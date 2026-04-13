'use client'

import { useState } from 'react'
import Box from '@mui/joy/Box'
import Button from '@mui/joy/Button'
import Typography from '@mui/joy/Typography'

interface Props {
  unsubscribed: boolean
  token: string
}

export default function SettingsClient({ unsubscribed: initial, token }: Props) {
  const [unsubscribed, setUnsubscribed] = useState(initial)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const res = await fetch('/api/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, resubscribe: unsubscribed }),
    })
    if (res.ok) {
      const data = await res.json()
      setUnsubscribed(data.unsubscribed)
    }
    setLoading(false)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 3,
        flexWrap: 'wrap',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        {/* Bell icon */}
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            bgcolor: unsubscribed ? 'background.level1' : 'rgba(14,165,233,0.1)',
            border: '1px solid',
            borderColor: unsubscribed ? 'divider' : 'rgba(14,165,233,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.2s',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={unsubscribed ? 'currentColor' : 'rgb(14,165,233)'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ opacity: unsubscribed ? 0.35 : 1 }}
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </Box>
        <Box>
          <Typography level="body-sm" sx={{ color: 'text.primary', fontWeight: 600, mb: 0.25, fontSize: '0.9rem' }}>
            daily accountability emails
          </Typography>
          <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.6, fontSize: '0.78rem' }}>
            {unsubscribed
              ? 'you are unsubscribed — no emails will be sent'
              : 'one email per day per active goal'}
          </Typography>
        </Box>
      </Box>

      <Button
        size="sm"
        variant="outlined"
        loading={loading}
        onClick={toggle}
        sx={{
          borderRadius: '20px',
          fontWeight: 600,
          fontSize: '0.78rem',
          px: 2.5,
          borderColor: unsubscribed ? 'divider' : 'rgba(249,115,22,0.35)',
          color: unsubscribed ? 'text.secondary' : 'rgb(249,115,22)',
          bgcolor: unsubscribed ? 'transparent' : 'rgba(249,115,22,0.06)',
          '&:hover': {
            borderColor: unsubscribed ? 'neutral.outlinedHoverBorder' : 'rgba(249,115,22,0.6)',
            bgcolor: unsubscribed ? 'background.level1' : 'rgba(249,115,22,0.1)',
          },
          transition: 'all 0.15s',
        }}
      >
        {unsubscribed ? 'resubscribe' : 'unsubscribe'}
      </Button>
    </Box>
  )
}
