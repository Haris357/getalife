'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Input from '@mui/joy/Input'
import Button from '@mui/joy/Button'
import type { RoadmapPhase } from '@/types'

interface Props {
  goalId: string
  roadmap: RoadmapPhase[]
  canEdit: boolean
}

export default function RoadmapEditor({ goalId, roadmap: initial, canEdit }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [phases, setPhases] = useState<RoadmapPhase[]>(initial)
  const [saving, setSaving] = useState(false)

  function updateTitle(i: number, title: string) {
    setPhases(prev => prev.map((p, idx) => idx === i ? { ...p, title } : p))
  }

  function updateFocus(pi: number, fi: number, value: string) {
    setPhases(prev => prev.map((p, idx) => idx === pi
      ? { ...p, focus: p.focus.map((f, j) => j === fi ? value : f) }
      : p
    ))
  }

  function addFocus(pi: number) {
    setPhases(prev => prev.map((p, idx) => idx === pi
      ? { ...p, focus: [...p.focus, ''] }
      : p
    ))
  }

  function removeFocus(pi: number, fi: number) {
    setPhases(prev => prev.map((p, idx) => idx === pi
      ? { ...p, focus: p.focus.filter((_, j) => j !== fi) }
      : p
    ))
  }

  function addPhase() {
    setPhases(prev => [
      ...prev,
      { phase: prev.length + 1, title: '', focus: [''] },
    ])
  }

  function removePhase(i: number) {
    setPhases(prev =>
      prev
        .filter((_, idx) => idx !== i)
        .map((p, idx) => ({ ...p, phase: idx + 1 }))
    )
  }

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/goals/${goalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roadmap: phases }),
    })
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  function handleCancel() {
    setPhases(initial)
    setEditing(false)
  }

  return (
    <Box sx={{ mb: 8 }}>
      {/* Header row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography
          level="body-xs"
          sx={{ color: 'text.tertiary', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.68rem', opacity: 0.5 }}
        >
          your arc · {phases.length} chapter{phases.length !== 1 ? 's' : ''}
        </Typography>
        {canEdit && !editing && (
          <Box
            component="button"
            onClick={() => setEditing(true)}
            sx={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              p: 0,
              color: 'text.tertiary',
              fontSize: '0.72rem',
              fontFamily: 'inherit',
              opacity: 0.4,
              '&:hover': { opacity: 0.85 },
              transition: 'opacity 0.15s',
            }}
          >
            edit
          </Box>
        )}
      </Box>

      {/* Chapters */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {phases.map((phase, i) => (
          <Box
            key={phase.phase}
            sx={{
              pb: 4,
              pt: i === 0 ? 0 : 4,
              borderBottom: i < phases.length - 1 ? '1px solid' : 'none',
              borderColor: 'divider',
            }}
          >
            {/* Chapter number + title */}
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mb: editing ? 1.5 : 1.25 }}>
              <Typography
                sx={{
                  fontVariantNumeric: 'tabular-nums',
                  color: 'text.tertiary',
                  fontSize: '0.68rem',
                  fontFamily: '-apple-system, sans-serif',
                  opacity: 0.3,
                  letterSpacing: '0.05em',
                  flexShrink: 0,
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </Typography>

              {editing ? (
                <>
                  <Input
                    value={phase.title}
                    onChange={e => updateTitle(i, e.target.value)}
                    placeholder="chapter title..."
                    size="sm"
                    sx={{
                      flex: 1,
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      '--Input-focusedThickness': '0px',
                      bgcolor: 'background.level1',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: '6px',
                      color: 'text.primary',
                    }}
                  />
                  {phases.length > 1 && (
                    <Box
                      component="button"
                      onClick={() => removePhase(i)}
                      title="remove chapter"
                      sx={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'text.tertiary', opacity: 0.35, fontSize: '0.75rem',
                        p: 0.5, borderRadius: '4px', flexShrink: 0,
                        '&:hover': { opacity: 1, color: 'danger.500' },
                        transition: 'opacity 0.15s, color 0.15s',
                      }}
                    >
                      ✕
                    </Box>
                  )}
                </>
              ) : (
                <Typography
                  level="body-sm"
                  sx={{ color: 'text.primary', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '-0.01em' }}
                >
                  {phase.title}
                </Typography>
              )}
            </Box>

            {/* Focus items */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: editing ? 1 : 0.6, pl: editing ? 0 : '2.2rem' }}>
              {phase.focus.map((item, j) => (
                <Box key={j} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {!editing && (
                    <Typography sx={{ color: 'text.tertiary', opacity: 0.35, fontSize: '0.75rem', lineHeight: 1, flexShrink: 0 }}>
                      —
                    </Typography>
                  )}
                  {editing ? (
                    <>
                      <Input
                        value={item}
                        onChange={e => updateFocus(i, j, e.target.value)}
                        placeholder="focus item..."
                        size="sm"
                        sx={{
                          flex: 1,
                          fontSize: '0.85rem',
                          '--Input-focusedThickness': '0px',
                          bgcolor: 'background.level1',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: '6px',
                          color: 'text.secondary',
                        }}
                      />
                      {phase.focus.length > 1 && (
                        <Box
                          component="button"
                          onClick={() => removeFocus(i, j)}
                          sx={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'text.tertiary', opacity: 0.4, fontSize: '0.8rem',
                            p: 0.5, borderRadius: '4px', flexShrink: 0,
                            '&:hover': { opacity: 1, color: 'danger.500' },
                            transition: 'opacity 0.15s, color 0.15s',
                          }}
                        >
                          ✕
                        </Box>
                      )}
                    </>
                  ) : (
                    <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '0.85rem', lineHeight: 1.55, opacity: 0.7 }}>
                      {item}
                    </Typography>
                  )}
                </Box>
              ))}

              {editing && phase.focus.length < 6 && (
                <Box
                  component="button"
                  onClick={() => addFocus(i)}
                  sx={{
                    background: 'none', border: '1px dashed', borderColor: 'divider',
                    cursor: 'pointer', color: 'text.tertiary', opacity: 0.5,
                    fontSize: '0.78rem', fontFamily: 'inherit', py: 0.75, px: 1.5,
                    borderRadius: '6px', textAlign: 'left', mt: 0.5,
                    '&:hover': { opacity: 1, borderColor: 'text.tertiary' },
                    transition: 'opacity 0.15s, border-color 0.15s',
                  }}
                >
                  + add item
                </Box>
              )}
            </Box>
          </Box>
        ))}
      </Box>

      {/* Add chapter button */}
      {editing && (
        <Box
          component="button"
          onClick={addPhase}
          sx={{
            width: '100%',
            background: 'none',
            border: '1px dashed',
            borderColor: 'divider',
            cursor: 'pointer',
            color: 'text.tertiary',
            opacity: 0.5,
            fontSize: '0.78rem',
            fontFamily: 'inherit',
            py: 1.25,
            px: 2,
            borderRadius: '8px',
            textAlign: 'center',
            mt: 2,
            '&:hover': { opacity: 1, borderColor: 'text.tertiary' },
            transition: 'opacity 0.15s, border-color 0.15s',
          }}
        >
          + add chapter
        </Box>
      )}

      {/* Edit mode actions */}
      {editing && (
        <Box sx={{ display: 'flex', gap: 1.5, mt: 4 }}>
          <Button
            size="sm"
            variant="outlined"
            loading={saving}
            onClick={handleSave}
            sx={{
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.8rem',
              borderColor: 'divider',
              color: 'text.primary',
              '&:hover': { borderColor: 'text.tertiary' },
            }}
          >
            save changes
          </Button>
          <Button
            size="sm"
            variant="plain"
            onClick={handleCancel}
            sx={{ borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem', color: 'text.tertiary' }}
          >
            cancel
          </Button>
        </Box>
      )}
    </Box>
  )
}
