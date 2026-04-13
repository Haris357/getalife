import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/utils/auth'
import { notifyEmail } from '@/lib/email/notify'

const patchSchema = z.object({
  status: z.enum(['active', 'completed', 'paused']).optional(),
  description: z.string().min(10).max(2000).optional(),
  deadline: z.string().datetime().nullable().optional(),
  roadmap: z.array(z.object({
    phase: z.number(),
    title: z.string().max(200),
    focus: z.array(z.string().max(300)),
  })).optional(),
})

export async function GET(
  _request: Request,
  { params }: { params: { goalId: string } }
) {
  const user = await requireUser()
  const supabase = await createClient()

  const { data: goal, error } = await supabase
    .from('goals')
    .select('*, todos(*)')
    .eq('id', params.goalId)
    .eq('user_id', user.id)
    .single()

  if (error || !goal) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ goal })
}

export async function PATCH(
  request: Request,
  { params }: { params: { goalId: string } }
) {
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

  // Fetch current status to detect pause/resume transitions
  const { data: existing } = await supabase
    .from('goals')
    .select('status, description')
    .eq('id', params.goalId)
    .eq('user_id', user.id)
    .single()

  const { data: goal, error } = await supabase
    .from('goals')
    .update(parsed.data)
    .eq('id', params.goalId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error || !goal) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  if (parsed.data.status && existing) {
    if (parsed.data.status === 'paused' && existing.status === 'active') {
      notifyEmail({ userId: user.id, emailType: 'goal_paused', goalId: params.goalId, goalDescription: existing.description })
    } else if (parsed.data.status === 'active' && existing.status === 'paused') {
      notifyEmail({ userId: user.id, emailType: 'goal_resumed', goalId: params.goalId, goalDescription: existing.description })
    }
  }

  return NextResponse.json({ goal })
}

export async function DELETE(
  _request: Request,
  { params }: { params: { goalId: string } }
) {
  const user = await requireUser()
  const supabase = await createClient()

  // Fetch goal description before deleting
  const { data: toDelete } = await supabase
    .from('goals')
    .select('description')
    .eq('id', params.goalId)
    .eq('user_id', user.id)
    .single()

  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', params.goalId)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (toDelete) {
    notifyEmail({ userId: user.id, emailType: 'goal_deleted', goalDescription: toDelete.description })
  }

  return NextResponse.json({ success: true })
}
