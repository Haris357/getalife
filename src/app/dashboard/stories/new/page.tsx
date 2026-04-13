import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import { requireUser } from '@/lib/utils/auth'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import StoryForm from './StoryForm'

export default async function NewStoryPage() {
  const user = await requireUser()
  const supabase = await createClient()

  const { data } = await supabase
    .from('goals')
    .select('id, description')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const goals = (data ?? []) as { id: string; description: string }[]

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.body' }}>
      <Header
        email={user.email ?? undefined}
        backHref="/stories"
        backLabel="all stories"
      />

      {/* Gradient header bar */}
      <Box
        sx={{
          width: '100%',
          py: { xs: 5, md: 7 },
          px: { xs: 3, md: 6 },
          background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
          textAlign: 'center',
        }}
      >
        <Typography
          level="body-xs"
          sx={{
            color: 'rgba(255,255,255,0.7)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            fontSize: '0.65rem',
            fontWeight: 600,
            mb: 1.5,
          }}
        >
          share your story
        </Typography>
        <Typography
          level="h2"
          sx={{
            color: '#fff',
            fontWeight: 700,
            fontSize: { xs: '1.6rem', md: '2.2rem' },
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            mb: 1.5,
          }}
        >
          you did the work.
          <br />
          now prove it to the world.
        </Typography>
        <Typography
          level="body-sm"
          sx={{ color: 'rgba(255,255,255,0.75)', maxWidth: 400, mx: 'auto', lineHeight: 1.6 }}
        >
          your story might be exactly what someone else needs to keep going.
        </Typography>
      </Box>

      {/* Form container */}
      <Box sx={{ maxWidth: 600, mx: 'auto', px: { xs: 3, md: 4 }, py: { xs: 5, md: 7 } }}>
        <StoryForm goals={goals} />
      </Box>
    </Box>
  )
}
