import { notFound } from 'next/navigation'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import { requireUser } from '@/lib/utils/auth'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import CheckinForm from './CheckinForm'

export default async function CheckinPage({
  params,
}: {
  params: { goalId: string }
}) {
  const user = await requireUser()
  const supabase = await createClient()

  const { data: goal } = await supabase
    .from('goals')
    .select('id, description, current_streak, last_checkin_date')
    .eq('id', params.goalId)
    .eq('user_id', user.id)
    .single()

  if (!goal) notFound()

  const today = new Date().toISOString().split('T')[0]
  const alreadyCheckedIn = goal.last_checkin_date === today

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.body' }}>
      {/* Gradient top accent bar */}
      <Box
        sx={{
          height: 4,
          width: '100%',
          background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 1200,
        }}
      />

      <Box sx={{ pt: '4px' }}>
        <Header
          email={user.email ?? undefined}
          backHref={`/dashboard/goal/${params.goalId}`}
          backLabel="back to goal"
        />
      </Box>

      <Box sx={{ maxWidth: 580, mx: 'auto', px: { xs: 3, md: 4 }, py: 6 }}>

        {alreadyCheckedIn ? (
          /* ── Already checked in state ── */
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              px: 4,
              bgcolor: 'background.surface',
              border: '1px solid',
              borderColor: 'success.300',
              borderRadius: '12px',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Subtle success gradient top */}
            <Box
              sx={{
                height: 3,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(90deg, rgb(14,165,233), rgb(34,197,94))',
              }}
            />

            {/* Streak glow pill */}
            {goal.current_streak > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                <Box
                  sx={{
                    px: 2.5,
                    py: 0.75,
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                    boxShadow: '0 0 20px rgba(14,165,233,0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
                    {goal.current_streak} day streak {goal.current_streak >= 7 ? '🔥' : ''}
                  </Typography>
                </Box>
              </Box>
            )}

            <Typography
              sx={{
                fontSize: '2rem',
                mb: 1.5,
              }}
            >
              ✓
            </Typography>
            <Typography
              level="h3"
              sx={{
                color: 'text.primary',
                fontWeight: 700,
                fontSize: { xs: '1.2rem', md: '1.4rem' },
                letterSpacing: '-0.025em',
                mb: 1,
              }}
            >
              already checked in today
            </Typography>
            <Typography level="body-sm" sx={{ color: 'text.tertiary', opacity: 0.55 }}>
              come back tomorrow to keep your streak alive
            </Typography>
          </Box>
        ) : (
          /* ── Normal check-in state ── */
          <>
            {/* Goal name chip */}
            <Box sx={{ mb: 3 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  px: 1.75,
                  py: 0.6,
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.surface',
                  maxWidth: '100%',
                  overflow: 'hidden',
                }}
              >
                <Typography
                  level="body-xs"
                  sx={{
                    color: 'text.tertiary',
                    fontSize: '0.75rem',
                    opacity: 0.7,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {goal.description.length > 60
                    ? goal.description.slice(0, 60) + '…'
                    : goal.description}
                </Typography>
              </Box>
            </Box>

            {/* Streak glow pill */}
            {goal.current_streak > 0 && (
              <Box sx={{ mb: 3 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    px: 1.75,
                    py: 0.6,
                    borderRadius: '20px',
                    background: goal.current_streak >= 7
                      ? 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)'
                      : 'transparent',
                    border: '1px solid',
                    borderColor: goal.current_streak >= 7 ? 'transparent' : 'divider',
                    boxShadow: goal.current_streak >= 7 ? '0 0 16px rgba(14,165,233,0.25)' : 'none',
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      color: goal.current_streak >= 7 ? '#fff' : 'text.secondary',
                    }}
                  >
                    {goal.current_streak} day streak{goal.current_streak >= 7 ? ' 🔥' : ''}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Label */}
            <Typography
              level="body-xs"
              sx={{
                color: 'text.tertiary',
                mb: 1,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontSize: '0.68rem',
                opacity: 0.45,
              }}
            >
              daily check-in
            </Typography>

            <Typography
              level="h3"
              sx={{
                color: 'text.primary',
                fontWeight: 700,
                fontSize: { xs: '1.2rem', md: '1.4rem' },
                lineHeight: 1.35,
                letterSpacing: '-0.025em',
                mb: 0.75,
              }}
            >
              what happened today?
            </Typography>
            <Typography level="body-sm" sx={{ color: 'text.tertiary', opacity: 0.5, mb: 5 }}>
              be honest. this is just between you and your goal.
            </Typography>

            {/* Form card */}
            <Box
              sx={{
                bgcolor: 'background.surface',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '12px',
                p: 3,
              }}
            >
              <CheckinForm goalId={params.goalId} streak={goal.current_streak ?? 0} />
            </Box>
          </>
        )}
      </Box>
    </Box>
  )
}
