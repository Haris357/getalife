import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/utils/auth'

// GET /api/buddies/available — list users available to buddy with
export async function GET() {
  const user = await requireUser()
  const supabase = await createClient()

  // Get all user IDs already in a buddy relationship with current user
  const { data: existingRows } = await supabase
    .from('buddies')
    .select('requester_id, buddy_id')
    .or(`requester_id.eq.${user.id},buddy_id.eq.${user.id}`)
    .neq('status', 'declined')

  const excludedIds = new Set<string>([user.id])
  for (const row of existingRows ?? []) {
    excludedIds.add(row.requester_id)
    excludedIds.add(row.buddy_id)
  }

  // Query available_buddies view, exclude known IDs
  const { data, error } = await supabase
    .from('available_buddies')
    .select('id, display_name, avatar_url, level, title, goal_id, active_goal, current_streak')
    .not('id', 'in', `(${Array.from(excludedIds).join(',')})`)
    .limit(20)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ available: data ?? [] })
}
