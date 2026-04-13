// Dev-only endpoint — sends email types to the authenticated user
// POST /api/dev/send-test-emails          → sends all types
// POST /api/dev/send-test-emails { type } → sends one type

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireUser } from '@/lib/utils/auth'
import { generateEmail } from '@/lib/openai/generateEmail'
import { sendEmail } from '@/lib/email/sender'
import { SCENARIOS } from '@/lib/email/scenarios'
import type { EmailType, CheckIn, Goal } from '@/types'

const SAMPLE_GOAL: Goal = {
  id: 'test-goal-1',
  user_id: 'test-user',
  description: 'get fit, lose 10kg, and build a consistent workout habit — I haven\'t exercised properly in 2 years',
  status: 'active',
  roadmap: null,
  current_streak: 7,
  longest_streak: 14,
  last_checkin_date: null,
  deadline: new Date(Date.now() + 30 * 86400000).toISOString(),
  created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  is_public: false,
  pledge: null,
  pattern_analysis: null,
  pattern_analyzed_at: null,
}

const SAMPLE_CHECKINS: CheckIn[] = [
  {
    id: '1', goal_id: 'g1', user_id: 'u1',
    date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    what_i_did: 'went to the gym, did 45 min cardio and upper body. felt terrible but finished.',
    commitment: 'tomorrow: legs day, no excuses.',
    ai_response: null, media_url: null, social_links: null,
    created_at: new Date().toISOString(),
  },
  {
    id: '2', goal_id: 'g1', user_id: 'u1',
    date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    what_i_did: 'ran 3km. slower than usual but showed up.',
    commitment: 'upper body tomorrow morning before work.',
    ai_response: null, media_url: null, social_links: null,
    created_at: new Date().toISOString(),
  },
  {
    id: '3', goal_id: 'g1', user_id: 'u1',
    date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
    what_i_did: 'skipped. was tired. no excuse.',
    commitment: 'get back tomorrow, no mercy.',
    ai_response: null, media_url: null, social_links: null,
    created_at: new Date().toISOString(),
  },
]


async function sendScenario(type: EmailType, userEmail: string, userId: string) {
  const s = SCENARIOS.find(s => s.type === type)
  if (!s) throw new Error(`Unknown type: ${type}`)

  const { subject, html } = await generateEmail({
    userEmail,
    goalDescription: SAMPLE_GOAL.description,
    recentCheckIns: SAMPLE_CHECKINS,
    emailType: s.type,
    daysSinceStart: s.days,
    currentStreak: s.streak,
    userId,
    goal: s.useGoal ? SAMPLE_GOAL : undefined,
    checkinWhatIDid: 'went to the gym, did 45 min cardio and upper body. felt terrible but finished.',
    storyName: 'How I Lost 10kg in 90 Days',
  })

  await sendEmail({ to: userEmail, subject: `[TEST] ${subject}`, html })
  return subject
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'dev only' }, { status: 403 })
  }

  const user = await requireUser()
  const adminClient = createAdminClient()
  const { data: { user: authUser } } = await adminClient.auth.admin.getUserById(user.id)

  if (!authUser?.email) {
    return NextResponse.json({ error: 'no email found' }, { status: 400 })
  }

  // Single type mode
  let body: { type?: string } = {}
  try { body = await request.json() } catch { /* no body */ }

  if (body.type) {
    try {
      const subject = await sendScenario(body.type as EmailType, authUser.email, user.id)
      return NextResponse.json({ sent: true, subject, to: authUser.email })
    } catch (err) {
      return NextResponse.json({ sent: false, error: err instanceof Error ? err.message : 'error' }, { status: 500 })
    }
  }

  // Send all mode
  const results: { type: string; label: string; subject: string; sent: boolean; error?: string }[] = []

  for (const s of SCENARIOS) {
    try {
      const subject = await sendScenario(s.type, authUser.email, user.id)
      results.push({ type: s.type, label: s.label, subject, sent: true })
      await new Promise(r => setTimeout(r, 1200))
    } catch (err) {
      results.push({ type: s.type, label: s.label, subject: '', sent: false, error: err instanceof Error ? err.message : 'error' })
    }
  }

  return NextResponse.json({
    message: `Sent ${results.filter(r => r.sent).length}/${SCENARIOS.length} emails to ${authUser.email}`,
    results,
  })
}
