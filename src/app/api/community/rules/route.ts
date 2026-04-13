import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/utils/auth'
import { isUserMod } from '@/lib/utils/community'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('community_rules')
    .select('*')
    .order('display_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rules: data ?? [] })
}

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  display_order: z.number().int().min(0),
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

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('community_rules')
    .insert(parsed.data)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rule: data }, { status: 201 })
}
