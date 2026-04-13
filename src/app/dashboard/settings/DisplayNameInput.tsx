'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/joy/Box'
import Input from '@mui/joy/Input'
import Button from '@mui/joy/Button'
import Typography from '@mui/joy/Typography'

interface Props {
  displayName: string | null
}

export default function DisplayNameInput({ displayName: initial }: Props) {
  const router = useRouter()
  const [value, setValue] = useState(initial ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!value.trim()) return
    setSaving(true)
    setError('')
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ display_name: value.trim() }),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to save')
    }
    setSaving(false)
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
        <Box>
          <Typography level="body-sm" sx={{ color: 'text.primary', fontWeight: 600, mb: 0.2, fontSize: '0.88rem' }}>
            display name
          </Typography>
          <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.55, fontSize: '0.75rem' }}>
            shown in the community feed next to your posts
          </Typography>
        </Box>
        {saved && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              bgcolor: 'rgba(34,197,94,0.1)',
              border: '1px solid',
              borderColor: 'rgba(34,197,94,0.25)',
              borderRadius: '20px',
              px: 1.5,
              py: 0.5,
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgb(34,197,94)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <Typography level="body-xs" sx={{ color: 'rgb(34,197,94)', fontSize: '0.72rem', fontWeight: 600 }}>
              saved
            </Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'stretch', flexWrap: 'wrap' }}>
        <Input
          value={value}
          onChange={e => { setValue(e.target.value); setError('') }}
          placeholder="your handle"
          sx={{
            flex: 1,
            minWidth: 160,
            bgcolor: 'background.level1',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '10px',
            fontSize: '0.88rem',
            '--Input-focusedThickness': '0px',
            '&:focus-within': {
              borderColor: 'rgba(14,165,233,0.5)',
              bgcolor: 'background.surface',
            },
            transition: 'border-color 0.15s',
          }}
        />
        <Button
          size="sm"
          variant="outlined"
          loading={saving}
          disabled={!value.trim() || value.trim() === (initial ?? '')}
          onClick={handleSave}
          sx={{
            borderRadius: '20px',
            fontWeight: 600,
            fontSize: '0.78rem',
            px: 2.5,
            borderColor: 'rgba(14,165,233,0.4)',
            color: 'rgb(14,165,233)',
            bgcolor: 'rgba(14,165,233,0.06)',
            '&:hover:not(:disabled)': {
              borderColor: 'rgb(14,165,233)',
              bgcolor: 'rgba(14,165,233,0.12)',
            },
            '&:disabled': {
              borderColor: 'divider',
              color: 'text.tertiary',
              opacity: 0.5,
            },
            transition: 'all 0.15s',
          }}
        >
          save
        </Button>
      </Box>
      {error && (
        <Typography level="body-xs" sx={{ color: 'danger.500', mt: 1, fontSize: '0.75rem' }}>
          {error}
        </Typography>
      )}
    </Box>
  )
}
