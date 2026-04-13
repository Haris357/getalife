import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function GET(
  _req: Request,
  { params }: { params: { goalId: string } }
) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('goals')
    .select('id, description, current_streak, deadline, created_at, last_checkin_date, is_public')
    .eq('id', params.goalId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Goal not found' }, { status: 404, headers: CORS })
  }

  // Only expose if goal is public OR we allow all (countdown is opt-in share)
  return NextResponse.json(
    {
      id: data.id,
      description: data.description,
      current_streak: data.current_streak,
      deadline: data.deadline,
      created_at: data.created_at,
      last_checkin_date: data.last_checkin_date,
    },
    { headers: { ...CORS, 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } }
  )
}
