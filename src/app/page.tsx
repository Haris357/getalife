import Link from 'next/link'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Logo from '@/components/layout/Logo'
import ThemeToggle from '@/components/layout/ThemeToggle'
import MagicLinkForm from '@/components/auth/MagicLinkForm'
import LiveActivityPanel from '@/components/landing/LiveActivityPanel'
import { getUser } from '@/lib/utils/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { BRAND_GRADIENT } from '@/components/layout/Logo'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default async function LandingPage() {
  const user = await getUser()
  const isLoggedIn = !!user

  // ── Fetch real data for right panel ──────────────────────
  const admin = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const [
    { count: totalGoals },
    { count: todayCheckins },
    { data: activeGoalStreaks },
    { data: recentCheckins },
    { data: recentCompletions },
  ] = await Promise.all([
    admin.from('goals').select('*', { count: 'exact', head: true }),
    admin.from('check_ins').select('*', { count: 'exact', head: true }).eq('date', today),
    admin.from('goals').select('current_streak').eq('status', 'active'),
    admin.from('check_ins')
      .select('user_id, goal_id, what_i_did, created_at')
      .order('created_at', { ascending: false })
      .limit(30),
    admin.from('goals')
      .select('description, current_streak, created_at')
      .eq('status', 'completed')
      .order('updated_at', { ascending: false })
      .limit(4),
  ])

  const avgStreak = activeGoalStreaks?.length
    ? Math.round(
        activeGoalStreaks.reduce((s, g) => s + (g.current_streak || 0), 0) /
          activeGoalStreaks.length
      )
    : 0

  // Enrich check-ins with goal + profile data
  const goalIds = Array.from(new Set((recentCheckins ?? []).map(c => c.goal_id).filter(Boolean)))
  const userIds = Array.from(new Set((recentCheckins ?? []).map(c => c.user_id).filter(Boolean)))

  const [{ data: goalDetails }, { data: profileDetails }] = await Promise.all([
    goalIds.length
      ? admin.from('goals').select('id, description, current_streak').in('id', goalIds)
      : Promise.resolve({ data: [] }),
    userIds.length
      ? admin.from('profiles').select('id, display_name').in('id', userIds)
      : Promise.resolve({ data: [] }),
  ])

  const goalMap = new Map((goalDetails ?? []).map(g => [g.id, g]))
  const profileMap = new Map((profileDetails ?? []).map(p => [p.id, p]))

  const activity = (recentCheckins ?? []).slice(0, 10).map(ci => {
    const goal = goalMap.get(ci.goal_id)
    const profile = profileMap.get(ci.user_id)
    const name = profile?.display_name ?? 'Someone'
    const goalDesc = goal?.description
      ? goal.description.slice(0, 52) + (goal.description.length > 52 ? '…' : '')
      : 'their goal'
    const streak = goal?.current_streak ?? 0
    const action = streak >= 30
      ? `${streak} day streak on`
      : streak >= 7
        ? `${streak} day streak on`
        : 'checked in —'
    return {
      name,
      action,
      goal: goalDesc,
      preview: ci.what_i_did?.slice(0, 85) ?? null,
      time: timeAgo(ci.created_at),
      streak,
    }
  })

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        bgcolor: 'background.body',
      }}
    >
      {/* ── Left panel ── */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          px: { xs: 4, md: 6 },
          py: { xs: 5, md: 6 },
          minHeight: { xs: 'auto', md: '100vh' },
        }}
      >
        {/* Top row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Logo href="/" size={26} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Link href="/stories" style={{ textDecoration: 'none' }}>
              <Typography
                level="body-xs"
                sx={{
                  color: 'text.tertiary',
                  fontSize: '0.8rem',
                  display: { xs: 'none', sm: 'block' },
                  '&:hover': { color: 'text.secondary' },
                  transition: 'color 0.15s',
                }}
              >
                stories
              </Typography>
            </Link>
            <ThemeToggle />
          </Box>
        </Box>

        {/* Middle: headline + form */}
        <Box sx={{ py: 4 }}>
          <Typography
            level="h1"
            sx={{
              fontSize: { xs: '2.4rem', md: '3rem', lg: '3.6rem' },
              lineHeight: 1.08,
              color: 'text.primary',
              mb: 2.5,
              fontWeight: 700,
              letterSpacing: '-0.03em',
            }}
          >
            stop planning.
            <br />
            start doing.
          </Typography>

          <Typography
            level="body-md"
            sx={{
              color: 'text.tertiary',
              mb: 5,
              maxWidth: 360,
              lineHeight: 1.65,
              fontSize: '0.95rem',
            }}
          >
            write your goal, get an AI roadmap, then check in every day until
            you actually finish it.
          </Typography>

          <Box sx={{ maxWidth: 420 }}>
            {isLoggedIn ? (
              <Box>
                <Link href="/dashboard" style={{ textDecoration: 'none', display: 'inline-block' }}>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1.25,
                      px: 3.5,
                      py: 1.5,
                      borderRadius: '10px',
                      border: 'none',
                      background: BRAND_GRADIENT,
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '1rem',
                      cursor: 'pointer',
                      transition: 'transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 28px rgba(14, 165, 233, 0.35)',
                        filter: 'brightness(1.08)',
                      },
                    }}
                  >
                    dashboard
                  </Box>
                </Link>
                <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.4, mt: 2, fontSize: '0.78rem' }}>
                  welcome back{user.email ? `, ${user.email.split('@')[0]}` : ''}
                </Typography>
              </Box>
            ) : (
              <MagicLinkForm />
            )}
          </Box>
        </Box>

        {/* Bottom */}
        <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.3 }}>
          © {new Date().getFullYear()} Get A Life
        </Typography>
      </Box>

      {/* ── Right panel (live) ── */}
      <LiveActivityPanel
        initialActivity={activity}
        initialStats={{ totalGoals: totalGoals ?? 0, todayCheckins: todayCheckins ?? 0, avgStreak }}
        initialCompletions={((recentCompletions ?? []) as { description: string }[]).slice(0, 3)}
      />
    </Box>
  )
}
