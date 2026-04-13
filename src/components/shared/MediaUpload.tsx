'use client'

import { useRef, useState } from 'react'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'

type Folder = 'checkins' | 'stories'

interface Props {
  folder: Folder
  onUploaded: (publicUrl: string) => void
  disabled?: boolean
  accept?: string
}

export default function MediaUpload({
  folder,
  onUploaded,
  disabled,
  accept = 'image/*,video/mp4,video/quicktime,video/webm',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<'image' | 'video'>('image')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)

  async function handleFile(file: File) {
    if (!file) return
    const isVideo = file.type.startsWith('video/')
    setPreviewType(isVideo ? 'video' : 'image')
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    setError('')

    try {
      // 1. Get signed upload URL
      const urlRes = await fetch('/api/upload/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder, fileName: file.name, fileType: file.type }),
      })
      if (!urlRes.ok) {
        const d = await urlRes.json()
        throw new Error(d.error || 'Failed to get upload URL')
      }
      const { signedUploadUrl, publicUrl } = await urlRes.json()

      // 2. Upload directly to Supabase Storage
      const uploadRes = await fetch(signedUploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!uploadRes.ok) throw new Error('Upload failed')

      onUploaded(publicUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  function clear() {
    setPreview(null)
    onUploaded('')
    if (inputRef.current) inputRef.current.value = ''
  }

  if (preview) {
    return (
      <Box sx={{ position: 'relative' }}>
        {previewType === 'video' ? (
          <Box
            component="video"
            src={preview}
            controls
            sx={{ width: '100%', borderRadius: '8px', maxHeight: 280, display: 'block', bgcolor: 'background.level2' }}
          />
        ) : (
          <Box
            component="img"
            src={preview}
            alt="preview"
            sx={{ width: '100%', borderRadius: '8px', maxHeight: 280, objectFit: 'cover', display: 'block' }}
          />
        )}

        {uploading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: 'rgba(0,0,0,0.45)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography level="body-xs" sx={{ color: '#fff', fontSize: '0.8rem' }}>
              uploading…
            </Typography>
          </Box>
        )}

        {!uploading && (
          <Box
            component="button"
            type="button"
            onClick={clear}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 28,
              height: 28,
              borderRadius: '50%',
              bgcolor: 'rgba(0,0,0,0.6)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '0.8rem',
              fontWeight: 700,
              '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
            }}
          >
            ×
          </Box>
        )}
      </Box>
    )
  }

  return (
    <Box>
      <Box
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        sx={{
          border: '1px dashed',
          borderColor: dragging ? 'text.tertiary' : 'divider',
          borderRadius: '8px',
          py: 3.5,
          px: 2,
          textAlign: 'center',
          cursor: disabled ? 'default' : 'pointer',
          transition: 'border-color 0.15s, background 0.15s',
          bgcolor: dragging ? 'background.level1' : 'transparent',
          '&:hover': disabled ? {} : { borderColor: 'neutral.outlinedBorder', bgcolor: 'background.level1' },
        }}
      >
        <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.5, fontSize: '0.82rem' }}>
          click to upload or drag & drop
        </Typography>
        <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.3, fontSize: '0.72rem', mt: 0.5 }}>
          photo or video · max 50MB
        </Typography>
      </Box>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onInputChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />
      {error && (
        <Typography level="body-xs" sx={{ color: 'danger.500', mt: 1, fontSize: '0.78rem' }}>
          {error}
        </Typography>
      )}
    </Box>
  )
}
