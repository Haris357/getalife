import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/utils/auth'

const createSchema = z.object({
  name: z.string().min(1).max(100).trim(),
})

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function GET() {
  const user = await requireUser()
  const supabase = await createClient()

  // Get pods where user is a member
  const { data: memberRows, error: memberError } = await supabase
    .from('pod_members')
    .select('pod_id')
    .eq('user_id', user.id)

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 })
  }

  const podIds = (memberRows ?? []).map((r: { pod_id: string }) => r.pod_id)

  if (podIds.length === 0) {
    return NextResponse.json({ pods: [] })
  }

  const { data: pods, error } = await supabase
    .from('pods_with_members')
    .select('*')
    .in('id', podIds)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ pods: pods ?? [] })
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
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const supabase = await createClient()

  // Generate a unique invite code
  let invite_code = generateInviteCode()
  let attempts = 0
  while (attempts < 5) {
    const { data: existing } = await supabase
      .from('pods')
      .select('id')
      .eq('invite_code', invite_code)
      .maybeSingle()
    if (!existing) break
    invite_code = generateInviteCode()
    attempts++
  }

  // Create the pod
  const { data: pod, error: podError } = await supabase
    .from('pods')
    .insert({ name: parsed.data.name, created_by: user.id, invite_code })
    .select()
    .single()

  if (podError) {
    return NextResponse.json({ error: podError.message }, { status: 500 })
  }

  // Auto-add creator as first member
  const { error: memberError } = await supabase
    .from('pod_members')
    .insert({ pod_id: pod.id, user_id: user.id })

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 })
  }

  return NextResponse.json({ pod }, { status: 201 })
}
