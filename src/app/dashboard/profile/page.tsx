import { redirect } from 'next/navigation'
import Link from 'next/link'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Header from '@/components/layout/Header'
import XPBar from '@/components/game/XPBar'
import BadgeGrid from '@/components/game/BadgeGrid'
import CopyButton from './CopyButton'
import { requireUser } from '@/lib/utils/auth'
import { createClient } from '@/lib/supabase/server'
import { getLevelInfo } from '@/lib/game/xp'
import type { BadgeType } from '@/types'

export const dynamic = 'force-dynamic'

// ─── gradient text helper ────────────────────────────────────────────────────
const gradientText = {
  background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
} as const

// ─── section label style ─────────────────────────────────────────────────────
const sectionLabel = {
  fontSize: '0.62rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: 'text.tertiary',
  opacity: 0.5,
  fontWeight: 700,
}

export default async function ProfilePage() {
  const user = await requireUser()
  const supabase = await createClient()

  const [{ data: profile }, { data: achievements }, { data: goals }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('achievements').select('type, earned_at').eq('user_id', user.id),
    supabase.from('goals').select('current_streak, longest_streak, status').eq('user_id', user.id),
  ])

  if (!profile) redirect('/dashboard')

  const earnedTypes = (achievements ?? []).map((a) => a.type as BadgeType)
  const maxStreak = Math.max(...(goals ?? []).map((g) => g.longest_streak ?? 0), 0)
  const activeGoals = (goals ?? []).filter((g) => g.status === 'active')
  const activeStreak = activeGoals.length > 0 ? Math.max(...activeGoals.map((g) => g.current_streak ?? 0), 0) : 0
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://getalife.app'
  const shareUrl = `${appUrl}/rank/${user.id}`

  // Goal DNA
  type GoalDNA = { style: string; strength: string; struggle: string; description: string; archetype: string }
  let goalDNA: GoalDNA | null = null
  if (profile.goal_dna) {
    try { goalDNA = JSON.parse(profile.goal_dna) as GoalDNA } catch { /* ignore */ }
  }
  const goalDNADaysAgo = profile.goal_dna_at
    ? Math.floor((Date.now() - new Date(profile.goal_dna_at).getTime()) / 86400000)
    : null

  // XP to next level
  const { nextMin } = getLevelInfo(profile.xp)
  const xpToNext = nextMin !== null ? nextMin - profile.xp : null

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.body' }}>
      <Header email={user.email ?? undefined} userId={user.id} />

      {/* ── Hero banner ──────────────────────────────────────────────────── */}
      <Box
        sx={{
          width: '100%',
          height: 180,
          background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Radial overlays */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle at 15% 60%, rgba(255,255,255,0.10) 0%, transparent 55%), ' +
              'radial-gradient(circle at 85% 20%, rgba(255,255,255,0.07) 0%, transparent 48%), ' +
              'radial-gradient(circle at 50% 100%, rgba(0,0,0,0.08) 0%, transparent 60%)',
          }}
        />

        {/* Large level number — right side of banner */}
        <Box
          sx={{
            position: 'absolute',
            right: { xs: 24, md: 64 },
            top: '50%',
            transform: 'translateY(-50%)',
            textAlign: 'right',
            userSelect: 'none',
          }}
        >
          <Typography
            sx={{
              fontSize: '6rem',
              fontWeight: 700,
              lineHeight: 1,
              color: 'rgba(255,255,255,0.95)',
              letterSpacing: '-0.04em',
            }}
          >
            {profile.level}
          </Typography>
          <Typography
            sx={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.55)',
              mt: -0.5,
            }}
          >
            level
          </Typography>
        </Box>
      </Box>

      {/* ── Page wrapper (900px max) ─────────────────────────────────────── */}
      <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 3, md: 4 }, pb: 10 }}>

        {/* ── Avatar row — overlaps banner ─────────────────────────────── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 2,
            mt: '-36px',
            mb: 4,
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* Avatar circle */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
              p: '3px',
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                bgcolor: 'background.body',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography
                sx={{
                  fontSize: '1.8rem',
                  fontWeight: 700,
                  ...gradientText,
                }}
              >
                {(profile.display_name ?? user.email ?? 'A')[0].toUpperCase()}
              </Typography>
            </Box>
          </Box>

          {/* Name + title */}
          <Box sx={{ pb: 0.5 }}>
            <Typography
              sx={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'text.primary',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              {profile.display_name ?? 'Anonymous'}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.78rem',
                fontWeight: 700,
                ...gradientText,
                mt: 0.25,
              }}
            >
              {profile.title}
            </Typography>
          </Box>
        </Box>

        {/* ── Two-column grid ───────────────────────────────────────────── */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '58% 1fr' },
            gap: 3,
            alignItems: 'start',
          }}
        >
          {/* ════════════════════ LEFT COLUMN ════════════════════════════ */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

            {/* XP Progress card */}
            <Box
              sx={{
                bgcolor: 'background.surface',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '16px',
                p: { xs: 3, md: 3.5 },
              }}
            >
              {/* XP count */}
              <Box sx={{ mb: 2.5 }}>
                <Typography
                  sx={{
                    fontSize: '2.2rem',
                    fontWeight: 700,
                    letterSpacing: '-0.04em',
                    lineHeight: 1,
                    ...gradientText,
                  }}
                >
                  {profile.xp.toLocaleString()}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.72rem',
                    color: 'text.tertiary',
                    opacity: 0.5,
                    mt: 0.5,
                  }}
                >
                  {xpToNext !== null
                    ? `${xpToNext.toLocaleString()} XP to next level`
                    : 'max level reached'}
                </Typography>
              </Box>

              <XPBar xp={profile.xp} level={profile.level} title={profile.title} />
            </Box>

            {/* Stats 2×2 grid */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 1.5,
              }}
            >
              {/* Current streak */}
              <StatTile
                value={activeStreak > 0 ? `${activeStreak}🔥` : '—'}
                label="current streak"
                highlight={activeStreak > 0}
              />

              {/* Best streak */}
              <StatTile
                value={maxStreak > 0 ? String(maxStreak) : '—'}
                label="best streak ever"
                highlight={maxStreak > 0}
              />

              {/* Streak shields */}
              <StatTile
                value={profile.streak_shields > 0 ? `${profile.streak_shields}🛡️` : '—'}
                label="streak shields"
                highlight={profile.streak_shields > 0}
              />

              {/* Badges earned */}
              <StatTile
                value={`${earnedTypes.length} / 10`}
                label="badges earned"
                highlight={earnedTypes.length > 0}
              />
            </Box>

            {/* Achievements section */}
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                }}
              >
                <Typography sx={sectionLabel}>achievements</Typography>
                <Typography
                  sx={{
                    fontSize: '0.7rem',
                    color: 'text.tertiary',
                    opacity: 0.45,
                    bgcolor: 'background.level1',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '20px',
                    px: 1.5,
                    py: 0.35,
                  }}
                >
                  {earnedTypes.length} / 10
                </Typography>
              </Box>
              <BadgeGrid earned={earnedTypes} />
            </Box>
          </Box>

          {/* ════════════════════ RIGHT COLUMN ═══════════════════════════ */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

            {/* Goal DNA card */}
            {goalDNA ? (
              <Box
                sx={{
                  bgcolor: 'background.surface',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '16px',
                  overflow: 'hidden',
                }}
              >
                {/* Gradient top bar */}
                <Box
                  sx={{
                    height: 3,
                    background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                  }}
                />

                <Box sx={{ p: { xs: 2.5, md: 3 } }}>
                  {/* DNA label */}
                  <Typography sx={{ ...sectionLabel, mb: 1.5 }}>
                    accountability DNA
                  </Typography>

                  {/* Archetype */}
                  <Typography
                    sx={{
                      fontSize: '1.3rem',
                      fontWeight: 700,
                      letterSpacing: '-0.03em',
                      lineHeight: 1.15,
                      ...gradientText,
                      mb: 1.75,
                    }}
                  >
                    {goalDNA.archetype}
                  </Typography>

                  {/* Strength + Struggle pills */}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                        px: 1.25,
                        py: 0.4,
                        borderRadius: '20px',
                        bgcolor: 'rgba(34,197,94,0.12)',
                      }}
                    >
                      <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: 'rgb(34,197,94)', flexShrink: 0 }} />
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgb(22,163,74)' }}>
                        {goalDNA.strength}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                        px: 1.25,
                        py: 0.4,
                        borderRadius: '20px',
                        bgcolor: 'rgba(245,158,11,0.12)',
                      }}
                    >
                      <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: 'rgb(245,158,11)', flexShrink: 0 }} />
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgb(217,119,6)' }}>
                        {goalDNA.struggle}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Description */}
                  <Typography
                    sx={{
                      fontSize: '0.85rem',
                      color: 'text.secondary',
                      lineHeight: 1.65,
                      mb: 2,
                    }}
                  >
                    {goalDNA.description}
                  </Typography>

                  {/* Style badge */}
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.6,
                      px: 1.25,
                      py: 0.4,
                      borderRadius: '20px',
                      bgcolor: 'background.level1',
                      border: '1px solid',
                      borderColor: 'divider',
                      mb: 1.75,
                    }}
                  >
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'text.tertiary', opacity: 0.65 }}>
                      {goalDNA.style} motivation
                    </Typography>
                  </Box>

                  {/* Updated footer */}
                  {goalDNADaysAgo !== null && (
                    <Typography sx={{ fontSize: '0.62rem', color: 'text.tertiary', opacity: 0.3 }}>
                      updated {goalDNADaysAgo === 0 ? 'today' : `${goalDNADaysAgo} day${goalDNADaysAgo !== 1 ? 's' : ''} ago`}
                    </Typography>
                  )}
                </Box>
              </Box>
            ) : (
              /* DNA teaser card */
              <Box
                sx={{
                  bgcolor: 'background.surface',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '16px',
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ height: 3, background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)' }} />
                <Box sx={{ p: { xs: 2.5, md: 3 }, textAlign: 'center' }}>
                  {/* Lock icon */}
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '12px',
                      bgcolor: 'background.level1',
                      border: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.35 }}>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </Box>
                  <Typography
                    sx={{ ...sectionLabel, display: 'block', mb: 1 }}
                  >
                    accountability DNA
                  </Typography>
                  <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', lineHeight: 1.6 }}>
                    complete 20 check-ins to unlock your accountability DNA
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Share card */}
            <Box
              sx={{
                bgcolor: 'background.surface',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '16px',
                p: { xs: 2.5, md: 3 },
              }}
            >
              <Typography sx={{ ...sectionLabel, mb: 1.75 }}>share your rank</Typography>

              {/* URL row */}
              <Box
                sx={{
                  bgcolor: 'background.level1',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '10px',
                  px: 1.5,
                  py: 1,
                  mb: 1.5,
                  overflow: 'hidden',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.72rem',
                    color: 'text.tertiary',
                    opacity: 0.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {shareUrl}
                </Typography>
              </Box>

              {/* Actions */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                <CopyButton text={shareUrl} />
                <Link href={`/rank/${user.id}`} style={{ textDecoration: 'none' }}>
                  <Typography
                    sx={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      ...gradientText,
                      '&:hover': { opacity: 0.8 },
                      transition: 'opacity 0.15s',
                    }}
                  >
                    view public profile →
                  </Typography>
                </Link>
              </Box>
            </Box>

            {/* Quick actions */}
            <Box
              sx={{
                bgcolor: 'background.surface',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '16px',
                overflow: 'hidden',
              }}
            >
              <QuickActionRow href="/leaderboard" label="view leaderboard →" />
              <Box sx={{ height: '1px', bgcolor: 'divider', mx: 2 }} />
              <QuickActionRow href="/dashboard/settings" label="edit profile →" />
            </Box>

          </Box>
          {/* end right column */}
        </Box>
        {/* end grid */}
      </Box>
    </Box>
  )
}

// ─── StatTile ────────────────────────────────────────────────────────────────
function StatTile({ value, label, highlight }: { value: string; label: string; highlight: boolean }) {
  return (
    <Box
      sx={{
        borderRadius: 14,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.surface',
        px: 2,
        py: 2,
      }}
    >
      <Typography
        sx={{
          fontSize: '1.4rem',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          lineHeight: 1,
          mb: 0.6,
          ...(highlight
            ? {
                background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }
            : { color: 'text.tertiary', opacity: 0.35 }),
        }}
      >
        {value}
      </Typography>
      <Typography
        sx={{
          fontSize: '0.62rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'text.tertiary',
          opacity: 0.45,
        }}
      >
        {label}
      </Typography>
    </Box>
  )
}

// ─── QuickActionRow ──────────────────────────────────────────────────────────
function QuickActionRow({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <Box
        sx={{
          px: 2.5,
          py: 1.75,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'background 0.15s',
          '&:hover': { bgcolor: 'background.level1' },
          cursor: 'pointer',
        }}
      >
        <Typography
          sx={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'text.secondary',
          }}
        >
          {label}
        </Typography>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </Box>
    </Link>
  )
}
