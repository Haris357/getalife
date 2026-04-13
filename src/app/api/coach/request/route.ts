import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/utils/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST — request a coach
export async function POST(request: Request) {
  const user = await requireUser()

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { coach_id } = body as { coach_id: string }
  if (!coach_id || typeof coach_id !== 'string') {
    return NextResponse.json({ error: 'coach_id required' }, { status: 400 })
  }

  if (coach_id === user.id) {
    return NextResponse.json({ error: 'Cannot coach yourself' }, { status: 400 })
  }

  const supabase = await createClient()

  const { error: insertError } = await supabase
    .from('coach_relationships')
    .insert({ coach_id, coachee_id: user.id })

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({ error: 'Already has this coach' }, { status: 409 })
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Notify the coach
  const admin = createAdminClient()
  await admin.from('notifications').insert({
    user_id: coach_id,
    type: 'new_coachee',
    actor_name: 'someone requested you as their accountability coach!',
    read: false,
  })

  return NextResponse.json({ ok: true })
}

// DELETE — remove a coach relationship
export async function DELETE(request: Request) {
  const user = await requireUser()

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { coach_id } = body as { coach_id: string }
  if (!coach_id || typeof coach_id !== 'string') {
    return NextResponse.json({ error: 'coach_id required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('coach_relationships')
    .delete()
    .eq('coach_id', coach_id)
    .eq('coachee_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
