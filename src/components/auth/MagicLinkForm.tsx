'use client'

import { useState } from 'react'
import Box from '@mui/joy/Box'
import Input from '@mui/joy/Input'
import Typography from '@mui/joy/Typography'
import GradientButton from '@/components/shared/GradientButton'

type Status = 'idle' | 'loading' | 'sent' | 'error'

export default function MagicLinkForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Something went wrong')
      }
      setStatus('sent')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <Box>
        <Typography level="title-md" sx={{ color: 'text.primary', mb: 0.5 }}>
          check your inbox
        </Typography>
        <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
          we sent a magic link to{' '}
          <span style={{ color: 'inherit', opacity: 0.8 }}>{email}</span>
        </Typography>
      </Box>
    )
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          size="lg"
          disabled={status === 'loading'}
          sx={{
            flex: 1,
            bgcolor: 'background.level1',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '6px',
            fontSize: '0.9rem',
            color: 'text.primary',
            '--Input-focusedThickness': '0px',
            '&:hover': { borderColor: 'neutral.outlinedBorder' },
            '&:focus-within': { borderColor: 'text.tertiary' },
          }}
        />
        <GradientButton
          type="submit"
          loading={status === 'loading'}
          size="lg"
          sx={{ flexShrink: 0, borderRadius: '6px', px: 3 }}
        >
          get started
        </GradientButton>
      </Box>
      {status === 'error' && (
        <Typography level="body-xs" sx={{ color: 'danger.500', mt: 1 }}>
          {errorMsg}
        </Typography>
      )}
      <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.4, mt: 1.5 }}>
        just your email.
      </Typography>
    </Box>
  )
}
