'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/joy/Box'
import Button from '@mui/joy/Button'
import Input from '@mui/joy/Input'
import Textarea from '@mui/joy/Textarea'
import Typography from '@mui/joy/Typography'
import Autocomplete from '@mui/joy/Autocomplete'
import SocialLinksInput, { type SocialLinks } from '@/components/shared/SocialLinksInput'
import CropModal from '@/components/shared/CropModal'
import GradientButton from '@/components/shared/GradientButton'

const inputSx = {
  bgcolor: 'background.body',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: '20px',
  fontSize: '0.9rem',
  color: 'text.secondary',
  '--Input-focusedThickness': '0px',
  px: 2,
  '&:hover': { borderColor: 'neutral.outlinedBorder' },
  '&:focus-within': { borderColor: 'rgb(14,165,233)' },
} as const

const textareaSx = {
  bgcolor: 'background.body',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: '12px',
  fontSize: '0.9rem',
  color: 'text.secondary',
  '--Textarea-focusedThickness': '0px',
  lineHeight: 1.6,
  resize: 'none' as const,
  p: 2,
  '&:hover': { borderColor: 'neutral.outlinedBorder' },
  '&:focus-within': { borderColor: 'rgb(14,165,233)' },
  textarea: { '&::placeholder': { color: 'text.tertiary', opacity: 0.35 } },
}

function SectionLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
      <Typography
        level="body-xs"
        sx={{ color: 'text.secondary', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.02em' }}
      >
        {children}
      </Typography>
      {optional && (
        <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '0.7rem', opacity: 0.5 }}>
          optional
        </Typography>
      )}
    </Box>
  )
}

type GoalOption = { label: string; id: string }

interface Props {
  goals: { id: string; description: string }[]
}

