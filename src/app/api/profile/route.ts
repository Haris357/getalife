import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/utils/auth'

const patchSchema = z.object({
  display_name: z.string().min(2).max(30).regex(/^[\w\s\-_.]+$/, 'Only letters, numbers, spaces, and - _ . are allowed').optional(),
  avatar_url: z.string().url().nullable().optional(),
})

export async function PATCH(request: Request) {
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
  const { data: profile, error } = await supabase
    .from('profiles')
    .update(parsed.data)
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ profile })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: profile }, { data: achievements }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('achievements').select('type, earned_at').eq('user_id', user.id),
  ])

  return NextResponse.json({ profile, achievements: achievements ?? [] })
}
