export const dynamic = 'force-dynamic'

import Link from 'next/link'
import dynamicImport from 'next/dynamic'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import { requireUser } from '@/lib/utils/auth'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import GoalInput from '@/components/goals/GoalInput'
import WeeklySummary from '@/components/goals/WeeklySummary'
import XPBar from '@/components/game/XPBar'
import PauseGoalButton from './goal/[goalId]/PauseGoalButton'
import RealtimeRefresher from '@/components/shared/RealtimeRefresher'
import type { Goal, Profile } from '@/types'

const DailyMission = dynamicImport(
  () => import('@/components/goals/DailyMission'),
  { ssr: false }
)

const CATEGORY_EMOJI: Record<string, string> = {
  fitness: '💪',
  learning: '📚',
  career: '💼',
  health: '🏥',
  creative: '🎨',
  finance: '💰',
  relationships: '❤️',
  mindset: '🧠',
  other: '🎯',
}

const QUICK_LINKS = [
  { href: '/community', label: 'community feed', emoji: '👥' },
  { href: '/community/challenges', label: 'challenges', emoji: '⚡' },
  { href: '/dashboard/buddies', label: 'goal buddies', emoji: '🤝' },
  { href: '/dashboard/pods', label: 'accountability pods', emoji: '🫙' },
  { href: '/leaderboard', label: 'leaderboard', emoji: '🏆' },
  { href: '/goals', label: 'goals board', emoji: '🌐' },
]

