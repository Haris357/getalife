export const dynamic = 'force-dynamic'

import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Header from '@/components/layout/Header'
import { requireUser } from '@/lib/utils/auth'
import { createClient } from '@/lib/supabase/server'
import PodsClient from './PodsClient'
import type { Pod } from '@/types'

export default async function PodsPage() {
  const user = await requireUser()
  const supabase = await createClient()

  // Get pods where user is a member
  const { data: memberRows } = await supabase
    .from('pod_members')
    .select('pod_id')
    .eq('user_id', user.id)

  const podIds = (memberRows ?? []).map((r: { pod_id: string }) => r.pod_id)

  let pods: Pod[] = []
  if (podIds.length > 0) {
    const { data } = await supabase
      .from('pods_with_members')
      .select('*')
      .in('id', podIds)
      .order('created_at', { ascending: false })
    pods = (data ?? []) as Pod[]
  }

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
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
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
              your pods
            </Typography>
          </Box>
        </Box>

        <PodsClient pods={pods} />
      </Box>
    </Box>
  )
}
