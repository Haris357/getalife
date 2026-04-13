export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import ChallengeJoinButton from './ChallengeJoinButton'
import type { Challenge, ChallengeLeaderboardEntry } from '@/types'

export default async function ChallengesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: challenges } = await supabase
    .from('challenges')
    .select('*')
    .order('end_date', { ascending: false })

  const now = new Date().toISOString()

  const enriched = await Promise.all(
    (challenges ?? []).map(async (challenge: Challenge) => {
      const [{ count: participantCount }, { data: leaderboard }] = await Promise.all([
        supabase
          .from('challenge_participants')
          .select('user_id', { count: 'exact', head: true })
          .eq('challenge_id', challenge.id),
        supabase
          .from('challenge_leaderboard')
          .select('*')
          .eq('challenge_id', challenge.id)
          .order('rank', { ascending: true })
          .limit(5),
      ])

      let isJoined = false
      if (user) {
        const { data: membership } = await supabase
          .from('challenge_participants')
          .select('challenge_id')
          .eq('challenge_id', challenge.id)
          .eq('user_id', user.id)
          .maybeSingle()
        isJoined = !!membership
      }

      return {
        ...challenge,
        participant_count: participantCount ?? 0,
        leaderboard: (leaderboard ?? []) as ChallengeLeaderboardEntry[],
        isJoined,
      }
    })
  )

  // Sort: active first, then past
  enriched.sort((a, b) => {
    const aActive = a.end_date > now
    const bActive = b.end_date > now
    if (aActive && !bActive) return -1
    if (!aActive && bActive) return 1
    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  })

  const activeChallenges = enriched.filter(c => c.end_date > now)
  const pastChallenges = enriched.filter(c => c.end_date <= now)

  const categoryColors: Record<string, string> = {
    fitness: 'rgba(14,165,233,0.15)',
    mindfulness: 'rgba(99,102,241,0.15)',
    learning: 'rgba(249,115,22,0.15)',
    productivity: 'rgba(34,197,94,0.15)',
    nutrition: 'rgba(236,72,153,0.15)',
    default: 'rgba(148,163,184,0.15)',
  }

  const categoryTextColors: Record<string, string> = {
    fitness: 'rgb(14,165,233)',
    mindfulness: 'rgb(99,102,241)',
    learning: 'rgb(249,115,22)',
    productivity: 'rgb(34,197,94)',
    nutrition: 'rgb(236,72,153)',
    default: 'rgb(148,163,184)',
  }

  function daysLeft(endDate: string): number {
    return Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000))
  }

  function getCategoryBg(cat: string): string {
    return categoryColors[cat.toLowerCase()] ?? categoryColors.default
  }

  function getCategoryText(cat: string): string {
    return categoryTextColors[cat.toLowerCase()] ?? categoryTextColors.default
  }

  function renderChallengeCard(
    challenge: typeof enriched[0],
    isActive: boolean
  ) {
    return (
      <Box
        key={challenge.id}
        sx={{
          bgcolor: 'background.surface',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '16px',
          overflow: 'hidden',
          transition: 'border-color 0.15s',
          '&:hover': { borderColor: 'neutral.outlinedHoverBorder' },
        }}
      >
        {/* Card header */}
        <Box sx={{ p: { xs: 3, md: 3.5 }, pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 1.5 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* Category pill */}
              <Box
                sx={{
                  display: 'inline-block',
                  px: 1.25,
                  py: 0.3,
                  borderRadius: '20px',
                  bgcolor: getCategoryBg(challenge.category),
                  mb: 1,
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: getCategoryText(challenge.category),
                  }}
                >
                  {challenge.category}
                </Typography>
              </Box>
              <Link href={`/community/challenges/${challenge.id}`} style={{ textDecoration: 'none' }}>
                <Typography
                  sx={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    color: 'text.primary',
                    lineHeight: 1.2,
                    mb: 0.75,
                    '&:hover': { color: 'rgb(14,165,233)' },
                    transition: 'color 0.15s',
                  }}
                >
                  {challenge.title}
                </Typography>
              </Link>
              <Typography
                level="body-sm"
                sx={{ color: 'text.secondary', opacity: 0.7, fontSize: '0.82rem', lineHeight: 1.5 }}
              >
                {challenge.description}
              </Typography>
            </Box>
          </Box>

          {/* Stats row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.tertiary', opacity: 0.6 }}>
              {challenge.participant_count} participant{challenge.participant_count !== 1 ? 's' : ''}
            </Typography>
            <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'divider' }} />
            {isActive ? (
              <Typography sx={{ fontSize: '0.75rem', color: 'rgb(14,165,233)', fontWeight: 600 }}>
                {daysLeft(challenge.end_date)} days left
              </Typography>
            ) : (
              <Typography sx={{ fontSize: '0.75rem', color: 'text.tertiary', opacity: 0.5 }}>
                ended
              </Typography>
            )}
            <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'divider' }} />
            <Typography sx={{ fontSize: '0.75rem', color: 'text.tertiary', opacity: 0.6 }}>
              {challenge.duration_days}d challenge
            </Typography>
          </Box>

          {/* Join/leave button */}
          {user && isActive && (
            <Box sx={{ mt: 2.5 }}>
              <ChallengeJoinButton
                challengeId={challenge.id}
                isJoined={challenge.isJoined}
              />
            </Box>
          )}
          {!user && isActive && (
            <Box sx={{ mt: 2.5 }}>
              <Link href="/auth/login" style={{ textDecoration: 'none' }}>
                <Box
                  sx={{
                    display: 'inline-block',
                    px: 2.5,
                    py: 0.85,
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                    cursor: 'pointer',
                  }}
                >
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
                    Sign in to join
                  </Typography>
                </Box>
              </Link>
            </Box>
          )}
        </Box>

        {/* Leaderboard section */}
        {challenge.leaderboard.length > 0 && (
          <Box
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider',
              px: { xs: 3, md: 3.5 },
              py: 2,
              bgcolor: 'background.level1',
            }}
          >
            <Typography
              sx={{
                fontSize: '0.62rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'text.tertiary',
                opacity: 0.45,
                mb: 1.5,
              }}
            >
              top participants
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {challenge.leaderboard.slice(0, 5).map((entry, idx) => (
                <Box key={entry.user_id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography
                    sx={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: idx === 0 ? 'rgb(249,115,22)' : 'text.tertiary',
                      opacity: idx === 0 ? 1 : 0.4,
                      minWidth: 16,
                      textAlign: 'center',
                    }}
                  >
                    {idx + 1}
                  </Typography>
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, color: '#fff' }}>
                      {(entry.display_name ?? 'U')[0].toUpperCase()}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: 'text.primary', flex: 1, minWidth: 0 }}>
                    {entry.display_name ?? 'Anonymous'}
                  </Typography>
                  <Typography sx={{ fontSize: '0.72rem', color: 'text.tertiary', opacity: 0.55 }}>
                    {entry.checkins_done} check-in{entry.checkins_done !== 1 ? 's' : ''}
                  </Typography>
                </Box>
              ))}
            </Box>
            <Link href={`/community/challenges/${challenge.id}`} style={{ textDecoration: 'none' }}>
              <Typography
                sx={{
                  fontSize: '0.72rem',
                  color: 'text.tertiary',
                  opacity: 0.45,
                  mt: 1.5,
                  '&:hover': { opacity: 1 },
                  transition: 'opacity 0.15s',
                }}
              >
                view full leaderboard →
              </Typography>
            </Link>
          </Box>
        )}
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.body' }}>
      <Header email={user?.email ?? undefined} userId={user?.id} backHref="/community" backLabel="← community" />

      <Box sx={{ maxWidth: 720, mx: 'auto', px: { xs: 3, md: 4 }, py: 6 }}>
        {/* Page header */}
        <Box sx={{ mb: 5 }}>
          <Typography
            level="h2"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.8rem', md: '2.2rem' },
              letterSpacing: '-0.04em',
              lineHeight: 1.05,
              background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              mb: 0.75,
            }}
          >
            challenges
          </Typography>
          <Typography sx={{ fontSize: '0.88rem', color: 'text.tertiary', opacity: 0.6 }}>
            community accountability challenges — join, check in, climb the board
          </Typography>
        </Box>

        {/* Active challenges */}
        {activeChallenges.length > 0 && (
          <Box sx={{ mb: 5 }}>
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
              active challenges
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {activeChallenges.map(c => renderChallengeCard(c, true))}
            </Box>
          </Box>
        )}

        {activeChallenges.length === 0 && (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              bgcolor: 'background.surface',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '16px',
              mb: 5,
            }}
          >
            <Typography sx={{ fontSize: '0.9rem', color: 'text.tertiary', opacity: 0.5 }}>
              no active challenges right now — check back soon
            </Typography>
          </Box>
        )}

        {/* Past challenges */}
        {pastChallenges.length > 0 && (
          <Box>
            <Typography
              sx={{
                fontSize: '0.62rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'text.tertiary',
                opacity: 0.35,
                mb: 2.5,
              }}
            >
              past challenges
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, opacity: 0.65 }}>
              {pastChallenges.map(c => renderChallengeCard(c, false))}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  )
}
