import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/utils/auth'
import { notifyEmail } from '@/lib/email/notify'

export async function POST(
  _request: Request,
  { params }: { params: { goalId: string } }
) {
  const user = await requireUser()
  const supabase = await createClient()

  const { data: goal } = await supabase
    .from('goals')
    .select('*')
    .eq('id', params.goalId)
    .eq('user_id', user.id)
    .single()

  if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (goal.status === 'completed') return NextResponse.json({ goal })

  // Mark goal complete
  const { data: updated } = await supabase
    .from('goals')
    .update({ status: 'completed' })
    .eq('id', params.goalId)
    .select()
    .single()

  const daysSinceStart = Math.floor(
    (Date.now() - new Date(goal.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )

  notifyEmail({
    userId: user.id,
    emailType: 'goal_completed',
    goalId: params.goalId,
    goalDescription: goal.description,
    currentStreak: goal.current_streak ?? 0,
    daysSinceStart,
  })

  // Auto-post goal completion to community
  try {
    await supabase.from('posts').insert({
      user_id: user.id,
      title: `Goal completed after ${daysSinceStart + 1} days 🎯`,
      body: `I finished: "${goal.description.slice(0, 150)}${goal.description.length > 150 ? '...' : ''}"`,
      type: 'milestone',
      goal_id: params.goalId,
    })
  } catch {
    // Non-critical, ignore
  }

  return NextResponse.json({ goal: updated })
}
