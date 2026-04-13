import { Metadata } from 'next'
import Link from 'next/link'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Header from '@/components/layout/Header'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Leaderboard — Get A Life',
  description: 'Top performers building real momentum.',
}

async function getLeaderboard() {
  const supabase = createAdminClient()

  // All-time top 20 by XP
  const { data: topXP } = await supabase
    .from('profiles')
    .select('id, xp, level, title, streak_shields')
    .order('xp', { ascending: false })
    .limit(20)

  // Weekly: check-ins in past 7 days
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoStr = weekAgo.toISOString().split('T')[0]

  const { data: weeklyRaw } = await supabase
    .from('check_ins')
    .select('user_id')
    .gte('date', weekAgoStr)

  const weekCounts: Record<string, number> = {}
  for (const row of weeklyRaw ?? []) {
    weekCounts[row.user_id] = (weekCounts[row.user_id] ?? 0) + 1
  }

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

  return { allTime: topXP ?? [], weekly: weeklyWithProfile }
}

// ─── podium config ────────────────────────────────────────────────────────────

const PODIUM = {
  1: {
    medal: '🥇',
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(245,158,11,0.06))',
    border: 'rgba(245,158,11,0.45)',
    accent: '#f59e0b',
    order: 2,
    scale: true,
  },
  2: {
    medal: '🥈',
    gradient: 'linear-gradient(135deg, rgba(148,163,184,0.18), rgba(148,163,184,0.06))',
    border: 'rgba(148,163,184,0.45)',
    accent: '#94a3b8',
    order: 1,
    scale: false,
  },
  3: {
    medal: '🥉',
    gradient: 'linear-gradient(135deg, rgba(180,83,9,0.18), rgba(180,83,9,0.06))',
    border: 'rgba(180,83,9,0.45)',
    accent: '#b45309',
    order: 3,
    scale: false,
  },
} as const

// ─── podium card ──────────────────────────────────────────────────────────────

function PodiumCard({
  rank,
  level,
  title,
  metric,
  metricLabel,
  isCurrentUser,
}: {
  rank: 1 | 2 | 3
  level: number
  title: string
  metric: string
  metricLabel: string
  isCurrentUser: boolean
}) {
  const p = PODIUM[rank]
  return (
    <Box
      sx={{
        order: p.order,
        flex: 1,
        minWidth: { xs: '100%', sm: 0 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        p: rank === 1 ? 2.5 : 2,
        background: p.gradient,
        border: `2px solid ${p.border}`,
        borderRadius: '18px',
        position: 'relative',
        transform: rank === 1 ? { xs: 'none', sm: 'translateY(-12px)' } : 'none',
        boxShadow: rank === 1
          ? `0 8px 32px rgba(245,158,11,0.18)`
          : rank === 2
          ? `0 4px 16px rgba(148,163,184,0.12)`
          : `0 4px 16px rgba(180,83,9,0.10)`,
        outline: isCurrentUser ? '2px solid rgb(14,165,233)' : 'none',
        outlineOffset: 3,
      }}
    >
      {/* medal */}
      <Typography sx={{ fontSize: rank === 1 ? '2rem' : '1.6rem', lineHeight: 1, mb: 0.25 }}>
        {p.medal}
      </Typography>

      {/* level circle */}
      <Box
        sx={{
          width: rank === 1 ? 52 : 44,
          height: rank === 1 ? 52 : 44,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Typography sx={{ color: 'white', fontWeight: 700, fontSize: rank === 1 ? '1.1rem' : '0.95rem', lineHeight: 1 }}>
          {level}
        </Typography>
      </Box>

      {/* title */}
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: rank === 1 ? '0.82rem' : '0.75rem',
          color: p.accent,
          textAlign: 'center',
          lineHeight: 1.3,
          mt: 0.25,
          maxWidth: 120,
          wordBreak: 'break-word',
        }}
      >
        {title}
      </Typography>

      {/* metric */}
      <Box sx={{ mt: 'auto', pt: 0.5, textAlign: 'center' }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: rank === 1 ? '1.15rem' : '1rem',
            background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1.1,
          }}
        >
          {metric}
        </Typography>
        <Typography sx={{ fontSize: '0.62rem', color: 'text.tertiary', fontWeight: 600, opacity: 0.5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {metricLabel}
        </Typography>
      </Box>

      {/* "you" badge */}
      {isCurrentUser && (
        <Box
          sx={{
            position: 'absolute',
            top: -10,
            right: 10,
            bgcolor: 'rgb(14,165,233)',
            borderRadius: '20px',
            px: 1,
            py: 0.25,
          }}
        >
          <Typography sx={{ color: 'white', fontSize: '0.6rem', fontWeight: 700 }}>you</Typography>
        </Box>
      )}
    </Box>
  )
}

// ─── list row (ranks 4–20) ────────────────────────────────────────────────────

function ListRow({
  rank,
  level,
  title,
  metric,
  metricLabel,
  isEven,
  isCurrentUser,
}: {
  rank: number
  level: number
  title: string
  metric: string
  metricLabel: string
  isEven: boolean
  isCurrentUser: boolean
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: 2.5,
        py: 1.4,
        bgcolor: isCurrentUser
          ? 'rgba(14,165,233,0.07)'
          : isEven
          ? 'rgba(255,255,255,0.025)'
          : 'transparent',
        borderLeft: isCurrentUser ? '3px solid rgb(14,165,233)' : '3px solid transparent',
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:last-child': { borderBottom: 'none' },
        transition: 'background 0.15s',
      }}
    >
      {/* rank number */}
      <Typography
        sx={{
          width: 28,
          fontWeight: 700,
          fontSize: '0.75rem',
          color: 'text.tertiary',
          opacity: 0.4,
          fontVariantNumeric: 'tabular-nums',
          textAlign: 'right',
          flexShrink: 0,
        }}
      >
        {rank}
      </Typography>

      {/* level badge */}
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
          borderRadius: '20px',
          px: 1.25,
          py: 0.3,
          flexShrink: 0,
        }}
      >
        <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.68rem', lineHeight: 1 }}>
          Lv.{level}
        </Typography>
      </Box>

      {/* title */}
      <Typography
        sx={{
          flex: 1,
          minWidth: 0,
          fontWeight: isCurrentUser ? 700 : 600,
          fontSize: '0.82rem',
          color: isCurrentUser ? 'rgb(14,165,233)' : 'text.primary',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
        {isCurrentUser && (
          <Box component="span" sx={{ ml: 1, fontSize: '0.62rem', opacity: 0.7 }}>(you)</Box>
        )}
      </Typography>

      {/* metric */}
      <Box sx={{ flexShrink: 0, textAlign: 'right' }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '0.82rem',
            background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            display: 'block',
            lineHeight: 1.1,
          }}
        >
          {metric}
        </Typography>
        <Typography sx={{ fontSize: '0.58rem', color: 'text.tertiary', opacity: 0.4, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {metricLabel}
        </Typography>
      </Box>
    </Box>
  )
}

// ─── section header ───────────────────────────────────────────────────────────

function SectionHeader({ label, hint }: { label: string; hint: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, px: 0.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 3, height: 18, borderRadius: 4, background: 'linear-gradient(180deg, rgb(14,165,233), rgb(249,115,22))' }} />
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '0.7rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'text.tertiary',
            opacity: 0.6,
          }}
        >
          {label}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary', opacity: 0.35, fontWeight: 600 }}>
        {hint}
      </Typography>
    </Box>
  )
}

