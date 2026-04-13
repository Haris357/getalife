'use client'

import { useEffect, useState, useRef } from 'react'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import { createClient } from '@/lib/supabase/client'

interface ActivityItem {
  id: string
  user_id: string
  type: 'checkin' | 'milestone'
  goal_id: string | null
  display_name: string | null
  goal_snippet: string | null
  streak: number | null
  day_number: number | null
  is_anonymous: boolean
  created_at: string
  _isNew?: boolean
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function LockIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function FireIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="rgb(249,115,22)" stroke="none">
      <path d="M12 2C9 7 6 9 6 13a6 6 0 0 0 12 0c0-4-3-6-6-11zm0 17a2 2 0 0 1-2-2c0-1.5 2-4 2-4s2 2.5 2 4a2 2 0 0 1-2 2z" />
    </svg>
  )
}

function Avatar({ name, size = 28 }: { name: string | null; size?: number }) {
  const isAnon = !name
  const initials = name ? name.slice(0, 2).toUpperCase() : ''

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: isAnon ? 'background.level2' : 'background.level1',
        border: '1px solid',
        borderColor: 'divider',
        color: 'text.tertiary',
        overflow: 'hidden',
      }}
    >
      {isAnon ? (
        <Box sx={{ opacity: 0.4 }}>
          <LockIcon />
        </Box>
      ) : (
        <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, color: 'text.tertiary', opacity: 0.6, lineHeight: 1 }}>
          {initials}
        </Typography>
      )}
    </Box>
  )
}

export default function ActivityFeed() {
  const [items, setItems] = useState<ActivityItem[]>([])
  const supabase = useRef(createClient()).current

  useEffect(() => {
    // Initial fetch
    supabase
      .from('activity_feed')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setItems(data as ActivityItem[])
      })

    // Realtime subscription
    const channel = supabase
      .channel('activity_feed_live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_feed' },
        (payload) => {
          const newItem = { ...(payload.new as ActivityItem), _isNew: true }
          setItems(prev => {
            const next = [newItem, ...prev].slice(0, 10)
            // clear _isNew flag after animation completes
            setTimeout(() => {
              setItems(curr =>
                curr.map(it => it.id === newItem.id ? { ...it, _isNew: false } : it)
              )
            }, 600)
            return next
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  if (items.length === 0) return null

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '10px',
        bgcolor: 'background.surface',
        overflow: 'hidden',
        mb: 2,
      }}
    >
      {/* Header */}
      <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography
          sx={{
            fontSize: '0.68rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'text.tertiary',
            opacity: 0.55,
          }}
        >
          Live Activity
        </Typography>
      </Box>

      {/* Items */}
      <Box sx={{ py: 0.5 }}>
        {items.map((item, idx) => {
          const name = item.is_anonymous ? 'someone' : (item.display_name ?? 'someone')
          const isMilestone = item.type === 'milestone'

          return (
            <Box key={item.id}>
              {idx > 0 && (
                <Box sx={{ mx: 2.5, borderBottom: '1px solid', borderColor: 'divider', opacity: 0.4 }} />
              )}
              <Box
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  px: 2.5,
                  py: 1.5,
                  alignItems: 'flex-start',
                  opacity: item._isNew ? 0 : 1,
                  transform: item._isNew ? 'translateY(-4px)' : 'translateY(0)',
                  transition: 'opacity 0.4s ease, transform 0.4s ease',
                }}
              >
                <Box sx={{ pt: '2px' }}>
                  <Avatar name={item.is_anonymous ? null : item.display_name} size={28} />
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                    <Typography
                      sx={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'text.secondary',
                        fontStyle: item.is_anonymous ? 'italic' : 'normal',
                      }}
                    >
                      {name}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: 'text.tertiary', opacity: 0.7 }}>
                      {isMilestone
                        ? `hit a ${item.streak}-day milestone!`
                        : `checked in on day ${item.day_number}`}
                    </Typography>
                    {isMilestone && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FireIcon />
                      </Box>
                    )}
                  </Box>

                  {item.goal_snippet && (
                    <Typography
                      sx={{
                        fontSize: '0.7rem',
                        color: 'text.tertiary',
                        opacity: 0.45,
                        mt: 0.2,
                        lineHeight: 1.35,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.goal_snippet}
                    </Typography>
                  )}

                  <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary', opacity: 0.3, mt: 0.25 }}>
                    {timeAgo(item.created_at)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
