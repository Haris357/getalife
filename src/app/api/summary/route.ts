import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/utils/auth'

export async function GET() {
  const user = await requireUser()
  const supabase = await createClient()

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const sevenDaysAgoIso = sevenDaysAgo.toISOString().split('T')[0]

  // Fetch active goals
  const { data: goals } = await supabase
    .from('goals')
    .select('id, current_streak, longest_streak')
    .eq('user_id', user.id)
    .eq('status', 'active')

  const goalsActive = goals?.length ?? 0
  const goalIds = (goals ?? []).map(g => g.id)

  // Best streak across active goals
  const bestStreak = (goals ?? []).reduce(
    (best, g) => Math.max(best, g.current_streak ?? 0, g.longest_streak ?? 0),
    0
  )

  // Check-ins in last 7 days
  let checkinsThisWeek = 0
  if (goalIds.length > 0) {
    const { count } = await supabase
      .from('check_ins')
      .select('id', { count: 'exact', head: true })
      .in('goal_id', goalIds)
      .gte('date', sevenDaysAgoIso)
    checkinsThisWeek = count ?? 0
  }

  // Total check-ins across all user goals ever
  const { count: totalCheckins } = await supabase
    .from('check_ins')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return NextResponse.json({
    checkinsThisWeek,
    goalsActive,
    bestStreak,
    totalCheckins: totalCheckins ?? 0,
  })
}
