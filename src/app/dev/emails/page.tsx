import { redirect } from 'next/navigation'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import { requireUser } from '@/lib/utils/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { SCENARIOS } from '@/lib/email/scenarios'
import EmailTestClient from './EmailTestClient'

export default async function EmailTestPage() {
  if (process.env.NODE_ENV === 'production') redirect('/')

  const user = await requireUser()
  const admin = createAdminClient()
  const { data: { user: authUser } } = await admin.auth.admin.getUserById(user.id)
  const email = authUser?.email ?? user.email ?? 'unknown'

  const scenarios = SCENARIOS.map(s => ({
    type: s.type,
    label: s.label,
    description: s.description,
  }))

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.body' }}>
      <Box sx={{ maxWidth: 680, mx: 'auto', px: { xs: 3, md: 4 }, py: 8 }}>
        {/* Header */}
        <Box sx={{ mb: 7 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
            <Box
              sx={{
                px: 1.25,
                py: 0.3,
                borderRadius: '4px',
                bgcolor: 'warning.softBg',
                border: '1px solid',
                borderColor: 'warning.300',
              }}
            >
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'warning.600', letterSpacing: '0.06em' }}>
                DEV ONLY
              </Typography>
            </Box>
          </Box>

          <Typography
            level="h2"
            sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', md: '1.8rem' }, letterSpacing: '-0.03em', color: 'text.primary', mb: 1 }}
          >
            email test lab
          </Typography>
          <Typography level="body-sm" sx={{ color: 'text.tertiary', opacity: 0.55, fontSize: '0.875rem' }}>
            send any email type to your inbox to preview how it looks. AI-generated types (coaching, newsletter) call OpenAI each time.
          </Typography>
        </Box>

        <EmailTestClient scenarios={scenarios} userEmail={email} />
      </Box>
    </Box>
  )
}
