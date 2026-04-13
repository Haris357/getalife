import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/utils/auth'

const voteSchema = z.object({
  value: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
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

  const parsed = voteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid vote value' }, { status: 400 })
  }

  const supabase = await createClient()
  const { value } = parsed.data

  if (value === 0) {
    await supabase
      .from('comment_votes')
      .delete()
      .eq('comment_id', params.commentId)
      .eq('user_id', user.id)
  } else {
    await supabase
      .from('comment_votes')
      .upsert({ comment_id: params.commentId, user_id: user.id, value }, { onConflict: 'comment_id,user_id' })
  }

  const { data: comment } = await supabase
    .from('comments')
    .select('score')
    .eq('id', params.commentId)
    .single()

  return NextResponse.json({ score: comment?.score ?? 0, user_vote: value === 0 ? null : value })
}
