'use client'

import { useEffect, useState, useCallback } from 'react'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'

interface Props {
  goalId: string
  goalDescription: string
}

interface MissionState {
  missions: string[]
  date: string
}

function TargetIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="7" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="7" cy="7" r="1" fill="currentColor" />
    </svg>
  )
}

export default function DailyMission({ goalId, goalDescription: _goalDescription }: Props) {
  const [state, setState] = useState<MissionState | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checked, setChecked] = useState<boolean[]>([false, false, false])

  const today = new Date().toISOString().split('T')[0]
  const storageKey = `missions_${goalId}_${today}`

  // Load checked state from localStorage
  const loadChecked = useCallback(
    (missions: string[]) => {
      try {
        const saved = localStorage.getItem(storageKey)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length === missions.length) {
            setChecked(parsed as boolean[])
            return
          }
        }
      } catch {
        // ignore
      }
      setChecked(missions.map(() => false))
    },
    [storageKey]
  )

  const saveChecked = useCallback(
    (next: boolean[]) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(next))
      } catch {
        // ignore
      }
    },
    [storageKey]
  )

  useEffect(() => {
    async function fetchMissions() {
      try {
        const res = await fetch(`/api/mission?goalId=${encodeURIComponent(goalId)}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = (await res.json()) as { missions: string[] | null; date: string }
        if (data.missions) {
          setState({ missions: data.missions, date: data.date })
          loadChecked(data.missions)
        }
      } catch {
        setError('Could not load missions.')
      } finally {
        setLoading(false)
      }
    }
    fetchMissions()
  }, [goalId, loadChecked])

  async function generateMissions() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId }),
      })
      if (!res.ok) throw new Error('Failed to generate')
      const data = (await res.json()) as { missions: string[]; date: string }
      setState({ missions: data.missions, date: data.date })
      loadChecked(data.missions)
    } catch {
      setError('Could not generate missions. Try again.')
    } finally {
      setGenerating(false)
    }
  }

  function toggleChecked(index: number) {
    setChecked((prev) => {
      const next = [...prev]
      next[index] = !next[index]
      saveChecked(next)
      return next
    })
  }

  // Skeleton while loading
  if (loading) {
    return (
      <Box
        sx={{
          bgcolor: 'background.surface',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '12px',
          overflow: 'hidden',
          display: 'flex',
          mt: 1,
        }}
      >
        <Box
          sx={{
            width: 4,
            flexShrink: 0,
            background: 'linear-gradient(180deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
          }}
        />
        <Box sx={{ flex: 1, px: 3, py: 2.5 }}>
          {[1, 2, 3].map((i) => (
            <Box
              key={i}
              sx={{
                height: 14,
                borderRadius: 4,
                bgcolor: 'neutral.100',
                mb: i < 3 ? 1.5 : 0,
                opacity: 0.15,
                width: i === 3 ? '60%' : '100%',
                animation: 'pulse 1.5s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 0.15 },
                  '50%': { opacity: 0.3 },
                },
              }}
            />
          ))}
        </Box>
      </Box>
    )
  }

  // No missions yet — show generate button
  if (!state) {
    return (
      <Box
        sx={{
          bgcolor: 'background.surface',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '12px',
          overflow: 'hidden',
          display: 'flex',
          mt: 1,
        }}
      >
        <Box
          sx={{
            width: 4,
            flexShrink: 0,
            background: 'linear-gradient(180deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
          }}
        />
        <Box sx={{ flex: 1, px: 3, py: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Box sx={{ color: 'text.tertiary', opacity: 0.5, lineHeight: 0 }}>
              <TargetIcon />
            </Box>
            <Typography
              level="body-xs"
              sx={{
                color: 'text.tertiary',
                fontSize: '0.68rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                opacity: 0.45,
              }}
            >
              today's missions
            </Typography>
          </Box>

          {error && (
            <Typography level="body-xs" sx={{ color: 'danger.500', fontSize: '0.78rem', mb: 1.5 }}>
              {error}
            </Typography>
          )}

          <Box
            component="button"
            onClick={generating ? undefined : generateMissions}
            disabled={generating}
            sx={{
              px: 2,
              py: 0.75,
              borderRadius: '20px',
              background: generating
                ? 'rgba(14,165,233,0.15)'
                : 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
              border: 'none',
              cursor: generating ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.15s',
              '&:hover': { opacity: generating ? 1 : 0.88 },
            }}
          >
            <Typography sx={{ color: '#fff', fontSize: '0.78rem', fontWeight: 600 }}>
              {generating ? 'generating...' : 'generate today\'s missions →'}
            </Typography>
          </Box>
        </Box>
      </Box>
    )
  }

  // Missions loaded
  return (
    <Box
      sx={{
        bgcolor: 'background.surface',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        mt: 1,
      }}
    >
      {/* Gradient left accent */}
      <Box
        sx={{
          width: 4,
          flexShrink: 0,
          background: 'linear-gradient(180deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
        }}
      />

      <Box sx={{ flex: 1, px: 3, py: 2.5 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Box sx={{ color: 'text.tertiary', opacity: 0.5, lineHeight: 0 }}>
            <TargetIcon />
          </Box>
          <Typography
            level="body-xs"
            sx={{
              color: 'text.tertiary',
              fontSize: '0.68rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              opacity: 0.45,
            }}
          >
            today's missions
          </Typography>
        </Box>

        {/* Mission items */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {state.missions.map((mission, i) => (
            <Box
              key={i}
              component="label"
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.25,
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              {/* Checkbox */}
              <Box
                component="input"
                type="checkbox"
                checked={checked[i] ?? false}
                onChange={() => toggleChecked(i)}
                sx={{
                  mt: '2px',
                  flexShrink: 0,
                  width: 15,
                  height: 15,
                  accentColor: 'rgb(14,165,233)',
                  cursor: 'pointer',
                }}
              />
              <Typography
                level="body-sm"
                sx={{
                  color: checked[i] ? 'text.tertiary' : 'text.secondary',
                  fontSize: '0.875rem',
                  lineHeight: 1.55,
                  textDecoration: checked[i] ? 'line-through' : 'none',
                  opacity: checked[i] ? 0.45 : 1,
                  transition: 'opacity 0.15s, color 0.15s',
                }}
              >
                {mission}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Footer */}
        <Typography
          level="body-xs"
          sx={{
            color: 'text.tertiary',
            fontSize: '0.65rem',
            opacity: 0.3,
            mt: 2,
          }}
        >
          generated by AI · refreshes tomorrow
        </Typography>
      </Box>
    </Box>
  )
}
