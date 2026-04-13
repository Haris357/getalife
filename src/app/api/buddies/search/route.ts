import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/utils/auth'

// GET /api/buddies/search?q=username
export async function GET(req: NextRequest) {
  const user = await requireUser()
  const supabase = await createClient()
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''

  if (q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  // Get IDs already in a relationship
  const { data: existing } = await supabase
    .from('buddies')
    .select('requester_id, buddy_id')
    .or(`requester_id.eq.${user.id},buddy_id.eq.${user.id}`)
    .neq('status', 'declined')

  const excludedIds = new Set<string>([user.id])
  for (const row of existing ?? []) {
    excludedIds.add(row.requester_id)
    excludedIds.add(row.buddy_id)
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, level, title')
    .ilike('display_name', `%${q}%`)
    .not('id', 'in', `(${Array.from(excludedIds).join(',')})`)
    .limit(10)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ results: data ?? [] })
}
