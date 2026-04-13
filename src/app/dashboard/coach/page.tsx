export const dynamic = 'force-dynamic'

import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import { requireUser } from '@/lib/utils/auth'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import CoachPageClient from './CoachPageClient'
import type { PodMember } from '@/types'

interface AvailableCoach {
  id: string
  display_name: string | null
  avatar_url: string | null
  level: number | null
  title: string | null
  xp: number | null
  coachee_count: number
}

export default async function CoachPage() {
  const user = await requireUser()
  const supabase = await createClient()

  // Fetch coach status
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_coach')
    .eq('id', user.id)
    .single()

  // Fetch coachees (people I coach)
  const { data: coacheeRels } = await supabase
    .from('coach_relationships')
    .select('coachee_id')
    .eq('coach_id', user.id)

  const coacheeIds = (coacheeRels ?? []).map((r) => r.coachee_id)
  let coachees: PodMember[] = []
  if (coacheeIds.length > 0) {
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, level, title, created_at')
      .in('id', coacheeIds)
    coachees = (data ?? []).map((p) => ({
      user_id: p.id,
      display_name: p.display_name,
      avatar_url: p.avatar_url,
      level: p.level,
      title: p.title,
      joined_at: p.created_at,
    }))
  }

  // Fetch my current coach (if any)
  const { data: myCoachRel } = await supabase
    .from('coach_relationships')
    .select('coach_id')
    .eq('coachee_id', user.id)
    .maybeSingle()

  let myCoach: AvailableCoach | null = null
  if (myCoachRel?.coach_id) {
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, level, title, xp')
      .eq('id', myCoachRel.coach_id)
      .single()
    if (data) {
      myCoach = { ...data, coachee_count: 0 }
    }
  }

  // Fetch available coaches if no coach yet
  let availableCoaches: AvailableCoach[] = []
  if (!myCoach) {
    const excludeIds = [user.id]
    const { data } = await supabase
      .from('available_coaches')
      .select('id, display_name, avatar_url, level, title, xp, coachee_count')
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .order('coachee_count', { ascending: false })
      .limit(20)
    availableCoaches = data ?? []
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.body' }}>
      <Header email={user.email ?? undefined} backHref="/dashboard" backLabel="dashboard" />

      <Box sx={{ maxWidth: 580, mx: 'auto', px: { xs: 3, md: 4 }, py: 6 }}>
        {/* Page header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 6 }}>
          <Box
            sx={{
              width: 4,
              height: 40,
              borderRadius: '4px',
              background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
              flexShrink: 0,
            }}
          />
          <Box>
            <Typography
              level="body-xs"
              sx={{
                color: 'text.tertiary',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontSize: '0.65rem',
                opacity: 0.5,
                mb: 0.25,
              }}
            >
              accountability
            </Typography>
            <Typography
              level="h3"
              sx={{ color: 'text.primary', fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.02em' }}
            >
              Coach Mode
            </Typography>
          </Box>
        </Box>

        <CoachPageClient
          initialIsCoach={profile?.is_coach ?? false}
          initialCoachees={coachees}
          myCoach={myCoach}
          availableCoaches={availableCoaches}
        />
      </Box>
    </Box>
  )
}
