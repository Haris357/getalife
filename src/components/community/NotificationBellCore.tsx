'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type { Notification } from '@/types'

interface Props {
  userId: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

function notifMessage(n: Notification): string {
  switch (n.type) {
    // community
    case 'post_comment':     return `${n.actor_name ?? 'someone'} commented on your post`
    case 'comment_reply':    return `${n.actor_name ?? 'someone'} replied to your comment`
    case 'post_pinned':      return 'your post was pinned by a mod'
    case 'post_removed':     return 'your post was removed by a mod'
    case 'comment_removed':  return 'your comment was removed by a mod'
    // goal / check-in events (actor_name holds the pre-written message)
    case 'welcome':
    case 'goal_created':
    case 'goal_completed':
    case 'goal_paused':
    case 'goal_resumed':
    case 'goal_deleted':
    case 'checkin_done':
    case 'story_submitted':
    case 'story_deleted':
    case 'reminder':
    case 'countdown_start':
    case 'countdown_mid':
    case 'countdown_end':
    case 'coaching':
    case 'newsletter':
      return n.actor_name ?? 'new notification'
    // coach mode
    case 'new_coachee':        return n.actor_name ?? 'new coachee request'
    case 'coachee_checkin':    return n.actor_name ?? 'your coachee checked in'
    case 'recovery_complete':  return n.actor_name ?? 'comeback challenge complete!'
    case 'pattern_analysis':   return n.actor_name ?? 'your pattern analysis is ready'
    case 'goal_dna':           return n.actor_name ?? 'your accountability DNA profile is ready'
    default: return 'new notification'
  }
}

export default function NotificationBell({ userId }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [marking, setMarking] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications ?? [])
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  useEffect(() => {
    const supabase = createBrowserClient()
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev].slice(0, 20))
        }
      )
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [userId])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const unreadCount = notifications.filter(n => !n.read).length

  async function markAllRead() {
    setMarking(true)
    await fetch('/api/notifications', { method: 'PATCH' })
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setMarking(false)
  }

  const recent = notifications.slice(0, 5)

  return (
    <Box ref={containerRef} sx={{ position: 'relative' }}>
      <Box
        component="button"
        onClick={() => setOpen(o => !o)}
        sx={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          p: 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          borderRadius: '6px',
          '&:hover': { bgcolor: 'background.level1' },
          transition: 'background-color 0.15s',
          position: 'relative',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.55 }}>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, color: '#fff', lineHeight: 1 }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </Typography>
          </Box>
        )}
      </Box>

      {open && (
        <Box
          sx={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: 320,
            bgcolor: 'background.surface',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            zIndex: 100,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: 'text.primary' }}>
              notifications
            </Typography>
            {unreadCount > 0 && (
              <Box
                component="button"
                onClick={markAllRead}
                disabled={marking}
                sx={{ background: 'none', border: 'none', cursor: 'pointer', p: 0 }}
              >
                <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary', opacity: 0.5, '&:hover': { opacity: 1 } }}>
                  mark all read
                </Typography>
              </Box>
            )}
          </Box>

          {recent.length === 0 ? (
            <Box sx={{ px: 2.5, py: 3 }}>
              <Typography sx={{ fontSize: '0.8rem', color: 'text.tertiary', opacity: 0.4 }}>
                no notifications yet
              </Typography>
            </Box>
          ) : (
            <Box>
              {recent.map(n => (
                <Box
                  key={n.id}
                  component={n.post_id ? Link : 'div'}
                  href={n.post_id ? `/community/${n.post_id}` : '#'}
                  onClick={() => setOpen(false)}
                  sx={{
                    display: 'block',
                    px: 2.5,
                    py: 1.75,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    textDecoration: 'none',
                    bgcolor: n.read ? 'transparent' : 'background.level1',
                    '&:last-child': { borderBottom: 'none' },
                    '&:hover': { bgcolor: 'background.level2' },
                    transition: 'background-color 0.15s',
                  }}
                >
                  <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', lineHeight: 1.4, mb: 0.25 }}>
                    {notifMessage(n)}
                  </Typography>
                  <Typography sx={{ fontSize: '0.68rem', color: 'text.tertiary', opacity: 0.4 }}>
                    {timeAgo(n.created_at)}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
            <Link href="/dashboard/notifications" onClick={() => setOpen(false)} style={{ textDecoration: 'none' }}>
              <Typography sx={{ fontSize: '0.73rem', color: 'text.tertiary', opacity: 0.5, '&:hover': { opacity: 1 }, transition: 'opacity 0.15s' }}>
                see all notifications →
              </Typography>
            </Link>
          </Box>
        </Box>
      )}
    </Box>
  )
}
