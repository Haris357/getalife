import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/utils/auth'

const postSchema = z.object({
  buddy_id: z.string().uuid(),
  my_goal_id: z.string().uuid().optional(),
})

// GET /api/buddies — returns { active, incoming, outgoing }
export async function GET() {
  const user = await requireUser()
  const supabase = await createClient()

  // Fetch all buddy rows where current user is involved
  const { data: rows, error } = await supabase
    .from('buddies')
    .select('*')
    .or(`requester_id.eq.${user.id},buddy_id.eq.${user.id}`)
    .neq('status', 'declined')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const buddies = rows ?? []

  // For each row we need the other party's profile
  const otherIds = buddies.map((b) =>
    b.requester_id === user.id ? b.buddy_id : b.requester_id
  )

  let profileMap: Record<string, { display_name: string | null; avatar_url: string | null; level: number | null }> = {}

  if (otherIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, level')
      .in('id', Array.from(new Set(otherIds)))

    for (const p of profiles ?? []) {
      profileMap[p.id] = { display_name: p.display_name, avatar_url: p.avatar_url, level: p.level }
    }
  }

  const enrich = (b: typeof buddies[0]) => {
    const otherId = b.requester_id === user.id ? b.buddy_id : b.requester_id
    return { ...b, ...profileMap[otherId] }
  }

  const active = buddies.filter((b) => b.status === 'active').map(enrich)
  const incoming = buddies
    .filter((b) => b.status === 'pending' && b.buddy_id === user.id)
    .map(enrich)
  const outgoing = buddies
    .filter((b) => b.status === 'pending' && b.requester_id === user.id)
    .map(enrich)

  return NextResponse.json({ active, incoming, outgoing })
}

// POST /api/buddies — send a buddy request
export async function POST(request: Request) {
  const user = await requireUser()

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { buddy_id, my_goal_id } = parsed.data

  if (buddy_id === user.id) {
    return NextResponse.json({ error: 'Cannot add yourself as a buddy' }, { status: 400 })
  }

  const supabase = await createClient()

  // Check no existing relationship
  const { data: existing } = await supabase
    .from('buddies')
    .select('id')
    .or(
      `and(requester_id.eq.${user.id},buddy_id.eq.${buddy_id}),and(requester_id.eq.${buddy_id},buddy_id.eq.${user.id})`
    )
    .neq('status', 'declined')
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Buddy relationship already exists' }, { status: 409 })
  }

  const { data: buddy, error } = await supabase
    .from('buddies')
    .insert({
      requester_id: user.id,
      buddy_id,
      requester_goal_id: my_goal_id ?? null,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Notify via notifications table (same pattern as coach/community)
  await supabase.from('notifications').insert({
    user_id: buddy_id,
    type: 'buddy_request',
    actor_id: user.id,
  })

  return NextResponse.json({ buddy }, { status: 201 })
}
