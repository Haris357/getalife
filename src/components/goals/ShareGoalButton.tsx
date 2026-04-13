'use client'

import { useState } from 'react'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'

interface Props {
  goalId: string
}

export default function ShareGoalButton({ goalId }: Props) {
  const [copied, setCopied] = useState(false)

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/share/complete/${goalId}`

  const handleClick = async () => {
    // Open in new tab
    window.open(`/api/share/complete/${goalId}`, '_blank', 'noopener,noreferrer')

    // Copy URL to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable — still opened in tab
    }
  }

  return (
    <Box
      onClick={handleClick}
      sx={{
        px: 1.75,
        py: 0.6,
        borderRadius: '20px',
        border: '1px solid',
        borderColor: copied ? 'success.300' : 'divider',
        bgcolor: copied ? 'success.softBg' : 'transparent',
        cursor: 'pointer',
        transition: 'border-color 0.15s, background-color 0.15s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        '&:hover': {
          borderColor: copied ? 'success.400' : 'neutral.outlinedHoverBorder',
        },
      }}
    >
      <Typography
        level="body-xs"
        sx={{
          color: copied ? 'success.700' : 'text.tertiary',
          fontSize: '0.75rem',
          opacity: copied ? 1 : 0.6,
          fontWeight: copied ? 600 : 400,
          transition: 'color 0.15s',
        }}
      >
        {copied ? 'copied!' : 'share card →'}
      </Typography>
    </Box>
  )
}
