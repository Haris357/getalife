export const dynamic = 'force-dynamic'

import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Header from '@/components/layout/Header'
import { requireUser } from '@/lib/utils/auth'
import { createClient } from '@/lib/supabase/server'
import BuddiesClient from './BuddiesClient'
import type { Buddy } from '@/types'

export default async function BuddiesPage() {
  const user = await requireUser()
  const supabase = await createClient()

  // Fetch all buddy rows for current user
  const { data: rows } = await supabase
    .from('buddies')
    .select('*')
    .or(`requester_id.eq.${user.id},buddy_id.eq.${user.id}`)
    .neq('status', 'declined')

  const buddies = rows ?? []

  // Collect other party IDs and fetch profiles
  const otherIds = buddies.map((b) =>
    b.requester_id === user.id ? b.buddy_id : b.requester_id
  )

  let profileMap: Record<string, { display_name: string | null; avatar_url: string | null; level: number | null }> = {}

  if (otherIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, level')
      .in('id', Array.from(new Set(otherIds)))

    for (const p of profiles ?? []) {
      profileMap[p.id] = {
        display_name: p.display_name,
        avatar_url: p.avatar_url,
        level: p.level,
      }
    }
  }

  const enrich = (b: typeof buddies[0]): Buddy => {
    const otherId = b.requester_id === user.id ? b.buddy_id : b.requester_id
    return { ...b, ...profileMap[otherId] }
  }

  const active = buddies.filter((b) => b.status === 'active').map(enrich)
  const incoming = buddies
    .filter((b) => b.status === 'pending' && b.buddy_id === user.id)
    .map(enrich)
  const outgoing = buddies
    .filter((b) => b.status === 'pending' && b.requester_id === user.id)
    .map(enrich)

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.body' }}>
      <Header email={user.email ?? undefined} userId={user.id} backHref="/dashboard" backLabel="← dashboard" />

      <Box sx={{ maxWidth: 640, mx: 'auto', px: { xs: 3, md: 4 }, py: 5 }}>
        {/* ── Header ── */}
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
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </Box>
          <Box>
            <Typography
              level="body-xs"
              sx={{
                color: 'text.tertiary',
                opacity: 0.4,
                fontSize: '0.65rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                mb: 0.2,
              }}
            >
              accountability
            </Typography>
            <Typography
              level="h3"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.4rem', md: '1.6rem' },
                letterSpacing: '-0.03em',
                color: 'text.primary',
              }}
            >
              your buddy
            </Typography>
          </Box>
        </Box>

        <BuddiesClient
          active={active}
          incoming={incoming}
          outgoing={outgoing}
          userId={user.id}
        />
      </Box>
    </Box>
  )
}
