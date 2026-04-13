import { notFound } from 'next/navigation'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import { requireUser } from '@/lib/utils/auth'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import GoalCountdown from '@/components/goals/GoalCountdown'

export const dynamic = 'force-dynamic'

export default async function CountdownPage({
  params,
}: {
  params: { goalId: string }
}) {
  const user = await requireUser()
  const supabase = await createClient()

  const { data: goal } = await supabase
    .from('goals')
    .select('id, description, deadline, status, roadmap')
    .eq('id', params.goalId)
    .eq('user_id', user.id)
    .single()

  if (!goal) notFound()

  // Calculate total days from roadmap phases if available
  const roadmap = goal.roadmap as { phase: number; title: string; focus: string[] }[] | null
  const phaseCount = roadmap?.length ?? 0

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.body' }}>
      <Header
        email={user.email ?? undefined}
        backHref={`/dashboard/goal/${params.goalId}`}
        backLabel="back to goal"
      />

      <Box
        sx={{
          maxWidth: 680,
          mx: 'auto',
          px: { xs: 3, md: 4 },
          py: { xs: 6, md: 10 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Title */}
        <Typography
          level="body-xs"
          sx={{
            color: 'text.tertiary',
            opacity: 0.35,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontSize: '0.65rem',
            mb: 3,
          }}
        >
          countdown
          {phaseCount > 0 && ` · ${phaseCount} phase${phaseCount === 1 ? '' : 's'}`}
        </Typography>

        <GoalCountdown
          goalId={goal.id}
          deadline={goal.deadline ?? null}
          goalDescription={goal.description}
        />

        {goal.status === 'paused' && (
          <Box
            sx={{
              mt: 2,
              px: 2,
              py: 1,
              borderRadius: '20px',
              border: '1px solid',
              borderColor: 'warning.300',
              bgcolor: 'warning.softBg',
            }}
          >
            <Typography level="body-xs" sx={{ color: 'warning.700', fontSize: '0.78rem' }}>
              goal is paused — timer still runs
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}
