import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireUser } from '@/lib/utils/auth'
import { generateCheckinResponse } from '@/lib/openai/generateCheckinResponse'
import { analyzeCheckinPattern } from '@/lib/openai/analyzePattern'
import { generateGoalDNA } from '@/lib/openai/generateGoalDNA'
import { checkRateLimit } from '@/lib/utils/rateLimit'
import { calcXPGain, getLevelInfo } from '@/lib/game/xp'
import { getBadgesToAward } from '@/lib/game/badges'
import { notifyEmail } from '@/lib/email/notify'
import type { BadgeType } from '@/types'

async function notifyCoach(coacheeId: string, goalDesc: string) {
  try {
    const admin = createAdminClient()
    const { data: rel } = await admin
      .from('coach_relationships')
      .select('coach_id')
      .eq('coachee_id', coacheeId)
      .single()
    if (!rel?.coach_id) return
    await admin.from('notifications').insert({
      user_id: rel.coach_id,
      type: 'coachee_checkin',
      actor_name: `your coachee just checked in — "${goalDesc.slice(0, 60)}"`,
      read: false,
    })
  } catch {}
}

const schema = z.object({
  what_i_did: z.string().min(1).max(2000),
  commitment: z.string().min(1).max(1000),
  media_url: z.string().url().nullable().optional(),
  social_links: z.record(z.string()).nullable().optional(),
})

