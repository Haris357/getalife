import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateDigest } from '@/lib/email/generateDigest'
import { sendEmail } from '@/lib/email/sender'
import type { Goal } from '@/types'

export const maxDuration = 300

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

function sentDigestThisWeek(logs: { type: string; sent_at: string }[]): boolean {
  const now = new Date()
  // Start of current week (Sunday)
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  return logs.some(l => l.type === 'digest' && new Date(l.sent_at) >= startOfWeek)
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const results = { processed: 0, skipped: 0, errors: [] as string[] }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('unsubscribed', false)

  if (!profiles?.length) return NextResponse.json(results)

  const userIds = profiles.map(p => p.id)

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const sevenDaysAgoIso = sevenDaysAgo.toISOString().split('T')[0]

  for (let i = 0; i < userIds.length; i += 10) {
    const batch = userIds.slice(i, i + 10)

    await Promise.allSettled(batch.map(async (userId) => {
      try {
        const { data: { user } } = await supabase.auth.admin.getUserById(userId)
        if (!user?.email) return

        // Check if already sent digest this week
        const { data: recentLogs } = await supabase
          .from('email_logs')
          .select('type, sent_at')
          .eq('user_id', userId)
          .eq('type', 'digest')
          .order('sent_at', { ascending: false })
          .limit(5)

        if (sentDigestThisWeek(recentLogs ?? [])) {
          results.skipped++
          return
        }

        // Fetch active goals
        const { data: goals } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')

        if (!goals?.length) {
          results.skipped++
          return
        }

        // Fetch check-ins in the last 7 days for all goals
        const goalIds = goals.map(g => g.id)

        const { data: recentCheckIns } = await supabase
          .from('check_ins')
          .select('goal_id, date')
          .in('goal_id', goalIds)
          .gte('date', sevenDaysAgoIso)

        const checkInsByGoal = (recentCheckIns ?? []).reduce<Record<string, number>>((acc, ci) => {
          acc[ci.goal_id] = (acc[ci.goal_id] ?? 0) + 1
          return acc
        }, {})

        // Build weekly stats per goal
        const weeklyStats = (goals as Goal[]).map(g => ({
          goalId: g.id,
          goalDescription: g.description,
          checkinsThisWeek: checkInsByGoal[g.id] ?? 0,
          streak: g.current_streak,
        }))

        // Generate digest email
        const { subject, html } = await generateDigest({
          userEmail: user.email,
          userId,
          goals: goals as Goal[],
          weeklyStats,
        })

        // Send
        await sendEmail({ to: user.email, subject, html })

        // Log
        await supabase.from('email_logs').insert({
          user_id: userId,
          goal_id: null,
          type: 'digest',
          subject,
        })

        results.processed++
        await delay(400)
      } catch (err) {
        results.errors.push(`User ${userId}: ${err instanceof Error ? err.message : 'error'}`)
      }
    }))

    if (i + 10 < userIds.length) await delay(1000)
  }

  return NextResponse.json(results)
}
