import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/utils/auth'

export async function POST(
  _request: Request,
  { params }: { params: { challengeId: string } }
) {
  const user = await requireUser()
  const supabase = await createClient()

  // Check not already a member
  const { data: existing } = await supabase
    .from('challenge_participants')
    .select('challenge_id')
    .eq('challenge_id', params.challengeId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Already joined this challenge' }, { status: 409 })
  }

  // Verify challenge exists
  const { data: challenge } = await supabase
    .from('challenges')
    .select('id, end_date')
    .eq('id', params.challengeId)
    .single()

  if (!challenge) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
  }

  const { error } = await supabase
    .from('challenge_participants')
    .insert({
      challenge_id: params.challengeId,
      user_id: user.id,
      goal_id: null,
      checkins_done: 0,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ joined: true }, { status: 201 })
}

export async function DELETE(
  _request: Request,
  { params }: { params: { challengeId: string } }
) {
  const user = await requireUser()
  const supabase = await createClient()

  const { error } = await supabase
    .from('challenge_participants')
    .delete()
    .eq('challenge_id', params.challengeId)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ left: true })
}
