import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/utils/auth'
import type { SortMode } from '@/types'

const createSchema = z.object({
  title: z.string().min(3).max(300),
  body: z.string().max(10000).optional(),
  image_url: z.string().url().optional(),
  type: z.enum(['text', 'image', 'milestone']).default('text'),
  goal_id: z.string().uuid().optional(),
  is_anonymous: z.boolean().optional().default(false),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sort = (searchParams.get('sort') ?? 'new') as SortMode
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '30'), 50)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const supabase = await createClient()

  let query = supabase
    .from('posts_with_authors')
    .select('*')
    .range(offset, offset + limit - 1)

  if (sort === 'new') {
    query = query.order('created_at', { ascending: false })
  } else if (sort === 'top') {
    query = query.order('score', { ascending: false }).order('created_at', { ascending: false })
  } else {
    // hot: score + comment_count*2, but only recent posts
    query = query
      .order('score', { ascending: false })
      .order('comment_count', { ascending: false })
      .order('created_at', { ascending: false })
  }

  const { data: posts, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Attach current user's votes if logged in
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user && posts && posts.length > 0) {
      const postIds = posts.map((p: { id: string }) => p.id)
      const [{ data: votes }, { data: saves }] = await Promise.all([
        supabase.from('post_votes').select('post_id, value').eq('user_id', user.id).in('post_id', postIds),
        supabase.from('saved_posts').select('post_id').eq('user_id', user.id).in('post_id', postIds),
      ])
      const voteMap = new Map((votes ?? []).map((v: { post_id: string; value: number }) => [v.post_id, v.value]))
      const saveSet = new Set((saves ?? []).map((s: { post_id: string }) => s.post_id))
      return NextResponse.json({
        posts: posts.map((p: { id: string }) => ({
          ...p,
          user_vote: voteMap.get(p.id) ?? null,
          is_saved: saveSet.has(p.id),
        })),
      })
    }
  } catch {
    // not logged in, return posts without vote info
  }

  return NextResponse.json({ posts: posts ?? [] })
}

export async function POST(request: Request) {
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
  const { data: post, error } = await supabase
    .from('posts')
    .insert({ user_id: user.id, ...parsed.data })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ post }, { status: 201 })
}
