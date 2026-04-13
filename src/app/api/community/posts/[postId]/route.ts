import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/utils/auth'

const patchSchema = z.object({
  title: z.string().min(3).max(300).optional(),
  body: z.string().max(10000).optional(),
})

export async function GET(
  _request: Request,
  { params }: { params: { postId: string } }
) {
  const supabase = await createClient()

  const { data: post, error } = await supabase
    .from('posts_with_authors')
    .select('*')
    .eq('id', params.postId)
    .single()

  if (error || !post) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Attach current user's vote/save if logged in
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const [{ data: vote }, { data: save }] = await Promise.all([
        supabase.from('post_votes').select('value').eq('post_id', params.postId).eq('user_id', user.id).single(),
        supabase.from('saved_posts').select('post_id').eq('post_id', params.postId).eq('user_id', user.id).single(),
      ])
      return NextResponse.json({
        post: {
          ...post,
          user_vote: vote?.value ?? null,
          is_saved: !!save,
        },
      })
    }
  } catch {
    // not logged in
  }

  return NextResponse.json({ post })
}

export async function PATCH(
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

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: post, error } = await supabase
    .from('posts')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', params.postId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error || !post) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({ post })
}

export async function DELETE(
  _request: Request,
  { params }: { params: { postId: string } }
) {
  const user = await requireUser()
  const supabase = await createClient()

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', params.postId)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