export default async function DashboardPage() {
  const user = await requireUser()
  const supabase = await createClient()

  const [{ data: goalsData }, { data: profileData }] = await Promise.all([
    supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'paused'])
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('xp, level, title, streak_shields, display_name')
      .eq('id', user.id)
      .single(),
  ])

  const allGoals = (goalsData ?? []) as Goal[]
  const goals = allGoals.filter(g => g.status === 'active')
  const pausedGoals = allGoals.filter(g => g.status === 'paused')
  const profile = profileData as Pick<
    Profile,
    'xp' | 'level' | 'title' | 'streak_shields' | 'display_name'
  > | null

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const hour = today.getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateLabel = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const topStreak = allGoals.reduce(
    (best, g) => Math.max(best, g.current_streak ?? 0),
    0
  )
  const checkedInCount = goals.filter(
    g => g.last_checkin_date === todayStr
  ).length
  const pendingCount = goals.length - checkedInCount
  const allDoneToday = goals.length > 0 && pendingCount === 0

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.body' }}>
      <RealtimeRefresher table="goals" filter={`user_id=eq.${user.id}`} />
      <RealtimeRefresher table="profiles" filter={`id=eq.${user.id}`} />
      <Header email={user.email ?? undefined} userId={user.id} />

      {/* ══ Hero banner ══════════════════════════════════════════════ */}
      <Box
        sx={{
          background:
            'linear-gradient(160deg, rgba(14,165,233,0.07) 0%, rgba(249,115,22,0.04) 60%, transparent 100%)',
          '[data-joy-color-scheme="light"] &': {
            background:
              'linear-gradient(160deg, rgba(14,165,233,0.05) 0%, rgba(249,115,22,0.03) 60%, transparent 100%)',
          },
          borderBottom: '1px solid',
          borderColor: 'divider',
          px: { xs: 3, md: 6 },
          pt: { xs: 4, md: 5 },
          pb: { xs: 3, md: 4 },
        }}
      >
        <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
          {/* Greeting */}
          <Box sx={{ mb: 4 }}>
            <Typography
              sx={{
                fontSize: '0.7rem',
                color: 'text.tertiary',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                opacity: 0.45,
                mb: 0.75,
              }}
            >
              {dateLabel}
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1.7rem', md: '2.25rem' },
                fontWeight: 700,
                letterSpacing: '-0.04em',
                lineHeight: 1.15,
                color: 'text.primary',
              }}
            >
              {greeting}
              {profile?.display_name ? (
                <>
                  {', '}
                  <Box
                    component="span"
                    sx={{
                      background:
                        'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {profile.display_name}
                  </Box>
                  .
                </>
              ) : (
                '.'
              )}
            </Typography>
          </Box>

          {/* 4-stat row */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(4, 1fr)',
              },
              gap: { xs: 1.5, md: 2 },
            }}
          >
            <StatCard
              value={topStreak > 0 ? `${topStreak}d` : '—'}
              label="best streak"
              accent={topStreak >= 7}
              suffix={topStreak >= 7 ? ' 🔥' : ''}
            />
            <StatCard
              value={`Lv ${profile?.level ?? 1}`}
              label={profile?.title ?? 'newcomer'}
            />
            <StatCard
              value={(profile?.xp ?? 0).toLocaleString()}
              label="total XP"
            />
            <StatCard
              value={
                allDoneToday
                  ? '✓ all done'
                  : goals.length === 0
                  ? '—'
                  : `${pendingCount} left`
              }
              label="today's check-ins"
              green={allDoneToday}
            />
          </Box>
        </Box>
      </Box>

      {/* ══ Main content ═════════════════════════════════════════════ */}
      <Box
        sx={{
          maxWidth: 1100,
          mx: 'auto',
          px: { xs: 3, md: 6 },
          py: { xs: 4, md: 5 },
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 300px' },
            gap: { xs: 4, lg: 5 },
            alignItems: 'start',
          }}
        >
          {/* ── Left: Goals ─────────────────────────────────── */}
          <Box>
            {/* No active goals — show goal input */}
            {goals.length === 0 && (
              <Box sx={{ mb: pausedGoals.length > 0 ? 5 : 0 }}>
                {/* Big empty state only when truly nothing exists */}
                {pausedGoals.length === 0 ? (
                  <Box
                    sx={{
                      textAlign: 'center',
                      py: { xs: 7, md: 10 },
                      px: { xs: 3, md: 6 },
                      border: '1px dashed',
                      borderColor: 'divider',
                      borderRadius: 20,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: { xs: '1.8rem', md: '2.5rem' },
                        fontWeight: 700,
                        letterSpacing: '-0.04em',
                        background:
                          'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        mb: 1.5,
                      }}
                    >
                      what's your goal?
                    </Typography>
                    <Typography
                      sx={{
                        color: 'text.tertiary',
                        opacity: 0.5,
                        fontSize: '0.9rem',
                        mb: 5,
                        lineHeight: 1.65,
                        maxWidth: 420,
                        mx: 'auto',
                      }}
                    >
                      write it down — we'll build your roadmap and keep you
                      accountable every single day.
                    </Typography>
                    <GoalInput hasActiveGoal={false} />
                  </Box>
                ) : (
                  /* Has paused goals but no active goal — show compact input */
                  <Box>
                    <Typography
                      sx={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: 'text.tertiary',
                        opacity: 0.45,
                        mb: 2.5,
                      }}
                    >
                      start a new goal
                    </Typography>
                    <GoalInput hasActiveGoal={false} />
                  </Box>
                )}
              </Box>
            )}

            {/* Active goals */}
            {goals.length > 0 && (
              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 3,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'text.tertiary',
                      opacity: 0.45,
                    }}
                  >
                    active goals · {goals.length}
                  </Typography>
                  {allDoneToday && (
                    <Box
                      sx={{
                        px: 1.5,
                        py: 0.4,
                        borderRadius: 20,
                        bgcolor: 'success.softBg',
                        border: '1px solid',
                        borderColor: 'success.300',
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '0.68rem',
                          color: 'success.700',
                          fontWeight: 600,
                        }}
                      >
                        ✓ all checked in
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {goals.map(goal => {
                    const done = goal.last_checkin_date === todayStr
                    const streak = goal.current_streak ?? 0
                    const daysSince = Math.floor(
                      (Date.now() - new Date(goal.created_at).getTime()) /
                        86400000
                    )
                    const dayNumber = daysSince + 1
                    const emoji =
                      CATEGORY_EMOJI[goal.category ?? 'other'] ?? '🎯'

                    let daysLeft: number | null = null
                    let progressPct = 0
                    if (goal.deadline) {
                      const deadlineMs = new Date(goal.deadline).getTime()
                      const startMs = new Date(goal.created_at).getTime()
                      daysLeft = Math.max(
                        0,
                        Math.ceil((deadlineMs - Date.now()) / 86400000)
                      )
                      const totalDays = Math.ceil(
                        (deadlineMs - startMs) / 86400000
                      )
                      progressPct =
                        totalDays > 0
                          ? Math.min(
                              100,
                              Math.round((daysSince / totalDays) * 100)
                            )
                          : 0
                    }

                    return (
                      <Box key={goal.id}>
                        {/* Goal card */}
                        <Box
                          sx={{
                            bgcolor: 'background.surface',
                            border: '1px solid',
                            borderColor: done ? 'success.300' : 'divider',
                            borderRadius: 16,
                            overflow: 'hidden',
                            transition:
                              'border-color 0.2s, box-shadow 0.2s, transform 0.18s',
                            '&:hover': {
                              borderColor: done
                                ? 'success.400'
                                : 'neutral.outlinedHoverBorder',
                              boxShadow: '0 6px 28px rgba(0,0,0,0.08)',
                              transform: 'translateY(-2px)',
                            },
                            '[data-joy-color-scheme="dark"] &:hover': {
                              boxShadow: '0 6px 28px rgba(0,0,0,0.3)',
                            },
                          }}
                        >
                          {/* Top colour bar */}
                          <Box
                            sx={{
                              height: 3,
                              background: done
                                ? 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)'
                                : 'linear-gradient(90deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                            }}
                          />

                          {/* Header row */}
                          <Box
                            sx={{
                              px: 3,
                              pt: 2.5,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              <Typography
                                sx={{ fontSize: '1rem', lineHeight: 1 }}
                              >
                                {emoji}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: '0.68rem',
                                  color: 'text.tertiary',
                                  opacity: 0.45,
                                  textTransform: 'capitalize',
                                  fontWeight: 500,
                                }}
                              >
                                {goal.category ?? 'goal'}
                              </Typography>
                            </Box>
                            <Typography
                              sx={{
                                fontSize: '0.68rem',
                                color: 'text.tertiary',
                                opacity: 0.35,
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              day {dayNumber}
                            </Typography>
                          </Box>

                          {/* Description */}
                          <Link
                            href={`/dashboard/goal/${goal.id}`}
                            style={{ textDecoration: 'none' }}
                          >
                            <Box sx={{ px: 3, pt: 1.25 }}>
                              <Typography
                                sx={{
                                  fontSize: '0.97rem',
                                  color: 'text.primary',
                                  lineHeight: 1.6,
                                  fontWeight: 500,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  cursor: 'pointer',
                                  transition: 'color 0.15s',
                                  '&:hover': { color: 'primary.500' },
                                }}
                              >
                                {goal.description}
                              </Typography>
                            </Box>
                          </Link>

                          {/* Progress bar */}
                          {goal.deadline && (
                            <Box sx={{ px: 3, pt: 2 }}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  mb: 0.85,
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontSize: '0.67rem',
                                    color: 'text.tertiary',
                                    opacity: 0.38,
                                  }}
                                >
                                  {progressPct}% complete
                                </Typography>
                                <Typography
                                  sx={{
                                    fontSize: '0.67rem',
                                    color: 'text.tertiary',
                                    opacity: 0.38,
                                  }}
                                >
                                  {daysLeft}d remaining
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  height: 4,
                                  bgcolor: 'rgba(0,0,0,0.06)',
                                  '[data-joy-color-scheme="dark"] &': {
                                    bgcolor: 'rgba(255,255,255,0.06)',
                                  },
                                  borderRadius: 4,
                                  overflow: 'hidden',
                                }}
                              >
                                <Box
                                  sx={{
                                    width: `${progressPct}%`,
                                    height: '100%',
                                    background:
                                      'linear-gradient(90deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                                    borderRadius: 4,
                                    transition: 'width 0.6s ease',
                                  }}
                                />
                              </Box>
                            </Box>
                          )}

                          {/* Footer: streak + CTA */}
                          <Box
                            sx={{
                              px: 3,
                              pt: 2,
                              pb: 2.5,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: 1.5,
                            }}
                          >
                            {/* Streak badge */}
                            {streak > 0 ? (
                              <Box
                                sx={{
                                  px: 1.5,
                                  py: 0.45,
                                  borderRadius: 20,
                                  background:
                                    streak >= 7
                                      ? 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)'
                                      : 'transparent',
                                  border: streak >= 7 ? 'none' : '1px solid',
                                  borderColor: 'divider',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    color:
                                      streak >= 7 ? '#fff' : 'text.tertiary',
                                  }}
                                >
                                  {streak >= 7 ? '🔥 ' : ''}
                                  {streak}d streak
                                </Typography>
                              </Box>
                            ) : (
                              <Typography
                                sx={{
                                  fontSize: '0.72rem',
                                  color: 'text.tertiary',
                                  opacity: 0.32,
                                }}
                              >
                                start your streak today
                              </Typography>
                            )}

                            {/* Check-in button */}
                            {done ? (
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.75,
                                  px: 1.75,
                                  py: 0.55,
                                  borderRadius: 20,
                                  bgcolor: 'success.softBg',
                                  border: '1px solid',
                                  borderColor: 'success.300',
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontSize: '0.78rem',
                                    color: 'success.700',
                                    fontWeight: 700,
                                  }}
                                >
                                  ✓ done today
                                </Typography>
                              </Box>
                            ) : (
                              <Link
                                href={`/dashboard/goal/${goal.id}/checkin`}
                                style={{ textDecoration: 'none' }}
                              >
                                <Box
                                  sx={{
                                    px: 2.25,
                                    py: 0.7,
                                    borderRadius: 20,
                                    background:
                                      'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    transition:
                                      'opacity 0.15s, transform 0.15s',
                                    '&:hover': {
                                      opacity: 0.88,
                                      transform: 'translateY(-1px)',
                                    },
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      color: '#fff',
                                      fontSize: '0.8rem',
                                      fontWeight: 700,
                                    }}
                                  >
                                    check in today →
                                  </Typography>
                                </Box>
                              </Link>
                            )}
                          </Box>
                        </Box>

                        {/* Daily mission */}
                        <DailyMission
                          goalId={goal.id}
                          goalDescription={goal.description}
                        />
                      </Box>
                    )
                  })}
                </Box>
              </Box>
            )}

            {/* Paused goals */}
            {pausedGoals.length > 0 && (
              <Box sx={{ mt: goals.length > 0 ? 5 : 0 }}>
                <Typography
                  sx={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'text.tertiary',
                    opacity: 0.38,
                    mb: 2.5,
                  }}
                >
                  paused · {pausedGoals.length}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                  }}
                >
                  {pausedGoals.map(goal => (
                    <Box
                      key={goal.id}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 14,
                        overflow: 'hidden',
                        display: 'flex',
                        opacity: 0.55,
                        transition: 'opacity 0.15s',
                        '&:hover': { opacity: 0.85 },
                      }}
                    >
                      <Box
                        sx={{
                          width: 3,
                          flexShrink: 0,
                          bgcolor: 'neutral.300',
                        }}
                      />
                      <Box
                        sx={{
                          flex: 1,
                          px: 3,
                          py: 2.25,
                          bgcolor: 'background.surface',
                        }}
                      >
                        <Typography
                          sx={{
                            color: 'text.secondary',
                            mb: 2,
                            lineHeight: 1.55,
                            fontSize: '0.88rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {goal.description}
                        </Typography>
                        <PauseGoalButton goalId={goal.id} status="paused" />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          {/* ── Right sidebar ──────────────────────────────── */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* XP / Level */}
            {profile && (
              <SidebarCard>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    mb: 2.5,
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontSize: '0.62rem',
                        color: 'text.tertiary',
                        opacity: 0.4,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        mb: 0.5,
                      }}
                    >
                      rank
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                        background:
                          'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      {profile.title}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography
                      sx={{
                        fontSize: '0.62rem',
                        color: 'text.tertiary',
                        opacity: 0.4,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        mb: 0.5,
                      }}
                    >
                      level
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '1.6rem',
                        fontWeight: 700,
                        letterSpacing: '-0.05em',
                        lineHeight: 1,
                        background:
                          'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      {profile.level}
                    </Typography>
                  </Box>
                </Box>

                <XPBar xp={profile.xp} level={profile.level} title={profile.title} />

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mt: 2,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.68rem',
                      color: 'text.tertiary',
                      opacity: 0.35,
                    }}
                  >
                    {profile.xp.toLocaleString()} XP
                    {(profile.streak_shields ?? 0) > 0 &&
                      ` · ${profile.streak_shields}🛡️`}
                  </Typography>
                  <Link href="/dashboard/profile" style={{ textDecoration: 'none' }}>
                    <Typography
                      sx={{
                        fontSize: '0.7rem',
                        color: 'text.tertiary',
                        opacity: 0.32,
                        transition: 'opacity 0.15s',
                        '&:hover': { opacity: 0.72 },
                      }}
                    >
                      full profile →
                    </Typography>
                  </Link>
                </Box>
              </SidebarCard>
            )}


            {/* Explore / quick links */}
            <SidebarCard>
              <Typography
                sx={{
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'text.tertiary',
                  opacity: 0.4,
                  mb: 1.75,
                }}
              >
                explore
              </Typography>
              <Box
                sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}
              >
                {QUICK_LINKS.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    style={{ textDecoration: 'none' }}
                  >
                    <Box
                      sx={{
                        px: 1.25,
                        py: 0.95,
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        transition: 'background 0.15s',
                        '&:hover': {
                          bgcolor: 'rgba(0,0,0,0.04)',
                        },
                        '[data-joy-color-scheme="dark"] &:hover': {
                          bgcolor: 'rgba(255,255,255,0.05)',
                        },
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '0.9rem',
                          lineHeight: 1,
                          width: 20,
                          textAlign: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {link.emoji}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '0.82rem',
                          color: 'text.secondary',
                        }}
                      >
                        {link.label}
                      </Typography>
                    </Box>
                  </Link>
                ))}
              </Box>
            </SidebarCard>

            {/* Weekly summary */}
            {profile && goals.length > 0 && (
              <WeeklySummary userId={user.id} />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

/* ── Shared sub-components ──────────────────────────────────────── */

function StatCard({
  value,
  label,
  accent,
  green,
  suffix,
}: {
  value: string
  label: string
  accent?: boolean
  green?: boolean
  suffix?: string
}) {
  return (
    <Box
      sx={{
        bgcolor: 'background.surface',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 14,
        px: 2.25,
        py: 2,
        transition: 'border-color 0.15s, box-shadow 0.15s',
        '&:hover': {
          borderColor: 'neutral.outlinedHoverBorder',
          boxShadow: '0 2px 14px rgba(0,0,0,0.06)',
        },
      }}
    >
      <Typography
        sx={{
          fontSize: { xs: '1.25rem', md: '1.5rem' },
          fontWeight: 700,
          letterSpacing: '-0.04em',
          lineHeight: 1.1,
          mb: 0.5,
          ...(accent && !green
            ? {
                background:
                  'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }
            : {}),
          color: green ? 'success.600' : !accent ? 'text.primary' : undefined,
        }}
      >
        {value}
        {suffix}
      </Typography>
      <Typography
        sx={{
          fontSize: '0.65rem',
          color: 'text.tertiary',
          opacity: 0.42,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 500,
        }}
      >
        {label}
      </Typography>
    </Box>
  )
}

function SidebarCard({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        bgcolor: 'background.surface',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 16,
        p: 2.5,
        transition: 'border-color 0.15s',
        '&:hover': { borderColor: 'neutral.outlinedHoverBorder' },
      }}
    >
      {children}
    </Box>
  )
}
