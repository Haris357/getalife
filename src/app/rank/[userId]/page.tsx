import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import XPBar from '@/components/game/XPBar'
import BadgeGrid from '@/components/game/BadgeGrid'
import { createAdminClient } from '@/lib/supabase/admin'
import type { BadgeType } from '@/types'

interface Props {
  params: { userId: string }
}

async function getRankData(userId: string) {
  const supabase = createAdminClient()

  const [{ data: profile }, { data: achievements }, { data: goals }] = await Promise.all([
    supabase.from('profiles').select('id, xp, level, title, streak_shields').eq('id', userId).single(),
    supabase.from('achievements').select('type, earned_at').eq('user_id', userId),
    supabase.from('goals').select('current_streak, longest_streak').eq('user_id', userId),
  ])

  return {
    profile,
    achievements: (achievements ?? []) as { type: BadgeType; earned_at: string }[],
    maxStreak: Math.max(...(goals ?? []).map((g) => g.longest_streak ?? 0), 0),
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { profile } = await getRankData(params.userId)
  if (!profile) return {}
  return {
    title: `Lv.${profile.level} ${profile.title} — Get A Life`,
    description: `${profile.xp.toLocaleString()} XP earned building real habits. Join the challenge.`,
  }
}

export default async function RankPage({ params }: Props) {
  const { profile, achievements, maxStreak } = await getRankData(params.userId)
  if (!profile) notFound()

  const earnedTypes = achievements.map((a) => a.type)

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.body' }}>
      {/* Gradient header banner */}
      <Box
        sx={{
          width: '100%',
          py: { xs: 4, md: 5 },
          px: { xs: 3, md: 6 },
          background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography
            level="body-xs"
            sx={{
              color: 'rgba(255,255,255,0.7)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              fontSize: '0.6rem',
              fontWeight: 700,
              mb: 0.5,
            }}
          >
            get a life
          </Typography>
          <Typography
            sx={{
              color: '#fff',
              fontWeight: 700,
              fontSize: { xs: '1.1rem', md: '1.3rem' },
              letterSpacing: '-0.02em',
            }}
          >
            rank card
          </Typography>
        </Box>

        {/* Shield count in header */}
        {profile.streak_shields > 0 && (
          <Box sx={{ textAlign: 'right' }}>
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.3rem', lineHeight: 1 }}>
              {profile.streak_shields}
              <span style={{ fontSize: '1rem', marginLeft: 2 }}>🛡️</span>
            </Typography>
            <Typography level="body-xs" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem' }}>
              streak shield{profile.streak_shields !== 1 ? 's' : ''}
            </Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ maxWidth: 500, mx: 'auto', px: { xs: 3, md: 4 }, py: { xs: 4, md: 6 } }}>
        {/* Main profile card */}
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '12px',
            p: { xs: 3, md: 4 },
            bgcolor: 'background.surface',
            mb: 4,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle gradient accent top-left corner */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 120,
              height: 120,
              background: 'linear-gradient(135deg, rgba(14,165,233,0.08) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Level + title */}
          <Box sx={{ mb: 4 }}>
            <Typography
              sx={{
                fontSize: { xs: '3.5rem', md: '4.5rem' },
                fontWeight: 700,
                lineHeight: 0.9,
                letterSpacing: '-0.06em',
                background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                mb: 1,
              }}
            >
              Lv.{profile.level}
            </Typography>
            <Typography
              sx={{
                color: 'text.primary',
                fontWeight: 700,
                fontSize: { xs: '1rem', md: '1.15rem' },
                letterSpacing: '-0.01em',
              }}
            >
              {profile.title}
            </Typography>
          </Box>

          {/* Stats row */}
          <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
            <Box>
              <Typography
                sx={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: 'text.primary',
                  lineHeight: 1,
                  letterSpacing: '-0.03em',
                }}
              >
                {profile.xp.toLocaleString()}
              </Typography>
              <Typography
                level="body-xs"
                sx={{ color: 'text.tertiary', fontSize: '0.65rem', mt: 0.4 }}
              >
                total XP
              </Typography>
            </Box>
            {maxStreak > 0 && (
              <Box>
                <Typography
                  sx={{
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    color: 'text.primary',
                    lineHeight: 1,
                    letterSpacing: '-0.03em',
                  }}
                >
                  {maxStreak}
                </Typography>
                <Typography
                  level="body-xs"
                  sx={{ color: 'text.tertiary', fontSize: '0.65rem', mt: 0.4 }}
                >
                  best streak
                </Typography>
              </Box>
            )}
            <Box>
              <Typography
                sx={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: 'text.primary',
                  lineHeight: 1,
                  letterSpacing: '-0.03em',
                }}
              >
                {earnedTypes.length}
              </Typography>
              <Typography
                level="body-xs"
                sx={{ color: 'text.tertiary', fontSize: '0.65rem', mt: 0.4 }}
              >
                badge{earnedTypes.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </Box>

          {/* XP bar */}
          <XPBar xp={profile.xp} level={profile.level} title={profile.title} />
        </Box>

        {/* Badge grid */}
        {earnedTypes.length > 0 && (
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '12px',
              bgcolor: 'background.surface',
              p: { xs: 3, md: 4 },
              mb: 4,
            }}
          >
            <Typography
              level="body-xs"
              sx={{
                color: 'text.tertiary',
                mb: 3,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontSize: '0.65rem',
                fontWeight: 600,
              }}
            >
              achievements
            </Typography>
            <BadgeGrid earned={earnedTypes} />
          </Box>
        )}

        {/* CTA */}
        <Box sx={{ textAlign: 'center', pt: 2 }}>
          <Typography
            level="body-xs"
            sx={{ color: 'text.tertiary', opacity: 0.45, mb: 3, fontSize: '0.78rem' }}
          >
            building momentum since day one
          </Typography>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Box
              sx={{
                display: 'inline-flex',
                px: 5,
                py: 1.5,
                borderRadius: '20px',
                background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                cursor: 'pointer',
                '&:hover': { opacity: 0.88 },
                transition: 'opacity 0.15s',
              }}
            >
              <Typography level="body-md" sx={{ color: '#fff', fontWeight: 700 }}>
                start your own journey →
              </Typography>
            </Box>
          </Link>
        </Box>
      </Box>
    </Box>
  )
}
