import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isUserMod } from '@/lib/utils/community'

const createSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  category: z.string().min(1).max(50),
  duration_days: z.number().int().min(1).max(365),
  start_date: z.string().optional(),
})

export async function GET() {
  const supabase = await createClient()

  const { data: challenges, error } = await supabase
    .from('challenges')
    .select('*')
    .order('end_date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fetch participant counts for all challenges
  const now = new Date().toISOString()
  const withCounts = await Promise.all(
    (challenges ?? []).map(async (challenge) => {
      const { count } = await supabase
        .from('challenge_participants')
        .select('user_id', { count: 'exact', head: true })
        .eq('challenge_id', challenge.id)
      return { ...challenge, participant_count: count ?? 0 }
    })
  )

  // Sort: active first (end_date > now), then past
  withCounts.sort((a, b) => {
    const aActive = a.end_date > now
    const bActive = b.end_date > now
    if (aActive && !bActive) return -1
    if (!aActive && bActive) return 1
    // Within same group, most recent start first
    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  })

  return NextResponse.json({ challenges: withCounts })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const mod = await isUserMod(user.id)
  if (!mod) {
    return NextResponse.json({ error: 'Forbidden — mods only' }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { title, description, category, duration_days, start_date } = parsed.data

  const startDate = start_date ? new Date(start_date) : new Date()
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + duration_days)

  const admin = createAdminClient()
  const { data: challenge, error } = await admin
    .from('challenges')
    .insert({
      title,
      description,
      category,
      duration_days,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ challenge }, { status: 201 })
}
