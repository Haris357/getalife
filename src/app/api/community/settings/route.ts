import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/utils/auth'
import { isUserMod } from '@/lib/utils/community'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('community_settings')
    .select('*')
    .eq('id', 1)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ settings: data })
}

export async function PATCH(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await isUserMod(user.id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const allowed = ['name', 'description', 'cover_url', 'avatar_url']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if ((body as Record<string, unknown>)[key] !== undefined) {
      updates[key] = (body as Record<string, unknown>)[key]
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('community_settings')
    .update(updates)
    .eq('id', 1)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ settings: data })
}
