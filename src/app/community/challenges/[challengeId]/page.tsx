export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import ChallengeJoinButton from '../ChallengeJoinButton'
import type { ChallengeLeaderboardEntry } from '@/types'

interface Props {
  params: { challengeId: string }
}

export default async function ChallengeDetailPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [challengeRes, leaderboardRes] = await Promise.all([
    supabase
      .from('challenges')
      .select('*')
      .eq('id', params.challengeId)
      .single(),
    supabase
      .from('challenge_leaderboard')
      .select('*')
      .eq('challenge_id', params.challengeId)
      .order('rank', { ascending: true })
      .limit(20),
  ])

  if (!challengeRes.data) notFound()

  const challenge = challengeRes.data
  const leaderboard = (leaderboardRes.data ?? []) as ChallengeLeaderboardEntry[]

  const { count: participantCount } = await supabase
    .from('challenge_participants')
    .select('user_id', { count: 'exact', head: true })
    .eq('challenge_id', params.challengeId)

  let isJoined = false
  let userEntry: ChallengeLeaderboardEntry | null = null
  if (user) {
    const [{ data: membership }, { data: entry }] = await Promise.all([
      supabase
        .from('challenge_participants')
        .select('challenge_id')
        .eq('challenge_id', params.challengeId)
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('challenge_leaderboard')
        .select('*')
        .eq('challenge_id', params.challengeId)
        .eq('user_id', user.id)
        .maybeSingle(),
    ])
    isJoined = !!membership
    userEntry = entry
  }

  const now = new Date()
  const startDate = new Date(challenge.start_date)
  const endDate = new Date(challenge.end_date)
  const isActive = endDate > now
  const daysSinceStart = Math.max(0, Math.floor((now.getTime() - startDate.getTime()) / 86400000))
  const progressPct = Math.min(100, Math.round((daysSinceStart / challenge.duration_days) * 100))
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / 86400000))

  const categoryColors: Record<string, string> = {
    fitness: 'rgb(14,165,233)',
    mindfulness: 'rgb(99,102,241)',
    learning: 'rgb(249,115,22)',
    productivity: 'rgb(34,197,94)',
    nutrition: 'rgb(236,72,153)',
    default: 'rgb(148,163,184)',
  }
  const catColor = categoryColors[challenge.category.toLowerCase()] ?? categoryColors.default

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.body' }}>
      <Header email={user?.email ?? undefined} userId={user?.id} backHref="/community/challenges" backLabel="← challenges" />

      <Box sx={{ maxWidth: 640, mx: 'auto', px: { xs: 3, md: 4 }, py: 6 }}>
        {/* Category pill */}
        <Box
          sx={{
            display: 'inline-block',
            px: 1.25,
            py: 0.3,
            borderRadius: '20px',
            bgcolor: `${catColor}22`,
            mb: 1.5,
          }}
        >
          <Typography
            sx={{
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: catColor,
            }}
          >
            {challenge.category}
          </Typography>
        </Box>

        {/* Title */}
        <Typography
          level="h1"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '1.8rem', md: '2.2rem' },
            letterSpacing: '-0.04em',
            lineHeight: 1.05,
            color: 'text.primary',
            mb: 1.5,
          }}
        >
          {challenge.title}
        </Typography>

        <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary', opacity: 0.75, mb: 3, lineHeight: 1.6 }}>
          {challenge.description}
        </Typography>

        {/* Stats + join */}
        <Box
          sx={{
            bgcolor: 'background.surface',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '14px',
            p: { xs: 2.5, md: 3 },
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 2.5 }}>
            <Box>
              <Typography
                sx={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: 1,
                  mb: 0.3,
                }}
              >
                {participantCount ?? 0}
              </Typography>
              <Typography sx={{ fontSize: '0.62rem', color: 'text.tertiary', opacity: 0.45, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                participants
              </Typography>
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  color: isActive ? 'rgb(14,165,233)' : 'text.tertiary',
                  lineHeight: 1,
                  mb: 0.3,
                }}
              >
                {isActive ? daysLeft : 0}
              </Typography>
              <Typography sx={{ fontSize: '0.62rem', color: 'text.tertiary', opacity: 0.45, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                days left
              </Typography>
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  color: 'text.primary',
                  lineHeight: 1,
                  mb: 0.3,
                }}
              >
                {challenge.duration_days}
              </Typography>
              <Typography sx={{ fontSize: '0.62rem', color: 'text.tertiary', opacity: 0.45, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                total days
              </Typography>
            </Box>
          </Box>

          {/* Progress bar */}
          <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
              <Typography sx={{ fontSize: '0.68rem', color: 'text.tertiary', opacity: 0.5 }}>
                progress
              </Typography>
              <Typography sx={{ fontSize: '0.68rem', color: 'text.tertiary', opacity: 0.5 }}>
                {progressPct}%
              </Typography>
            </Box>
            <Box
              sx={{
                height: 6,
                bgcolor: 'background.level2',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  width: `${progressPct}%`,
                  background: 'linear-gradient(90deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                  borderRadius: '3px',
                  transition: 'width 0.5s ease',
                }}
              />
            </Box>
          </Box>

          {/* Date range */}
          <Typography sx={{ fontSize: '0.72rem', color: 'text.tertiary', opacity: 0.45 }}>
            {new Date(challenge.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            {' → '}
            {new Date(challenge.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Typography>
        </Box>

        {/* Your rank card if joined */}
        {userEntry && (
          <Box
            sx={{
              bgcolor: 'background.level1',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '12px',
              p: { xs: 2, md: 2.5 },
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography sx={{ fontSize: '0.68rem', color: 'text.tertiary', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.3 }}>
                your rank
              </Typography>
              <Typography
                sx={{
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: 1,
                }}
              >
                #{userEntry.rank}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography sx={{ fontSize: '0.68rem', color: 'text.tertiary', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.3 }}>
                check-ins
              </Typography>
              <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'text.primary', lineHeight: 1 }}>
                {userEntry.checkins_done}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Join/leave button */}
        {user && isActive && (
          <Box sx={{ mb: 4 }}>
            <ChallengeJoinButton challengeId={challenge.id} isJoined={isJoined} />
          </Box>
        )}
        {!user && isActive && (
          <Box sx={{ mb: 4 }}>
            <Link href="/auth/login" style={{ textDecoration: 'none' }}>
              <Box
                sx={{
                  display: 'inline-block',
                  px: 3,
                  py: 1,
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                }}
              >
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                  Sign in to join
                </Typography>
              </Box>
            </Link>
          </Box>
        )}

        {/* Leaderboard */}
        <Box>
          <Typography
            sx={{
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'text.tertiary',
              opacity: 0.45,
              mb: 2.5,
            }}
          >
            leaderboard
          </Typography>

          {leaderboard.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 5,
                bgcolor: 'background.surface',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '14px',
              }}
            >
              <Typography sx={{ fontSize: '0.85rem', color: 'text.tertiary', opacity: 0.45 }}>
                no participants yet — be the first!
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                bgcolor: 'background.surface',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '14px',
                overflow: 'hidden',
              }}
            >
              {leaderboard.map((entry, idx) => {
                const isCurrentUser = entry.user_id === user?.id
                return (
                  <Box
                    key={entry.user_id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      px: { xs: 2.5, md: 3 },
                      py: 1.75,
                      borderBottom: idx < leaderboard.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                      bgcolor: isCurrentUser ? 'background.level1' : 'transparent',
                    }}
                  >
                    {/* Rank */}
                    <Typography
                      sx={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        minWidth: 24,
                        textAlign: 'center',
                        color: idx === 0 ? 'rgb(249,115,22)' : idx === 1 ? 'rgb(148,163,184)' : idx === 2 ? 'rgb(180,140,100)' : 'text.tertiary',
                        opacity: idx < 3 ? 1 : 0.45,
                      }}
                    >
                      {entry.rank}
                    </Typography>

                    {/* Avatar */}
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#fff' }}>
                        {(entry.display_name ?? 'U')[0].toUpperCase()}
                      </Typography>
                    </Box>

                    {/* Name + title */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: isCurrentUser ? 700 : 600, color: 'text.primary', lineHeight: 1.2 }}>
                        {entry.display_name ?? 'Anonymous'}
                        {isCurrentUser && (
                          <Box component="span" sx={{ ml: 0.75, fontSize: '0.65rem', color: 'rgb(14,165,233)', fontWeight: 700 }}>
                            you
                          </Box>
                        )}
                      </Typography>
                      {entry.title && (
                        <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary', opacity: 0.4 }}>
                          {entry.title}
                        </Typography>
                      )}
                    </Box>

                    {/* Check-ins */}
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: 'text.primary', lineHeight: 1 }}>
                        {entry.checkins_done}
                      </Typography>
                      <Typography sx={{ fontSize: '0.6rem', color: 'text.tertiary', opacity: 0.4 }}>
                        check-ins
                      </Typography>
                    </Box>
                  </Box>
                )
              })}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}
