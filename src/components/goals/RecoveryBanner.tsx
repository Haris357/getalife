'use client'

import { useEffect, useState } from 'react'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'

interface RecoveryChallenge {
  id: string
  started_at: string
  target_date: string
  checkins_done: number
  completed: boolean
  failed: boolean
}

interface Props {
  goalId: string
}

export default function RecoveryBanner({ goalId }: Props) {
  const [challenge, setChallenge] = useState<RecoveryChallenge | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/recovery?goalId=${goalId}`)
      .then((r) => r.json())
      .then((data) => {
        setChallenge(data.challenge ?? null)
      })
      .catch(() => {
        // silently ignore — banner just won't show
      })
      .finally(() => setLoading(false))
  }, [goalId])

  if (loading || !challenge) return null

  const checkinsDone = challenge.checkins_done ?? 0
  const targetDate = new Date(challenge.target_date)
  const now = new Date()
  const msLeft = targetDate.getTime() - now.getTime()
  const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)))

  return (
    <Box
      sx={{
        mb: 4,
        p: 3,
        borderRadius: '12px',
        border: '1px solid',
        borderColor: 'warning.400',
        bgcolor: 'warning.softBg',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* amber top bar */}
      <Box
        sx={{
          height: 3,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(90deg, rgb(249,115,22), rgb(234,179,8))',
        }}
      />

      {/* Title */}
      <Typography
        level="body-xs"
        sx={{
          color: 'warning.600',
          fontVariant: 'small-caps',
          fontWeight: 700,
          fontSize: '0.72rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          mb: 0.75,
        }}
      >
        comeback challenge
      </Typography>

      {/* Body */}
      <Typography
        level="body-sm"
        sx={{
          color: 'warning.800',
          fontSize: '0.875rem',
          lineHeight: 1.6,
          mb: 2,
        }}
      >
        missed a day? do 3 check-ins in 3 days to get back on track
      </Typography>

      {/* Progress dots */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: i < checkinsDone ? 'warning.500' : 'warning.200',
              border: '1.5px solid',
              borderColor: i < checkinsDone ? 'warning.600' : 'warning.300',
              transition: 'background-color 0.2s',
            }}
          />
        ))}
        <Typography
          level="body-xs"
          sx={{ color: 'warning.700', fontSize: '0.75rem', fontWeight: 600 }}
        >
          {checkinsDone}/3 done
        </Typography>
      </Box>

      {/* Days left */}
      <Typography
        level="body-xs"
        sx={{ color: 'warning.600', fontSize: '0.72rem', opacity: 0.8 }}
      >
        {daysLeft === 0
          ? 'last chance — challenge ends today'
          : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left to complete the challenge`}
      </Typography>
    </Box>
  )
}
