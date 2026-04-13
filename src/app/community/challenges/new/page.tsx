export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import { isUserMod } from '@/lib/utils/community'
import CreateChallengeForm from './CreateChallengeForm'

export default async function NewChallengePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')
  if (!(await isUserMod(user.id))) redirect('/community/challenges')

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.body' }}>
      <Header email={user.email ?? undefined} userId={user.id} backHref="/community/challenges" backLabel="← challenges" />

      <Box sx={{ maxWidth: 560, mx: 'auto', px: { xs: 3, md: 4 }, py: 6 }}>
        <Box sx={{ mb: 5 }}>
          <Typography
            level="h2"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.7rem', md: '2rem' },
              letterSpacing: '-0.04em',
              lineHeight: 1.05,
              background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              mb: 0.5,
            }}
          >
            create challenge
          </Typography>
          <Typography sx={{ fontSize: '0.82rem', color: 'text.tertiary', opacity: 0.5 }}>
            mod-only — visible to all community members
          </Typography>
        </Box>

        <CreateChallengeForm />
      </Box>
    </Box>
  )
}
