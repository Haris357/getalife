'use client'

import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'

interface Props {
  displayName: string | null
  level: number | null
  title: string | null
  avatarUrl?: string | null
  size?: 'sm' | 'md'
}

export default function UserBadge({ displayName, level, title, avatarUrl, size = 'sm' }: Props) {
  const name = displayName ?? 'anon'
  const isMd = size === 'md'
  const avatarSize = isMd ? 28 : 22

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {/* Avatar */}
      <Box
        sx={{
          width: avatarSize,
          height: avatarSize,
          borderRadius: '50%',
          flexShrink: 0,
          overflow: 'hidden',
          bgcolor: 'background.level2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {avatarUrl ? (
          <Box
            component="img"
            src={avatarUrl}
            alt={name}
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <Typography
            sx={{
              fontSize: isMd ? '0.65rem' : '0.55rem',
              fontWeight: 700,
              color: 'text.tertiary',
              opacity: 0.5,
              lineHeight: 1,
            }}
          >
            {name.slice(0, 2).toUpperCase()}
          </Typography>
        )}
      </Box>

      {/* Level pill */}
      {level && (
        <Box
          sx={{
            px: isMd ? 1 : 0.75,
            py: 0.2,
            borderRadius: '4px',
            background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{
              fontSize: isMd ? '0.6rem' : '0.55rem',
              fontWeight: 700,
              color: '#fff',
              letterSpacing: '0.04em',
              lineHeight: 1,
            }}
          >
            {level}
          </Typography>
        </Box>
      )}

      <Typography
        sx={{
          fontSize: isMd ? '0.82rem' : '0.75rem',
          color: 'text.secondary',
          fontWeight: 600,
        }}
      >
        {name}
      </Typography>

      {title && (
        <Typography
          sx={{
            fontSize: isMd ? '0.7rem' : '0.65rem',
            color: 'text.tertiary',
            opacity: 0.45,
          }}
        >
          · {title}
        </Typography>
      )}
    </Box>
  )
}
