'use client'

import { useEffect, useState } from 'react'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import { getLevelInfo } from '@/lib/game/xp'

interface Props {
  xp: number
  level: number
  title: string
  compact?: boolean
}

export default function XPBar({ xp, level, title, compact }: Props) {
  const { progress, nextMin, currentMin } = getLevelInfo(xp)
  const [animatedProgress, setAnimatedProgress] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setAnimatedProgress(progress), 120)
    return () => clearTimeout(t)
  }, [progress])

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            px: 1.25,
            py: 0.35,
            borderRadius: '20px',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.surface',
          }}
        >
          <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.02em' }}>
            Lv.{level} · {title}
          </Typography>
        </Box>
        <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.4, fontSize: '0.72rem' }}>
          {xp.toLocaleString('en-US')} XP
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: 'text.primary', letterSpacing: '-0.02em', lineHeight: 1 }}>
            Lv.{level}
          </Typography>
          <Typography level="body-xs" sx={{ color: 'text.tertiary', fontWeight: 600, fontSize: '0.8rem' }}>
            {title}
          </Typography>
        </Box>
        <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.45, fontSize: '0.72rem' }}>
          {xp.toLocaleString('en-US')} {nextMin ? `/ ${nextMin.toLocaleString('en-US')} XP` : 'XP · MAX'}
        </Typography>
      </Box>

      {/* XP bar */}
      <Box sx={{ height: 4, bgcolor: 'background.level2', borderRadius: 4, overflow: 'hidden' }}>
        <Box
          sx={{
            height: '100%',
            width: `${animatedProgress}%`,
            borderRadius: 4,
            background: 'linear-gradient(90deg, var(--joy-palette-primary-500), var(--joy-palette-primary-300))',
            transition: 'width 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 0 8px var(--joy-palette-primary-400)',
          }}
        />
      </Box>

      {nextMin && (
        <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.3, mt: 0.75, fontSize: '0.68rem' }}>
          {(nextMin - xp).toLocaleString('en-US')} XP to {getLevelInfo(nextMin).title}
        </Typography>
      )}
    </Box>
  )
}
