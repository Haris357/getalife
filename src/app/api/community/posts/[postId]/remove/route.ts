import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/utils/auth'
import { isUserMod } from '@/lib/utils/community'

const schema = z.object({
  removed: z.boolean(),
  reason: z.string().max(500).optional(),
})

export async function POST(
  request: Request,
  { params }: { params: { postId: string } }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await isUserMod(user.id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const supabase = await createClient()

  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', params.postId)
    .single()

  if (fetchError || !post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  const { error } = await supabase
    .from('posts')
    .update({
      removed: parsed.data.removed,
      removed_reason: parsed.data.removed ? (parsed.data.reason ?? null) : null,
    })
    .eq('id', params.postId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (parsed.data.removed && post.user_id !== user.id) {
    const { data: modProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single()

    await supabase.from('notifications').insert({
      user_id: post.user_id,
      type: 'post_removed',
      post_id: params.postId,
      actor_id: user.id,
      actor_name: modProfile?.display_name ?? 'moderator',
    })
  }

  return NextResponse.json({ removed: parsed.data.removed })
}
