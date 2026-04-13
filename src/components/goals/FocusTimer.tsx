'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'

interface Props {
  goalDescription: string
}

type Phase = 'focus' | 'break'
type TimerState = 'idle' | 'running' | 'paused' | 'break' | 'done'

const FOCUS_DURATION = 25 * 60 // 25 min in seconds
const BREAK_DURATION = 5 * 60  // 5 min in seconds

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function FocusTimer({ goalDescription }: Props) {
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [phase, setPhase] = useState<Phase>('focus')
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_DURATION)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Tick logic
  useEffect(() => {
    if (timerState !== 'running') {
      clearTimer()
      return
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          intervalRef.current = null

          if (phase === 'focus') {
            // Session complete — transition to break
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification('Focus session complete!', {
                body: 'Great work — take a 5-minute break.',
                icon: '/icon-192.png',
              })
            }
            setPhase('break')
            setTimerState('break')
            return BREAK_DURATION
          } else {
            // Break over — done
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification('Break over!', {
                body: 'Ready for another round?',
                icon: '/icon-192.png',
              })
            }
            setTimerState('done')
            return 0
          }
        }
        return prev - 1
      })
    }, 1000)

    return () => clearTimer()
  }, [timerState, phase, clearTimer])

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimer()
  }, [clearTimer])

  function requestNotificationPermission() {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {/* ignore */})
    }
  }

  function handleStart() {
    requestNotificationPermission()
    setPhase('focus')
    setSecondsLeft(FOCUS_DURATION)
    setTimerState('running')
  }

  function handlePause() {
    setTimerState('paused')
  }

  function handleResume() {
    setTimerState('running')
  }

  function handleSkip() {
    clearTimer()
    if (phase === 'focus') {
      setPhase('break')
      setTimerState('break')
      setSecondsLeft(BREAK_DURATION)
    } else {
      setTimerState('done')
    }
  }

  function handleEnd() {
    clearTimer()
    setTimerState('idle')
    setPhase('focus')
    setSecondsLeft(FOCUS_DURATION)
  }

  const truncatedGoal =
    goalDescription.length > 80 ? goalDescription.slice(0, 77) + '...' : goalDescription

  // ── Idle state: floating pill button ──────────────────────────────
  if (timerState === 'idle') {
    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: 24, md: 32 },
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
        }}
      >
        <Box
          component="button"
          onClick={handleStart}
          sx={{
            px: 3,
            py: 1.25,
            borderRadius: '999px',
            background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 24px rgba(14,165,233,0.35)',
            transition: 'box-shadow 0.2s, transform 0.15s',
            '&:hover': {
              boxShadow: '0 6px 32px rgba(14,165,233,0.5)',
              transform: 'translateY(-1px)',
            },
            '&:active': { transform: 'translateY(0)' },
          }}
        >
          <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
            start focus session
          </Typography>
        </Box>
      </Box>
    )
  }

  // ── Done state: full-screen overlay ───────────────────────────────
  if (timerState === 'done') {
    return (
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          bgcolor: '#0a0a0a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          px: 4,
        }}
      >
        <Typography
          sx={{
            fontSize: '0.72rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#fff',
            opacity: 0.35,
          }}
        >
          getalife focus mode
        </Typography>

        <Typography
          sx={{
            fontSize: { xs: '1.6rem', md: '2rem' },
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: '#fff',
            textAlign: 'center',
          }}
        >
          session complete!
        </Typography>

        <Typography sx={{ color: '#fff', opacity: 0.5, fontSize: '0.95rem', textAlign: 'center' }}>
          great work — go log what you did.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', mt: 2 }}>
          <Link href="checkin" style={{ textDecoration: 'none' }}>
            <Box
              sx={{
                px: 3,
                py: 1.25,
                borderRadius: '999px',
                background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                cursor: 'pointer',
              }}
            >
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>
                go check in →
              </Typography>
            </Box>
          </Link>
          <Box
            component="button"
            onClick={handleEnd}
            sx={{
              px: 3,
              py: 1.25,
              borderRadius: '999px',
              bgcolor: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              cursor: 'pointer',
              transition: 'border-color 0.15s',
              '&:hover': { borderColor: 'rgba(255,255,255,0.4)' },
            }}
          >
            <Typography sx={{ color: '#fff', opacity: 0.55, fontSize: '0.9rem' }}>
              close
            </Typography>
          </Box>
        </Box>
      </Box>
    )
  }

  // ── Running / Paused / Break: full-screen overlay ─────────────────
  const isBreak = timerState === 'break' || phase === 'break'
  const phaseLabel = isBreak ? 'break · 5 min' : 'focus · 25 min'

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        bgcolor: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        px: 4,
      }}
    >
      {/* Label */}
      <Typography
        sx={{
          fontSize: '0.72rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#fff',
          opacity: 0.35,
        }}
      >
        getalife focus mode
      </Typography>

      {/* Goal description */}
      <Typography
        sx={{
          fontSize: '0.95rem',
          color: '#fff',
          opacity: 0.5,
          textAlign: 'center',
          maxWidth: 420,
          lineHeight: 1.55,
        }}
      >
        &ldquo;{truncatedGoal}&rdquo;
      </Typography>

      {/* Break message */}
      {isBreak && (
        <Typography
          sx={{
            fontSize: '0.85rem',
            color: '#fff',
            opacity: 0.4,
            textAlign: 'center',
          }}
        >
          great work — rest up
        </Typography>
      )}

      {/* Giant countdown */}
      <Typography
        sx={{
          fontSize: { xs: '5rem', md: '7rem' },
          fontWeight: 700,
          letterSpacing: '-0.05em',
          lineHeight: 1,
          background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontVariantNumeric: 'tabular-nums',
          my: 1,
        }}
      >
        {formatTime(secondsLeft)}
      </Typography>

      {/* Phase label */}
      <Typography
        sx={{
          fontSize: '0.78rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#fff',
          opacity: 0.3,
        }}
      >
        {timerState === 'paused' ? 'paused' : phaseLabel}
      </Typography>

      {/* Controls */}
      <Box sx={{ display: 'flex', gap: 1.5, mt: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
        {timerState === 'paused' ? (
          <Box
            component="button"
            onClick={handleResume}
            sx={{
              px: 2.5,
              py: 1,
              borderRadius: '999px',
              background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.875rem' }}>
              resume
            </Typography>
          </Box>
        ) : (
          <Box
            component="button"
            onClick={handlePause}
            sx={{
              px: 2.5,
              py: 1,
              borderRadius: '999px',
              bgcolor: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              cursor: 'pointer',
              transition: 'border-color 0.15s',
              '&:hover': { borderColor: 'rgba(255,255,255,0.45)' },
            }}
          >
            <Typography sx={{ color: '#fff', opacity: 0.7, fontSize: '0.875rem' }}>
              pause
            </Typography>
          </Box>
        )}

        <Box
          component="button"
          onClick={handleSkip}
          sx={{
            px: 2.5,
            py: 1,
            borderRadius: '999px',
            bgcolor: 'transparent',
            border: '1px solid rgba(255,255,255,0.12)',
            cursor: 'pointer',
            transition: 'border-color 0.15s',
            '&:hover': { borderColor: 'rgba(255,255,255,0.3)' },
          }}
        >
          <Typography sx={{ color: '#fff', opacity: 0.45, fontSize: '0.875rem' }}>
            skip
          </Typography>
        </Box>

        <Box
          component="button"
          onClick={handleEnd}
          sx={{
            px: 2.5,
            py: 1,
            borderRadius: '999px',
            bgcolor: 'transparent',
            border: '1px solid rgba(255,255,255,0.12)',
            cursor: 'pointer',
            transition: 'border-color 0.15s',
            '&:hover': { borderColor: 'rgba(255,255,255,0.3)' },
          }}
        >
          <Typography sx={{ color: '#fff', opacity: 0.35, fontSize: '0.875rem' }}>
            end session
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
