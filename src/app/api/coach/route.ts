import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/utils/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET — am I a coach? returns { is_coach, coachee_count, coachees }
export async function GET() {
  const user = await requireUser()
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_coach')
    .eq('id', user.id)
    .single()

  const { data: relationships } = await supabase
    .from('coach_relationships')
    .select('coachee_id')
    .eq('coach_id', user.id)

  const coacheeIds = (relationships ?? []).map((r) => r.coachee_id)
  let coachees: unknown[] = []

  if (coacheeIds.length > 0) {
    const { data } = await supabase
      .from('profiles')
      .select('id:id, user_id:id, display_name, avatar_url, level, title, joined_at:created_at')
      .in('id', coacheeIds)
    coachees = data ?? []
  }

  return NextResponse.json({
    is_coach: profile?.is_coach ?? false,
    coachee_count: coacheeIds.length,
    coachees,
  })
}

// PATCH — toggle is_coach for current user
export async function PATCH(request: Request) {
  const user = await requireUser()

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { is_coach } = body as { is_coach: boolean }
  if (typeof is_coach !== 'boolean') {
    return NextResponse.json({ error: 'is_coach must be boolean' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ is_coach })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ is_coach })
}
