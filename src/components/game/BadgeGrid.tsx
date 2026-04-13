import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import { BADGE_DEFS, RARITY_COLORS } from '@/lib/game/badges'
import type { BadgeType } from '@/types'

interface Props {
  earned: BadgeType[]
}

export default function BadgeGrid({ earned }: Props) {
  const earnedSet = new Set(earned)

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1.5 }}>
      {BADGE_DEFS.map((badge) => {
        const unlocked = earnedSet.has(badge.type)
        return (
          <Box
            key={badge.type}
            title={`${badge.label} — ${badge.description}`}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.75,
              p: 1.25,
              borderRadius: '10px',
              border: '1px solid',
              borderColor: unlocked ? RARITY_COLORS[badge.rarity] + '40' : 'divider',
              bgcolor: unlocked ? RARITY_COLORS[badge.rarity] + '08' : 'transparent',
              transition: 'all 0.2s',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Glow effect for unlocked */}
            {unlocked && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -10,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: RARITY_COLORS[badge.rarity],
                  opacity: 0.12,
                  filter: 'blur(12px)',
                  pointerEvents: 'none',
                }}
              />
            )}
            <Typography sx={{ fontSize: unlocked ? '1.5rem' : '1.5rem', filter: unlocked ? 'none' : 'grayscale(1)', opacity: unlocked ? 1 : 0.25 }}>
              {badge.icon}
            </Typography>
            <Typography
              level="body-xs"
              sx={{
                fontSize: '0.62rem',
                color: unlocked ? 'text.secondary' : 'text.tertiary',
                opacity: unlocked ? 0.8 : 0.3,
                textAlign: 'center',
                lineHeight: 1.3,
                fontWeight: unlocked ? 600 : 400,
              }}
            >
              {badge.label}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}
