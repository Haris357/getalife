'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@mui/joy/Button'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import type { GoalStatus } from '@/types'

interface Props {
  goalId: string
  status: GoalStatus
}

export default function PauseGoalButton({ goalId, status }: Props) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const isPaused = status === 'paused'

  async function handleToggle() {
    setLoading(true)
    await fetch(`/api/goals/${goalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: isPaused ? 'active' : 'paused' }),
    })
    router.refresh()
    setLoading(false)
    setConfirming(false)
  }

  if (isPaused) {
    return (
      <Button
        size="sm"
        variant="outlined"
        loading={loading}
        onClick={handleToggle}
        sx={{
          borderRadius: '20px',
          fontWeight: 600,
          fontSize: '0.78rem',
          px: 2,
          borderColor: 'success.300',
          color: 'success.600',
          '&:hover': { borderColor: 'success.400', color: 'success.700' },
          transition: 'border-color 0.15s, color 0.15s',
        }}
      >
        ok fine, i'm back
      </Button>
    )
  }

  if (confirming) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.6, fontSize: '0.8rem' }}>
          rest is valid. just don&apos;t let &ldquo;paused&rdquo; become &ldquo;abandoned&rdquo;.
        </Typography>
        <Button
          size="sm"
          variant="outlined"
          loading={loading}
          onClick={handleToggle}
          sx={{ borderRadius: '20px', fontWeight: 600, fontSize: '0.78rem', borderColor: 'warning.300', color: 'warning.600' }}
        >
          pause it
        </Button>
        <Button
          size="sm"
          variant="plain"
          onClick={() => setConfirming(false)}
          sx={{ borderRadius: '20px', fontWeight: 600, fontSize: '0.78rem', color: 'text.tertiary' }}
        >
          nah, keep going
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
        '&:hover': { borderColor: 'warning.400', color: 'warning.600' },
        transition: 'border-color 0.15s, color 0.15s',
      }}
    >
      need a break
    </Button>
  )
}
