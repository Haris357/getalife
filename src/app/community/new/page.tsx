import { redirect } from 'next/navigation'
import Link from 'next/link'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import { requireUser } from '@/lib/utils/auth'
import Header from '@/components/layout/Header'
import CreatePostForm from './CreatePostForm'

export default async function NewPostPage() {
  const user = await requireUser()
  if (!user) redirect('/auth/login')

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.body' }}>
      <Header
        email={user.email ?? undefined}
        backHref="/community"
        backLabel="getalife"
      />

      <Box sx={{ maxWidth: 640, mx: 'auto', px: { xs: 3, md: 4 }, py: 6 }}>
        {/* Gradient accent bar */}
        <Box
          sx={{
            width: 40,
            height: 3,
            borderRadius: '2px',
            background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
            mb: 3,
          }}
        />

        {/* Breadcrumb */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Link href="/community" style={{ textDecoration: 'none' }}>
            <Typography
              sx={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'text.tertiary',
                opacity: 0.5,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                transition: 'opacity 0.15s',
                '&:hover': { opacity: 0.9 },
              }}
            >
              r/getalife
            </Typography>
          </Link>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.tertiary', opacity: 0.3 }}>→</Typography>
          <Typography
            sx={{
              fontSize: '0.72rem',
              color: 'text.tertiary',
              opacity: 0.35,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            create post
          </Typography>
        </Box>

        <Typography
          level="h3"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '1.4rem', md: '1.7rem' },
            letterSpacing: '-0.03em',
            mb: 5,
            background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          create a post
        </Typography>

        {/* Form card */}
        <Box
          sx={{
            bgcolor: 'background.surface',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '12px',
            p: { xs: 3, md: 4 },
          }}
        >
          <CreatePostForm />
        </Box>
      </Box>
    </Box>
  )
}
