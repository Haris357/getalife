import Link from 'next/link'
import dynamic from 'next/dynamic'
import { notFound } from 'next/navigation'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import { requireUser } from '@/lib/utils/auth'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import CompleteGoalButton from './CompleteGoalButton'
import PauseGoalButton from './PauseGoalButton'
import RoadmapEditor from './RoadmapEditor'
import RealtimeRefresher from '@/components/shared/RealtimeRefresher'
import RecoveryBanner from '@/components/goals/RecoveryBanner'
import CheckinCalendar from '@/components/goals/CheckinCalendar'
import MediaTimeline from '@/components/goals/MediaTimeline'
import ShareGoalButton from '@/components/goals/ShareGoalButton'
import type { CheckIn, RoadmapPhase } from '@/types'

const FocusTimer = dynamic(() => import('@/components/goals/FocusTimer'), { ssr: false })

export default async function GoalPage({
  params,
}: {
  params: { goalId: string }
}) {
  const user = await requireUser()
  const supabase = await createClient()

  const { data: goal } = await supabase
    .from('goals')
    .select('*, check_ins(*)')
    .eq('id', params.goalId)
    .eq('user_id', user.id)
    .single()

  if (!goal) notFound()

  const checkIns: CheckIn[] = ((goal.check_ins ?? []) as CheckIn[]).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const roadmap: RoadmapPhase[] | null = goal.roadmap ?? null

  const today = new Date().toISOString().split('T')[0]
  const checkedInToday = goal.last_checkin_date === today

  const daysSinceStart = Math.floor(
    (Date.now() - new Date(goal.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.body' }}>
      <RealtimeRefresher table="check_ins" filter={`goal_id=eq.${params.goalId}`} event="INSERT" />
      <RealtimeRefresher table="goals" filter={`id=eq.${params.goalId}`} />
      <Header email={user.email ?? undefined} userId={user.id} backHref="/dashboard" backLabel="all goals" />

      <Box sx={{ maxWidth: 640, mx: 'auto', px: { xs: 3, md: 4 }, py: 6 }}>

        {/* ── Status banners (paused / completed) ── */}
        {goal.status === 'paused' && (
          <Box
            sx={{
              mb: 4,
              px: 3,
              py: 2,
              borderRadius: '12px',
              border: '1px solid',
              borderColor: 'warning.300',
              bgcolor: 'warning.softBg',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            {/* Pause icon */}
            <Box sx={{ flexShrink: 0, opacity: 0.7 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="2" y="2" width="3" height="10" rx="1" fill="currentColor" style={{ color: 'var(--joy-palette-warning-600)' }} />
                <rect x="9" y="2" width="3" height="10" rx="1" fill="currentColor" style={{ color: 'var(--joy-palette-warning-600)' }} />
              </svg>
            </Box>
            <Typography level="body-sm" sx={{ color: 'warning.700', fontWeight: 600, fontSize: '0.85rem' }}>
              goal paused — resume when you're ready
            </Typography>
          </Box>
        )}

        {goal.status === 'completed' && (
          <Box
            sx={{
              mb: 4,
              px: 3,
              py: 2.5,
              borderRadius: '12px',
              border: '1px solid',
              borderColor: 'success.300',
              bgcolor: 'success.softBg',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Typography level="body-sm" sx={{ color: 'success.700', fontWeight: 700, fontSize: '0.85rem' }}>
              goal completed — well done.
            </Typography>
          </Box>
        )}

        {/* ── Hero ── */}
        <Box sx={{ mb: 6 }}>
          {/* Day count meta */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Typography
              level="body-xs"
              sx={{
                color: 'text.tertiary',
                fontSize: '0.68rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                opacity: 0.45,
              }}
            >
              started {new Date(goal.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Typography>
            <Box sx={{ width: '1px', height: 10, bgcolor: 'divider' }} />
            <Typography
              sx={{
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.02em',
                background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              day {daysSinceStart + 1}
            </Typography>
          </Box>

          {/* Goal title */}
          <Typography
            level="h3"
            sx={{
              color: 'text.primary',
              fontWeight: 700,
              fontSize: { xs: '1.25rem', md: '1.45rem' },
              lineHeight: 1.35,
              letterSpacing: '-0.025em',
              mb: 3,
            }}
          >
            {goal.description}
          </Typography>

          {/* Streak badges */}
          {goal.current_streak > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  px: 1.75,
                  py: 0.6,
                  borderRadius: '20px',
                  background: goal.current_streak >= 7
                    ? 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)'
                    : 'transparent',
                  border: '1px solid',
                  borderColor: goal.current_streak >= 7 ? 'transparent' : 'divider',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: goal.current_streak >= 7 ? '#fff' : 'text.secondary',
                  }}
                >
                  {goal.current_streak} day streak{goal.current_streak >= 7 ? ' 🔥' : ''}
                </Typography>
              </Box>

              {goal.longest_streak > 0 && goal.longest_streak > goal.current_streak && (
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '20px',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '0.75rem', opacity: 0.6 }}>
                    best {goal.longest_streak}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* ── Action row ── */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
            {/* Check in CTA — gradient pill */}
            {goal.status === 'active' && (
              checkedInToday ? (
                <Box
                  sx={{
                    px: 2.5,
                    py: 1,
                    borderRadius: '20px',
                    border: '1px solid',
                    borderColor: 'success.300',
                    bgcolor: 'success.softBg',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  <Typography sx={{ color: 'success.600', fontWeight: 600, fontSize: '0.85rem' }}>
                    ✓ checked in today
                  </Typography>
                </Box>
              ) : (
                <Link href={`/dashboard/goal/${params.goalId}/checkin`} style={{ textDecoration: 'none' }}>
                  <Box
                    sx={{
                      px: 2.5,
                      py: 1,
                      borderRadius: '20px',
                      background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      boxShadow: '0 2px 12px rgba(14,165,233,0.25)',
                      transition: 'box-shadow 0.2s',
                      '&:hover': { boxShadow: '0 4px 20px rgba(14,165,233,0.35)' },
                    }}
                  >
                    <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>
                      check in today →
                    </Typography>
                  </Box>
                </Link>
              )
            )}

            {/* Countdown pill */}
            <Link href={`/dashboard/goal/${params.goalId}/countdown`} style={{ textDecoration: 'none' }}>
              <Box
                sx={{
                  px: 1.75,
                  py: 0.6,
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: 'divider',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                  '&:hover': { borderColor: 'neutral.outlinedHoverBorder' },
                }}
              >
                <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '0.75rem', opacity: 0.6 }}>
                  {goal.deadline ? 'countdown →' : 'set deadline →'}
                </Typography>
              </Box>
            </Link>

            {/* Wallpaper pill */}
            <Link href={`/countdown/${params.goalId}`} target="_blank" style={{ textDecoration: 'none' }}>
              <Box
                sx={{
                  px: 1.75,
                  py: 0.6,
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: 'divider',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                  '&:hover': { borderColor: 'neutral.outlinedHoverBorder' },
                }}
              >
                <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '0.75rem', opacity: 0.6 }}>
                  wallpaper →
                </Typography>
              </Box>
            </Link>

            {/* Pause / complete pills */}
            {(goal.status === 'active' || goal.status === 'paused') && (
              <PauseGoalButton goalId={params.goalId} status={goal.status} />
            )}
            {goal.status === 'active' && checkIns.length >= 3 && (
              <CompleteGoalButton goalId={params.goalId} />
            )}
            {goal.status === 'completed' && (
              <ShareGoalButton goalId={params.goalId} />
            )}
          </Box>

          {/* ── Pledge callout ── */}
          {goal.pledge && (
            <Box sx={{ mb: 4, px: 3, py: 2, borderRadius: '10px', border: '1px dashed', borderColor: 'warning.300', bgcolor: 'warning.softBg' }}>
              <Typography level="body-xs" sx={{ color: 'warning.700', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.7, mb: 0.5 }}>your pledge</Typography>
              <Typography level="body-sm" sx={{ color: 'warning.800', fontSize: '0.875rem', fontWeight: 600 }}>"{goal.pledge}"</Typography>
            </Box>
          )}
        </Box>

        {/* ── Recovery Banner ── */}
        {goal.status === 'active' && <RecoveryBanner goalId={params.goalId} />}

        {/* ── AI Pattern Analysis ── */}
        {goal.pattern_analysis && (() => {
          const analyzedAt = goal.pattern_analyzed_at ? new Date(goal.pattern_analyzed_at) : null
          const withinWindow = analyzedAt
            ? Date.now() - analyzedAt.getTime() < 14 * 24 * 60 * 60 * 1000
            : false
          if (!withinWindow) return null
          return (
            <Box sx={{ mb: 4, p: 3, borderRadius: '12px', bgcolor: 'background.surface', border: '1px solid', borderColor: 'divider' }}>
              <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.45, mb: 1 }}>
                ai pattern analysis · {analyzedAt!.toLocaleDateString()}
              </Typography>
              <Typography level="body-sm" sx={{ color: 'text.secondary', lineHeight: 1.7, fontStyle: 'italic', fontSize: '0.88rem' }}>
                {goal.pattern_analysis}
              </Typography>
            </Box>
          )
        })()}

        {/* ── Roadmap ── */}
        {roadmap && roadmap.length > 0 && (
          <RoadmapEditor
            goalId={params.goalId}
            roadmap={roadmap}
            canEdit={goal.status !== 'completed'}
          />
        )}

        {/* ── Media Timeline ── */}
        {checkIns.some(ci => ci.media_url) && <MediaTimeline checkIns={checkIns} />}

        {/* ── Activity Heatmap ── */}
        <CheckinCalendar checkIns={checkIns} />

        {/* ── Journal feed ── */}
        <Box>
          <Typography
            level="body-xs"
            sx={{
              color: 'text.tertiary',
              mb: 4,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontSize: '0.68rem',
              opacity: 0.45,
            }}
          >
            journal · {checkIns.length} {checkIns.length === 1 ? 'entry' : 'entries'}
          </Typography>

          {checkIns.length === 0 ? (
            <Box
              sx={{
                py: 6,
                textAlign: 'center',
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: '12px',
                bgcolor: 'background.surface',
              }}
            >
              <Typography level="body-sm" sx={{ color: 'text.tertiary', opacity: 0.3 }}>
                no check-ins yet — start today
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {checkIns.map((ci) => (
                <Box
                  key={ci.id}
                  sx={{
                    bgcolor: 'background.surface',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    transition: 'border-color 0.15s',
                    '&:hover': { borderColor: 'neutral.outlinedHoverBorder' },
                  }}
                >
                  {/* Date pill header */}
                  <Box
                    sx={{
                      px: 3,
                      py: 1.25,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.level1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        px: 1.25,
                        py: 0.3,
                        borderRadius: '20px',
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.surface',
                      }}
                    >
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '0.7rem', letterSpacing: '0.04em' }}>
                        {new Date(ci.date + 'T00:00:00').toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ px: 3, py: 3 }}>
                    {/* What I did — quote accent */}
                    <Box
                      sx={{
                        mb: 3,
                        pl: 2.5,
                        borderLeft: '3px solid',
                        borderColor: 'rgb(14,165,233)',
                      }}
                    >
                      <Typography
                        level="body-xs"
                        sx={{
                          color: 'text.tertiary',
                          fontSize: '0.68rem',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          opacity: 0.45,
                          mb: 0.75,
                        }}
                      >
                        what I did
                      </Typography>
                      <Typography level="body-sm" sx={{ color: 'text.secondary', lineHeight: 1.65, fontSize: '0.9rem' }}>
                        {ci.what_i_did}
                      </Typography>
                    </Box>

                    {/* AI Response */}
                    {ci.ai_response && (
                      <Box
                        sx={{
                          mb: 3,
                          px: 2.5,
                          py: 2,
                          borderRadius: '10px',
                          bgcolor: 'background.level1',
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Typography
                          level="body-xs"
                          sx={{
                            color: 'text.tertiary',
                            fontSize: '0.68rem',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            opacity: 0.4,
                            mb: 0.75,
                          }}
                        >
                          coach
                        </Typography>
                        <Typography
                          level="body-sm"
                          sx={{
                            color: 'text.tertiary',
                            lineHeight: 1.7,
                            fontSize: '0.875rem',
                            fontStyle: 'italic',
                            opacity: 0.75,
                          }}
                        >
                          {ci.ai_response}
                        </Typography>
                      </Box>
                    )}

                    {/* Media */}
                    {ci.media_url && (
                      <Box sx={{ mb: 3 }}>
                        {ci.media_url.match(/\.(mp4|mov|webm)$/i) ? (
                          <Box
                            component="video"
                            src={ci.media_url}
                            controls
                            sx={{
                              width: '100%',
                              borderRadius: '8px',
                              maxHeight: 260,
                              bgcolor: 'background.level2',
                              display: 'block',
                            }}
                          />
                        ) : (
                          <Box
                            component="img"
                            src={ci.media_url}
                            alt="check-in media"
                            sx={{
                              width: '100%',
                              borderRadius: '8px',
                              maxHeight: 260,
                              objectFit: 'cover',
                              display: 'block',
                            }}
                          />
                        )}
                      </Box>
                    )}

                    {/* Commitment */}
                    <Box>
                      <Typography
                        level="body-xs"
                        sx={{
                          color: 'text.tertiary',
                          fontSize: '0.68rem',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          opacity: 0.4,
                          mb: 0.75,
                        }}
                      >
                        committed to
                      </Typography>
                      <Typography
                        level="body-sm"
                        sx={{ color: 'text.tertiary', lineHeight: 1.6, fontSize: '0.875rem', opacity: 0.65 }}
                      >
                        {ci.commitment}
                      </Typography>
                    </Box>

                    {/* Social links */}
                    {ci.social_links && Object.keys(ci.social_links).length > 0 && (
                      <Box sx={{ mt: 2.5, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {Object.entries(ci.social_links).map(([platform, url]) =>
                          url ? (
                            <Box
                              key={platform}
                              component="a"
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{
                                px: 1.5,
                                py: 0.4,
                                borderRadius: '20px',
                                border: '1px solid',
                                borderColor: 'divider',
                                textDecoration: 'none',
                                transition: 'border-color 0.15s',
                                '&:hover': { borderColor: 'neutral.outlinedHoverBorder' },
                              }}
                            >
                              <Typography
                                level="body-xs"
                                sx={{
                                  color: 'text.tertiary',
                                  fontSize: '0.72rem',
                                  opacity: 0.6,
                                  textTransform: 'capitalize',
                                }}
                              >
                                {platform} ↗
                              </Typography>
                            </Box>
                          ) : null
                        )}
                      </Box>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* ── Focus Timer (floating) ── */}
        {goal.status === 'active' && <FocusTimer goalDescription={goal.description} />}

      </Box>
    </Box>
  )
}
