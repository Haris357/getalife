import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/utils/auth'

const patchSchema = z.object({
  status: z.enum(['active', 'declined']),
})

// PATCH /api/buddies/[buddyId] — accept or decline a request
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ buddyId: string }> }
) {
  const user = await requireUser()
  const { buddyId } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const supabase = await createClient()

  // Only the buddy_id user can accept/decline
  const { data: row, error: fetchError } = await supabase
    .from('buddies')
    .select('*')
    .eq('id', buddyId)
    .single()

  if (fetchError || !row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (row.buddy_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: updated, error } = await supabase
    .from('buddies')
    .update({ status: parsed.data.status })
    .eq('id', buddyId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ buddy: updated })
}

// DELETE /api/buddies/[buddyId] — remove buddy relationship (either party)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ buddyId: string }> }
) {
  const user = await requireUser()
  const { buddyId } = await params

  const supabase = await createClient()

  // Ensure user is part of this relationship
  const { data: row, error: fetchError } = await supabase
    .from('buddies')
    .select('id, requester_id, buddy_id')
    .eq('id', buddyId)
    .single()

  if (fetchError || !row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (row.requester_id !== user.id && row.buddy_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase.from('buddies').delete().eq('id', buddyId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
