export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Header from '@/components/layout/Header'
import { requireUser } from '@/lib/utils/auth'
import { createClient } from '@/lib/supabase/server'
import PodDetailClient from './PodDetailClient'
import type { Pod, PodMember } from '@/types'

export default async function PodDetailPage({
  params,
}: {
  params: Promise<{ podId: string }>
}) {
  const { podId } = await params
  const user = await requireUser()
  const supabase = await createClient()

  // Verify user is a member
  const { data: membership } = await supabase
    .from('pod_members')
    .select('pod_id')
    .eq('pod_id', podId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) notFound()

  // Fetch pod
  const { data: pod } = await supabase
    .from('pods_with_members')
    .select('*')
    .eq('id', podId)
    .maybeSingle()

  if (!pod) notFound()

  // Fetch members with profiles
  const { data: memberRows } = await supabase
    .from('pod_members')
    .select('user_id, joined_at, profiles(display_name, avatar_url, level, title)')
    .eq('pod_id', podId)
    .order('joined_at', { ascending: true })

  const members: PodMember[] = (memberRows ?? []).map((row: {
    user_id: string
    joined_at: string
    profiles: { display_name: string | null; avatar_url: string | null; level: number | null; title: string | null } | null
  }) => ({
    user_id: row.user_id,
    display_name: row.profiles?.display_name ?? null,
    avatar_url: row.profiles?.avatar_url ?? null,
    level: row.profiles?.level ?? null,
    title: row.profiles?.title ?? null,
    joined_at: row.joined_at,
  }))

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.body' }}>
      <Header email={user.email ?? undefined} userId={user.id} backHref="/dashboard/pods" backLabel="← pods" />

      <Box sx={{ maxWidth: 640, mx: 'auto', px: { xs: 3, md: 4 }, py: 5 }}>
        {/* ── Pod header ── */}
        <Box sx={{ mb: 5 }}>
          <Typography
            level="body-xs"
            sx={{
              color: 'text.tertiary',
              opacity: 0.4,
              fontSize: '0.65rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              mb: 0.5,
            }}
          >
            accountability pod
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: '1.5rem', md: '1.75rem' },
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: 'text.primary',
              lineHeight: 1.2,
            }}
          >
            {(pod as Pod).name}
          </Typography>
        </Box>

        <PodDetailClient
          pod={pod as Pod}
          members={members}
          currentUserId={user.id}
        />
      </Box>
    </Box>
  )
}
