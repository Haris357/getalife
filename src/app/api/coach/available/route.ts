import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/utils/auth'
import { createClient } from '@/lib/supabase/server'

// GET — available coaches (excludes self and anyone already coaching current user)
export async function GET() {
  const user = await requireUser()
  const supabase = await createClient()

  // Get IDs of coaches who already coach this user
  const { data: existing } = await supabase
    .from('coach_relationships')
    .select('coach_id')
    .eq('coachee_id', user.id)

  const excludeIds = [user.id, ...(existing ?? []).map((r) => r.coach_id)]

  const { data: coaches, error } = await supabase
    .from('available_coaches')
    .select('id, display_name, avatar_url, level, title, xp, coachee_count')
    .not('id', 'in', `(${excludeIds.join(',')})`)
    .order('coachee_count', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ coaches: coaches ?? [] })
}
