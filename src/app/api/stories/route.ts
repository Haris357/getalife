import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/utils/auth'
import { notifyEmail } from '@/lib/email/notify'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  tagline: z.string().min(1).max(200),
  body: z.string().min(10).max(5000),
  goal_id: z.string().uuid().optional(),
  image_url: z.string().url().optional(),
  social_links: z.record(z.string()).optional(),
})

export async function GET() {
  const supabase = await createClient()

  const { data: stories, error } = await supabase
    .from('stories')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ stories })
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
  const { data: story, error } = await supabase
    .from('stories')
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      tagline: parsed.data.tagline,
      body: parsed.data.body,
      goal_id: parsed.data.goal_id ?? null,
      image_url: parsed.data.image_url ?? null,
      social_links: parsed.data.social_links ?? null,
      published: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  notifyEmail({
    userId: user.id,
    emailType: 'story_submitted',
    storyName: parsed.data.name,
  })

  return NextResponse.json({ story }, { status: 201 })
}
