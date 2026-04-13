import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/utils/auth'

const joinSchema = z.object({
  invite_code: z.string().min(1).max(10).trim(),
})

export async function POST(request: Request) {
  const user = await requireUser()

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = joinSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const invite_code = parsed.data.invite_code.toUpperCase()
  const supabase = await createClient()

  // Find the pod
  const { data: pod, error: podError } = await supabase
    .from('pods_with_members')
    .select('*')
    .eq('invite_code', invite_code)
    .maybeSingle()

  if (podError) {
    return NextResponse.json({ error: podError.message }, { status: 500 })
  }

  if (!pod) {
    return NextResponse.json({ error: 'invalid_code', message: 'No pod found with that code.' }, { status: 404 })
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from('pod_members')
    .select('pod_id')
    .eq('pod_id', pod.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'already_member', message: 'You are already in this pod.', pod }, { status: 409 })
  }

  // Check member count
  if (pod.member_count >= pod.max_members) {
    return NextResponse.json({ error: 'pod_full', message: 'This pod is full.' }, { status: 409 })
  }

  // Join
  const { error: joinError } = await supabase
    .from('pod_members')
    .insert({ pod_id: pod.id, user_id: user.id })

  if (joinError) {
    return NextResponse.json({ error: joinError.message }, { status: 500 })
  }

  return NextResponse.json({ pod }, { status: 201 })
}
