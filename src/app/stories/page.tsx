import type { Metadata } from 'next'
import Link from 'next/link'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Button from '@mui/joy/Button'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Success Stories — Get A Life',
  description: 'Real people, real goals, real results. See what happens when you actually show up every day.',
}
import { createClient } from '@/lib/supabase/server'
import Logo from '@/components/layout/Logo'
import ThemeToggle from '@/components/layout/ThemeToggle'
import RealtimeRefresher from '@/components/shared/RealtimeRefresher'
import type { Story } from '@/types'

export default async function StoriesPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('stories')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })

  const stories = (data ?? []) as Story[]

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.body' }}>
      <RealtimeRefresher table="stories" filter="published=eq.true" />

      {/* Nav */}
      <Box
        sx={{
          px: { xs: 3, md: 6 },
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.surface',
          backdropFilter: 'blur(8px)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Logo href="/" size={24} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Link href="/dashboard/stories/new" style={{ textDecoration: 'none' }}>
            <Box
              sx={{
                px: 2.5,
                py: 0.75,
                borderRadius: '20px',
                background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                cursor: 'pointer',
                transition: 'opacity 0.15s',
                '&:hover': { opacity: 0.88 },
              }}
            >
              <Typography
                level="body-xs"
                sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.01em' }}
              >
                share yours
              </Typography>
            </Box>
          </Link>
          <ThemeToggle />
        </Box>
      </Box>

      {/* Hero */}
      <Box
        sx={{
          maxWidth: 760,
          mx: 'auto',
          px: { xs: 4, md: 6 },
          pt: { xs: 6, md: 10 },
          pb: { xs: 4, md: 6 },
          textAlign: 'center',
        }}
      >
        <Typography
          level="body-xs"
          sx={{
            color: 'text.tertiary',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontSize: '0.65rem',
            fontWeight: 600,
            mb: 3,
          }}
        >
          success stories
        </Typography>

        <Typography
          level="h1"
          sx={{
            fontSize: { xs: '2.4rem', md: '3.4rem' },
            lineHeight: 1.08,
            fontWeight: 700,
            letterSpacing: '-0.04em',
            mb: 2,
            background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          stories that matter
        </Typography>

        {/* Animated gradient underline accent */}
        <Box
          sx={{
            mx: 'auto',
            mb: 3.5,
            height: '3px',
            width: 80,
            borderRadius: '2px',
            background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 1, width: '80px' },
              '50%': { opacity: 0.6, width: '60px' },
            },
            animation: 'pulse 3s ease-in-out infinite',
          }}
        />

        <Typography
          level="body-md"
          sx={{
            color: 'text.secondary',
            fontSize: '1rem',
            lineHeight: 1.65,
            maxWidth: 440,
            mx: 'auto',
          }}
        >
          real goals. real check-ins. real results. these are the people who
          showed up every single day.
        </Typography>
      </Box>

      {/* Grid */}
      <Box
        sx={{
          maxWidth: 1160,
          mx: 'auto',
          px: { xs: 3, md: 6 },
          pb: 16,
        }}
      >
        {stories.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 16 }}>
            {/* Pen SVG */}
            <Box sx={{ mb: 3, opacity: 0.2 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto' }}>
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </Box>
            <Typography level="body-sm" sx={{ color: 'text.tertiary', mb: 4 }}>
              no stories yet — be the first to inspire someone
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
                  share your story →
                </Typography>
              </Box>
            </Link>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
              gap: 3,
            }}
          >
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </Box>
        )}
      </Box>

    </Box>
  )
}

function StoryCard({ story }: { story: Story }) {
  const initial = story.name.trim().charAt(0).toUpperCase()

  return (
    <Link href={`/stories/${story.id}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '12px',
          overflow: 'hidden',
          bgcolor: 'background.surface',
          display: 'flex',
          flexDirection: 'column',
          transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
          height: '100%',
          '&:hover': {
            borderColor: 'rgb(14,165,233)',
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 32px rgba(14,165,233,0.12)',
          },
        }}
      >
        {/* Image area — 200px tall */}
        <Box sx={{ position: 'relative', height: 200, flexShrink: 0 }}>
          {story.image_url ? (
            <>
              <Box
                component="img"
                src={story.image_url}
                alt={story.name}
                sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              {/* Gradient overlay */}
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)',
                }}
              />
            </>
          ) : (
            /* Gradient placeholder with initial */
            <Box
              sx={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <Typography
                sx={{
                  fontSize: '4.5rem',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.25)',
                  lineHeight: 1,
                  userSelect: 'none',
                }}
              >
                {initial}
              </Typography>
              {/* Still add overlay for name/tagline legibility */}
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)',
                }}
              />
            </Box>
          )}

          {/* Name + tagline overlay on image bottom */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              px: 2,
              pb: 2,
              pt: 3,
            }}
          >
            <Typography
              level="title-sm"
              sx={{ color: '#fff', fontWeight: 700, fontSize: '1rem', lineHeight: 1.2, mb: 0.4 }}
            >
              {story.name}
            </Typography>
            <Typography
              level="body-xs"
              sx={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: '0.75rem',
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {story.tagline}
            </Typography>
          </Box>
        </Box>

        {/* Body preview */}
        <Box sx={{ px: 2.5, py: 2, flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography
            level="body-xs"
            sx={{
              color: 'text.secondary',
              fontSize: '0.82rem',
              lineHeight: 1.65,
              flex: 1,
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {story.body}
          </Typography>

          {/* Tag pills */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, pt: 0.5 }}>
            <Box
              sx={{
                px: 1.5,
                py: 0.3,
                borderRadius: '20px',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.level1',
              }}
            >
              <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.04em' }}>
                success story
              </Typography>
            </Box>
            {story.goal_id && (
              <Box
                sx={{
                  px: 1.5,
                  py: 0.3,
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: 'rgba(14,165,233,0.3)',
                  bgcolor: 'rgba(14,165,233,0.06)',
                }}
              >
                <Typography level="body-xs" sx={{ color: 'rgb(14,165,233)', fontSize: '0.68rem', fontWeight: 600 }}>
                  goal linked
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Link>
  )
}
