import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/utils/auth'
import { notifyEmail } from '@/lib/email/notify'

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  tagline: z.string().min(1).max(200).optional(),
  body: z.string().min(10).max(5000).optional(),
  image_url: z.string().url().nullable().optional(),
  social_links: z.record(z.string()).nullable().optional(),
  published: z.boolean().optional(),
})

// PATCH /api/stories/[storyId] — update own story
export async function PATCH(
  request: Request,
  { params }: { params: { storyId: string } }
) {
  const user = await requireUser()
  const supabase = await createClient()

  // Verify ownership
  const { data: existing } = await supabase
    .from('stories')
    .select('user_id')
    .eq('id', params.storyId)
    .single()

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const { data: story, error } = await supabase
    .from('stories')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', params.storyId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ story })
}

// DELETE /api/stories/[storyId] — delete own story
export async function DELETE(
  _req: Request,
  { params }: { params: { storyId: string } }
) {
  const user = await requireUser()
  const supabase = await createClient()

  // Verify ownership and fetch name for email
  const { data: existing } = await supabase
    .from('stories')
    .select('user_id, name')
    .eq('id', params.storyId)
    .single()

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase.from('stories').delete().eq('id', params.storyId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  notifyEmail({ userId: user.id, emailType: 'story_deleted' })

  return NextResponse.json({ ok: true })
}
