'use client'

import { useState } from 'react'
import Box from '@mui/joy/Box'
import Button from '@mui/joy/Button'
import Typography from '@mui/joy/Typography'

export default function UnsubscribeActions({ token }: { token: string }) {
  const [resubscribed, setResubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleResubscribe() {
    setLoading(true)
    try {
      await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, resubscribe: true }),
      })
      setResubscribed(true)
    } finally {
      setLoading(false)
    }
  }

  if (resubscribed) {
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          px: 2.5,
          py: 1,
          borderRadius: '20px',
          bgcolor: 'success.softBg',
          border: '1px solid',
          borderColor: 'success.outlinedBorder',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--joy-palette-success-600)' }}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'success.700' }}>
          you&apos;re back! emails resume tomorrow.
        </Typography>
      </Box>
    )
  }

  return (
    <Button
      variant="outlined"
      loading={loading}
      onClick={handleResubscribe}
      sx={{
        borderRadius: '20px',
        borderColor: 'divider',
        color: 'text.secondary',
        fontWeight: 600,
        fontSize: '0.85rem',
        px: 3,
        '&:hover': {
          borderColor: 'rgb(14,165,233)',
          bgcolor: 'background.level1',
        },
      }}
    >
      re-subscribe to daily emails
    </Button>
  )
}
