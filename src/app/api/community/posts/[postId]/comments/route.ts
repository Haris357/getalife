import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/utils/auth'
import { notifyEmail } from '@/lib/email/notify'

const createSchema = z.object({
  body: z.string().min(1).max(5000),
  parent_id: z.string().uuid().optional(),
})

export async function GET(
  _request: Request,
  { params }: { params: { postId: string } }
) {
  const supabase = await createClient()

  const { data: comments, error } = await supabase
    .from('comments_with_authors')
    .select('*')
    .eq('post_id', params.postId)
    .order('score', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Attach user votes if logged in
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user && comments && comments.length > 0) {
      const commentIds = comments.map((c: { id: string }) => c.id)
      const { data: votes } = await supabase
        .from('comment_votes')
        .select('comment_id, value')
        .eq('user_id', user.id)
        .in('comment_id', commentIds)

      const voteMap = new Map((votes ?? []).map((v: { comment_id: string; value: number }) => [v.comment_id, v.value]))
      return NextResponse.json({
        comments: comments.map((c: { id: string }) => ({
          ...c,
          user_vote: voteMap.get(c.id) ?? null,
        })),
      })
    }
  } catch {
    // not logged in
  }

  return NextResponse.json({ comments: comments ?? [] })
}

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

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      post_id: params.postId,
      user_id: user.id,
      body: parsed.data.body,
      parent_id: parsed.data.parent_id ?? null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Notifications (fire-and-forget)
  void (async () => {
    try {
      const { data: actorProfile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single()
      const actorName = actorProfile?.display_name ?? 'someone'

      if (parsed.data.parent_id) {
        // Reply: notify parent comment author
        const { data: parentComment } = await supabase
          .from('comments')
          .select('user_id')
          .eq('id', parsed.data.parent_id)
          .single()
        if (parentComment && parentComment.user_id !== user.id) {
          await supabase.from('notifications').insert({
            user_id: parentComment.user_id,
            type: 'comment_reply',
            post_id: params.postId,
            comment_id: comment.id,
            actor_id: user.id,
            actor_name: actorName,
          })
          notifyEmail({ userId: parentComment.user_id, emailType: 'community_reply' })
        }
      } else {
        // Top-level comment: notify post author
        const { data: post } = await supabase
          .from('posts')
          .select('user_id')
          .eq('id', params.postId)
          .single()
        if (post && post.user_id !== user.id) {
          await supabase.from('notifications').insert({
            user_id: post.user_id,
            type: 'post_comment',
            post_id: params.postId,
            comment_id: comment.id,
            actor_id: user.id,
            actor_name: actorName,
          })
          notifyEmail({ userId: post.user_id, emailType: 'community_comment' })
        }
      }
    } catch {
      // notifications are best-effort
    }
  })()

  return NextResponse.json({ comment }, { status: 201 })
}
