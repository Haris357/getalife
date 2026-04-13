'use client'

import { useState, useRef } from 'react'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Input from '@mui/joy/Input'
import Textarea from '@mui/joy/Textarea'
import Button from '@mui/joy/Button'
import CropModal from '@/components/shared/CropModal'
import type { CommunitySettings } from '@/types'

interface Props {
  settings: CommunitySettings
}

async function uploadFile(file: File, folder: string): Promise<string | null> {
  try {
    const res = await fetch('/api/upload/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder, fileName: file.name, fileType: file.type }),
    })
    if (!res.ok) return null
    const { signedUploadUrl, publicUrl } = await res.json()
    const uploadRes = await fetch(signedUploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    if (!uploadRes.ok) return null
    return publicUrl
  } catch {
    return null
  }
}

function IconUpload({ color }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

export default function ModSettingsForm({ settings }: Props) {
  const [name, setName] = useState(settings.name)
  const [description, setDescription] = useState(settings.description)
  const [coverUrl, setCoverUrl] = useState(settings.cover_url ?? '')
  const [avatarUrl, setAvatarUrl] = useState(settings.avatar_url ?? '')
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const coverRef = useRef<HTMLInputElement>(null)
  const avatarRef = useRef<HTMLInputElement>(null)
  // crop modal state
  const [cropSrc,   setCropSrc]   = useState<string | null>(null)
  const [cropTarget, setCropTarget] = useState<'cover' | 'avatar'>('cover')
  const [pendingFileName, setPendingFileName] = useState('image.jpg')

  function openCrop(file: File, target: 'cover' | 'avatar') {
    const reader = new FileReader()
    reader.onload = e => {
      setPendingFileName(file.name)
      setCropTarget(target)
      setCropSrc(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  async function handleCropApply(blob: Blob) {
    setCropSrc(null)
    const target = cropTarget
    const name = pendingFileName.replace(/\.[^.]+$/, '.jpg')
    const file = new File([blob], name, { type: 'image/jpeg' })
    if (target === 'cover') setUploadingCover(true)
    else setUploadingAvatar(true)
    setError('')
    const url = await uploadFile(file, 'community')
    if (url) {
      if (target === 'cover') setCoverUrl(url)
      else setAvatarUrl(url)
    } else {
      setError(`${target === 'cover' ? 'Cover' : 'Avatar'} upload failed — try again`)
    }
    if (target === 'cover') setUploadingCover(false)
    else setUploadingAvatar(false)
  }

  async function handleCoverSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    openCrop(file, 'cover')
    if (coverRef.current) coverRef.current.value = ''
  }

  async function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    openCrop(file, 'avatar')
    if (avatarRef.current) avatarRef.current.value = ''
  }

  async function handleSave() {
    setSaving(true)
    await fetch('/api/community/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description,
        cover_url: coverUrl || null,
        avatar_url: avatarUrl || null,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const labelSx = {
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.07em',
    textTransform: 'uppercase' as const,
    color: 'text.tertiary',
    opacity: 0.6,
    mb: 0.75,
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>

      {/* Cover photo */}
      <Box>
        <Typography sx={labelSx}>Cover Photo</Typography>
        <Box
          sx={{
            height: 130,
            borderRadius: '10px',
            overflow: 'hidden',
            position: 'relative',
            border: '1px solid',
            borderColor: 'divider',
            cursor: uploadingCover ? 'wait' : 'pointer',
            bgcolor: 'background.level1',
          }}
          onClick={() => !uploadingCover && coverRef.current?.click()}
        >
          {coverUrl ? (
            <Box
              component="img"
              src={coverUrl}
              alt="cover"
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(99,102,241) 50%, rgb(249,115,22) 100%)', opacity: 0.25 }} />
          )}
          {/* Hover overlay */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.75,
              bgcolor: coverUrl ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0)',
              transition: 'background-color 0.15s',
              '&:hover': { bgcolor: coverUrl ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.06)' },
            }}
          >
            <IconUpload color={coverUrl ? '#fff' : undefined} />
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: coverUrl ? '#fff' : 'text.tertiary', opacity: 0.85 }}>
              {uploadingCover ? 'uploading...' : coverUrl ? 'change cover' : 'upload cover photo'}
            </Typography>
          </Box>
        </Box>
        {coverUrl && (
          <Box
            component="button"
            onClick={() => setCoverUrl('')}
            sx={{ mt: 0.75, background: 'none', border: 'none', cursor: 'pointer', p: 0 }}
          >
            <Typography sx={{ fontSize: '0.7rem', color: 'danger.plainColor', opacity: 0.6, '&:hover': { opacity: 1 }, transition: 'opacity 0.1s' }}>
              remove cover
            </Typography>
          </Box>
        )}
        <input ref={coverRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} onChange={handleCoverSelect} />
      </Box>

      {/* Avatar */}
      <Box>
        <Typography sx={labelSx}>Community Avatar</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid',
              borderColor: 'divider',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: avatarUrl
                ? 'none'
                : 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
            }}
          >
            {avatarUrl ? (
              <Box
                component="img"
                src={avatarUrl}
                alt="avatar"
                sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
                r/g
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              variant="outlined"
              size="sm"
              loading={uploadingAvatar}
              onClick={() => avatarRef.current?.click()}
              sx={{ borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600, alignSelf: 'flex-start' }}
            >
              {avatarUrl ? 'change avatar' : 'upload avatar'}
            </Button>
            {avatarUrl && (
              <Box
                component="button"
                onClick={() => setAvatarUrl('')}
                sx={{ background: 'none', border: 'none', cursor: 'pointer', p: 0, alignSelf: 'flex-start' }}
              >
                <Typography sx={{ fontSize: '0.7rem', color: 'danger.plainColor', opacity: 0.6, '&:hover': { opacity: 1 }, transition: 'opacity 0.1s' }}>
                  remove avatar
                </Typography>
              </Box>
            )}
            <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary', opacity: 0.4 }}>
              JPG, PNG or WebP · recommended 256×256
            </Typography>
          </Box>
        </Box>
        <input ref={avatarRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleAvatarSelect} />
      </Box>

      {/* Name */}
      <Box>
        <Typography sx={labelSx}>Community Name</Typography>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          sx={{ borderRadius: '8px', fontSize: '0.875rem', '--Input-focusedThickness': '0px' }}
        />
      </Box>

      {/* Description */}
      <Box>
        <Typography sx={labelSx}>Description</Typography>
        <Textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          minRows={2}
          maxRows={4}
          sx={{ borderRadius: '8px', fontSize: '0.875rem', '--Textarea-focusedThickness': '0px' }}
        />
      </Box>

      {error && (
        <Typography sx={{ fontSize: '0.8rem', color: 'danger.plainColor' }}>{error}</Typography>
      )}

      <Box>
        <Button
          loading={saving}
          onClick={handleSave}
          sx={{ borderRadius: '20px', fontWeight: 600, fontSize: '0.82rem', px: 3 }}
        >
          {saved ? 'saved ✓' : 'save settings'}
        </Button>
      </Box>

      {/* Crop modal — circle for avatar, wide rect for cover */}
      {cropSrc && (
        <CropModal
          src={cropSrc}
          shape={cropTarget === 'avatar' ? 'circle' : 'rect'}
          aspect={cropTarget === 'cover' ? 4 : 1}
          outputWidth={cropTarget === 'cover' ? 1200 : 256}
          onApply={handleCropApply}
          onCancel={() => setCropSrc(null)}
        />
      )}
    </Box>
  )
}
