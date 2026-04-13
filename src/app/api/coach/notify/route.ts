import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Internal utility — called when a coachee checks in
export async function POST(request: Request) {
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { coachee_id, goal_description } = body as { coachee_id: string; goal_description: string }
  if (!coachee_id || !goal_description) {
    return NextResponse.json({ error: 'coachee_id and goal_description required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: rel } = await admin
    .from('coach_relationships')
    .select('coach_id')
    .eq('coachee_id', coachee_id)
    .single()

  if (!rel?.coach_id) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  await admin.from('notifications').insert({
    user_id: rel.coach_id,
    type: 'coachee_checkin',
    actor_name: `your coachee just checked in — "${goal_description.slice(0, 60)}"`,
    read: false,
  })

  return NextResponse.json({ ok: true })
}
