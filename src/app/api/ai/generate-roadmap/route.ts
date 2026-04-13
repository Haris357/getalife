import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/utils/auth'
import { generateRoadmap } from '@/lib/openai/generateRoadmap'
import { checkRateLimit } from '@/lib/utils/rateLimit'

const schema = z.object({
  goalId: z.string().uuid(),
  description: z.string().min(1),
})

export async function POST(request: Request) {
  const user = await requireUser()

  const { allowed } = checkRateLimit({
    key: `roadmap:${user.id}`,
    limit: 10,
    windowMs: 60 * 60 * 1000, // 10 per hour
  })
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { goalId, description } = parsed.data

  // Verify the goal belongs to this user
  const supabase = await createClient()
  const { data: goal } = await supabase
    .from('goals')
    .select('id')
    .eq('id', goalId)
    .eq('user_id', user.id)
    .single()

  if (!goal) {
    return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
  }

  const roadmap = await generateRoadmap(description)

  // Persist roadmap to goal row
  await supabase.from('goals').update({ roadmap }).eq('id', goalId)

  return NextResponse.json({ roadmap })
}
