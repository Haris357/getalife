import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

export async function GET() {
  const admin = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const [
    { count: totalGoals },
    { count: todayCheckins },
    { data: activeGoalStreaks },
    { data: recentCheckins },
    { data: recentCompletions },
  ] = await Promise.all([
    admin.from('goals').select('*', { count: 'exact', head: true }),
    admin.from('check_ins').select('*', { count: 'exact', head: true }).eq('date', today),
    admin.from('goals').select('current_streak').eq('status', 'active'),
    admin.from('check_ins')
      .select('user_id, goal_id, what_i_did, created_at')
      .order('created_at', { ascending: false })
      .limit(30),
    admin.from('goals')
      .select('description, current_streak, created_at')
      .eq('status', 'completed')
      .order('updated_at', { ascending: false })
      .limit(4),
  ])

  const avgStreak = activeGoalStreaks?.length
    ? Math.round(
        (activeGoalStreaks as { current_streak: number | null }[]).reduce(
          (s, g) => s + (g.current_streak || 0), 0
        ) / activeGoalStreaks.length
      )
    : 0

  const goalIds = Array.from(new Set(
    (recentCheckins ?? []).map((c: { goal_id: string }) => c.goal_id).filter(Boolean)
  ))
  const userIds = Array.from(new Set(
    (recentCheckins ?? []).map((c: { user_id: string }) => c.user_id).filter(Boolean)
  ))

  const [{ data: goalDetails }, { data: profileDetails }] = await Promise.all([
    goalIds.length
      ? admin.from('goals').select('id, description, current_streak').in('id', goalIds)
      : Promise.resolve({ data: [] }),
    userIds.length
      ? admin.from('profiles').select('id, display_name').in('id', userIds)
      : Promise.resolve({ data: [] }),
  ])

  type GoalRow = { id: string; description: string; current_streak: number }
  type ProfileRow = { id: string; display_name: string | null }

  const goalMap = new Map((goalDetails ?? []).map((g: GoalRow) => [g.id, g]))
  const profileMap = new Map((profileDetails ?? []).map((p: ProfileRow) => [p.id, p]))

  type CheckInRow = { user_id: string; goal_id: string; what_i_did: string | null; created_at: string }

  const activity = (recentCheckins ?? []).slice(0, 10).map((ci: CheckInRow) => {
    const goal = goalMap.get(ci.goal_id) as GoalRow | undefined
    const profile = profileMap.get(ci.user_id) as ProfileRow | undefined
    const name = profile?.display_name ?? 'Someone'
    const goalDesc = goal?.description
      ? goal.description.slice(0, 52) + (goal.description.length > 52 ? '…' : '')
      : 'their goal'
    const streak = goal?.current_streak ?? 0
    const action = streak >= 7 ? `${streak} day streak on` : 'checked in —'
    return { name, action, goal: goalDesc, preview: ci.what_i_did?.slice(0, 85) ?? null, time: timeAgo(ci.created_at), streak }
  })

  return NextResponse.json({
    activity,
    stats: { totalGoals: totalGoals ?? 0, todayCheckins: todayCheckins ?? 0, avgStreak },
    recentCompletions: ((recentCompletions ?? []) as { description: string }[]).slice(0, 3),
  })
}
