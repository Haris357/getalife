'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Avatar from '@mui/joy/Avatar'
import Input from '@mui/joy/Input'
import { useRouter } from 'next/navigation'
import type { Buddy } from '@/types'

interface AvailableBuddy {
  id: string
  display_name: string | null
  avatar_url: string | null
  level: number | null
  active_goal: string | null
  current_streak: number | null
}

interface SearchResult {
  id: string
  display_name: string | null
  avatar_url: string | null
  level: number | null
  title: string | null
}

interface Props {
  active: Buddy[]
  incoming: Buddy[]
  outgoing: Buddy[]
  userId: string
}

function PillButton({
  children,
  onClick,
  variant = 'default',
  disabled = false,
}: {
  children: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'gradient' | 'danger' | 'ghost'
  disabled?: boolean
}) {
  const styles = {
    default: {
      border: '1px solid',
      borderColor: 'divider',
      background: 'transparent',
      color: 'text.secondary',
    },
    gradient: {
      border: '1px solid transparent',
      background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
      color: '#fff',
    },
    danger: {
      border: '1px solid',
      borderColor: 'danger.300',
      background: 'transparent',
      color: 'danger.500',
    },
    ghost: {
      border: '1px solid',
      borderColor: 'divider',
      background: 'transparent',
      color: 'text.tertiary',
      opacity: 0.55,
    },
  }

  const s = styles[variant]

  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      disabled={disabled}
      sx={{
        px: 1.5,
        py: 0.5,
        borderRadius: '20px',
        cursor: disabled ? 'default' : 'pointer',
        fontSize: '0.75rem',
        fontWeight: 600,
        transition: 'opacity 0.15s',
        opacity: disabled ? 0.4 : 1,
        whiteSpace: 'nowrap',
        ...s,
      }}
    >
      <Typography level="body-xs" sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'inherit' }}>
        {children}
      </Typography>
    </Box>
  )
}

