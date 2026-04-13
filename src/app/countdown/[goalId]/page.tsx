import Link from 'next/link'
import { notFound } from 'next/navigation'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

interface Goal {
  id: string
  description: string
  current_streak: number
  deadline: string | null
  created_at: string
  last_checkin_date: string | null
}

export default async function PublicCountdownPage({
  params,
}: {
  params: { goalId: string }
}) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('goals')
    .select('id, description, current_streak, deadline, created_at, last_checkin_date')
    .eq('id', params.goalId)
    .single()

  if (error || !data) notFound()

  const goal = data as Goal

  const now = Date.now()
  const startMs = new Date(goal.created_at).getTime()
  const daysSinceStart = Math.floor((now - startMs) / (1000 * 60 * 60 * 24))
  const dayNumber = daysSinceStart + 1

  let daysLeft: number | null = null
  let totalDays: number | null = null
  let progressPercent = 0

  if (goal.deadline) {
    const deadlineMs = new Date(goal.deadline).getTime()
    daysLeft = Math.max(0, Math.ceil((deadlineMs - now) / (1000 * 60 * 60 * 24)))
    totalDays = Math.ceil((deadlineMs - startMs) / (1000 * 60 * 60 * 24))
    progressPercent = totalDays > 0
      ? Math.min(100, Math.round((daysSinceStart / totalDays) * 100))
      : 0
  }

  const bigNumber = daysLeft !== null ? daysLeft : dayNumber
  const bigLabel = daysLeft !== null ? 'days left' : 'days in'

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle gradient overlay */}
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          background:
            'linear-gradient(135deg, rgba(14,165,233,0.04) 0%, rgba(249,115,22,0.03) 100%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Top bar */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 3, md: 6 },
          pt: { xs: 3, md: 4 },
        }}
      >
        {/* Wordmark */}
        <Typography
          sx={{
            fontSize: '0.9rem',
            fontWeight: 600,
            letterSpacing: '0.04em',
            color: 'rgba(255,255,255,0.3)',
          }}
        >
          getalife
        </Typography>

        {/* Top-right action pills */}
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Box
            component={Link}
            href={`/countdown/${params.goalId}/setup`}
            sx={{
              px: 2, py: 0.75, borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.12)',
              textDecoration: 'none', cursor: 'pointer',
              transition: 'border-color 0.15s, background 0.15s',
              '&:hover': { borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)' },
            }}
          >
            <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>
              set up live wallpaper →
            </Typography>
          </Box>
          <Box
            component="a"
            href={`/api/wallpaper/${params.goalId}`}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              px: 2, py: 0.75, borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.12)',
              textDecoration: 'none', cursor: 'pointer',
              transition: 'border-color 0.15s, background 0.15s',
              '&:hover': { borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)' },
            }}
          >
            <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>
              download PNG →
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Main content */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 4, md: 8 },
          py: { xs: 6, md: 4 },
          textAlign: 'center',
          gap: 0,
        }}
      >
        {/* Streak badge */}
        {goal.current_streak > 0 && (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              px: 2.5,
              py: 0.75,
              borderRadius: '20px',
              background: goal.current_streak >= 7
                ? 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)'
                : 'rgba(255,255,255,0.06)',
              border: goal.current_streak >= 7 ? 'none' : '1px solid rgba(255,255,255,0.12)',
              mb: 5,
            }}
          >
            <Typography
              sx={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#fff',
              }}
            >
              {goal.current_streak >= 7 ? '🔥 ' : ''}{goal.current_streak} day streak
            </Typography>
          </Box>
        )}

        {/* Big number */}
        <Typography
          sx={{
            fontSize: { xs: '7rem', sm: '10rem', md: '14rem' },
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 0.9,
            background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
          }}
        >
          {bigNumber}
        </Typography>

        {/* Label */}
        <Typography
          sx={{
            fontSize: { xs: '0.85rem', md: '1rem' },
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.3)',
            fontWeight: 500,
            mb: 6,
          }}
        >
          {bigLabel}
        </Typography>

        {/* Goal description */}
        <Typography
          sx={{
            fontSize: { xs: '1rem', md: '1.2rem' },
            color: 'rgba(255,255,255,0.65)',
            lineHeight: 1.5,
            maxWidth: 560,
            fontWeight: 400,
            mb: goal.deadline ? 5 : 0,
          }}
        >
          {goal.description}
        </Typography>

        {/* Progress bar (only when deadline set) */}
        {goal.deadline && totalDays !== null && totalDays > 0 && (
          <Box sx={{ width: '100%', maxWidth: 480 }}>
            {/* Stats row */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mb: 1.25,
              }}
            >
              <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em' }}>
                day {dayNumber}
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em' }}>
                {progressPercent}% done
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em' }}>
                {totalDays} days total
              </Typography>
            </Box>

            {/* Track */}
            <Box
              sx={{
                width: '100%',
                height: '4px',
                borderRadius: '2px',
                bgcolor: 'rgba(255,255,255,0.07)',
                overflow: 'hidden',
              }}
            >
              {/* Fill */}
              <Box
                sx={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background:
                    'linear-gradient(90deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                  borderRadius: '2px',
                  transition: 'width 0.6s ease',
                }}
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* Bottom bar */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 3, md: 6 },
          pb: { xs: 4, md: 5 },
        }}
      >
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Typography
            sx={{
              fontSize: '0.72rem',
              color: 'rgba(255,255,255,0.18)',
              letterSpacing: '0.08em',
              transition: 'color 0.15s',
              '&:hover': { color: 'rgba(255,255,255,0.4)' },
            }}
          >
            getalife.app
          </Typography>
        </Link>
      </Box>
    </Box>
  )
}
