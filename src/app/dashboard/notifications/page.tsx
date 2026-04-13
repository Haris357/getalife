export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import { requireUser } from '@/lib/utils/auth'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import type { Notification } from '@/types'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return d < 30 ? `${d}d ago` : new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

function notifColor(type: string): string {
  switch (type) {
    case 'post_comment': return 'rgb(14,165,233)'
    case 'comment_reply': return 'rgb(249,115,22)'
    case 'post_pinned': return 'rgb(168,85,247)'
    case 'post_removed': return 'rgb(239,68,68)'
    case 'comment_removed': return 'rgb(239,68,68)'
    default: return 'rgb(100,116,139)'
  }
}

function NotifIcon({ type }: { type: string }) {
  const color = notifColor(type)
  switch (type) {
    case 'post_comment':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      )
    case 'comment_reply':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 14 4 9 9 4"/>
          <path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
        </svg>
      )
    case 'post_pinned':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="17" x2="12" y2="22"/>
          <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>
        </svg>
      )
    case 'post_removed':
    case 'comment_removed':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        </svg>
      )
    default:
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      )
  }
}

function notifMessage(n: Notification): string {
  switch (n.type) {
    case 'post_comment': return `${n.actor_name ?? 'someone'} commented on your post`
    case 'comment_reply': return `${n.actor_name ?? 'someone'} replied to your comment`
    case 'post_pinned': return 'your post was pinned by a moderator'
    case 'post_removed': return 'your post was removed by a moderator'
    case 'comment_removed': return 'your comment was removed by a moderator'
    default: return 'new notification'
  }
}

function SectionLabel({ label }: { label: string }) {
  return (
    <Typography
      level="body-xs"
      sx={{
        color: 'text.tertiary',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        fontSize: '0.62rem',
        opacity: 0.45,
        mb: 1.5,
        mt: 0.5,
      }}
    >
      {label}
    </Typography>
  )
}

function NotifCardInner({ n }: { n: Notification }) {
  const color = notifColor(n.type)
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        alignItems: 'flex-start',
        bgcolor: 'background.surface',
        border: '1px solid',
        borderColor: n.read ? 'divider' : 'rgba(14,165,233,0.25)',
        borderRadius: '12px',
        px: 2.5,
        py: 2,
        mb: 1.5,
        opacity: n.read ? 0.75 : 1,
        '&:hover': {
          borderColor: 'neutral.outlinedHoverBorder',
          opacity: 1,
        },
        transition: 'all 0.15s',
      }}
    >
      {/* Colored icon circle */}
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          bgcolor: `${color}14`,
          border: `1px solid ${color}28`,
          mt: 0.1,
        }}
      >
        <NotifIcon type={n.type} />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: '0.875rem',
            color: 'text.primary',
            fontWeight: n.read ? 400 : 600,
            lineHeight: 1.5,
            mb: 0.35,
          }}
        >
          {notifMessage(n)}
        </Typography>
        <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary', opacity: 0.4 }}>
          {timeAgo(n.created_at)}
        </Typography>
      </Box>

      {/* Unread dot */}
      {!n.read && (
        <Box
          sx={{
            flexShrink: 0,
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
            mt: 1,
          }}
        />
      )}
    </Box>
  )
}

function NotifCard({ n }: { n: Notification }) {
  if (n.post_id) {
    return (
      <Box component={Link} href={`/community/${n.post_id}`} sx={{ display: 'block', textDecoration: 'none' }}>
        <NotifCardInner n={n} />
      </Box>
    )
  }
  return <NotifCardInner n={n} />
}

export default async function NotificationsPage() {
  const user = await requireUser()
  const supabase = await createClient()

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const notifs = (notifications ?? []) as Notification[]

  // Mark all as read
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)

  const todayNotifs = notifs.filter(n => isToday(n.created_at))
  const earlierNotifs = notifs.filter(n => !isToday(n.created_at))

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.body' }}>
      <Header email={user.email ?? undefined} userId={user.id} backHref="/dashboard" backLabel="dashboard" />

      <Box sx={{ maxWidth: 640, mx: 'auto', px: { xs: 3, md: 4 }, py: 6 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 6 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </Box>
          <Box>
            <Typography
              level="body-xs"
              sx={{ color: 'text.tertiary', opacity: 0.4, fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', mb: 0.2 }}
            >
              inbox
            </Typography>
            <Typography
              level="h3"
              sx={{ fontWeight: 700, fontSize: { xs: '1.4rem', md: '1.6rem' }, letterSpacing: '-0.03em', color: 'text.primary' }}
            >
              Notifications
            </Typography>
          </Box>
        </Box>

        {notifs.length === 0 ? (
          /* Empty state */
          <Box
            sx={{
              py: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '18px',
                bgcolor: 'background.surface',
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1,
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.2 }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </Box>
            <Typography level="body-sm" sx={{ color: 'text.tertiary', opacity: 0.4, fontWeight: 500 }}>
              no notifications yet
            </Typography>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.25, fontSize: '0.78rem' }}>
              you're all caught up
            </Typography>
          </Box>
        ) : (
          <Box>
            {todayNotifs.length > 0 && (
              <Box sx={{ mb: 1 }}>
                <SectionLabel label="Today" />
                {todayNotifs.map(n => <NotifCard key={n.id} n={n} />)}
              </Box>
            )}
            {earlierNotifs.length > 0 && (
              <Box>
                <SectionLabel label="Earlier" />
                {earlierNotifs.map(n => <NotifCard key={n.id} n={n} />)}
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  )
}
