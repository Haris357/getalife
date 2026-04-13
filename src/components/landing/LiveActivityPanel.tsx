'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import { createClient } from '@/lib/supabase/client'

export interface ActivityItem {
  name: string
  action: string
  goal: string
  preview: string | null
  time: string
  streak: number
}

export interface ActivityStats {
  totalGoals: number
  todayCheckins: number
  avgStreak: number
}

interface Props {
  initialActivity: ActivityItem[]
  initialStats: ActivityStats
  initialCompletions: { description: string }[]
}

export default function LiveActivityPanel({ initialActivity, initialStats, initialCompletions }: Props) {
  const [activity, setActivity] = useState(initialActivity)
  const [stats, setStats] = useState(initialStats)
  const [completions, setCompletions] = useState(initialCompletions)
  const lastFetchRef = useRef(0)

  const refresh = useCallback(async () => {
    const now = Date.now()
    if (now - lastFetchRef.current < 5000) return
    lastFetchRef.current = now
    try {
      const res = await fetch('/api/activity', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setActivity(data.activity)
      setStats(data.stats)
      setCompletions(data.recentCompletions)
    } catch { /* silently ignore */ }
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('landing-activity')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'check_ins' } as any, () => {
        void refresh()
      })
      .subscribe()

    const interval = setInterval(() => void refresh(), 60_000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [refresh])

  const statValues = [
    { value: stats.totalGoals.toLocaleString('en-US'), label: 'goals started' },
    { value: String(stats.todayCheckins), label: 'checked in today' },
    { value: stats.avgStreak ? `${stats.avgStreak}` : '0', label: 'avg streak (days)' },
  ]

  return (
    <Box
      sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        bgcolor: 'background.surface',
        borderLeft: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      {/* Stats bar */}
      <Box sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'divider' }}>
        {statValues.map((s, i) => (
          <Box
            key={i}
            sx={{
              flex: 1,
              px: 3,
              py: 2.5,
              borderRight: i < statValues.length - 1 ? '1px solid' : 'none',
              borderColor: 'divider',
            }}
          >
            <Typography
              sx={{
                fontSize: '1.3rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'text.primary',
                lineHeight: 1,
                mb: 0.4,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {s.value}
            </Typography>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.5, fontSize: '0.72rem' }}>
              {s.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Activity feed header */}
      <Box
        sx={{
          px: 4,
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: 'success.500',
            animation: 'blink 2s ease-in-out infinite',
            '@keyframes blink': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.3 },
            },
          }}
        />
        <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '0.75rem', opacity: 0.6 }}>
          live activity
        </Typography>
        {stats.todayCheckins > 0 && (
          <Box
            sx={{
              ml: 'auto',
              px: 1,
              py: 0.2,
              borderRadius: '4px',
              bgcolor: 'background.level2',
            }}
          >
            <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary', opacity: 0.5 }}>
              {stats.todayCheckins} today
            </Typography>
          </Box>
        )}
      </Box>

      {/* Activity feed */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 4, py: 2 }}>
        {activity.length > 0 ? (
          activity.map((item, i) => (
            <Box
              key={`${item.name}-${item.time}-${i}`}
              sx={{
                py: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:last-child': { borderBottom: 'none' },
                animation: 'slideIn 0.3s ease both',
                animationDelay: `${i * 40}ms`,
                '@keyframes slideIn': {
                  from: { opacity: 0, transform: 'translateX(6px)' },
                  to: { opacity: 1, transform: 'translateX(0)' },
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography level="body-xs" sx={{ color: 'text.secondary', fontSize: '0.83rem', lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 600 }}>{item.name}</span>
                    {' '}
                    <span style={{ opacity: 0.55 }}>{item.action}</span>
                    {' '}
                    <span style={{ fontStyle: 'italic', opacity: 0.7 }}>{item.goal}</span>
                  </Typography>
                  {item.preview && (
                    <Typography
                      level="body-xs"
                      sx={{
                        color: 'text.tertiary',
                        opacity: 0.4,
                        fontSize: '0.75rem',
                        mt: 0.5,
                        lineHeight: 1.45,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      &ldquo;{item.preview}{item.preview.length >= 85 ? '…' : ''}&rdquo;
                    </Typography>
                  )}
                </Box>
                <Typography
                  level="body-xs"
                  sx={{ color: 'text.tertiary', opacity: 0.35, fontSize: '0.72rem', whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  {item.time}
                </Typography>
              </Box>
            </Box>
          ))
        ) : (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.3 }}>
              be the first to check in
            </Typography>
          </Box>
        )}
      </Box>

      {/* Bottom: recent completions or stories link */}
      {completions.length > 0 ? (
        <Box
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            px: 4,
            py: 2.5,
          }}
        >
          <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.35, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1.5 }}>
            recently completed
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {completions.slice(0, 3).map((g, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
                <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary', opacity: 0.3, flexShrink: 0 }}>
                  ✓
                </Typography>
                <Typography
                  level="body-xs"
                  sx={{
                    color: 'text.tertiary',
                    opacity: 0.55,
                    fontSize: '0.78rem',
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {g.description}
                </Typography>
              </Box>
            ))}
          </Box>
          <Link href="/stories" style={{ textDecoration: 'none' }}>
            <Typography
              level="body-xs"
              sx={{ color: 'text.tertiary', opacity: 0.3, fontSize: '0.72rem', mt: 1.5, display: 'block', '&:hover': { opacity: 0.7 }, transition: 'opacity 0.15s' }}
            >
              read their stories →
            </Typography>
          </Link>
        </Box>
      ) : (
        <Box
          sx={{
            px: 4,
            py: 2.5,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.4, fontSize: '0.75rem' }}>
            people who actually got it done
          </Typography>
          <Link href="/stories" style={{ textDecoration: 'none' }}>
            <Typography
              level="body-xs"
              sx={{ color: 'text.tertiary', fontSize: '0.75rem', '&:hover': { color: 'text.secondary' }, transition: 'color 0.15s' }}
            >
              read stories →
            </Typography>
          </Link>
        </Box>
      )}
    </Box>
  )
}