export default function StoryForm({ goals }: Props) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [body, setBody] = useState('')
  const [selectedGoal, setSelectedGoal] = useState<GoalOption | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [cropName, setCropName] = useState('cover.jpg')
  const [uploadingImage, setUploadingImage] = useState(false)
  const imageRef = useRef<HTMLInputElement>(null)
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({})
  const [showSocial, setShowSocial] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const goalOptions: GoalOption[] = goals.map((g) => ({
    label: g.description.length > 80 ? g.description.slice(0, 80) + '…' : g.description,
    id: g.id,
  }))

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (imageRef.current) imageRef.current.value = ''
    setCropName(file.name)
    const reader = new FileReader()
    reader.onload = ev => setCropSrc(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleCropApply(blob: Blob) {
    setCropSrc(null)
    const name = cropName.replace(/\.[^.]+$/, '.jpg')
    const file = new File([blob], name, { type: 'image/jpeg' })
    setUploadingImage(true)
    try {
      const res = await fetch('/api/upload/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'stories', fileName: file.name, fileType: file.type }),
      })
      if (!res.ok) { setError('Image upload failed'); return }
      const { signedUploadUrl, publicUrl } = await res.json()
      const up = await fetch(signedUploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file })
      if (!up.ok) { setError('Image upload failed'); return }
      setImageUrl(publicUrl)
    } catch {
      setError('Image upload failed')
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !tagline.trim() || !body.trim()) return
    setSubmitting(true)
    setError('')

    const filteredLinks = Object.fromEntries(
      Object.entries(socialLinks).filter(([, v]) => v?.trim())
    )

    try {
      const payload: Record<string, unknown> = { name, tagline, body }
      if (selectedGoal?.id) payload.goal_id = selectedGoal.id
      if (imageUrl) payload.image_url = imageUrl
      if (Object.keys(filteredLinks).length) payload.social_links = filteredLinks

      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Something went wrong')
      }
      // Invalidate router cache so stories page re-fetches
      router.refresh()
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '12px',
          bgcolor: 'background.surface',
          p: { xs: 4, md: 5 },
          textAlign: 'center',
        }}
      >
        {/* Checkmark SVG */}
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </Box>
        <Typography level="title-md" sx={{ color: 'text.primary', mb: 1, fontWeight: 700, fontSize: '1.2rem' }}>
          story published
        </Typography>
        <Typography level="body-sm" sx={{ color: 'text.tertiary', mb: 5, lineHeight: 1.65, maxWidth: 320, mx: 'auto' }}>
          your story is live. thank you for sharing — this is what it&apos;s all about.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button
            variant="outlined"
            size="lg"
            onClick={() => router.push('/stories')}
            sx={{
              borderRadius: '20px',
              fontWeight: 600,
              borderColor: 'divider',
              color: 'text.secondary',
              '&:hover': { borderColor: 'neutral.outlinedBorder', bgcolor: 'background.level1' },
            }}
          >
            view all stories →
          </Button>
          <Button
            variant="outlined"
            size="lg"
            onClick={() => router.push('/dashboard/stories')}
            sx={{
              borderRadius: '20px',
              fontWeight: 600,
              borderColor: 'divider',
              color: 'text.secondary',
              '&:hover': { borderColor: 'neutral.outlinedBorder', bgcolor: 'background.level1' },
            }}
          >
            manage my stories
          </Button>
        </Box>
      </Box>
    )
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '12px',
        bgcolor: 'background.surface',
        p: { xs: 3, md: 4 },
        display: 'flex',
        flexDirection: 'column',
        gap: 3.5,
      }}
    >
      {/* Name */}
      <Box>
        <SectionLabel>your name</SectionLabel>
        <Input
          placeholder="Alex Chen"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={submitting}
          sx={inputSx}
        />
      </Box>

      {/* Tagline */}
      <Box>
        <SectionLabel>one-line summary of what you achieved</SectionLabel>
        <Input
          placeholder="Lost 12kg in 90 days by checking in every single morning"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          required
          disabled={submitting}
          sx={inputSx}
        />
      </Box>

      {/* Goal autocomplete */}
      <Box>
        <SectionLabel optional>link to a goal</SectionLabel>
        <Autocomplete
          options={goalOptions}
          getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
          value={selectedGoal}
          onChange={(_, newValue) => {
            setSelectedGoal(typeof newValue === 'object' ? newValue : null)
          }}
          placeholder={goals.length > 0 ? 'Search your goals…' : 'No goals yet'}
          disabled={submitting || goals.length === 0}
          clearOnEscape
          sx={{
            bgcolor: 'background.body',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '20px',
            fontSize: '0.9rem',
            color: 'text.secondary',
            '--Input-focusedThickness': '0px',
            '&:hover': { borderColor: 'neutral.outlinedBorder' },
            '&:focus-within': { borderColor: 'rgb(14,165,233)' },
          }}
        />
        {selectedGoal && (
          <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.5, mt: 0.75, fontSize: '0.72rem', pl: 1 }}>
            linked to: {selectedGoal.label}
          </Typography>
        )}
      </Box>

      {/* Story body */}
      <Box>
        <SectionLabel>tell the full story</SectionLabel>
        <Textarea
          placeholder="What was the goal? What did the daily check-ins actually look like? What changed for you? Be real — the good, the hard days, how you pushed through."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          minRows={7}
          maxRows={18}
          required
          disabled={submitting}
          sx={textareaSx}
        />
        <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.35, mt: 0.75, textAlign: 'right', fontSize: '0.72rem' }}>
          {body.length} / 5000
        </Typography>
      </Box>

      {/* Cover photo */}
      <Box>
        <SectionLabel optional>cover photo</SectionLabel>
        {imageUrl ? (
          <Box sx={{ position: 'relative' }}>
            <Box
              component="img"
              src={imageUrl}
              alt="cover"
              sx={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: '10px', display: 'block' }}
            />
            <Box
              component="button"
              type="button"
              onClick={() => setImageUrl('')}
              sx={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '20px', cursor: 'pointer', px: 1.5, py: 0.5 }}
            >
              <Typography sx={{ fontSize: '0.72rem', color: '#fff', fontWeight: 600 }}>remove</Typography>
            </Box>
          </Box>
        ) : (
          <Box
            component="button"
            type="button"
            onClick={() => imageRef.current?.click()}
            disabled={uploadingImage || submitting}
            sx={{
              width: '100%', height: 100, border: '1.5px dashed', borderColor: 'divider',
              borderRadius: '10px', bgcolor: 'background.level1', cursor: uploadingImage ? 'wait' : 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.75,
              transition: 'border-color 0.15s, background-color 0.15s',
              '&:hover': { borderColor: 'rgb(14,165,233)', bgcolor: 'rgba(14,165,233,0.03)' },
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.45, fontSize: '0.78rem' }}>
              {uploadingImage ? 'uploading...' : 'click to add cover photo'}
            </Typography>
          </Box>
        )}
        <input ref={imageRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleImageSelect} />
      </Box>

      {cropSrc && (
        <CropModal
          src={cropSrc}
          shape="rect"
          aspect={16 / 9}
          outputWidth={1200}
          onApply={handleCropApply}
          onCancel={() => setCropSrc(null)}
        />
      )}

      {/* Social links */}
      <Box>
        <Box
          component="button"
          type="button"
          onClick={() => setShowSocial((v) => !v)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            p: 0,
            mb: showSocial ? 2 : 0,
          }}
        >
          <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '0.8rem', fontWeight: 600 }}>
            {showSocial ? '▾' : '▸'} add your social links
          </Typography>
        </Box>
        {showSocial && (
          <SocialLinksInput value={socialLinks} onChange={setSocialLinks} disabled={submitting} />
        )}
      </Box>

      {error && (
        <Typography level="body-xs" sx={{ color: 'danger.500' }}>
          {error}
        </Typography>
      )}

      {/* Submit */}
      <GradientButton
        type="submit"
        loading={submitting}
        disabled={!name.trim() || !tagline.trim() || body.trim().length < 10}
        size="lg"
        fullWidth
        sx={{ borderRadius: '20px', fontWeight: 700 }}
      >
        publish story →
      </GradientButton>

      <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.35, textAlign: 'center', fontSize: '0.72rem' }}>
        your story goes live immediately
      </Typography>
    </Box>
  )
}
