import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/utils/auth'

export async function POST(
  _request: Request,
  { params }: { params: { postId: string } }
) {
  const user = await requireUser()
  const supabase = await createClient()

  // Check if already saved
  const { data: existing } = await supabase
    .from('saved_posts')
    .select('post_id')
    .eq('post_id', params.postId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    await supabase
      .from('saved_posts')
      .delete()
      .eq('post_id', params.postId)
      .eq('user_id', user.id)
    return NextResponse.json({ is_saved: false })
  } else {
    await supabase
      .from('saved_posts')
      .insert({ post_id: params.postId, user_id: user.id })
    return NextResponse.json({ is_saved: true })
  }
}
