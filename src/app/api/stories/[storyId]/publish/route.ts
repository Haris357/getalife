import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/utils/auth'

// Simple admin check — add your email to ADMIN_EMAILS env var (comma-separated)
function isAdmin(email: string) {
  const admins = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim())
  return admins.includes(email)
}

export async function PATCH(
  _request: Request,
  { params }: { params: { storyId: string } }
) {
  const user = await requireUser()

  if (!user.email || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data: story, error } = await supabase
    .from('stories')
    .update({ published: true })
    .eq('id', params.storyId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ story })
}

export async function DELETE(
  _request: Request,
  { params }: { params: { storyId: string } }
) {
  const user = await requireUser()

  if (!user.email || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createClient()
  const { error } = await supabase.from('stories').delete().eq('id', params.storyId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
