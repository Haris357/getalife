'use client'

import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import type { Pod } from '@/types'

interface Props {
  pod: Pod
  onClick: () => void
}

export default function PodCard({ pod, onClick }: Props) {
  return (
    <Box
      onClick={onClick}
      sx={{
        bgcolor: 'background.surface',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
        '&:hover': { borderColor: 'neutral.outlinedHoverBorder' },
      }}
    >
      {/* Gradient left accent bar */}
      <Box
        sx={{
          width: 4,
          flexShrink: 0,
          background: 'linear-gradient(180deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
        }}
      />

      <Box sx={{ flex: 1, px: 3, py: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 1.5 }}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '0.95rem',
              color: 'text.primary',
              letterSpacing: '-0.01em',
              lineHeight: 1.35,
            }}
          >
            {pod.name}
          </Typography>

          {/* Invite code badge */}
          <Box
            sx={{
              px: 1.5,
              py: 0.35,
              borderRadius: '6px',
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.level1',
              flexShrink: 0,
            }}
          >
            <Typography
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: 'text.tertiary',
                opacity: 0.7,
              }}
            >
              {pod.invite_code}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '0.72rem', opacity: 0.5 }}>
            {pod.member_count} / {pod.max_members} members
          </Typography>
          {pod.creator_name && (
            <>
              <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'divider' }} />
              <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '0.72rem', opacity: 0.45 }}>
                by {pod.creator_name}
              </Typography>
            </>
          )}
        </Box>
      </Box>
    </Box>
  )
}
