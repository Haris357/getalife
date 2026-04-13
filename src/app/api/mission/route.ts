import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/utils/auth'
import { getOpenAIClient } from '@/lib/openai/client'

export async function GET(request: Request) {
  const user = await requireUser()
  const { searchParams } = new URL(request.url)
  const goalId = searchParams.get('goalId')

  if (!goalId) {
    return NextResponse.json({ error: 'goalId is required' }, { status: 400 })
  }

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('daily_missions')
    .select('missions, date')
    .eq('goal_id', goalId)
    .eq('user_id', user.id)
    .eq('date', today)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ missions: null, date: today })
  }

  return NextResponse.json({ missions: data.missions as string[], date: data.date })
}

export async function POST(request: Request) {
  const user = await requireUser()

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { goalId } = body as { goalId?: string }
  if (!goalId || typeof goalId !== 'string') {
    return NextResponse.json({ error: 'goalId is required' }, { status: 400 })
  }

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // Verify goal belongs to user
  const { data: goal } = await supabase
    .from('goals')
    .select('id, description')
    .eq('id', goalId)
    .eq('user_id', user.id)
    .single()

  if (!goal) {
    return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
  }

  // Fetch last 3 check-ins for context
  const { data: recentCheckIns } = await supabase
    .from('check_ins')
    .select('what_i_did, date')
    .eq('goal_id', goalId)
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(3)

  const recentProgress = (recentCheckIns ?? [])
    .map((ci, i) => `Day -${i + 1}: ${ci.what_i_did}`)
    .join('\n')

  const client = getOpenAIClient()

  const completion = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content:
          'You are an accountability coach. Given the user\'s goal and recent progress, generate exactly 3 specific, actionable tasks they should do TODAY to advance their goal. Make them concrete and achievable in one day. Return ONLY a JSON array of 3 strings, no other text. Example: ["Do 20 pushups in the morning", "Prep meals for tomorrow", "Read 10 pages of your book"]',
      },
      {
        role: 'user',
        content: `Goal: ${goal.description}\n\nRecent progress:\n${recentProgress || 'No check-ins yet — this is day 1.'}`,
      },
    ],
  })

  const raw = completion.choices[0]?.message?.content?.trim() ?? '[]'

  let missions: string[]
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length !== 3) {
      throw new Error('Expected array of 3')
    }
    missions = parsed.map(String)
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
  }

  // Upsert into daily_missions
  const { error: upsertError } = await supabase
    .from('daily_missions')
    .upsert(
      {
        user_id: user.id,
        goal_id: goalId,
        missions,
        date: today,
      },
      { onConflict: 'goal_id,date' }
    )

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  return NextResponse.json({ missions, date: today })
}
