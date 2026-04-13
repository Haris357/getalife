'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Button from '@mui/joy/Button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.body',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 4,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle gradient background blob */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgb(249,115,22) 0%, rgb(14,165,233) 100%)',
          opacity: 0.04,
          pointerEvents: 'none',
          filter: 'blur(80px)',
        }}
      />

      {/* Brand logo mark */}
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: '10px',
          background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 5,
        }}
      >
        <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', lineHeight: 1 }}>g</Typography>
      </Box>

      {/* Error icon */}
      <Box
        sx={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          bgcolor: 'danger.softBg',
          border: '2px solid',
          borderColor: 'danger.outlinedBorder',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 4,
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--joy-palette-danger-500)' }}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </Box>

      <Typography
        level="h3"
        sx={{
          fontWeight: 700,
          fontSize: { xs: '1.4rem', md: '1.8rem' },
          letterSpacing: '-0.03em',
          mb: 1.5,
          color: 'text.primary',
        }}
      >
        something broke
      </Typography>
      <Typography
        level="body-sm"
        sx={{ color: 'text.tertiary', opacity: 0.5, mb: 1.5, maxWidth: 320, lineHeight: 1.6 }}
      >
        an unexpected error occurred. your data is safe.
      </Typography>

      {error.message && (
        <Box
          sx={{
            mb: 5,
            px: 2.5,
            py: 1.5,
            borderRadius: '8px',
            bgcolor: 'background.surface',
            border: '1px solid',
            borderColor: 'divider',
            maxWidth: 400,
          }}
        >
          <Typography
            sx={{
              fontSize: '0.75rem',
              color: 'text.tertiary',
              opacity: 0.55,
              fontFamily: 'monospace',
              lineHeight: 1.5,
            }}
          >
            {error.message}
          </Typography>
        </Box>
      )}

      {!error.message && <Box sx={{ mb: 5 }} />}

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button
          onClick={reset}
          sx={{
            borderRadius: '20px',
            fontWeight: 700,
            fontSize: '0.88rem',
            px: 3.5,
            py: 1.25,
            background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
            color: '#fff',
            border: 'none',
            '&:hover': { opacity: 0.9 },
          }}
        >
          try again
        </Button>

        <Link href="/" style={{ textDecoration: 'none' }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 3,
              py: 1.25,
              borderRadius: '20px',
              border: '1px solid',
              borderColor: 'divider',
              color: 'text.secondary',
              fontSize: '0.85rem',
              fontWeight: 600,
              transition: 'all 0.15s',
              '&:hover': { borderColor: 'text.tertiary', bgcolor: 'background.level1' },
            }}
          >
            go home
          </Box>
        </Link>
      </Box>
    </Box>
  )
}