function BuddyCard({
  buddy,
  actions,
}: {
  buddy: Buddy | AvailableBuddy
  actions: React.ReactNode
}) {
  const name = buddy.display_name ?? 'anonymous'
  const initial = name[0]?.toUpperCase() ?? '?'

  return (
    <Box
      sx={{
        bgcolor: 'background.surface',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        transition: 'border-color 0.15s',
        '&:hover': { borderColor: 'neutral.outlinedHoverBorder' },
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

      <Box sx={{ flex: 1, px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        {/* Avatar + name */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
          <Avatar
            src={buddy.avatar_url ?? undefined}
            sx={{ width: 36, height: 36, fontSize: '0.9rem', flexShrink: 0 }}
          >
            {initial}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography level="body-sm" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.9rem' }}>
                {name}
              </Typography>
              {buddy.level != null && (
                <Box
                  sx={{
                    px: 0.75,
                    py: 0.1,
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                  }}
                >
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#fff' }}>
                    {buddy.level}
                  </Typography>
                </Box>
              )}
            </Box>
            {'active_goal' in buddy && buddy.active_goal && (
              <Typography
                level="body-xs"
                sx={{
                  color: 'text.tertiary',
                  fontSize: '0.75rem',
                  opacity: 0.65,
                  mt: 0.25,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 220,
                }}
              >
                {buddy.active_goal}
              </Typography>
            )}
            {'current_streak' in buddy && (buddy as AvailableBuddy).current_streak != null && (buddy as AvailableBuddy).current_streak! > 0 && (
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 0.4 }}>
                <Box
                  sx={{
                    px: 1,
                    py: 0.15,
                    borderRadius: '20px',
                    border: '1px solid',
                    borderColor: 'warning.300',
                    bgcolor: 'warning.softBg',
                  }}
                >
                  <Typography level="body-xs" sx={{ fontSize: '0.68rem', color: 'warning.600', fontWeight: 600 }}>
                    {(buddy as AvailableBuddy).current_streak}d streak
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          {actions}
        </Box>
      </Box>
    </Box>
  )
}

export default function BuddiesClient({ active, incoming, outgoing, userId }: Props) {
  const router = useRouter()
  const [available, setAvailable] = useState<AvailableBuddy[]>([])
  const [loadingAvailable, setLoadingAvailable] = useState(true)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [copied, setCopied] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchAvailable = useCallback(async () => {
    setLoadingAvailable(true)
    try {
      const res = await fetch('/api/buddies/available')
      if (res.ok) {
        const { available: data } = await res.json()
        setAvailable(data)
      }
    } finally {
      setLoadingAvailable(false)
    }
  }, [])

  useEffect(() => {
    fetchAvailable()
  }, [fetchAvailable])

  async function handleAccept(buddyRowId: string) {
    await fetch(`/api/buddies/${buddyRowId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active' }),
    })
    router.refresh()
  }

  async function handleDecline(buddyRowId: string) {
    await fetch(`/api/buddies/${buddyRowId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'declined' }),
    })
    router.refresh()
  }

  async function handleRemove(buddyRowId: string) {
    await fetch(`/api/buddies/${buddyRowId}`, { method: 'DELETE' })
    router.refresh()
  }

  async function handleRequest(targetUserId: string) {
    setPendingIds((prev) => new Set(prev).add(targetUserId))
    await fetch('/api/buddies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buddy_id: targetUserId }),
    })
    await fetchAvailable()
    setSearchQuery('')
    setSearchResults([])
    router.refresh()
  }

  function handleSearchChange(q: string) {
    setSearchQuery(q)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (q.trim().length < 2) { setSearchResults([]); return }
    setSearching(true)
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/buddies/search?q=${encodeURIComponent(q.trim())}`)
        if (res.ok) {
          const { results } = await res.json()
          setSearchResults(results ?? [])
        }
      } finally {
        setSearching(false)
      }
    }, 350)
  }

  async function copyInviteLink() {
    const url = `${window.location.origin}/dashboard/buddies`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sectionLabel = (text: string, count: number) => (
    <Typography
      level="body-xs"
      sx={{
        color: 'text.tertiary',
        mb: 2.5,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        fontSize: '0.68rem',
        opacity: 0.5,
      }}
    >
      {text} · {count}
    </Typography>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

      {/* ── Active buddy ── */}
      {active.length > 0 && (
        <Box>
          {sectionLabel('your buddy', active.length)}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {active.map((b) => (
              <BuddyCard
                key={b.id}
                buddy={b}
                actions={
                  <PillButton variant="danger" onClick={() => handleRemove(b.id)}>
                    remove
                  </PillButton>
                }
              />
            ))}
          </Box>
        </Box>
      )}

      {/* ── Pending ── */}
      {(incoming.length > 0 || outgoing.length > 0) && (
        <Box>
          {sectionLabel('pending', incoming.length + outgoing.length)}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {incoming.map((b) => (
              <BuddyCard
                key={b.id}
                buddy={b}
                actions={
                  <>
                    <PillButton variant="gradient" onClick={() => handleAccept(b.id)}>
                      accept
                    </PillButton>
                    <PillButton variant="ghost" onClick={() => handleDecline(b.id)}>
                      decline
                    </PillButton>
                  </>
                }
              />
            ))}
            {outgoing.map((b) => (
              <BuddyCard
                key={b.id}
                buddy={b}
                actions={
                  <PillButton variant="ghost" onClick={() => handleRemove(b.id)}>
                    cancel
                  </PillButton>
                }
              />
            ))}
          </Box>
        </Box>
      )}

      {/* ── Find a buddy ── */}
      <Box>
        <Typography
          level="body-xs"
          sx={{
            color: 'text.tertiary',
            mb: 2.5,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontSize: '0.68rem',
            opacity: 0.5,
          }}
        >
          find a buddy
        </Typography>

        {/* Search input */}
        <Input
          placeholder="search by username…"
          value={searchQuery}
          onChange={e => handleSearchChange(e.target.value)}
          sx={{ mb: 2, borderRadius: '10px', fontSize: '0.88rem' }}
          endDecorator={
            searching ? (
              <Typography sx={{ fontSize: '0.72rem', color: 'text.tertiary', opacity: 0.4 }}>
                searching…
              </Typography>
            ) : null
          }
        />

        {/* Search results */}
        {searchQuery.trim().length >= 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
            {searchResults.length === 0 && !searching ? (
              <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.4, px: 1 }}>
                no users found for &quot;{searchQuery}&quot;
              </Typography>
            ) : (
              searchResults.map(r => (
                <BuddyCard
                  key={r.id}
                  buddy={{ ...r, active_goal: null, current_streak: null }}
                  actions={
                    <PillButton
                      variant="gradient"
                      onClick={() => handleRequest(r.id)}
                      disabled={pendingIds.has(r.id)}
                    >
                      {pendingIds.has(r.id) ? 'requested ✓' : 'add buddy'}
                    </PillButton>
                  }
                />
              ))
            )}
          </Box>
        )}

        {/* Auto-discovered users with active goals */}
        {searchQuery.trim().length < 2 && (
          loadingAvailable ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.35 }}>
                loading…
              </Typography>
            </Box>
          ) : available.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.35, fontSize: '0.72rem', mb: 0.5 }}>
                people working on goals right now
              </Typography>
              {available.map(a => (
                <BuddyCard
                  key={a.id}
                  buddy={a}
                  actions={
                    <PillButton
                      variant="gradient"
                      onClick={() => handleRequest(a.id)}
                      disabled={pendingIds.has(a.id)}
                    >
                      {pendingIds.has(a.id) ? 'requested ✓' : 'add buddy'}
                    </PillButton>
                  }
                />
              ))}
            </Box>
          ) : (
            <Box
              sx={{
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: '12px',
                px: 3,
                py: 4,
                textAlign: 'center',
              }}
            >
              <Typography level="body-sm" sx={{ color: 'text.tertiary', opacity: 0.5, mb: 0.75 }}>
                no other users online right now
              </Typography>
              <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.35 }}>
                search by username above, or share the invite link below
              </Typography>
            </Box>
          )
        )}

        {/* Invite link */}
        <Box
          sx={{
            mt: 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '12px',
            px: 2.5,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            bgcolor: 'background.surface',
          }}
        >
          <Box>
            <Typography level="body-xs" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.25 }}>
              invite a friend
            </Typography>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.5, fontSize: '0.72rem' }}>
              share the buddies page link — they can search for you by username
            </Typography>
          </Box>
          <PillButton variant="gradient" onClick={copyInviteLink}>
            {copied ? 'copied!' : 'copy link'}
          </PillButton>
        </Box>
      </Box>
    </Box>
  )
}
