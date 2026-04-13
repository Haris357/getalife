'use client'

import { useState } from 'react'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Input from '@mui/joy/Input'
import Textarea from '@mui/joy/Textarea'
import Button from '@mui/joy/Button'
import type { CommunityRule } from '@/types'

interface Props {
  initialRules: CommunityRule[]
}

export default function ModRulesEditor({ initialRules }: Props) {
  const [rules, setRules] = useState<CommunityRule[]>(initialRules)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)

  async function handleAdd() {
    if (!newTitle.trim()) return
    setAdding(true)
    const res = await fetch('/api/community/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, description: newDesc || undefined, display_order: rules.length + 1 }),
    })
    if (res.ok) {
      const { rule } = await res.json()
      setRules(r => [...r, rule])
      setNewTitle('')
      setNewDesc('')
      setShowForm(false)
    }
    setAdding(false)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/community/rules/${id}`, { method: 'DELETE' })
    setRules(r => r.filter(rule => rule.id !== id))
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {rules.length === 0 && !showForm && (
        <Typography sx={{ fontSize: '0.82rem', color: 'text.tertiary', opacity: 0.4, py: 1 }}>
          no rules yet
        </Typography>
      )}

      {rules.map((rule, i) => (
        <Box
          key={rule.id}
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'flex-start',
            p: 2.5,
            borderRadius: '10px',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.level1',
            transition: 'border-color 0.15s',
            '&:hover': { borderColor: 'text.tertiary' },
          }}
        >
          {/* Drag handle style indicator */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '3px', mt: 0.75, flexShrink: 0, opacity: 0.2 }}>
            {[0, 1, 2].map(j => (
              <Box key={j} sx={{ width: 14, height: 1.5, bgcolor: 'text.tertiary', borderRadius: '1px' }} />
            ))}
          </Box>

          <Typography
            sx={{
              fontSize: '0.78rem',
              color: 'text.tertiary',
              opacity: 0.35,
              fontWeight: 700,
              minWidth: 18,
              mt: 0.15,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {i + 1}
          </Typography>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: 'text.primary', mb: 0.35 }}>
              {rule.title}
            </Typography>
            {rule.description && (
              <Typography sx={{ fontSize: '0.78rem', color: 'text.tertiary', opacity: 0.6, lineHeight: 1.5 }}>
                {rule.description}
              </Typography>
            )}
          </Box>

          <Box
            component="button"
            onClick={() => handleDelete(rule.id)}
            sx={{ background: 'none', border: 'none', cursor: 'pointer', p: 0.5, flexShrink: 0, borderRadius: '4px', '&:hover': { bgcolor: 'danger.softBg' } }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--joy-palette-danger-500)', opacity: 0.6 }}>
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </Box>
        </Box>
      ))}

      {showForm ? (
        <Box
          sx={{
            p: 3,
            borderRadius: '10px',
            border: '1px solid',
            borderColor: 'rgb(14,165,233)',
            bgcolor: 'background.level1',
          }}
        >
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'text.tertiary', opacity: 0.55, mb: 2 }}>
            New Rule
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Input
              placeholder="rule title"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              sx={{
                borderRadius: '8px',
                fontSize: '0.875rem',
                '--Input-focusedThickness': '0px',
                '&:focus-within': { borderColor: 'rgb(14,165,233)' },
              }}
            />
            <Textarea
              placeholder="description (optional)"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              minRows={2}
              maxRows={4}
              sx={{
                borderRadius: '8px',
                fontSize: '0.875rem',
                '--Textarea-focusedThickness': '0px',
                '&:focus-within': { borderColor: 'rgb(14,165,233)' },
              }}
            />
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                size="sm"
                loading={adding}
                disabled={!newTitle.trim()}
                onClick={handleAdd}
                sx={{
                  borderRadius: '20px',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  px: 2.5,
                  background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                  color: '#fff',
                  border: 'none',
                  '&:hover': { opacity: 0.9 },
                  '&:disabled': { opacity: 0.4 },
                }}
              >
                save rule
              </Button>
              <Button
                size="sm"
                variant="plain"
                onClick={() => { setShowForm(false); setNewTitle(''); setNewDesc('') }}
                sx={{ borderRadius: '20px', color: 'text.tertiary', fontSize: '0.78rem', px: 2 }}
              >
                cancel
              </Button>
            </Box>
          </Box>
        </Box>
      ) : (
        <Box>
          <Button
            size="sm"
            variant="outlined"
            onClick={() => setShowForm(true)}
            sx={{
              borderRadius: '20px',
              fontWeight: 600,
              fontSize: '0.78rem',
              borderColor: 'divider',
              color: 'text.tertiary',
              px: 2.5,
              '&:hover': { borderColor: 'rgb(14,165,233)', color: 'text.primary', bgcolor: 'background.level1' },
            }}
          >
            + add rule
          </Button>
        </Box>
      )}
    </Box>
  )
}
