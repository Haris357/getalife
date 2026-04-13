'use client'

import { useState, useEffect, useCallback } from 'react'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import type { CheckIn } from '@/types'

interface Props {
  checkIns: CheckIn[]
}

interface PhotoEntry {
  url: string
  date: string
}

export default function MediaTimeline({ checkIns }: Props) {
  const [lightbox, setLightbox] = useState<string | null>(null)

  const photos: PhotoEntry[] = checkIns
    .filter(ci => ci.media_url && !ci.media_url.match(/\.(mp4|mov|webm)$/i))
    .map(ci => ({ url: ci.media_url as string, date: ci.date }))
    // checkIns are already sorted desc, reverse to show oldest→newest left→right
    .reverse()

  const closeLightbox = useCallback(() => setLightbox(null), [])

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, closeLightbox])

  if (photos.length === 0) return null

  return (
    <Box sx={{ mb: 5 }}>
      <Typography
        level="body-xs"
        sx={{
          color: 'text.tertiary',
          mb: 2.5,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontSize: '0.68rem',
          opacity: 0.45,
        }}
      >
        progress photos · {photos.length}
      </Typography>

      {/* Horizontal scrollable strip */}
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          overflowX: 'auto',
          pb: 1,
          '&::-webkit-scrollbar': { height: 4 },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 2 },
        }}
      >
        {photos.map((photo, idx) => (
          <Box
            key={idx}
            sx={{ flexShrink: 0, cursor: 'pointer' }}
            onClick={() => setLightbox(photo.url)}
          >
            <Box
              component="img"
              src={photo.url}
              alt={`progress ${formatDate(photo.date)}`}
              sx={{
                width: 120,
                height: 120,
                objectFit: 'cover',
                borderRadius: '8px',
                display: 'block',
                transition: 'opacity 0.15s, transform 0.15s',
                '&:hover': {
                  opacity: 0.85,
                  transform: 'scale(1.03)',
                },
              }}
            />
            <Typography
              level="body-xs"
              sx={{
                mt: 0.75,
                fontSize: '0.62rem',
                color: 'text.tertiary',
                opacity: 0.5,
                textAlign: 'center',
              }}
            >
              {formatDate(photo.date)}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Lightbox */}
      {lightbox && (
        <Box
          onClick={closeLightbox}
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            bgcolor: 'rgba(0,0,0,0.88)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out',
          }}
        >
          <Box
            component="img"
            src={lightbox}
            alt="progress photo"
            onClick={(e) => e.stopPropagation()}
            sx={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: '12px',
              boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
              cursor: 'default',
            }}
          />
          {/* Close hint */}
          <Typography
            sx={{
              position: 'absolute',
              top: 20,
              right: 24,
              color: 'rgba(255,255,255,0.4)',
              fontSize: '0.75rem',
              userSelect: 'none',
            }}
          >
            ESC to close
          </Typography>
        </Box>
      )}
    </Box>
  )
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}
