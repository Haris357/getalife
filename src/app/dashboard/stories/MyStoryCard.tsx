'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Input from '@mui/joy/Input'
import Textarea from '@mui/joy/Textarea'
import Button from '@mui/joy/Button'
import GradientButton from '@/components/shared/GradientButton'
import MediaUpload from '@/components/shared/MediaUpload'
import SocialLinksInput, { type SocialLinks } from '@/components/shared/SocialLinksInput'
import type { Story } from '@/types'

interface Props {
  story: Story
}

const inputSx = {
  bgcolor: 'background.body',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: '6px',
  fontSize: '0.88rem',
  color: 'text.secondary',
  '--Input-focusedThickness': '0px',
  '&:hover': { borderColor: 'neutral.outlinedBorder' },
  '&:focus-within': { borderColor: 'text.tertiary' },
} as const

function Label({ children }: { children: React.ReactNode }) {
  return (
    <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 0.75, fontSize: '0.75rem', opacity: 0.6 }}>
      {children}
    </Typography>
  )
}

export default function MyStoryCard({ story }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<'view' | 'edit' | 'confirmDelete'>('view')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [error, setError] = useState('')

  // Edit state
  const [name, setName] = useState(story.name)
  const [tagline, setTagline] = useState(story.tagline)
  const [body, setBody] = useState(story.body)
  const [imageUrl, setImageUrl] = useState(story.image_url ?? '')
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(story.social_links ?? {})
  const [showSocial, setShowSocial] = useState(!!story.social_links && Object.keys(story.social_links).length > 0)
  const [published, setPublished] = useState(story.published)

  async function patch(payload: Record<string, unknown>) {
    const res = await fetch(`/api/stories/${story.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const d = await res.json()
      throw new Error(d.error || 'Failed to save')
    }
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const filteredLinks = Object.fromEntries(
        Object.entries(socialLinks).filter(([, v]) => v?.trim())
      )
      await patch({
        name,
        tagline,
        body,
        image_url: imageUrl || null,
        social_links: Object.keys(filteredLinks).length ? filteredLinks : null,
      })
      router.refresh()
      setMode('view')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleTogglePublish() {
    setToggling(true)
    setError('')
    try {
      await patch({ published: !published })
      setPublished((p) => !p)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setToggling(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/stories/${story.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setDeleting(false)
    }
  }

  // ── Delete confirm ─────────────────────────────────────
  if (mode === 'confirmDelete') {
    return (
      <Box sx={{ border: '1px solid', borderColor: 'danger.200', borderRadius: '10px', p: 3, bgcolor: 'background.surface' }}>
        <Typography level="body-sm" sx={{ color: 'text.primary', fontWeight: 600, mb: 0.5 }}>
          trashing your own story?
        </Typography>
        <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.6, mb: 3, lineHeight: 1.55 }}>
          &ldquo;{story.tagline}&rdquo; — someone out there might have needed to read this. gone forever if you do it.
        </Typography>
        {error && <Typography level="body-xs" sx={{ color: 'danger.500', mb: 2 }}>{error}</Typography>}
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button size="sm" color="danger" loading={deleting} onClick={handleDelete} sx={{ borderRadius: '6px', fontWeight: 600 }}>
            delete it anyway
          </Button>
          <Button variant="outlined" size="sm" onClick={() => setMode('view')} disabled={deleting}
            sx={{ borderRadius: '6px', borderColor: 'divider', color: 'text.tertiary', '&:hover': { borderColor: 'neutral.outlinedBorder' } }}>
            keep it up
          </Button>
        </Box>
      </Box>
    )
  }

  // ── Edit mode ──────────────────────────────────────────
  if (mode === 'edit') {
    return (
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '10px', p: 3, bgcolor: 'background.surface' }}>
        <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 3, fontSize: '0.72rem', opacity: 0.5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          editing
        </Typography>

        <Box sx={{ mb: 2.5 }}>
          <Label>your name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} sx={inputSx} />
        </Box>

        <Box sx={{ mb: 2.5 }}>
          <Label>tagline</Label>
          <Input value={tagline} onChange={(e) => setTagline(e.target.value)} sx={inputSx} />
        </Box>

        <Box sx={{ mb: 2.5 }}>
          <Label>story</Label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            minRows={5}
            maxRows={14}
            sx={{
              ...inputSx,
              lineHeight: 1.6,
              resize: 'none',
              '--Textarea-focusedThickness': '0px',
              textarea: { '&::placeholder': { color: 'text.tertiary', opacity: 0.35 } },
            }}
          />
          <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.3, mt: 0.5, textAlign: 'right', fontSize: '0.7rem' }}>
            {body.length} / 5000
          </Typography>
        </Box>

        {/* Image upload */}
        <Box sx={{ mb: 2.5 }}>
          <Label>photo or video</Label>
          {imageUrl && (
            <Box sx={{ mb: 1.5, position: 'relative', display: 'inline-block' }}>
              <Box
                component="img"
                src={imageUrl}
                alt="current"
                sx={{ width: 120, height: 80, objectFit: 'cover', borderRadius: '6px', display: 'block' }}
              />
              <Box
                component="button"
                type="button"
                onClick={() => setImageUrl('')}
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  bgcolor: 'rgba(0,0,0,0.6)',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#fff',
                  fontSize: '0.65rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </Box>
            </Box>
          )}
          <MediaUpload folder="stories" onUploaded={setImageUrl} accept="image/*" />
        </Box>

        {/* Social links */}
        <Box sx={{ mb: 3 }}>
          <Box
            component="button"
            type="button"
            onClick={() => setShowSocial((v) => !v)}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.75, background: 'none', border: 'none', cursor: 'pointer', p: 0, mb: showSocial ? 2 : 0 }}
          >
            <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '0.78rem', letterSpacing: '0.03em', opacity: 0.6 }}>
              {showSocial ? '▾' : '▸'} social links
            </Typography>
          </Box>
          {showSocial && <SocialLinksInput value={socialLinks} onChange={setSocialLinks} />}
        </Box>

        {error && <Typography level="body-xs" sx={{ color: 'danger.500', mb: 2 }}>{error}</Typography>}

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <GradientButton
            size="sm"
            loading={saving}
            disabled={!name.trim() || !tagline.trim() || body.trim().length < 10}
            onClick={handleSave}
            sx={{ borderRadius: '6px' }}
          >
            save changes
          </GradientButton>
          <Button
            variant="outlined"
            size="sm"
            onClick={() => {
              setMode('view')
              setName(story.name)
              setTagline(story.tagline)
              setBody(story.body)
              setImageUrl(story.image_url ?? '')
              setSocialLinks(story.social_links ?? {})
            }}
            disabled={saving}
            sx={{ borderRadius: '6px', borderColor: 'divider', color: 'text.tertiary', '&:hover': { borderColor: 'neutral.outlinedBorder' } }}
          >
            cancel
          </Button>
        </Box>
      </Box>
    )
  }

  // ── View mode ──────────────────────────────────────────
  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '10px', p: 3, bgcolor: 'background.surface', display: 'flex', gap: 2.5 }}>
      {story.image_url && (
        <Box
          component="img"
          src={story.image_url}
          alt={story.name}
          sx={{ width: 72, height: 72, borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
        />
      )}

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
          <Typography level="body-sm" sx={{ color: 'text.primary', fontWeight: 700, fontSize: '0.9rem' }}>
            {story.name}
          </Typography>
          <Box
            sx={{
              px: 1,
              py: 0.25,
              borderRadius: '4px',
              bgcolor: published ? 'success.softBg' : 'warning.softBg',
              flexShrink: 0,
            }}
          >
            <Typography level="body-xs" sx={{ fontSize: '0.65rem', fontWeight: 600, color: published ? 'success.700' : 'warning.700' }}>
              {published ? 'live' : 'draft'}
            </Typography>
          </Box>
        </Box>

        <Typography
          level="body-xs"
          sx={{ color: 'text.tertiary', fontSize: '0.8rem', lineHeight: 1.5, mb: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {story.tagline}
        </Typography>

        {error && <Typography level="body-xs" sx={{ color: 'danger.500', mb: 1 }}>{error}</Typography>}

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href={`/stories/${story.id}`} target="_blank" style={{ textDecoration: 'none' }}>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '0.75rem', fontWeight: 600, '&:hover': { color: 'text.secondary' }, transition: 'color 0.15s' }}>
              view →
            </Typography>
          </Link>

          <Box sx={{ width: '1px', height: 10, bgcolor: 'divider' }} />

          <Box component="button" onClick={() => setMode('edit')} sx={{ background: 'none', border: 'none', cursor: 'pointer', p: 0 }}>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '0.75rem', fontWeight: 600, '&:hover': { color: 'text.secondary' }, transition: 'color 0.15s' }}>
              edit
            </Typography>
          </Box>

          <Box sx={{ width: '1px', height: 10, bgcolor: 'divider' }} />

          <Box component="button" onClick={handleTogglePublish} disabled={toggling} sx={{ background: 'none', border: 'none', cursor: 'pointer', p: 0 }}>
            <Typography level="body-xs" sx={{ color: published ? 'warning.600' : 'success.600', fontSize: '0.75rem', fontWeight: 600, '&:hover': { opacity: 0.7 }, transition: 'opacity 0.15s' }}>
              {toggling ? '…' : published ? 'unpublish' : 'publish'}
            </Typography>
          </Box>

          <Box sx={{ width: '1px', height: 10, bgcolor: 'divider' }} />

          <Box component="button" onClick={() => setMode('confirmDelete')} sx={{ background: 'none', border: 'none', cursor: 'pointer', p: 0 }}>
            <Typography level="body-xs" sx={{ color: 'danger.400', fontSize: '0.75rem', fontWeight: 600, '&:hover': { color: 'danger.600' }, transition: 'color 0.15s' }}>
              delete
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
