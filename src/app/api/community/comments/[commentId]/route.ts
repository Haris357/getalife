import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/utils/auth'

const patchSchema = z.object({
  body: z.string().min(1).max(5000),
})

export async function PATCH(
  request: Request,
  { params }: { params: { commentId: string } }
) {
  const user = await requireUser()

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
  const { data: comment, error } = await supabase
    .from('comments')
    .update({ body: parsed.data.body, updated_at: new Date().toISOString() })
    .eq('id', params.commentId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error || !comment) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({ comment })
}

export async function DELETE(
  _request: Request,
  { params }: { params: { commentId: string } }
) {
  const user = await requireUser()
  const supabase = await createClient()

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', params.commentId)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
