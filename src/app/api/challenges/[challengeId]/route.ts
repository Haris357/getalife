import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: { challengeId: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [challengeRes, leaderboardRes] = await Promise.all([
    supabase
      .from('challenges')
      .select('*')
      .eq('id', params.challengeId)
      .single(),
    supabase
      .from('challenge_leaderboard')
      .select('*')
      .eq('challenge_id', params.challengeId)
      .order('rank', { ascending: true })
      .limit(20),
  ])

  if (!challengeRes.data) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
  }

  // Participant count
  const { count: participantCount } = await supabase
    .from('challenge_participants')
    .select('user_id', { count: 'exact', head: true })
    .eq('challenge_id', params.challengeId)

  // Current user's entry if logged in
  let userEntry = null
  if (user) {
    const { data } = await supabase
      .from('challenge_leaderboard')
      .select('*')
      .eq('challenge_id', params.challengeId)
      .eq('user_id', user.id)
      .maybeSingle()
    userEntry = data
  }

  return NextResponse.json({
    challenge: { ...challengeRes.data, participant_count: participantCount ?? 0 },
    leaderboard: leaderboardRes.data ?? [],
    userEntry,
  })
}
