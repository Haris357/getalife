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
    .select('locked')
    .eq('id', params.postId)
    .single()

  if (fetchError || !post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  const newLocked = !post.locked

  const { error } = await supabase
    .from('posts')
    .update({ locked: newLocked })
    .eq('id', params.postId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ locked: newLocked })
}
