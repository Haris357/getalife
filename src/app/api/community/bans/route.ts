import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/utils/auth'
import { isUserMod } from '@/lib/utils/community'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await isUserMod(user.id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('community_bans')
    .select('*, profiles!user_id(display_name)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ bans: data ?? [] })
}

const banSchema = z.object({
  user_id: z.string().uuid(),
  reason: z.string().max(500).optional(),
  expires_at: z.string().datetime().optional(),
})

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await isUserMod(user.id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = banSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('community_bans')
    .upsert({
      user_id: parsed.data.user_id,
      banned_by: user.id,
      reason: parsed.data.reason ?? null,
      expires_at: parsed.data.expires_at ?? null,
    }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ban: data }, { status: 201 })
}
