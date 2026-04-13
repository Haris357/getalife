'use client'

import { useState } from 'react'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'

interface Props {
  challengeId: string
  isJoined: boolean
}

export default function ChallengeJoinButton({ challengeId, isJoined: initialJoined }: Props) {
  const [joined, setJoined] = useState(initialJoined)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    try {
      const res = await fetch(`/api/challenges/${challengeId}/join`, {
        method: joined ? 'DELETE' : 'POST',
      })
      if (res.ok) {
        setJoined(j => !j)
      }
    } catch {
      // ignore
    }
    setLoading(false)
  }

  return (
    <Box
      component="button"
      onClick={toggle}
      disabled={loading}
      sx={{
        px: 2.5,
        py: 0.85,
        borderRadius: '20px',
        border: joined ? '1px solid' : 'none',
        borderColor: joined ? 'divider' : 'transparent',
        background: joined ? 'none' : 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
        cursor: loading ? 'wait' : 'pointer',
        opacity: loading ? 0.6 : 1,
        transition: 'opacity 0.15s',
        bgcolor: joined ? 'background.level1' : 'transparent',
        '&:hover': { opacity: 0.8 },
      }}
    >
      <Typography
        sx={{
          fontSize: '0.8rem',
          fontWeight: 700,
          color: joined ? 'text.secondary' : '#fff',
        }}
      >
        {loading ? '...' : joined ? 'Leave' : 'Join Challenge'}
      </Typography>
    </Box>
  )
}
