import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/utils/auth'

const schema = z.object({
  reason: z.string().min(1).max(500),
})

export async function POST(
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

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const supabase = await createClient()
  const { error } = await supabase.from('comment_reports').insert({
    comment_id: params.commentId,
    user_id: user.id,
    reason: parsed.data.reason,
  })

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Already reported' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
