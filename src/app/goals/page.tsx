import { Metadata } from 'next'
import Link from 'next/link'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Avatar from '@mui/joy/Avatar'
import Header from '@/components/layout/Header'
import { getUser } from '@/lib/utils/auth'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Goals Board — Get A Life',
  description: 'People doing the work, publicly.',
}

export const revalidate = 60

const CATEGORIES = [
  { value: 'all', label: 'all' },
  { value: 'fitness', label: '🏋️ fitness' },
  { value: 'career', label: '💼 career' },
  { value: 'learning', label: '📚 learning' },
  { value: 'money', label: '💰 money' },
  { value: 'creativity', label: '🎨 creativity' },
  { value: 'health', label: '❤️ health' },
  { value: 'relationships', label: '🤝 relationships' },
  { value: 'mindfulness', label: '🧘 mindfulness' },
  { value: 'other', label: '✨ other' },
]

interface PublicGoal {
  id: string
  description: string
  category: string | null
  current_streak: number
  created_at: string
  deadline: string | null
  pledge: string | null
  display_name: string | null
  avatar_url: string | null
  level: number | null
  title: string | null
}

interface PageProps {
  searchParams: Promise<{ category?: string }>
}

export default async function GoalsBoardPage({ searchParams }: PageProps) {
  const { category: categoryParam } = await searchParams
  const activeCategory = CATEGORIES.find((c) => c.value === categoryParam)?.value ?? 'all'

  const [user, supabase] = await Promise.all([getUser(), createClient()])

  let query = supabase
    .from('public_goals')
    .select('id, description, category, current_streak, created_at, deadline, pledge, display_name, avatar_url, level, title')
    .order('current_streak', { ascending: false })
    .limit(60)

  if (activeCategory !== 'all') {
    query = query.eq('category', activeCategory)
  }

  const { data } = await query
  const goals = (data ?? []) as PublicGoal[]

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.body' }}>
      <Header email={user?.email ?? undefined} userId={user?.id ?? undefined} />

      <Box sx={{ maxWidth: 860, mx: 'auto', px: { xs: 3, md: 4 }, py: 5 }}>

        {/* ── Title ── */}
        <Box sx={{ mb: 5 }}>
          <Typography
            sx={{
              fontSize: { xs: '1.7rem', md: '2rem' },
              fontWeight: 700,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              color: 'text.primary',
              mb: 0.75,
            }}
          >
            community goals
          </Typography>
          <Typography level="body-sm" sx={{ color: 'text.tertiary', opacity: 0.55, fontSize: '0.9rem' }}>
            people doing the work, publicly
          </Typography>
        </Box>

        {/* ── Category filter pills ── */}
        <Box
          sx={{
            display: 'flex',
            gap: 0.75,
            flexWrap: 'nowrap',
            overflowX: 'auto',
            pb: 0.5,
            mb: 5,
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {CATEGORIES.map((cat) => {
            const isActive = cat.value === activeCategory
            return (
              <Link
                key={cat.value}
                href={cat.value === 'all' ? '/goals' : `/goals?category=${cat.value}`}
                style={{ textDecoration: 'none', flexShrink: 0 }}
              >
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '20px',
                    border: '1px solid',
                    borderColor: isActive ? 'transparent' : 'divider',
                    background: isActive
                      ? 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)'
                      : 'transparent',
                    transition: 'all 0.15s',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: isActive ? 'transparent' : 'neutral.outlinedBorder',
                    },
                  }}
                >
                  <Typography
                    level="body-xs"
                    sx={{
                      fontSize: '0.75rem',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? '#fff' : 'text.tertiary',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cat.label}
                  </Typography>
                </Box>
              </Link>
            )
          })}
        </Box>

        {/* ── Goals grid ── */}
        {goals.length === 0 ? (
          <Box sx={{ py: 10, textAlign: 'center' }}>
            <Typography level="body-sm" sx={{ color: 'text.tertiary', opacity: 0.35 }}>
              no public goals in this category yet
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 2,
            }}
          >
            {goals.map((goal) => {
              const daysSince = Math.floor(
                (Date.now() - new Date(goal.created_at).getTime()) / (1000 * 60 * 60 * 24)
              )
              const daysLeft = goal.deadline
                ? Math.ceil(
                    (new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  )
                : null
              const name = goal.display_name ?? 'anonymous'
              const initial = name[0]?.toUpperCase() ?? '?'
              const catMeta = CATEGORIES.find((c) => c.value === (goal.category ?? 'other'))

              return (
                <Box
                  key={goal.id}
                  sx={{
                    bgcolor: 'background.surface',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    display: 'flex',
                    transition: 'border-color 0.15s',
                    '&:hover': { borderColor: 'neutral.outlinedHoverBorder' },
                  }}
                >
                  {/* Gradient left accent */}
                  <Box
                    sx={{
                      width: 4,
                      flexShrink: 0,
                      background: 'linear-gradient(180deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                    }}
                  />

                  <Box sx={{ flex: 1, px: 2.5, py: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Author row */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <Avatar
                        src={goal.avatar_url ?? undefined}
                        sx={{ width: 30, height: 30, fontSize: '0.8rem', flexShrink: 0 }}
                      >
                        {initial}
                      </Avatar>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                        <Typography level="body-xs" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.82rem' }}>
                          {name}
                        </Typography>
                        {goal.level != null && (
                          <Box
                            sx={{
                              px: 0.75,
                              py: 0.1,
                              borderRadius: '20px',
                              background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                            }}
                          >
                            <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#fff' }}>
                              Lv.{goal.level}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>

                    {/* Goal description */}
                    <Typography
                      level="body-sm"
                      sx={{
                        color: 'text.secondary',
                        fontSize: '0.875rem',
                        lineHeight: 1.55,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {goal.description}
                    </Typography>

                    {/* Pledge callout */}
                    {goal.pledge && (
                      <Box
                        sx={{
                          px: 1.5,
                          py: 0.75,
                          borderRadius: '8px',
                          bgcolor: 'warning.softBg',
                          border: '1px solid',
                          borderColor: 'warning.200',
                        }}
                      >
                        <Typography level="body-xs" sx={{ color: 'warning.700', fontSize: '0.75rem', lineHeight: 1.4 }}>
                          🔒 {goal.pledge}
                        </Typography>
                      </Box>
                    )}

                    {/* Footer row */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                      {/* Left: category pill + day */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {catMeta && catMeta.value !== 'all' && (
                          <Box
                            sx={{
                              px: 1,
                              py: 0.2,
                              borderRadius: '20px',
                              border: '1px solid',
                              borderColor: 'divider',
                              bgcolor: 'background.level1',
                            }}
                          >
                            <Typography level="body-xs" sx={{ fontSize: '0.68rem', color: 'text.tertiary', opacity: 0.7 }}>
                              {catMeta.label}
                            </Typography>
                          </Box>
                        )}
                        <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '0.7rem', opacity: 0.5 }}>
                          Day {daysSince + 1}
                        </Typography>
                        {goal.current_streak > 0 && (
                          <Box
                            sx={{
                              px: 1,
                              py: 0.2,
                              borderRadius: '20px',
                              border: '1px solid',
                              borderColor: goal.current_streak >= 7 ? 'warning.300' : 'divider',
                              bgcolor: goal.current_streak >= 7 ? 'warning.softBg' : 'transparent',
                            }}
                          >
                            <Typography
                              level="body-xs"
                              sx={{
                                fontSize: '0.68rem',
                                color: goal.current_streak >= 7 ? 'warning.600' : 'text.tertiary',
                                fontWeight: goal.current_streak >= 7 ? 600 : 400,
                              }}
                            >
                              {goal.current_streak}d{goal.current_streak >= 7 ? ' 🔥' : ''}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Right: days left */}
                      {daysLeft != null && daysLeft > 0 && (
                        <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '0.7rem', opacity: 0.45 }}>
                          {daysLeft}d left
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              )
            })}
          </Box>
        )}

        {/* Bottom CTA */}
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.3, mb: 2.5, fontSize: '0.78rem' }}>
            ready to go public?
          </Typography>
          <Link href={user ? '/dashboard' : '/'} style={{ textDecoration: 'none' }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                borderRadius: '20px',
                px: 3,
                py: 1.25,
                '&:hover': { opacity: 0.9 },
                transition: 'opacity 0.15s',
              }}
            >
              <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>
                {user ? 'set a goal →' : 'get started →'}
              </Typography>
            </Box>
          </Link>
        </Box>
      </Box>
    </Box>
  )
}
