'use client'

import { useState } from 'react'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import type { EmailType } from '@/types'

interface Scenario {
  type: EmailType
  label: string
  description: string
}

interface SendState {
  status: 'idle' | 'sending' | 'sent' | 'error'
  subject?: string
  error?: string
}

const TYPE_COLORS: Record<string, string> = {
  welcome:         'rgb(14,165,233)',
  reminder:        'rgb(249,115,22)',
  countdown_start: 'rgb(168,85,247)',
  countdown_mid:   'rgb(168,85,247)',
  countdown_end:   'rgb(239,68,68)',
  coaching:        'rgb(34,197,94)',
  newsletter:      'rgb(234,179,8)',
}

export default function EmailTestClient({ scenarios, userEmail }: { scenarios: Scenario[]; userEmail: string }) {
  const [states, setStates] = useState<Record<string, SendState>>(
    Object.fromEntries(scenarios.map(s => [s.type, { status: 'idle' }]))
  )
  const [sendingAll, setSendingAll] = useState(false)
  const [allResult, setAllResult] = useState<string | null>(null)

  function setTypeState(type: string, state: SendState) {
    setStates(prev => ({ ...prev, [type]: state }))
  }

  async function sendOne(type: EmailType) {
    setTypeState(type, { status: 'sending' })
    try {
      const res = await fetch('/api/dev/send-test-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      const data = await res.json()
      if (res.ok && data.sent) {
        setTypeState(type, { status: 'sent', subject: data.subject })
      } else {
        setTypeState(type, { status: 'error', error: data.error ?? 'failed' })
      }
    } catch {
      setTypeState(type, { status: 'error', error: 'network error' })
    }
  }

  async function sendAll() {
    setSendingAll(true)
    setAllResult(null)
    // Reset all states
    setStates(Object.fromEntries(scenarios.map(s => [s.type, { status: 'idle' }])))

    try {
      // Send one by one so UI updates progressively
      for (const s of scenarios) {
        setTypeState(s.type, { status: 'sending' })
        const res = await fetch('/api/dev/send-test-emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: s.type }),
        })
        const data = await res.json()
        if (res.ok && data.sent) {
          setTypeState(s.type, { status: 'sent', subject: data.subject })
        } else {
          setTypeState(s.type, { status: 'error', error: data.error ?? 'failed' })
        }
        await new Promise(r => setTimeout(r, 400))
      }
      setAllResult(`all ${scenarios.length} emails sent to ${userEmail}`)
    } catch {
      setAllResult('something went wrong')
    } finally {
      setSendingAll(false)
    }
  }

  const anySending = sendingAll || Object.values(states).some(s => s.status === 'sending')

  return (
    <Box>
      {/* Header controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.4, fontSize: '0.7rem', mb: 0.5 }}>
            sending to
          </Typography>
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: 'text.primary' }}>
            {userEmail}
          </Typography>
        </Box>

        <Box
          component="button"
          onClick={sendAll}
          disabled={anySending}
          sx={{
            px: 3,
            py: 1.25,
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
            border: 'none',
            cursor: anySending ? 'wait' : 'pointer',
            opacity: anySending ? 0.6 : 1,
            transition: 'filter 0.15s',
            '&:hover:not(:disabled)': { filter: 'brightness(1.08)' },
          }}
        >
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
            {sendingAll ? 'sending all…' : `send all ${scenarios.length} →`}
          </Typography>
        </Box>
      </Box>

      {allResult && (
        <Box sx={{ mb: 4, px: 3, py: 2, borderRadius: '8px', bgcolor: 'background.level2', border: '1px solid', borderColor: 'divider' }}>
          <Typography level="body-xs" sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>
            ✓ {allResult}
          </Typography>
        </Box>
      )}

      {/* Email cards */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {scenarios.map(s => {
          const state = states[s.type]
          const color = TYPE_COLORS[s.type] ?? 'rgb(14,165,233)'

          return (
            <Box
              key={s.type}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                px: 3,
                py: 2.5,
                borderRadius: '10px',
                border: '1px solid',
                borderColor: state.status === 'sent' ? 'success.300' : state.status === 'error' ? 'danger.300' : 'divider',
                bgcolor: 'background.surface',
                transition: 'border-color 0.2s',
              }}
            >
              {/* Color dot */}
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0, opacity: 0.85 }} />

              {/* Info */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.35 }}>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: 'text.primary' }}>
                    {s.label}
                  </Typography>
                  <Box sx={{ px: 0.75, py: 0.1, borderRadius: '4px', bgcolor: 'background.level2' }}>
                    <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', opacity: 0.6, fontFamily: 'monospace' }}>
                      {s.type}
                    </Typography>
                  </Box>
                </Box>
                <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.55, fontSize: '0.78rem' }}>
                  {s.description}
                </Typography>
                {state.status === 'sent' && state.subject && (
                  <Typography level="body-xs" sx={{ color: 'success.500', fontSize: '0.75rem', mt: 0.5, opacity: 0.85 }}>
                    ✓ sent · subject: "{state.subject}"
                  </Typography>
                )}
                {state.status === 'error' && (
                  <Typography level="body-xs" sx={{ color: 'danger.500', fontSize: '0.75rem', mt: 0.5 }}>
                    ✕ {state.error}
                  </Typography>
                )}
              </Box>

              {/* Send button */}
              <Box
                component="button"
                onClick={() => sendOne(s.type)}
                disabled={state.status === 'sending' || sendingAll}
                sx={{
                  flexShrink: 0,
                  px: 2,
                  py: 0.9,
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: state.status === 'sent' ? 'success.300' : 'divider',
                  bgcolor:
                    state.status === 'sent'
                      ? 'success.softBg'
                      : state.status === 'error'
                        ? 'danger.softBg'
                        : 'background.level1',
                  cursor: state.status === 'sending' || sendingAll ? 'wait' : 'pointer',
                  opacity: state.status === 'sending' || sendingAll ? 0.5 : 1,
                  transition: 'all 0.15s',
                  '&:hover:not(:disabled)': { borderColor: 'text.tertiary' },
                }}
              >
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                  {state.status === 'sending' ? 'sending…' : state.status === 'sent' ? 'sent ✓' : state.status === 'error' ? 'retry' : 'send →'}
                </Typography>
              </Box>
            </Box>
          )
        })}
      </Box>

      {/* Footer note */}
      <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.3, mt: 4, fontSize: '0.72rem' }}>
        coaching + newsletter emails are AI-generated and may take a few seconds · this page only works in development
      </Typography>
    </Box>
  )
}
