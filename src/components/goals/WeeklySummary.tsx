'use client'

import { useEffect, useState } from 'react'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'

interface WeeklyStats {
  checkinsThisWeek: number
  goalsActive: number
  bestStreak: number
  totalCheckins: number
}

interface WeeklySummaryProps {
  userId: string
}

export default function WeeklySummary({ userId: _userId }: WeeklySummaryProps) {
  const [stats, setStats] = useState<WeeklyStats | null>(null)

  useEffect(() => {
    fetch('/api/summary')
      .then(r => r.ok ? r.json() as Promise<WeeklyStats> : null)
      .then(data => { if (data) setStats(data) })
      .catch(() => {/* silent fail */})
  }, [])

  const checkins = stats?.checkinsThisWeek ?? 0
  const goals = stats?.goalsActive ?? 0
  const streak = stats?.bestStreak ?? 0

  return (
    <Box
      sx={{
        mb: 6,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
      }}
    >
      {/* Gradient left accent */}
      <Box
        sx={{
          width: 4,
          flexShrink: 0,
          background: 'linear-gradient(180deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
        }}
      />

      <Box sx={{ flex: 1, px: 3, py: 2.5, bgcolor: 'background.surface' }}>
        {/* Header */}
        <Typography
          level="body-xs"
          sx={{
            color: 'text.tertiary',
            fontSize: '0.68rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            opacity: 0.45,
            mb: 2,
          }}
        >
          this week
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.75, mb: 0.5 }}>
          {/* Big number */}
          <Typography
            sx={{
              fontSize: '2.2rem',
              fontWeight: 700,
              letterSpacing: '-0.04em',
              lineHeight: 1,
              background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {checkins}
          </Typography>
          <Typography
            level="body-sm"
            sx={{
              color: 'text.tertiary',
              fontSize: '0.85rem',
              opacity: 0.55,
              mb: 0.35,
            }}
          >
            check-in{checkins !== 1 ? 's' : ''}
          </Typography>
        </Box>

        <Typography
          level="body-xs"
          sx={{
            color: 'text.tertiary',
            fontSize: '0.78rem',
            opacity: 0.45,
            mb: streak > 0 ? 1.5 : 0,
          }}
        >
          across {goals} active goal{goals !== 1 ? 's' : ''}
        </Typography>

        {/* Best streak pill */}
        {streak > 0 && (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              px: 1.5,
              py: 0.35,
              borderRadius: '20px',
              border: '1px solid',
              borderColor: streak >= 7 ? 'warning.300' : 'divider',
              bgcolor: streak >= 7 ? 'warning.softBg' : 'transparent',
            }}
          >
            <Typography
              level="body-xs"
              sx={{
                color: streak >= 7 ? 'warning.600' : 'text.tertiary',
                fontSize: '0.72rem',
                fontWeight: streak >= 7 ? 600 : 400,
              }}
            >
              best streak: {streak} day{streak !== 1 ? 's' : ''}{streak >= 7 ? ' 🔥' : ''}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}
