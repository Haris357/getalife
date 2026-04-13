import Link from 'next/link'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Header from '@/components/layout/Header'
import { requireUser } from '@/lib/utils/auth'
import { createClient } from '@/lib/supabase/server'
import MyStoryCard from './MyStoryCard'
import type { Story } from '@/types'

export default async function MyStoriesPage() {
  const user = await requireUser()
  const supabase = await createClient()

  const { data } = await supabase
    .from('stories')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const stories = (data ?? []) as Story[]

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.body' }}>
      <Header email={user.email ?? undefined} backHref="/dashboard" backLabel="← dashboard" />

      <Box sx={{ maxWidth: 720, mx: 'auto', px: { xs: 3, md: 4 }, py: 6 }}>
        {/* Page header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 7 }}>
          <Box>
            <Typography
              level="body-xs"
              sx={{
                color: 'text.tertiary',
                mb: 1,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontSize: '0.65rem',
                fontWeight: 600,
              }}
            >
              my stories
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1.6rem', md: '2rem' },
                fontWeight: 700,
                letterSpacing: '-0.04em',
                lineHeight: 1.1,
                background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {stories.length} {stories.length === 1 ? 'story' : 'stories'}
            </Typography>
          </Box>

          <Link href="/dashboard/stories/new" style={{ textDecoration: 'none' }}>
            <Box
              sx={{
                px: 3,
                py: 1,
                borderRadius: '20px',
                background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                cursor: 'pointer',
                transition: 'opacity 0.15s',
                '&:hover': { opacity: 0.88 },
              }}
            >
              <Typography level="body-xs" sx={{ color: '#fff', fontWeight: 700, fontSize: '0.82rem' }}>
                + write new story
              </Typography>
            </Box>
          </Link>
        </Box>

        {/* Empty state */}
        {stories.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 14,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '12px',
              bgcolor: 'background.surface',
            }}
          >
            {/* Write SVG icon */}
            <Box sx={{ mb: 3, opacity: 0.18 }}>
              <svg
                width="52"
                height="52"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ display: 'block', margin: '0 auto' }}
              >
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </Box>
            <Typography level="body-md" sx={{ color: 'text.tertiary', mb: 1.5, fontWeight: 600 }}>
              you haven&apos;t shared a story yet
            </Typography>
            <Typography level="body-sm" sx={{ color: 'text.tertiary', opacity: 0.6, mb: 4, maxWidth: 300, mx: 'auto', lineHeight: 1.6 }}>
              your journey could be exactly what someone else needs to keep going.
            </Typography>
            <Link href="/dashboard/stories/new" style={{ textDecoration: 'none' }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  px: 4,
                  py: 1.25,
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.88 },
                  transition: 'opacity 0.15s',
                }}
              >
                <Typography level="body-sm" sx={{ color: '#fff', fontWeight: 700 }}>
                  share your first story →
                </Typography>
              </Box>
            </Link>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {stories.map((story) => (
              <MyStoryCard key={story.id} story={story} />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  )
}