export async function POST(
  request: Request,
  { params }: { params: { goalId: string } }
) {
  const user = await requireUser()

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { allowed } = checkRateLimit({ key: `checkin:${user.id}`, limit: 20, windowMs: 60 * 60 * 1000 })
  if (!allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const supabase = await createClient()

  const [goalRes, profileRes] = await Promise.all([
    supabase.from('goals').select('id, description, current_streak, longest_streak, last_checkin_date, created_at').eq('id', params.goalId).eq('user_id', user.id).single(),
    supabase.from('profiles').select('xp, level, title, streak_shields, display_name').eq('id', user.id).single(),
  ])

  if (!goalRes.data) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
  const goal = goalRes.data
  const profile = profileRes.data ?? { xp: 0, level: 1, title: 'Starting Out', streak_shields: 0 }

  // ── Streak calculation with Shield support ──────────────────────
  const today = new Date().toISOString().split('T')[0]
  const lastDate = goal.last_checkin_date

  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
  const twoDaysAgo = new Date(); twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
  const yesterdayStr = yesterday.toISOString().split('T')[0]
  const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0]

  let newStreak = 1
  let shieldUsed = false
  let hadLongBreak = false
  let streakBroke = false

  if (lastDate) {
    if (lastDate === yesterdayStr) {
      newStreak = (goal.current_streak ?? 0) + 1
    } else if (lastDate === today) {
      newStreak = goal.current_streak ?? 1
    } else if (lastDate === twoDaysAgoStr && (profile.streak_shields ?? 0) > 0) {
      // Missed exactly 1 day — use a shield
      newStreak = (goal.current_streak ?? 0) + 1
      shieldUsed = true
    } else {
      // Streak broke — check if it was a long break
      if (lastDate && lastDate < twoDaysAgoStr && (goal.current_streak ?? 0) >= 3) {
        hadLongBreak = true
      }
      // Mark streak as broken if the previous streak was > 0
      if ((goal.current_streak ?? 0) > 0) {
        streakBroke = true
      }
      newStreak = 1
    }
  }

  // ── XP calculation ──────────────────────────────────────────────
  const xpGain = calcXPGain({
    streak: newStreak,
    hasMedia: !!parsed.data.media_url,
    hasSocialLinks: !!(parsed.data.social_links && Object.keys(parsed.data.social_links).length > 0),
  })

  const newXP = (profile.xp ?? 0) + xpGain.total
  const { level: newLevel, title: newTitle } = getLevelInfo(newXP)
  const leveledUp = newLevel > (profile.level ?? 1)

  // ── Shields — earn one every 7-day milestone ─────────────────────
  const shieldEarned = newStreak > 0 && newStreak % 7 === 0
  const newShields = Math.max(0, (profile.streak_shields ?? 0) - (shieldUsed ? 1 : 0)) + (shieldEarned ? 1 : 0)

  // ── Badges ──────────────────────────────────────────────────────
  // Check media check-in count
  const { count: mediaCount } = await supabase
    .from('check_ins')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .not('media_url', 'is', null)

  const { count: totalCheckins } = await supabase
    .from('check_ins')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Count goal-specific check-ins (for pattern analysis trigger)
  const { count: goalCheckinCount } = await supabase
    .from('check_ins')
    .select('id', { count: 'exact', head: true })
    .eq('goal_id', params.goalId)
    .eq('user_id', user.id)

  const badgesToAward = getBadgesToAward({
    isFirstCheckin: (totalCheckins ?? 0) === 0,
    streak: newStreak,
    hadLongBreak,
    mediaCheckinCount: (mediaCount ?? 0) + (parsed.data.media_url ? 1 : 0),
  })

  // Filter out already-earned badges
  const { data: existingBadges } = await supabase
    .from('achievements')
    .select('type')
    .eq('user_id', user.id)

  const earned = new Set((existingBadges ?? []).map((b) => b.type))
  const newBadges = badgesToAward.filter((b) => !earned.has(b))

  // ── Generate AI response ────────────────────────────────────────
  const ai_response = await generateCheckinResponse({
    goalDescription: goal.description,
    whatIDid: parsed.data.what_i_did,
    commitment: parsed.data.commitment,
    streak: newStreak,
  })

  // ── Persist everything ──────────────────────────────────────────
  const [ciResult] = await Promise.all([
    supabase.from('check_ins').upsert({
      goal_id: params.goalId,
      user_id: user.id,
      date: today,
      what_i_did: parsed.data.what_i_did,
      commitment: parsed.data.commitment,
      ai_response,
      media_url: parsed.data.media_url ?? null,
      social_links: parsed.data.social_links ?? null,
    }, { onConflict: 'goal_id,date' }).select().single(),

    supabase.from('goals').update({
      current_streak: newStreak,
      longest_streak: Math.max(newStreak, goal.longest_streak ?? 0),
      last_checkin_date: today,
    }).eq('id', params.goalId),

    supabase.from('profiles').update({
      xp: newXP,
      level: newLevel,
      title: newTitle,
      streak_shields: newShields,
    }).eq('id', user.id),

    ...(newBadges.length > 0 ? [
      supabase.from('achievements').insert(
        newBadges.map((type) => ({ user_id: user.id, type }))
      )
    ] : []),
  ])

  const checkIn = ciResult.data

  // ── Checkin notification email ──────────────────────────────────
  notifyEmail({
    userId: user.id,
    emailType: 'checkin_done',
    goalId: params.goalId,
    goalDescription: goal.description,
    currentStreak: newStreak,
    checkinWhatIDid: parsed.data.what_i_did,
  })

  // ── Community auto-posts for milestones ─────────────────────────
  const milestonePosts: { title: string; body: string }[] = []

  if (shieldEarned) {
    milestonePosts.push({
      title: `${newStreak}-day streak achieved 🔥`,
      body: `Just hit a ${newStreak}-day streak on my goal: "${goal.description.slice(0, 100)}${goal.description.length > 100 ? '...' : ''}"`,
    })
  } else if (newStreak === 30) {
    milestonePosts.push({
      title: '30 days straight. One month.',
      body: `Been working on "${goal.description.slice(0, 100)}${goal.description.length > 100 ? '...' : ''}" for 30 consecutive days.`,
    })
  } else if (newStreak === 100) {
    milestonePosts.push({
      title: '100 days. This is who I am now.',
      body: `"${goal.description.slice(0, 100)}${goal.description.length > 100 ? '...' : ''}" — 100 day streak.`,
    })
  }

  if (newBadges.length > 0) {
    const badgeNames: Partial<Record<string, string>> = {
      first_checkin: 'First Check-In', week_warrior: 'Week Warrior', fortnight: 'Fortnight',
      month_strong: 'Month Strong', iron_will: 'Iron Will', century: 'Century',
      goal_crusher: 'Goal Crusher', comeback_kid: 'Comeback Kid', show_off: 'Show Off', storyteller: 'Storyteller',
    }
    for (const badge of newBadges) {
      milestonePosts.push({
        title: `Earned the "${badgeNames[badge] ?? badge}" badge`,
        body: `New achievement unlocked on my accountability journey.`,
      })
    }
  }

  if (milestonePosts.length > 0) {
    await Promise.all(
      milestonePosts.map(({ title, body }) =>
        supabase.from('posts').insert({
          user_id: user.id,
          title,
          body,
          type: 'milestone',
          goal_id: params.goalId,
        })
      )
    )
  }

  // ── Streak Recovery Challenges ──────────────────────────────────
  const admin = createAdminClient()

  if (streakBroke) {
    // Start a new recovery challenge (fire-and-forget)
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + 3)
    Promise.resolve(
      admin.from('recovery_challenges').insert({
        user_id: user.id,
        goal_id: params.goalId,
        started_at: new Date().toISOString(),
        target_date: targetDate.toISOString(),
        checkins_done: 1,
      })
    ).catch(() => {/* ignore */})
  } else if (!streakBroke && lastDate !== today) {
    // Not a new streak break — check if there's an active recovery challenge to update
    Promise.resolve(
      admin
        .from('recovery_challenges')
        .select('id, checkins_done')
        .eq('user_id', user.id)
        .eq('goal_id', params.goalId)
        .eq('completed', false)
        .eq('failed', false)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    ).then(async ({ data: activeChallenge }) => {
      if (!activeChallenge) return
      const newCheckinsDone = (activeChallenge.checkins_done ?? 0) + 1
      if (newCheckinsDone >= 3) {
        // Challenge complete!
        await Promise.all([
          Promise.resolve(
            admin
              .from('recovery_challenges')
              .update({ checkins_done: newCheckinsDone, completed: true })
              .eq('id', activeChallenge.id)
          ),
          Promise.resolve(
            admin.from('notifications').insert({
              user_id: user.id,
              type: 'recovery_complete',
              actor_name: 'you crushed the comeback — 3-day recovery streak complete!',
            })
          ),
        ])
      } else {
        await Promise.resolve(
          admin
            .from('recovery_challenges')
            .update({ checkins_done: newCheckinsDone })
            .eq('id', activeChallenge.id)
        )
      }
    }).catch(() => {/* ignore */})
  }

  // ── AI Pattern Analysis (every 7th goal check-in) ──────────────
  const newGoalCheckinCount = (goalCheckinCount ?? 0) + 1
  if (newGoalCheckinCount % 7 === 0) {
    analyzeCheckinPattern(user.id, params.goalId, goal.description)
      .catch(() => {/* fire-and-forget — ignore errors */})
  }

  // ── Goal DNA (at 20 total check-ins, then every 50 after) ───────
  const newTotalCheckins = (totalCheckins ?? 0) + 1
  if (newTotalCheckins === 20 || (newTotalCheckins > 20 && (newTotalCheckins - 20) % 50 === 0)) {
    void generateGoalDNA(user.id)
  }

  // ── Notify coach (fire-and-forget) ─────────────────────────────
  void notifyCoach(user.id, goal.description)

  // ── Milestone celebrations + activity feed (fire-and-forget) ────
  void (async () => {
    try {
      const MILESTONE_STREAKS = [7, 14, 21, 30, 60, 100]
      const goalCreatedAt = new Date((goal as { created_at: string }).created_at)
      const daysSinceStart = Math.floor((Date.now() - goalCreatedAt.getTime()) / (1000 * 60 * 60 * 24))
      const displayName = (profile as { display_name?: string | null }).display_name ?? null
      const goalSnippet = goal.description.slice(0, 80)

      // Always insert a checkin row into activity_feed
      admin.from('activity_feed').insert({
        user_id: user.id,
        type: 'checkin',
        goal_id: params.goalId,
        display_name: displayName,
        goal_snippet: goalSnippet,
        streak: newStreak,
        day_number: daysSinceStart + 1,
        is_anonymous: false,
      }).then(() => {}).catch(() => {})

      // Milestone logic
      if (MILESTONE_STREAKS.includes(newStreak)) {
        const milestoneType = `${newStreak}_day`
        const { data: existing } = await admin
          .from('milestones')
          .select('id')
          .eq('user_id', user.id)
          .eq('goal_id', params.goalId)
          .eq('type', milestoneType)
          .maybeSingle()

        if (!existing) {
          // Insert milestone record
          admin.from('milestones').insert({
            user_id: user.id,
            goal_id: params.goalId,
            type: milestoneType,
            streak_count: newStreak,
          }).then(() => {}).catch(() => {})

          // Milestone notification
          admin.from('notifications').insert({
            user_id: user.id,
            type: `milestone_${newStreak}`,
            actor_name: `${newStreak}-day milestone reached — incredible consistency!`,
            read: false,
          }).then(() => {}).catch(() => {})

          // Milestone activity_feed row
          admin.from('activity_feed').insert({
            user_id: user.id,
            type: 'milestone',
            goal_id: params.goalId,
            display_name: displayName,
            goal_snippet: goalSnippet,
            streak: newStreak,
            day_number: daysSinceStart + 1,
            is_anonymous: false,
          }).then(() => {}).catch(() => {})
        }
      }
    } catch {/* fire-and-forget — ignore errors */}
  })()

  return NextResponse.json({
    checkIn,
    streak: newStreak,
    xpGain,
    newXP,
    leveledUp,
    newLevel,
    newTitle,
    shieldUsed,
    shieldEarned,
    newShields,
    newBadges: newBadges as BadgeType[],
  })
}
