import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/utils/auth'
import { notifyEmail } from '@/lib/email/notify'

const createSchema = z.object({
  description: z.string().min(10).max(2000),
  is_public: z.boolean().optional().default(false),
  pledge: z.string().max(300).optional(),
  category: z.string().optional().default('other'),
})

export async function GET() {
  const user = await requireUser()
  const supabase = await createClient()

  const { data: goals, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ goals })
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
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  // Enforce one active goal at a time
  const { count } = await supabase
    .from('goals')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'active')

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: 'one_active_goal', message: 'You already have an active goal. Pause or complete it first.' },
      { status: 409 }
    )
  }

  const { data: goal, error } = await supabase
    .from('goals')
    .insert({
      user_id: user.id,
      description: parsed.data.description,
      is_public: parsed.data.is_public,
      pledge: parsed.data.pledge ?? null,
      category: parsed.data.category,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  notifyEmail({
    userId: user.id,
    emailType: 'goal_created',
    goalId: goal.id,
    goalDescription: goal.description,
  })

  return NextResponse.json({ goal }, { status: 201 })
}
