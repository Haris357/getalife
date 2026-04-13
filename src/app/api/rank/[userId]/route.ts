import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(_req: Request, { params }: { params: { userId: string } }) {
  const supabase = createAdminClient()

  const [{ data: profile }, { data: achievements }, { data: goals }] = await Promise.all([
    supabase.from('profiles').select('id, xp, level, title, streak_shields').eq('id', params.userId).single(),
    supabase.from('achievements').select('type, earned_at').eq('user_id', params.userId),
    supabase.from('goals').select('current_streak, longest_streak').eq('user_id', params.userId).eq('status', 'active'),
  ])

  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const maxStreak = Math.max(...(goals ?? []).map((g) => g.longest_streak ?? 0), 0)

  return NextResponse.json({
    profile,
    achievements: achievements ?? [],
    maxStreak,
  })
}
