'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Input from '@mui/joy/Input'
import Textarea from '@mui/joy/Textarea'
import GradientButton from '@/components/shared/GradientButton'
import CropModal from '@/components/shared/CropModal'

export default function CreatePostForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [cropName, setCropName] = useState('image.jpg')

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (fileRef.current) fileRef.current.value = ''
    setCropName(file.name)
    const reader = new FileReader()
    reader.onload = ev => setCropSrc(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleCropApply(blob: Blob) {
    setCropSrc(null)
    const name = cropName.replace(/\.[^.]+$/, '.jpg')
    const file = new File([blob], name, { type: 'image/jpeg' })
    setUploading(true)
    setError('')
    try {
      const res = await fetch('/api/upload/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'community', fileName: file.name, fileType: file.type }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Upload failed')
        return
      }
      const { signedUploadUrl, publicUrl } = await res.json()
      const uploadRes = await fetch(signedUploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file })
      if (!uploadRes.ok) { setError('Upload failed'); return }
      setImageUrl(publicUrl)
    } catch {
      setError('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (title.trim().length < 3) return
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim() || undefined,
          image_url: imageUrl ?? undefined,
          type: imageUrl ? 'image' : 'text',
          is_anonymous: isAnonymous,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to create post')
        return
      }

      const { post } = await res.json()
      router.push(`/community/${post.id}`)
    } catch {
      setError('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const labelSx = {
    color: 'text.tertiary',
    opacity: 0.55,
    mb: 1,
    fontSize: '0.72rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    fontWeight: 700,
  }

  const inputSx = {
    bgcolor: 'background.level1',
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: '8px',
    fontSize: '0.95rem',
    '--Input-focusedThickness': '0px',
    '&:focus-within': { borderColor: 'rgb(14,165,233)', bgcolor: 'background.surface' },
    transition: 'border-color 0.15s, background-color 0.15s',
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Box sx={{ mb: 3 }}>
        <Typography level="body-xs" sx={labelSx}>
          title *
        </Typography>
        <Input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="what's on your mind?"
          required
          sx={{ ...inputSx, fontWeight: 600 }}
        />
        <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.25, mt: 0.5, textAlign: 'right', fontSize: '0.7rem' }}>
          {title.length}/300
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography level="body-xs" sx={labelSx}>
          body (optional)
        </Typography>
        <Textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="share your progress, ask for help, celebrate a win..."
          minRows={5}
          maxRows={20}
          sx={{
            bgcolor: 'background.level1',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '8px',
            fontSize: '0.9rem',
            lineHeight: 1.65,
            resize: 'none',
            '--Textarea-focusedThickness': '0px',
            '&:focus-within': { borderColor: 'rgb(14,165,233)', bgcolor: 'background.surface' },
            transition: 'border-color 0.15s, background-color 0.15s',
            textarea: { '&::placeholder': { color: 'text.tertiary', opacity: 0.35 } },
          }}
        />
      </Box>

      {/* Image upload */}
      <Box sx={{ mb: 5 }}>
        <Typography level="body-xs" sx={labelSx}>
          image (optional)
        </Typography>

        {imageUrl ? (
          <Box sx={{ position: 'relative', display: 'inline-block', width: '100%' }}>
            <Box
              component="img"
              src={imageUrl}
              alt="preview"
              sx={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: '8px', display: 'block' }}
            />
            <Box
              component="button"
              type="button"
              onClick={() => { setImageUrl(null); if (fileRef.current) fileRef.current.value = '' }}
              sx={{
                position: 'absolute', top: 8, right: 8,
                background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '20px',
                cursor: 'pointer', px: 1.5, py: 0.5,
              }}
            >
              <Typography sx={{ fontSize: '0.72rem', color: '#fff', fontWeight: 600 }}>remove</Typography>
            </Box>
          </Box>
        ) : (
          <Box
            component="button"
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            sx={{
              width: '100%',
              height: 88,
              border: '1.5px dashed',
              borderColor: 'divider',
              borderRadius: '8px',
              bgcolor: 'background.level1',
              cursor: uploading ? 'wait' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.75,
              transition: 'border-color 0.15s, background-color 0.15s',
              '&:hover': { borderColor: 'rgb(14,165,233)', bgcolor: 'background.surface' },
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.4, fontSize: '0.78rem' }}>
              {uploading ? 'uploading...' : 'click to add image'}
            </Typography>
          </Box>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          style={{ display: 'none' }}
          onChange={handleImageSelect}
        />
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

      {/* Anonymous toggle */}
      <Box
        component="label"
        htmlFor="anon-toggle"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mb: 3,
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        {/* Lock icon */}
        <Box sx={{ color: isAnonymous ? 'rgb(14,165,233)' : 'text.tertiary', opacity: isAnonymous ? 1 : 0.35, flexShrink: 0, transition: 'color 0.15s, opacity 0.15s', display: 'flex', alignItems: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </Box>

        {/* Toggle switch */}
        <Box sx={{ position: 'relative', width: 36, height: 20, flexShrink: 0 }}>
          <Box
            component="input"
            id="anon-toggle"
            type="checkbox"
            checked={isAnonymous}
            onChange={e => setIsAnonymous(e.target.checked)}
            sx={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
          />
          <Box
            onClick={() => setIsAnonymous(v => !v)}
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: '20px',
              bgcolor: isAnonymous ? 'rgb(14,165,233)' : 'background.level2',
              border: '1px solid',
              borderColor: isAnonymous ? 'rgb(14,165,233)' : 'divider',
              transition: 'background-color 0.18s, border-color 0.18s',
              cursor: 'pointer',
            }}
          />
          <Box
            onClick={() => setIsAnonymous(v => !v)}
            sx={{
              position: 'absolute',
              top: '3px',
              left: isAnonymous ? '18px' : '3px',
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              transition: 'left 0.18s',
              cursor: 'pointer',
            }}
          />
        </Box>

        {/* Labels */}
        <Box>
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: 'text.secondary', lineHeight: 1.2 }}>
            post anonymously
          </Typography>
          <Typography sx={{ fontSize: '0.68rem', color: 'text.tertiary', opacity: 0.4, lineHeight: 1 }}>
            your name won't be shown
          </Typography>
        </Box>
      </Box>

      {error && (
        <Box
          sx={{
            mb: 3,
            p: 2,
            borderRadius: '8px',
            bgcolor: 'danger.softBg',
            border: '1px solid',
            borderColor: 'danger.outlinedBorder',
          }}
        >
          <Typography level="body-xs" sx={{ color: 'danger.600', fontSize: '0.82rem' }}>
            {error}
          </Typography>
        </Box>
      )}

      <GradientButton
        type="submit"
        size="lg"
        fullWidth
        disabled={title.trim().length < 3}
        loading={submitting}
        sx={{ borderRadius: '20px', fontWeight: 700, fontSize: '0.92rem' }}
      >
        post to getalife →
      </GradientButton>
    </Box>
  )
}
