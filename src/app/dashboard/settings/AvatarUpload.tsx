'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import CropModal from '@/components/shared/CropModal'

interface Props {
  avatarUrl: string | null
  displayName: string | null
}

export default function AvatarUpload({ avatarUrl: initial, displayName }: Props) {
  const router   = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [preview,   setPreview]   = useState<string | null>(initial)
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState('')
  const [cropSrc,   setCropSrc]   = useState<string | null>(null)
  const [cropName,  setCropName]  = useState('avatar.jpg')

  const initials = (displayName ?? '?').slice(0, 2).toUpperCase()

  function openCrop(file: File) {
    if (!file.type.startsWith('image/')) { setError('images only'); return }
    if (file.size > 10 * 1024 * 1024)   { setError('max 10 MB');   return }
    setError('')
    setCropName(file.name)
    const reader = new FileReader()
    reader.onload = e => setCropSrc(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleCropApply(blob: Blob) {
    setCropSrc(null)
    const name = cropName.replace(/\.[^.]+$/, '.jpg')
    const file = new File([blob], name, { type: 'image/jpeg' })
    setPreview(URL.createObjectURL(blob))
    setUploading(true)
    setError('')
    try {
      const urlRes = await fetch('/api/upload/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'avatars', fileName: file.name, fileType: file.type }),
      })
      if (!urlRes.ok) throw new Error('Failed to get upload URL')
      const { signedUploadUrl, publicUrl } = await urlRes.json()

      const up = await fetch(signedUploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file })
      if (!up.ok) throw new Error('Upload failed')

      const patch = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: publicUrl }),
      })
      if (!patch.ok) throw new Error('Failed to save')

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setPreview(initial)
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px', px: 3, py: 3, bgcolor: 'background.surface' }}>
        <Typography level="body-sm" sx={{ fontWeight: 600, mb: 0.25 }}>profile picture</Typography>
        <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.55, fontSize: '0.78rem', mb: 2.5 }}>
          shown next to your posts in the community
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {/* circle preview */}
          <Box
            onClick={() => !uploading && inputRef.current?.click()}
            sx={{
              width: 72, height: 72, borderRadius: '50%',
              overflow: 'hidden', flexShrink: 0,
              cursor: uploading ? 'default' : 'pointer',
              position: 'relative',
              border: '2px solid', borderColor: 'divider',
              bgcolor: 'background.level2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              '&:hover .ov': { opacity: 1 },
            }}
          >
            {preview
              ? <Box component="img" src={preview} alt="avatar" sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: 'text.tertiary', opacity: 0.4 }}>{initials}</Typography>
            }
            <Box className="ov" sx={{ position: 'absolute', inset: 0, borderRadius: '50%', bgcolor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: uploading ? 1 : 0, transition: 'opacity 0.15s' }}>
              <Typography sx={{ fontSize: '0.62rem', color: '#fff', fontWeight: 700 }}>{uploading ? '…' : 'change'}</Typography>
            </Box>
          </Box>

          <Box>
            <Box
              component="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              sx={{
                background: 'none', border: '1px solid', borderColor: 'divider',
                borderRadius: '20px', px: 2, py: 0.75,
                cursor: uploading ? 'default' : 'pointer',
                '&:hover': uploading ? {} : { bgcolor: 'background.level1', borderColor: 'neutral.outlinedHoverBorder' },
                transition: 'all 0.15s',
              }}
            >
              <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600 }}>
                {uploading ? 'uploading…' : 'upload photo'}
              </Typography>
            </Box>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.35, mt: 0.75, fontSize: '0.7rem' }}>
              jpg · png · gif · max 10 MB
            </Typography>
          </Box>
        </Box>

        {error && <Typography level="body-xs" sx={{ color: 'danger.plainColor', mt: 1.5, fontSize: '0.75rem' }}>{error}</Typography>}

        <input ref={inputRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) openCrop(f); if (inputRef.current) inputRef.current.value = '' }} style={{ display: 'none' }} disabled={uploading} />
      </Box>

      {cropSrc && (
        <CropModal
          src={cropSrc}
          shape="circle"
          outputWidth={256}
          onApply={handleCropApply}
          onCancel={() => setCropSrc(null)}
        />
      )}
    </>
  )
}
