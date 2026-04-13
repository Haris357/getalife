import Link from 'next/link'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import { createAdminClient } from '@/lib/supabase/admin'
import UnsubscribeActions from './UnsubscribeActions'

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const token = searchParams.token ?? ''

  let success = false
  let error = ''

  if (token) {
    try {
      const userId = Buffer.from(token, 'base64').toString('utf8')
      if (!/^[0-9a-f-]{36}$/.test(userId)) throw new Error('Invalid token')

      const supabase = createAdminClient()
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ unsubscribed: true })
        .eq('id', userId)

      if (dbError) throw dbError
      success = true
    } catch {
      error = 'Invalid or expired unsubscribe link.'
    }
  } else {
    error = 'Missing unsubscribe token.'
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.body',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 3,
      }}
    >
      {/* Brand logo mark */}
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 4,
        }}
      >
        <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', lineHeight: 1 }}>g</Typography>
      </Box>

      {/* Card */}
      <Box
        sx={{
          maxWidth: 400,
          width: '100%',
          bgcolor: 'background.surface',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '12px',
          p: { xs: 3, md: 4 },
          textAlign: 'center',
        }}
      >
        {success ? (
          <>
            {/* Green checkmark circle */}
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: 'success.softBg',
                border: '2px solid',
                borderColor: 'success.outlinedBorder',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--joy-palette-success-600)' }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </Box>

            <Typography
              level="h4"
              sx={{ fontWeight: 700, letterSpacing: '-0.02em', mb: 1.5, color: 'text.primary' }}
            >
              unsubscribed
            </Typography>
            <Typography
              level="body-sm"
              sx={{ color: 'text.secondary', opacity: 0.7, mb: 4, lineHeight: 1.6 }}
            >
              You won&apos;t receive any more getalife emails. Changed your mind?
            </Typography>

            <UnsubscribeActions token={token} />
          </>
        ) : (
          <>
            {/* Red X circle */}
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: 'danger.softBg',
                border: '2px solid',
                borderColor: 'danger.outlinedBorder',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--joy-palette-danger-600)' }}>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </Box>

            <Typography
              level="h4"
              sx={{ fontWeight: 700, letterSpacing: '-0.02em', mb: 1.5, color: 'text.primary' }}
            >
              unsubscribe failed
            </Typography>
            <Typography
              level="body-sm"
              sx={{ color: 'danger.600', mb: 4, lineHeight: 1.6 }}
            >
              {error}
            </Typography>

            <Link href="/" style={{ textDecoration: 'none' }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 3,
                  py: 1,
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: 'divider',
                  color: 'text.secondary',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  transition: 'all 0.15s',
                  '&:hover': { borderColor: 'text.tertiary', bgcolor: 'background.level1' },
                }}
              >
                go home
              </Box>
            </Link>
          </>
        )}
      </Box>
    </Box>
  )
}
