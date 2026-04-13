import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateEmail } from '@/lib/openai/generateEmail'
import { sendEmail } from '@/lib/email/sender'
import { shouldSendCoaching, shouldSendNewsletter } from '@/lib/email/rotation'
import type { Goal, CheckIn } from '@/types'

export const maxDuration = 300

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

function sentTypeToday(logs: { type: string; sent_at: string }[], type: string): boolean {
  const today = new Date().toISOString().split('T')[0]
  return logs.some(l => l.type === type && l.sent_at.startsWith(today))
}

function sentTypeForGoal(logs: { type: string; goal_id: string }[], type: string, goalId: string): boolean {
  return logs.some(l => l.type === type && l.goal_id === goalId)
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const results = { processed: 0, skipped: 0, errors: [] as string[] }
  const dow = new Date().getDay() // 0=Sun, 3=Wed

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('unsubscribed', false)

  if (!profiles?.length) return NextResponse.json(results)

  const userIds = profiles.map(p => p.id)

  for (let i = 0; i < userIds.length; i += 10) {
    const batch = userIds.slice(i, i + 10)

    await Promise.allSettled(batch.map(async (userId) => {
      try {
        const { data: { user } } = await supabase.auth.admin.getUserById(userId)
        if (!user?.email) return

        const { data: goals } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')

        if (!goals?.length) {
          // New user with no goals — check if welcome email needed
          const { data: logs } = await supabase
            .from('email_logs')
            .select('type')
            .eq('user_id', userId)
            .eq('type', 'welcome')
            .limit(1)

          if (!logs?.length) {
            const { subject, html } = await generateEmail({
              userEmail: user.email,
              goalDescription: 'your new goal',
              recentCheckIns: [],
              emailType: 'welcome',
              daysSinceStart: 0,
              currentStreak: 0,
              userId,
            })
            await sendEmail({ to: user.email, subject, html })
            await supabase.from('email_logs').insert({ user_id: userId, goal_id: null, type: 'welcome', subject })
            results.processed++
          }
          return
        }

        const { data: allLogs } = await supabase
          .from('email_logs')
          .select('type, goal_id, sent_at')
          .eq('user_id', userId)
          .order('sent_at', { ascending: false })
          .limit(100)

        const logs = allLogs ?? []
        const today = new Date().toISOString().split('T')[0]

        // 30-DAY POST-COMPLETION FOLLOW-UP
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()
        const { data: completedGoalEmails } = await supabase
          .from('email_logs')
          .select('goal_id, sent_at')
          .eq('user_id', userId)
          .eq('type', 'goal_completed')
          .lte('sent_at', thirtyDaysAgo)

        for (const completedLog of completedGoalEmails ?? []) {
          if (!completedLog.goal_id) continue
          const alreadySentFollowup = logs.some(
            l => l.type === 'goal_completed_followup' && l.goal_id === completedLog.goal_id
          )
          if (!alreadySentFollowup) {
            const { data: completedGoal } = await supabase
              .from('goals')
              .select('description')
              .eq('id', completedLog.goal_id)
              .single()

            if (completedGoal) {
              const { subject, html } = await generateEmail({
                userEmail: user.email,
                goalDescription: completedGoal.description,
                emailType: 'goal_completed_followup',
                recentCheckIns: [],
                daysSinceStart: 0,
                currentStreak: 0,
                userId,
              })
              await sendEmail({ to: user.email, subject, html })
              await supabase.from('email_logs').insert({
                user_id: userId,
                goal_id: completedLog.goal_id,
                type: 'goal_completed_followup',
                subject,
              })
              results.processed++
              await delay(400)
            }
          }
        }

        for (const goal of goals as Goal[]) {
          const { data: checkIns } = await supabase
            .from('check_ins')
            .select('*')
            .eq('goal_id', goal.id)
            .order('date', { ascending: false })
            .limit(7)

          const daysSinceStart = Math.floor(
            (Date.now() - new Date(goal.created_at).getTime()) / 86400000
          )

          const goalLogs = logs.filter(l => l.goal_id === goal.id)

          // 1. WELCOME EMAIL (first ever goal)
          if (!logs.some(l => l.type === 'welcome')) {
            const { subject, html } = await generateEmail({
              userEmail: user.email,
              goalDescription: goal.description,
              recentCheckIns: [],
              emailType: 'welcome',
              daysSinceStart: 0,
              currentStreak: 0,
              userId,
              goal: goal as Goal,
            })
            await sendEmail({ to: user.email, subject, html })
            await supabase.from('email_logs').insert({ user_id: userId, goal_id: goal.id, type: 'welcome', subject })
            results.processed++
            await delay(400)
            continue // don't send more emails on first day
          }

          // 2. COUNTDOWN EMAILS (only if goal has deadline)
          if (goal.deadline) {
            const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000)
            const totalDays = Math.ceil(
              (new Date(goal.deadline).getTime() - new Date(goal.created_at).getTime()) / 86400000
            )
            const halfPoint = Math.floor(totalDays / 2)

            if (!sentTypeForGoal(goalLogs, 'countdown_start', goal.id) && daysSinceStart === 0) {
              const { subject, html } = await generateEmail({ userEmail: user.email, goalDescription: goal.description, recentCheckIns: checkIns as CheckIn[] ?? [], emailType: 'countdown_start', daysSinceStart, currentStreak: goal.current_streak, userId, goal: goal as Goal })
              await sendEmail({ to: user.email, subject, html })
              await supabase.from('email_logs').insert({ user_id: userId, goal_id: goal.id, type: 'countdown_start', subject })
              results.processed++
              await delay(400)
              continue
            }

            if (!sentTypeForGoal(goalLogs, 'countdown_mid', goal.id) && daysSinceStart >= halfPoint) {
              const { subject, html } = await generateEmail({ userEmail: user.email, goalDescription: goal.description, recentCheckIns: checkIns as CheckIn[] ?? [], emailType: 'countdown_mid', daysSinceStart, currentStreak: goal.current_streak, userId, goal: goal as Goal })
              await sendEmail({ to: user.email, subject, html })
              await supabase.from('email_logs').insert({ user_id: userId, goal_id: goal.id, type: 'countdown_mid', subject })
              results.processed++
              await delay(400)
              continue
            }

            if (!sentTypeForGoal(goalLogs, 'countdown_end', goal.id) && daysLeft === 1) {
              const { subject, html } = await generateEmail({ userEmail: user.email, goalDescription: goal.description, recentCheckIns: checkIns as CheckIn[] ?? [], emailType: 'countdown_end', daysSinceStart, currentStreak: goal.current_streak, userId, goal: goal as Goal })
              await sendEmail({ to: user.email, subject, html })
              await supabase.from('email_logs').insert({ user_id: userId, goal_id: goal.id, type: 'countdown_end', subject })
              results.processed++
              await delay(400)
              continue
            }
          }

          // 3. DAILY REMINDER (if user hasn't checked in today)
          const checkedInToday = goal.last_checkin_date === today
          if (!checkedInToday && !sentTypeToday(goalLogs, 'reminder') && daysSinceStart >= 1) {
            const { subject, html } = await generateEmail({ userEmail: user.email, goalDescription: goal.description, recentCheckIns: checkIns as CheckIn[] ?? [], emailType: 'reminder', daysSinceStart, currentStreak: goal.current_streak, userId, goal: goal as Goal })
            await sendEmail({ to: user.email, subject, html })
            await supabase.from('email_logs').insert({ user_id: userId, goal_id: goal.id, type: 'reminder', subject })
            results.processed++
            await delay(400)
          }

          // 4. WEEKLY COACHING (Sundays)
          if (shouldSendCoaching(dow) && !sentTypeToday(goalLogs, 'coaching')) {
            const { subject, html } = await generateEmail({ userEmail: user.email, goalDescription: goal.description, recentCheckIns: checkIns as CheckIn[] ?? [], emailType: 'coaching', daysSinceStart, currentStreak: goal.current_streak, userId, goal: goal as Goal })
            await sendEmail({ to: user.email, subject, html })
            await supabase.from('email_logs').insert({ user_id: userId, goal_id: goal.id, type: 'coaching', subject })
            results.processed++
            await delay(400)
          }

          // 5. WEEKLY NEWSLETTER (Wednesdays, once per user not per goal)
          if (shouldSendNewsletter(dow) && !sentTypeToday(logs, 'newsletter')) {
            const { subject, html } = await generateEmail({ userEmail: user.email, goalDescription: goal.description, recentCheckIns: [], emailType: 'newsletter', daysSinceStart: 0, currentStreak: 0, userId })
            await sendEmail({ to: user.email, subject, html })
            await supabase.from('email_logs').insert({ user_id: userId, goal_id: goal.id, type: 'newsletter', subject })
            results.processed++
            await delay(400)
            break // newsletter is once per user, not per goal
          }
        }
      } catch (err) {
        results.errors.push(`User ${userId}: ${err instanceof Error ? err.message : 'error'}`)
      }
    }))

    if (i + 10 < userIds.length) await delay(1000)
  }

  return NextResponse.json(results)
}
