import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

const schema = z.object({
  token: z.string().min(1),
  resubscribe: z.boolean().optional(),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  let userId: string
  try {
    userId = Buffer.from(parsed.data.token, 'base64').toString('utf8')
    // Basic UUID validation
    if (!/^[0-9a-f-]{36}$/.test(userId)) throw new Error('Invalid token')
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const unsubscribed = parsed.data.resubscribe ? false : true

  const { error } = await supabase
    .from('profiles')
    .update({ unsubscribed })
    .eq('id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ unsubscribed })
}
