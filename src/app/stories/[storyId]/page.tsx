import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import { createClient } from '@/lib/supabase/server'
import Logo from '@/components/layout/Logo'
import ThemeToggle from '@/components/layout/ThemeToggle'
import type { Story } from '@/types'

export async function generateMetadata({
  params,
}: {
  params: { storyId: string }
}): Promise<Metadata> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('stories')
    .select('name, tagline')
    .eq('id', params.storyId)
    .eq('published', true)
    .single()

  if (!data) return { title: 'Story — Get A Life' }

  return {
    title: `${data.name} — Get A Life`,
    description: data.tagline,
    openGraph: {
      title: `${data.name} — Get A Life`,
      description: data.tagline,
    },
    twitter: {
      card: 'summary',
      title: `${data.name} — Get A Life`,
      description: data.tagline,
    },
  }
}

export default async function StoryPage({
  params,
}: {
  params: { storyId: string }
}) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('stories')
    .select('*')
    .eq('id', params.storyId)
    .eq('published', true)
    .single()

  if (!data) notFound()

  const story = data as Story
  const initial = story.name.trim().charAt(0).toUpperCase()

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.body' }}>
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
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Logo href="/" size={24} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Link href="/stories" style={{ textDecoration: 'none' }}>
            <Box
              sx={{
                px: 2.5,
                py: 0.75,
                borderRadius: '20px',
                border: '1px solid',
                borderColor: 'divider',
                cursor: 'pointer',
                transition: 'border-color 0.15s',
                '&:hover': { borderColor: 'text.tertiary' },
              }}
            >
              <Typography level="body-xs" sx={{ color: 'text.secondary', fontSize: '0.78rem', fontWeight: 600 }}>
                ← all stories
              </Typography>
            </Box>
          </Link>
          <ThemeToggle />
        </Box>
      </Box>

      {/* Full-width hero */}
      <Box sx={{ position: 'relative', width: '100%', height: { xs: 320, md: 440 }, overflow: 'hidden' }}>
        {story.image_url ? (
          <>
            <Box
              component="img"
              src={story.image_url}
              alt={story.name}
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.1) 100%)',
              }}
            />
          </>
        ) : (
          <>
            {/* Brand gradient fallback with large initial */}
            <Box
              sx={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography
                sx={{
                  fontSize: '9rem',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.15)',
                  lineHeight: 1,
                  userSelect: 'none',
                }}
              >
                {initial}
              </Typography>
            </Box>
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)',
              }}
            />
          </>
        )}

        {/* Hero text overlaid */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            px: { xs: 4, md: 8 },
            pb: { xs: 4, md: 6 },
            maxWidth: 860,
          }}
        >
          <Typography
            level="body-xs"
            sx={{
              color: 'rgba(255,255,255,0.65)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontSize: '0.65rem',
              fontWeight: 600,
              mb: 1.5,
            }}
          >
            success story · {new Date(story.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Typography>
          <Typography
            level="h1"
            sx={{
              color: '#fff',
              fontWeight: 700,
              fontSize: { xs: '1.8rem', md: '2.6rem' },
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              mb: 1,
            }}
          >
            {story.name}
          </Typography>
          <Typography
            level="body-md"
            sx={{
              color: 'rgba(255,255,255,0.78)',
              fontSize: { xs: '0.95rem', md: '1.05rem' },
              lineHeight: 1.5,
              maxWidth: 560,
            }}
          >
            {story.tagline}
          </Typography>
        </Box>
      </Box>

      {/* Article body */}
      <Box
        sx={{
          maxWidth: 680,
          mx: 'auto',
          px: { xs: 4, md: 6 },
          pt: { xs: 5, md: 7 },
          pb: 12,
        }}
      >
        {/* Goal chip info */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 5 }}>
          <Box
            sx={{
              px: 2,
              py: 0.6,
              borderRadius: '20px',
              border: '1px solid',
              borderColor: 'rgba(14,165,233,0.35)',
              bgcolor: 'rgba(14,165,233,0.07)',
            }}
          >
            <Typography level="body-xs" sx={{ color: 'rgb(14,165,233)', fontSize: '0.75rem', fontWeight: 600 }}>
              success story
            </Typography>
          </Box>
          {story.goal_id && (
            <Box
              sx={{
                px: 2,
                py: 0.6,
                borderRadius: '20px',
                border: '1px solid',
                borderColor: 'rgba(249,115,22,0.35)',
                bgcolor: 'rgba(249,115,22,0.07)',
              }}
            >
              <Typography level="body-xs" sx={{ color: 'rgb(249,115,22)', fontSize: '0.75rem', fontWeight: 600 }}>
                goal achieved
              </Typography>
            </Box>
          )}
          <Box
            sx={{
              px: 2,
              py: 0.6,
              borderRadius: '20px',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '0.75rem' }}>
              {new Date(story.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </Typography>
          </Box>
        </Box>

        {/* Story body — paragraphs */}
        <Box
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            pt: 5,
            '& > *:first-of-type': { mt: 0 },
          }}
        >
          {story.body.split('\n').filter(Boolean).map((para, i) => (
            <Typography
              key={i}
              level="body-md"
              sx={{
                color: 'text.primary',
                lineHeight: 1.85,
                fontSize: { xs: '1rem', md: '1.075rem' },
                mb: 3,
              }}
            >
              {para}
            </Typography>
          ))}
        </Box>

        {/* Social links */}
        {story.social_links && Object.keys(story.social_links).length > 0 && (
          <Box sx={{ mt: 6, pt: 5, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography
              level="body-xs"
              sx={{
                color: 'text.tertiary',
                mb: 2.5,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontSize: '0.65rem',
                fontWeight: 600,
              }}
            >
              find them online
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
              {Object.entries(story.social_links).map(([platform, url]) =>
                url ? (
                  <Box
                    key={platform}
                    component="a"
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      px: 2.5,
                      py: 0.75,
                      borderRadius: '20px',
                      border: '1px solid',
                      borderColor: 'divider',
                      textDecoration: 'none',
                      transition: 'border-color 0.15s, background 0.15s',
                      '&:hover': {
                        borderColor: 'rgb(14,165,233)',
                        bgcolor: 'rgba(14,165,233,0.06)',
                      },
                    }}
                  >
                    <Typography
                      level="body-xs"
                      sx={{ color: 'text.secondary', fontSize: '0.82rem', textTransform: 'capitalize', fontWeight: 600 }}
                    >
                      {platform} ↗
                    </Typography>
                  </Box>
                ) : null
              )}
            </Box>
          </Box>
        )}

        {/* Share / CTA section */}
        <Box
          sx={{
            mt: 8,
            pt: 6,
            borderTop: '1px solid',
            borderColor: 'divider',
            textAlign: 'center',
          }}
        >
          <Typography
            level="body-xs"
            sx={{
              color: 'text.tertiary',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontSize: '0.65rem',
              fontWeight: 600,
              mb: 1.5,
            }}
          >
            inspired?
          </Typography>
          <Typography
            level="h4"
            sx={{
              color: 'text.primary',
              fontWeight: 700,
              fontSize: '1.2rem',
              letterSpacing: '-0.02em',
              mb: 1,
            }}
          >
            ready to write your own story?
          </Typography>
          <Typography level="body-sm" sx={{ color: 'text.tertiary', mb: 4 }}>
            set a goal. show up every day. get a life.
          </Typography>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Box
              sx={{
                display: 'inline-flex',
                px: 5,
                py: 1.5,
                borderRadius: '20px',
                background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                cursor: 'pointer',
                '&:hover': { opacity: 0.88 },
                transition: 'opacity 0.15s',
              }}
            >
              <Typography level="body-md" sx={{ color: '#fff', fontWeight: 700 }}>
                start your goal →
              </Typography>
            </Box>
          </Link>
        </Box>
      </Box>
    </Box>
  )
}
