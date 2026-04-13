import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/utils/auth'
import { isUserMod } from '@/lib/utils/community'

export async function POST(
  _request: Request,
  { params }: { params: { postId: string } }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await isUserMod(user.id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createClient()

  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('pinned, user_id')
    .eq('id', params.postId)
    .single()

  if (fetchError || !post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  const newPinned = !post.pinned

  const { error } = await supabase
    .from('posts')
    .update({ pinned: newPinned })
    .eq('id', params.postId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (newPinned && post.user_id !== user.id) {
    const { data: modProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single()

    await supabase.from('notifications').insert({
      user_id: post.user_id,
      type: 'post_pinned',
      post_id: params.postId,
      actor_id: user.id,
      actor_name: modProfile?.display_name ?? 'moderator',
    })
  }

  return NextResponse.json({ pinned: newPinned })
}
