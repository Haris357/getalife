'use client'

import { useState } from 'react'
import Box from '@mui/joy/Box'
import Button from '@mui/joy/Button'
import Typography from '@mui/joy/Typography'
import type { PodMember } from '@/types'

interface AvailableCoach {
  id: string
  display_name: string | null
  avatar_url: string | null
  level: number | null
  title: string | null
  xp: number | null
  coachee_count: number
}

interface Props {
  initialIsCoach: boolean
  initialCoachees: PodMember[]
  myCoach: AvailableCoach | null
  availableCoaches: AvailableCoach[]
}

function AvatarCircle({ name, avatarUrl }: { name: string | null; avatarUrl: string | null }) {
  if (avatarUrl) {
    return (
      <Box
        component="img"
        src={avatarUrl}
        alt={name ?? 'user'}
        sx={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }
  const initials = (name ?? '?').slice(0, 2).toUpperCase()
  return (
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#fff' }}>{initials}</Typography>
    </Box>
  )
}

export default function CoachPageClient({
  initialIsCoach,
  initialCoachees,
  myCoach: initialMyCoach,
  availableCoaches: initialAvailable,
}: Props) {
  const [isCoach, setIsCoach] = useState(initialIsCoach)
  const [toggling, setToggling] = useState(false)
  const [myCoach, setMyCoach] = useState<AvailableCoach | null>(initialMyCoach)
  const [availableCoaches] = useState<AvailableCoach[]>(initialAvailable)
  const [requesting, setRequesting] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)

  async function toggleCoach() {
    setToggling(true)
    const next = !isCoach
    const res = await fetch('/api/coach', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_coach: next }),
    })
    if (res.ok) setIsCoach(next)
    setToggling(false)
  }

  async function requestCoach(coach: AvailableCoach) {
    setRequesting(coach.id)
    const res = await fetch('/api/coach/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coach_id: coach.id }),
    })
    if (res.ok) setMyCoach(coach)
    setRequesting(null)
  }

  async function removeCoach() {
    if (!myCoach) return
    setRemoving(true)
    const res = await fetch('/api/coach/request', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coach_id: myCoach.id }),
    })
    if (res.ok) setMyCoach(null)
    setRemoving(false)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

      {/* ── Section A: Be a Coach ── */}
      <Box
        sx={{
          bgcolor: 'background.surface',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        {/* Gradient accent top bar */}
        <Box
          sx={{
            height: 3,
            background: 'linear-gradient(90deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
          }}
        />
        <Box sx={{ px: 3, py: 3 }}>
          <Typography
            level="body-xs"
            sx={{
              color: 'text.tertiary',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontSize: '0.62rem',
              opacity: 0.5,
              mb: 2,
            }}
          >
            be a coach
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: isCoach ? 3 : 0 }}>
            <Box sx={{ flex: 1 }}>
              <Typography level="body-sm" sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.9rem' }}>
                {isCoach ? 'you are a coach' : 'become an accountability coach'}
              </Typography>
              <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.55, fontSize: '0.78rem', lineHeight: 1.5 }}>
                {isCoach
                  ? 'you\'ll get notified when your coachees check in or miss a day'
                  : 'get notified when someone you\'re coaching checks in or misses a day'}
              </Typography>
              {!isCoach && (
                <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.35, fontSize: '0.72rem', mt: 1 }}>
                  coaches typically have 50+ total check-ins
                </Typography>
              )}
            </Box>

            <Button
              size="sm"
              variant="outlined"
              loading={toggling}
              onClick={toggleCoach}
              sx={{
                borderRadius: '20px',
                fontWeight: 600,
                fontSize: '0.78rem',
                px: 2.5,
                flexShrink: 0,
                borderColor: isCoach ? 'rgba(249,115,22,0.35)' : 'divider',
                color: isCoach ? 'rgb(249,115,22)' : 'text.secondary',
                bgcolor: isCoach ? 'rgba(249,115,22,0.06)' : 'transparent',
                '&:hover': {
                  borderColor: isCoach ? 'rgba(249,115,22,0.6)' : 'neutral.outlinedHoverBorder',
                  bgcolor: isCoach ? 'rgba(249,115,22,0.1)' : 'background.level1',
                },
                transition: 'all 0.15s',
              }}
            >
              {isCoach ? 'stop coaching' : 'become a coach'}
            </Button>
          </Box>

          {/* Coachees list */}
          {isCoach && initialCoachees.length > 0 && (
            <Box>
              <Typography
                level="body-xs"
                sx={{ color: 'text.tertiary', opacity: 0.45, fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1.5 }}
              >
                your coachees · {initialCoachees.length}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {initialCoachees.map((coachee) => (
                  <Box
                    key={coachee.user_id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1.5,
                      borderRadius: '10px',
                      bgcolor: 'background.level1',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <AvatarCircle name={coachee.display_name} avatarUrl={coachee.avatar_url} />
                    <Box sx={{ flex: 1 }}>
                      <Typography level="body-sm" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                        {coachee.display_name ?? 'anonymous'}
                      </Typography>
                      {coachee.title && (
                        <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.5, fontSize: '0.72rem' }}>
                          {coachee.title}
                        </Typography>
                      )}
                    </Box>
                    {coachee.level && (
                      <Box
                        sx={{
                          px: 1.25,
                          py: 0.3,
                          borderRadius: '20px',
                          background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                        }}
                      >
                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#fff' }}>
                          lv {coachee.level}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {isCoach && initialCoachees.length === 0 && (
            <Box sx={{ p: 2, borderRadius: '10px', bgcolor: 'background.level1', border: '1px solid', borderColor: 'divider' }}>
              <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.4, fontSize: '0.78rem' }}>
                no coachees yet — they'll appear here when someone requests you
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* ── Section B: Find a Coach ── */}
      <Box
        sx={{
          bgcolor: 'background.surface',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            height: 3,
            background: 'linear-gradient(90deg, rgb(249,115,22) 0%, rgb(14,165,233) 100%)',
          }}
        />
        <Box sx={{ px: 3, py: 3 }}>
          <Typography
            level="body-xs"
            sx={{
              color: 'text.tertiary',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontSize: '0.62rem',
              opacity: 0.5,
              mb: 2,
            }}
          >
            find a coach
          </Typography>

          {myCoach ? (
            <Box>
              <Typography level="body-sm" sx={{ fontWeight: 600, mb: 2, fontSize: '0.9rem' }}>
                your coach
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: '10px',
                  bgcolor: 'background.level1',
                  border: '1px solid',
                  borderColor: 'rgba(14,165,233,0.25)',
                }}
              >
                <AvatarCircle name={myCoach.display_name} avatarUrl={myCoach.avatar_url} />
                <Box sx={{ flex: 1 }}>
                  <Typography level="body-sm" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    {myCoach.display_name ?? 'anonymous'}
                  </Typography>
                  {myCoach.title && (
                    <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.5, fontSize: '0.72rem' }}>
                      {myCoach.title}
                    </Typography>
                  )}
                </Box>
                {myCoach.level && (
                  <Box
                    sx={{
                      px: 1.25,
                      py: 0.3,
                      borderRadius: '20px',
                      background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                    }}
                  >
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#fff' }}>
                      lv {myCoach.level}
                    </Typography>
                  </Box>
                )}
                <Button
                  size="sm"
                  variant="outlined"
                  loading={removing}
                  onClick={removeCoach}
                  sx={{
                    borderRadius: '20px',
                    fontWeight: 600,
                    fontSize: '0.72rem',
                    px: 2,
                    borderColor: 'divider',
                    color: 'text.tertiary',
                    '&:hover': { borderColor: 'danger.300', color: 'danger.500', bgcolor: 'danger.softBg' },
                    transition: 'all 0.15s',
                  }}
                >
                  remove
                </Button>
              </Box>
            </Box>
          ) : (
            <Box>
              <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.55, fontSize: '0.78rem', mb: 2, lineHeight: 1.5 }}>
                choose an accountability coach — they'll be notified when you check in or miss a day
              </Typography>

              {availableCoaches.length === 0 ? (
                <Box sx={{ p: 2, borderRadius: '10px', bgcolor: 'background.level1', border: '1px solid', borderColor: 'divider' }}>
                  <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.4, fontSize: '0.78rem' }}>
                    no coaches available right now — check back later
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {availableCoaches.map((coach) => (
                    <Box
                      key={coach.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: '10px',
                        bgcolor: 'background.level1',
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': { borderColor: 'neutral.outlinedHoverBorder' },
                        transition: 'border-color 0.15s',
                      }}
                    >
                      <AvatarCircle name={coach.display_name} avatarUrl={coach.avatar_url} />
                      <Box sx={{ flex: 1 }}>
                        <Typography level="body-sm" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          {coach.display_name ?? 'anonymous'}
                        </Typography>
                        <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.45, fontSize: '0.7rem' }}>
                          {coach.coachee_count} {coach.coachee_count === 1 ? 'coachee' : 'coachees'}
                          {coach.title ? ` · ${coach.title}` : ''}
                        </Typography>
                      </Box>
                      {coach.level && (
                        <Box
                          sx={{
                            px: 1.25,
                            py: 0.3,
                            borderRadius: '20px',
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: 'text.secondary' }}>
                            lv {coach.level}
                          </Typography>
                        </Box>
                      )}
                      <Button
                        size="sm"
                        variant="outlined"
                        loading={requesting === coach.id}
                        disabled={requesting !== null && requesting !== coach.id}
                        onClick={() => requestCoach(coach)}
                        sx={{
                          borderRadius: '20px',
                          fontWeight: 600,
                          fontSize: '0.72rem',
                          px: 2,
                          borderColor: 'rgba(14,165,233,0.35)',
                          color: 'rgb(14,165,233)',
                          bgcolor: 'rgba(14,165,233,0.05)',
                          '&:hover': {
                            borderColor: 'rgba(14,165,233,0.6)',
                            bgcolor: 'rgba(14,165,233,0.1)',
                          },
                          transition: 'all 0.15s',
                        }}
                      >
                        request
                      </Button>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}
