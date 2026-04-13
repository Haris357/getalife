import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/utils/auth'

export async function GET(request: Request) {
  const user = await requireUser()
  const { searchParams } = new URL(request.url)
  const goalId = searchParams.get('goalId')

  if (!goalId) {
    return NextResponse.json({ error: 'goalId is required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: challenge, error } = await supabase
    .from('recovery_challenges')
    .select('id, started_at, target_date, checkins_done, completed, failed')
    .eq('user_id', user.id)
    .eq('goal_id', goalId)
    .eq('completed', false)
    .eq('failed', false)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ challenge })
}