// ─── empty state ──────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <Box
      sx={{
        bgcolor: 'background.surface',
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: '16px',
        py: 6,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
      }}
    >
      <Typography sx={{ fontSize: '2rem', lineHeight: 1 }}>🌱</Typography>
      <Typography sx={{ color: 'text.tertiary', opacity: 0.45, fontSize: '0.85rem', fontWeight: 600 }}>
        {message}
      </Typography>
    </Box>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function LeaderboardPage() {
  const [{ allTime, weekly }, supabase] = await Promise.all([
    getLeaderboard(),
    createClient(),
  ])
  const { data: { user } } = await supabase.auth.getUser()

  // Find user's rank in allTime (1-indexed)
  const userAllTimeIndex = user ? allTime.findIndex((p) => p.id === user.id) : -1
  const userAllTimeRank = userAllTimeIndex >= 0 ? userAllTimeIndex + 1 : null
  const userAllTimeData = userAllTimeIndex >= 0 ? allTime[userAllTimeIndex] : null

  // top 3 vs rest splits
  const allTimeTop3 = allTime.slice(0, 3) as typeof allTime
  const allTimeRest = allTime.slice(3)

  const weeklyTop3 = weekly.slice(0, 3)
  const weeklyRest = weekly.slice(3)

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.body' }}>
      <Header email={user?.email ?? undefined} userId={user?.id ?? undefined} />

      {/* ── Hero banner ─────────────────────────────────────────────────────── */}
      <Box
        sx={{
          width: '100%',
          height: 200,
          background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
        }}
      >
        {/* depth blobs */}
        <Box
          sx={{
            position: 'absolute',
            top: -60,
            left: -60,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -40,
            right: -40,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '60%',
            transform: 'translate(-50%,-50%)',
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* content */}
        <Typography sx={{ fontSize: '4rem', lineHeight: 1 }}>🏆</Typography>
        <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: 'white', lineHeight: 1, letterSpacing: '-0.03em' }}>
          leaderboard
        </Typography>
        <Typography sx={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
          top performers building real momentum
        </Typography>
      </Box>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <Box sx={{ maxWidth: 720, mx: 'auto', px: { xs: 2.5, md: 4 }, py: 5 }}>

        {/* ── User rank card ───────────────────────────────────────────────── */}
        {user && (
          <Box
            sx={{
              mb: 5,
              p: 2.5,
              bgcolor: 'rgba(14,165,233,0.04)',
              border: '1px solid rgba(14,165,233,0.2)',
              borderLeft: '4px solid',
              borderLeftColor: 'transparent',
              borderImage: 'linear-gradient(180deg, rgb(14,165,233), rgb(249,115,22)) 1',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: 2.5,
              flexWrap: 'wrap',
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'text.tertiary', opacity: 0.5, mb: 0.5 }}>
                your rank
              </Typography>
              {userAllTimeRank ? (
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, flexWrap: 'wrap' }}>
                  <Typography
                    sx={{
                      fontSize: '2.2rem',
                      fontWeight: 700,
                      lineHeight: 1,
                      background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    #{userAllTimeRank}
                  </Typography>
                  <Box>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'text.primary', lineHeight: 1.3 }}>
                      {userAllTimeData?.xp.toLocaleString()} XP
                    </Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: 'text.tertiary', opacity: 0.55, fontWeight: 600 }}>
                      Level {userAllTimeData?.level} · {userAllTimeData?.title}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: 'text.tertiary', opacity: 0.5 }}>
                  not ranked yet
                </Typography>
              )}
            </Box>
            <Link href="/dashboard" style={{ textDecoration: 'none' }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                  background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                  borderRadius: '20px',
                  px: 2.25,
                  py: 1,
                  '&:hover': { opacity: 0.85 },
                  transition: 'opacity 0.15s',
                  flexShrink: 0,
                }}
              >
                <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.8rem' }}>
                  check in now
                </Typography>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </Box>
            </Link>
          </Box>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/*  ALL TIME section                                                  */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <Box sx={{ mb: 8 }}>
          <SectionHeader label="all time" hint="total xp earned" />

          {allTime.length === 0 ? (
            <EmptyState message="no data yet — be the first to check in!" />
          ) : (
            <>
              {/* podium — top 3 */}
              {allTimeTop3.length > 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 1.5,
                    mb: 2.5,
                    alignItems: { xs: 'stretch', sm: 'flex-end' },
                  }}
                >
                  {allTimeTop3.map((p, i) => {
                    const rank = (i + 1) as 1 | 2 | 3
                    return (
                      <PodiumCard
                        key={p.id}
                        rank={rank}
                        level={p.level}
                        title={p.title}
                        metric={p.xp.toLocaleString()}
                        metricLabel="xp"
                        isCurrentUser={user?.id === p.id}
                      />
                    )
                  })}
                </Box>
              )}

              {/* ranks 4–20 */}
              {allTimeRest.length > 0 && (
                <Box
                  sx={{
                    bgcolor: 'background.surface',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '14px',
                    overflow: 'hidden',
                  }}
                >
                  {allTimeRest.map((p, i) => (
                    <ListRow
                      key={p.id}
                      rank={i + 4}
                      level={p.level}
                      title={p.title}
                      metric={p.xp.toLocaleString()}
                      metricLabel="xp"
                      isEven={i % 2 === 1}
                      isCurrentUser={user?.id === p.id}
                    />
                  ))}
                </Box>
              )}
            </>
          )}
        </Box>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/*  THIS WEEK section                                                 */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <Box sx={{ mb: 8 }}>
          <SectionHeader label="this week" hint="check-ins · streak · score" />

          {weekly.length === 0 ? (
            <EmptyState message="no data yet — be the first to check in this week!" />
          ) : (
            <>
              {/* podium — top 3 */}
              {weeklyTop3.length > 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 1.5,
                    mb: 2.5,
                    alignItems: { xs: 'stretch', sm: 'flex-end' },
                  }}
                >
                  {weeklyTop3.map((w, i) => {
                    const rank = (i + 1) as 1 | 2 | 3
                    return (
                      <PodiumCard
                        key={w.userId}
                        rank={rank}
                        level={w.level}
                        title={w.title}
                        metric={`${w.checkins}`}
                        metricLabel={`check-in${w.checkins !== 1 ? 's' : ''}`}
                        isCurrentUser={user?.id === w.userId}
                      />
                    )
                  })}
                </Box>
              )}

              {/* ranks 4–20 */}
              {weeklyRest.length > 0 && (
                <Box
                  sx={{
                    bgcolor: 'background.surface',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '14px',
                    overflow: 'hidden',
                  }}
                >
                  {weeklyRest.map((w, i) => (
                    <ListRow
                      key={w.userId}
                      rank={i + 4}
                      level={w.level}
                      title={w.title}
                      metric={`${w.checkins} · ${w.streak}d`}
                      metricLabel="check-ins · streak"
                      isEven={i % 2 === 1}
                      isCurrentUser={user?.id === w.userId}
                    />
                  ))}
                </Box>
              )}
            </>
          )}
        </Box>

        {/* ── Footer nudge ─────────────────────────────────────────────────── */}
        <Box sx={{ textAlign: 'center', pb: 4 }}>
          <Typography sx={{ fontSize: '0.78rem', color: 'text.tertiary', opacity: 0.35, mb: 0.75, fontWeight: 600 }}>
            your rank updates with every check-in
          </Typography>
          <Typography sx={{ fontSize: '0.68rem', color: 'text.tertiary', opacity: 0.25, fontWeight: 600 }}>
            top 20 shown · updated in real time
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
