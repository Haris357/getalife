import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/utils/auth'

const voteSchema = z.object({
  value: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
})

export async function POST(
  request: Request,
  { params }: { params: { postId: string } }
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
    // Remove vote
    await supabase
      .from('post_votes')
      .delete()
      .eq('post_id', params.postId)
      .eq('user_id', user.id)
  } else {
    // Upsert vote
    await supabase
      .from('post_votes')
      .upsert({ post_id: params.postId, user_id: user.id, value }, { onConflict: 'post_id,user_id' })
  }

  // Return updated score
  const { data: post } = await supabase
    .from('posts')
    .select('score')
    .eq('id', params.postId)
    .single()

  return NextResponse.json({ score: post?.score ?? 0, user_vote: value === 0 ? null : value })
}
