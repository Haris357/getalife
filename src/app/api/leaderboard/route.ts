import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = createAdminClient()

  // Top 20 by XP (all time)
  const { data: topXP } = await supabase
    .from('profiles')
    .select('id, xp, level, title, streak_shields')
    .order('xp', { ascending: false })
    .limit(20)

  // Weekly — users who checked in this week, ranked by total check-ins × max streak
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoStr = weekAgo.toISOString().split('T')[0]

  const { data: weeklyRaw } = await supabase
    .from('check_ins')
    .select('user_id, goal_id')
    .gte('date', weekAgoStr)

  // Count check-ins per user this week
  const weekCounts: Record<string, number> = {}
  for (const row of weeklyRaw ?? []) {
    weekCounts[row.user_id] = (weekCounts[row.user_id] ?? 0) + 1
  }

  // Get max streak for weekly users
  const weekUserIds = Object.keys(weekCounts)
  let weeklyGoals: { user_id: string; current_streak: number }[] = []
  if (weekUserIds.length > 0) {
    const { data } = await supabase
      .from('goals')
      .select('user_id, current_streak')
      .in('user_id', weekUserIds)
    weeklyGoals = (data ?? []) as typeof weeklyGoals
  }

  const maxStreakByUser: Record<string, number> = {}
  for (const g of weeklyGoals) {
    maxStreakByUser[g.user_id] = Math.max(maxStreakByUser[g.user_id] ?? 0, g.current_streak)
  }

  const weekly = Object.entries(weekCounts)
    .map(([userId, checkins]) => ({
      userId,
      checkins,
      streak: maxStreakByUser[userId] ?? 0,
      score: checkins * 10 + (maxStreakByUser[userId] ?? 0) * 2,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)

  // Fetch profile info for weekly users
  let weeklyProfiles: { id: string; xp: number; level: number; title: string }[] = []
  if (weekly.length > 0) {
    const { data } = await supabase
      .from('profiles')
      .select('id, xp, level, title')
      .in('id', weekly.map((w) => w.userId))
    weeklyProfiles = (data ?? []) as typeof weeklyProfiles
  }
  const profileMap = Object.fromEntries(weeklyProfiles.map((p) => [p.id, p]))

  const weeklyWithProfile = weekly.map((w) => ({
    ...w,
    level: profileMap[w.userId]?.level ?? 1,
    title: profileMap[w.userId]?.title ?? 'Starting Out',
  }))

  return NextResponse.json({ allTime: topXP ?? [], weekly: weeklyWithProfile })
}
