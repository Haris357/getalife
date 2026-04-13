'use client'

import { useEffect, useState } from 'react'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import { BADGE_MAP, RARITY_COLORS } from '@/lib/game/badges'
import type { BadgeType } from '@/types'
import type { XPGain } from '@/lib/game/xp'

interface Props {
  xpGain: XPGain
  leveledUp: boolean
  newLevel: number
  newTitle: string
  shieldUsed: boolean
  shieldEarned: boolean
  newShields: number
  newBadges: BadgeType[]
}

export default function XPToast({ xpGain, leveledUp, newLevel, newTitle, shieldUsed, shieldEarned, newShields, newBadges }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <Box
      sx={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.35s ease, transform 0.35s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        mb: 4,
      }}
    >
      {/* XP gained */}
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 0.75,
          borderRadius: '8px',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.surface',
          alignSelf: 'flex-start',
        }}
      >
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: 'text.primary', letterSpacing: '-0.01em' }}>
          +{xpGain.total} XP
        </Typography>
        {xpGain.streakBonus > 0 && (
          <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.5, fontSize: '0.72rem' }}>
            streak ×{Math.floor(xpGain.streakBonus / 5) + 1}
          </Typography>
        )}
        {xpGain.mediaBonus > 0 && (
          <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.5, fontSize: '0.72rem' }}>+ media</Typography>
        )}
      </Box>

      {/* Level up */}
      {leveledUp && (
        <Box
          sx={{
            px: 2,
            py: 1,
            borderRadius: '8px',
            border: '1px solid',
            borderColor: 'primary.300',
            bgcolor: 'primary.softBg',
            animation: 'pulse 1.5s ease-in-out 2',
            '@keyframes pulse': {
              '0%, 100%': { boxShadow: 'none' },
              '50%': { boxShadow: '0 0 12px var(--joy-palette-primary-300)' },
            },
          }}
        >
          <Typography level="body-xs" sx={{ color: 'primary.700', fontWeight: 700, fontSize: '0.82rem' }}>
            LEVEL UP → Lv.{newLevel} · {newTitle}
          </Typography>
        </Box>
      )}

      {/* Shield events */}
      {shieldUsed && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '1rem' }}>🛡️</Typography>
          <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '0.78rem', opacity: 0.7 }}>
            streak shield absorbed your missed day — streak protected
          </Typography>
        </Box>
      )}
      {shieldEarned && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '1rem' }}>🛡️</Typography>
          <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '0.78rem', opacity: 0.7 }}>
            streak shield earned! you now have {newShields} shield{newShields !== 1 ? 's' : ''}
          </Typography>
        </Box>
      )}

      {/* New badges */}
      {newBadges.map((type) => {
        const def = BADGE_MAP[type]
        return (
          <Box
            key={type}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              px: 1.5,
              py: 0.75,
              borderRadius: '8px',
              border: '1px solid',
              borderColor: RARITY_COLORS[def.rarity] + '60',
              bgcolor: RARITY_COLORS[def.rarity] + '10',
            }}
          >
            <Typography sx={{ fontSize: '1.1rem' }}>{def.icon}</Typography>
            <Box>
              <Typography level="body-xs" sx={{ color: 'text.primary', fontWeight: 700, fontSize: '0.8rem' }}>
                Badge unlocked: {def.label}
              </Typography>
              <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.6, fontSize: '0.72rem' }}>
                {def.description}
              </Typography>
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}
