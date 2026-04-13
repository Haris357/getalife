'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import type { Goal } from '@/types'

interface Props {
  goal: Goal
}

export default function GoalCard({ goal }: Props) {
  const router = useRouter()
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const daysSince = Math.floor(
    (Date.now() - new Date(goal.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )
  const streak = goal.current_streak ?? 0
  const today = new Date().toISOString().split('T')[0]
  const checkedInToday = goal.last_checkin_date === today

  async function handleDelete() {
    setDeleting(true)
    try {
      await fetch(`/api/goals/${goal.id}`, { method: 'DELETE' })
      router.refresh()
    } catch {
      setDeleting(false)
      setShowDelete(false)
    }
  }

  return (
    <>
      <Box sx={{ position: 'relative', '&:hover .goal-delete': { opacity: 1 } }}>
        {/* Delete button — always visible on mobile, hover on desktop */}
        <Box
          className="goal-delete"
          component="button"
          onClick={() => setShowDelete(true)}
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 2,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            opacity: { xs: 0.45, md: 0 },
            transition: 'opacity 0.15s',
            p: 0.5,
            borderRadius: '4px',
            '&:hover': { bgcolor: 'background.level2' },
          }}
          title="Delete goal"
        >
          <Typography sx={{ fontSize: '0.75rem', color: 'text.tertiary', opacity: 0.5, lineHeight: 1 }}>
            ✕
          </Typography>
        </Box>

        <Link href={`/dashboard/goal/${goal.id}`} style={{ textDecoration: 'none', display: 'block' }}>
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '10px',
              px: 3,
              py: 2.5,
              bgcolor: 'background.surface',
              cursor: 'pointer',
              transition: 'border-color 0.15s, background 0.15s',
              '&:hover': {
                borderColor: 'text.tertiary',
                bgcolor: 'background.level1',
              },
            }}
          >
            <Typography
              level="body-md"
              sx={{
                color: 'text.secondary',
                mb: 2.5,
                lineHeight: 1.55,
                fontSize: '0.9rem',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                pr: 2,
              }}
            >
              {goal.description}
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '0.72rem', opacity: 0.6 }}>
                  day {daysSince + 1}
                </Typography>

                {streak > 0 && (
                  <>
                    <Box sx={{ width: '1px', height: 10, bgcolor: 'divider' }} />
                    <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '0.72rem', opacity: 0.6 }}>
                      {streak} day streak{streak >= 7 ? ' 🔥' : ''}
                    </Typography>
                  </>
                )}

                {goal.longest_streak > 0 && goal.longest_streak > streak && (
                  <>
                    <Box sx={{ width: '1px', height: 10, bgcolor: 'divider' }} />
                    <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '0.72rem', opacity: 0.35 }}>
                      best {goal.longest_streak}
                    </Typography>
                  </>
                )}
              </Box>

              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: checkedInToday ? 'success.500' : 'background.level3',
                  transition: 'background 0.15s',
                }}
              />
            </Box>
          </Box>
        </Link>
      </Box>

      <ConfirmDialog
        open={showDelete}
        title="giving up?"
        description={`all your check-ins, your streak, everything you built on "${goal.description.slice(0, 60)}${goal.description.length > 60 ? '…' : ''}" — gone forever. maybe it gets easier to quit next time too.`}
        confirmLabel="yeah, delete it"
        cancelLabel="i'm not quitting"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </>
  )
}
