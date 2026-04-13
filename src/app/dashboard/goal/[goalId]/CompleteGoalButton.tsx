'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@mui/joy/Button'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'

export default function CompleteGoalButton({ goalId }: { goalId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleComplete() {
    setLoading(true)
    await fetch(`/api/goals/${goalId}/complete`, { method: 'POST' })
    router.refresh()
  }

  if (confirming) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.6, fontSize: '0.8rem' }}>
          for real? no take-backs. you actually did it?
        </Typography>
        <Button
          size="sm"
          loading={loading}
          onClick={handleComplete}
          sx={{
            borderRadius: '20px',
            fontWeight: 600,
            fontSize: '0.78rem',
            px: 2,
            bgcolor: 'success.500',
            '&:hover': { bgcolor: 'success.600' },
          }}
        >
          yes, i actually did it
        </Button>
        <Button
          size="sm"
          variant="plain"
          onClick={() => setConfirming(false)}
          sx={{ borderRadius: '20px', fontWeight: 600, fontSize: '0.78rem', color: 'text.tertiary' }}
        >
          not yet
        </Button>
      </Box>
    )
  }

  return (
    <Button
      size="sm"
      variant="outlined"
      onClick={() => setConfirming(true)}
      sx={{
        borderRadius: '20px',
        fontWeight: 600,
        fontSize: '0.78rem',
        px: 2,
        borderColor: 'divider',
        color: 'text.tertiary',
        '&:hover': { borderColor: 'success.400', color: 'success.600' },
        transition: 'border-color 0.15s, color 0.15s',
      }}
    >
      mark as complete
    </Button>
  )
}
