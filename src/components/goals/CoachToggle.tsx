'use client'

import { useState, useEffect } from 'react'
import Box from '@mui/joy/Box'
import Button from '@mui/joy/Button'
import Typography from '@mui/joy/Typography'

export default function CoachToggle() {
  const [isCoach, setIsCoach] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [patching, setPatching] = useState(false)

  useEffect(() => {
    fetch('/api/coach')
      .then((r) => r.json())
      .then((d) => setIsCoach(d.is_coach ?? false))
      .catch(() => setIsCoach(false))
      .finally(() => setLoading(false))
  }, [])

  async function toggle() {
    if (isCoach === null) return
    setPatching(true)
    const next = !isCoach
    const res = await fetch('/api/coach', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_coach: next }),
    })
    if (res.ok) setIsCoach(next)
    setPatching(false)
  }

  if (loading) {
    return (
      <Box sx={{ height: 32, display: 'flex', alignItems: 'center' }}>
        <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.4, fontSize: '0.78rem' }}>
          loading...
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
      <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '0.78rem' }}>
        {isCoach ? 'you are accepting coachees' : 'you are not accepting coachees'}
      </Typography>
      <Button
        size="sm"
        variant="outlined"
        loading={patching}
        onClick={toggle}
        sx={{
          borderRadius: '20px',
          fontWeight: 600,
          fontSize: '0.78rem',
          px: 2.5,
          borderColor: isCoach ? 'rgba(249,115,22,0.35)' : 'divider',
          color: isCoach ? 'rgb(249,115,22)' : 'text.secondary',
          bgcolor: isCoach ? 'rgba(249,115,22,0.06)' : 'transparent',
          '&:hover': {
            borderColor: isCoach ? 'rgba(249,115,22,0.6)' : 'neutral.outlinedHoverBorder',
            bgcolor: isCoach ? 'rgba(249,115,22,0.1)' : 'background.level1',
          },
          transition: 'all 0.15s',
        }}
      >
        {isCoach ? 'stop coaching' : 'become a coach'}
      </Button>
    </Box>
  )
}
