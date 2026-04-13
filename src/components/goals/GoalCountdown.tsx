'use client'

import { useEffect, useRef, useState } from 'react'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Input from '@mui/joy/Input'
import GradientButton from '@/components/shared/GradientButton'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  ms: number
  total: number
}

function calcTimeLeft(deadline: string): TimeLeft {
  const total = new Date(deadline).getTime() - Date.now()
  if (total <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, ms: 0, total: 0 }
  const days = Math.floor(total / (1000 * 60 * 60 * 24))
  const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((total % (1000 * 60)) / 1000)
  const ms = Math.floor((total % 1000) / 10)
  return { days, hours, minutes, seconds, ms, total }
}

interface UnitProps {
  value: number
  label: string
  numSize: string | { xs: string; md: string }
  lblSize: string
  pad?: number
}

function CountUnit({ value, label, numSize, lblSize, pad = 2 }: UnitProps) {
  const display = String(value).padStart(pad, '0')
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      <Typography
        sx={{
          fontSize: numSize,
          fontWeight: 300,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          fontFamily: '"SF Pro Display","Helvetica Neue",system-ui,sans-serif',
          color: 'text.primary',
          minWidth: '2ch',
          textAlign: 'center',
        }}
      >
        {display}
      </Typography>
      <Typography
        sx={{
          fontSize: lblSize,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'text.tertiary',
          opacity: 0.4,
          lineHeight: 1,
          mt: 0.5,
          fontFamily: 'inherit',
        }}
      >
        {label}
      </Typography>
    </Box>
  )
}

function Sep({ size }: { size: string | { xs: string; md: string } }) {
  return (
    <Typography
      sx={{
        fontSize: size,
        fontWeight: 100,
        color: 'text.tertiary',
        opacity: 0.15,
        lineHeight: 1,
        mt: '-0.15em',
        px: { xs: 0.25, md: 0.5 },
        fontFamily: '"SF Pro Display","Helvetica Neue",system-ui,sans-serif',
      }}
    >
      :
    </Typography>
  )
}

interface Props {
  goalId: string
  deadline: string | null
  goalDescription: string
}

export default function GoalCountdown({ goalId, deadline: initialDeadline, goalDescription }: Props) {
  const [deadline, setDeadline] = useState(initialDeadline)
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(
    initialDeadline ? calcTimeLeft(initialDeadline) : null
  )
  const [editing, setEditing] = useState(!initialDeadline)
  const [dateInput, setDateInput] = useState(
    initialDeadline ? initialDeadline.split('T')[0] : ''
  )
  const [saving, setSaving] = useState(false)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!deadline) return
    function tick() {
      setTimeLeft(calcTimeLeft(deadline!))
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) }
  }, [deadline])

  async function handleSaveDeadline() {
    if (!dateInput) return
    setSaving(true)
    const iso = new Date(dateInput + 'T23:59:59').toISOString()
    try {
      const res = await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deadline: iso }),
      })
      if (res.ok) { setDeadline(iso); setEditing(false) }
    } finally { setSaving(false) }
  }

  const expired = timeLeft !== null && timeLeft.total <= 0

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <Typography
        level="body-xs"
        sx={{
          color: 'text.tertiary', opacity: 0.4, fontSize: '0.75rem',
          textAlign: 'center', maxWidth: 340, lineHeight: 1.55,
          mb: deadline ? 5 : 3, px: 2,
        }}
      >
        {goalDescription}
      </Typography>

      {(editing || !deadline) && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, mb: 5, width: '100%', maxWidth: 260 }}>
          <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.45, fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            set your deadline
          </Typography>
          <Input
            type="date"
            value={dateInput}
            onChange={e => setDateInput(e.target.value)}
            slotProps={{ input: { min: new Date().toISOString().split('T')[0] } }}
            sx={{ width: '100%', bgcolor: 'background.surface', border: '1px solid', borderColor: 'divider', borderRadius: '8px', fontSize: '0.9rem', '--Input-focusedThickness': '0px', '&:focus-within': { borderColor: 'text.tertiary' } }}
          />
          <GradientButton size="sm" disabled={!dateInput} loading={saving} onClick={handleSaveDeadline} fullWidth>
            set deadline →
          </GradientButton>
          {deadline && (
            <Box component="button" onClick={() => setEditing(false)} sx={{ background: 'none', border: 'none', cursor: 'pointer', p: 0 }}>
              <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.3, fontSize: '0.72rem', '&:hover': { opacity: 0.7 } }}>cancel</Typography>
            </Box>
          )}
        </Box>
      )}

      {deadline && timeLeft && !editing && (
        <>
          {expired ? (
            <Box sx={{ textAlign: 'center', mb: 5 }}>
              <Typography sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' }, fontWeight: 200, color: 'text.primary', letterSpacing: '-0.03em', fontFamily: '"SF Pro Display","Helvetica Neue",system-ui,sans-serif' }}>
                time&apos;s up
              </Typography>
              <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.35, mt: 1, mb: 3 }}>deadline has passed</Typography>
              <Box
                component="button"
                onClick={() => { setEditing(true); setDateInput('') }}
                sx={{
                  background: 'none', border: '1px solid', borderColor: 'divider',
                  cursor: 'pointer', px: 2.5, py: 1, borderRadius: '20px',
                  '&:hover': { borderColor: 'text.tertiary' }, transition: 'border-color 0.15s',
                }}
              >
                <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '0.78rem' }}>
                  set new deadline →
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: { xs: 0.5, md: 1 }, mb: 5, flexWrap: 'nowrap', justifyContent: 'center' }}>
              <CountUnit value={timeLeft.days}    label="days"  numSize={{ xs: '3.5rem', md: '5rem' }}   lblSize="0.58rem" pad={timeLeft.days >= 100 ? 3 : 2} />
              <Sep size={{ xs: '3rem', md: '4.5rem' }} />
              <CountUnit value={timeLeft.hours}   label="hrs"   numSize={{ xs: '2.4rem', md: '3.4rem' }} lblSize="0.56rem" />
              <Sep size={{ xs: '2rem', md: '3rem' }} />
              <CountUnit value={timeLeft.minutes} label="min"   numSize={{ xs: '1.7rem', md: '2.4rem' }} lblSize="0.54rem" />
              <Sep size={{ xs: '1.4rem', md: '2rem' }} />
              <CountUnit value={timeLeft.seconds} label="sec"   numSize={{ xs: '1.2rem', md: '1.7rem' }} lblSize="0.52rem" />
              <Sep size={{ xs: '1rem', md: '1.4rem' }} />
              <CountUnit value={timeLeft.ms}      label="ms"    numSize={{ xs: '0.85rem', md: '1.1rem' }} lblSize="0.5rem" />
            </Box>
          )}

          <Box component="button" onClick={() => { setEditing(true); setDateInput(deadline.split('T')[0]) }}
            sx={{ background: 'none', border: 'none', cursor: 'pointer', p: 0, mb: 3 }}>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.25, fontSize: '0.7rem', '&:hover': { opacity: 0.6 }, transition: 'opacity 0.15s' }}>
              change deadline
            </Typography>
          </Box>
        </>
      )}
    </Box>
  )
}
