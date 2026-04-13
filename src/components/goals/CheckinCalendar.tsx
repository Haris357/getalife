'use client'

import { useMemo, useState } from 'react'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import type { CheckIn } from '@/types'

interface Props {
  checkIns: CheckIn[]
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY_LABELS: Record<number, string> = { 1: 'M', 3: 'W', 5: 'F' }

function lerpColor(t: number): string {
  // Blue rgb(14,165,233) → Orange rgb(249,115,22)
  const r = Math.round(14 + (249 - 14) * t)
  const g = Math.round(165 + (115 - 165) * t)
  const b = Math.round(233 + (22 - 233) * t)
  return `rgba(${r},${g},${b},0.9)`
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function CheckinCalendar({ checkIns }: Props) {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null)

  const { weeks, monthPositions, totalCheckIns, currentYear } = useMemo(() => {
    const checkInSet = new Set(checkIns.map(ci => ci.date))
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Start from the most recent Sunday going back 52 weeks (364 days)
    // Align start to Monday of 52 weeks ago
    const msPerDay = 86400000
    const totalDays = 364

    // Find the Monday 364 days ago
    const startDate = new Date(today.getTime() - (totalDays - 1) * msPerDay)
    // Adjust to Monday
    const startDow = startDate.getDay() // 0=Sun
    const daysBack = startDow === 0 ? 6 : startDow - 1
    startDate.setTime(startDate.getTime() - daysBack * msPerDay)

    // Build weeks array: each week is 7 days (Mon=0 → Sun=6)
    const weeksArr: Array<Array<{ dateStr: string; hasCheckIn: boolean } | null>> = []
    let cur = new Date(startDate)

    while (cur <= today) {
      const week: Array<{ dateStr: string; hasCheckIn: boolean } | null> = []
      for (let d = 0; d < 7; d++) {
        const cellDate = new Date(cur.getTime() + d * msPerDay)
        if (cellDate > today) {
          week.push(null)
        } else {
          const dateStr = cellDate.toISOString().split('T')[0]
          week.push({ dateStr, hasCheckIn: checkInSet.has(dateStr) })
        }
      }
      weeksArr.push(week)
      cur.setTime(cur.getTime() + 7 * msPerDay)
    }

    // Build month label positions
    const monthPos: Array<{ label: string; col: number }> = []
    let lastMonth = -1
    weeksArr.forEach((week, colIdx) => {
      const firstDay = week.find(d => d !== null)
      if (!firstDay) return
      const m = new Date(firstDay.dateStr + 'T00:00:00').getMonth()
      if (m !== lastMonth) {
        monthPos.push({ label: MONTH_LABELS[m], col: colIdx })
        lastMonth = m
      }
    })

    return {
      weeks: weeksArr,
      monthPositions: monthPos,
      totalCheckIns: checkInSet.size,
      currentYear: today.getFullYear(),
    }
  }, [checkIns])

  const CELL = 10
  const GAP = 2
  const STEP = CELL + GAP
  const LEFT_OFFSET = 18 // space for day labels
  const TOP_OFFSET = 20  // space for month labels

  const gridWidth = weeks.length * STEP - GAP
  const gridHeight = 7 * STEP - GAP

  return (
    <Box sx={{ mb: 6 }}>
      <Typography
        level="body-xs"
        sx={{
          color: 'text.tertiary',
          mb: 3,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontSize: '0.68rem',
          opacity: 0.45,
        }}
      >
        your activity
      </Typography>

      {/* Scrollable container */}
      <Box
        sx={{
          overflowX: 'auto',
          pb: 1,
          // Hide scrollbar but keep functionality
          '&::-webkit-scrollbar': { height: 4 },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 2 },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            display: 'inline-block',
            pl: `${LEFT_OFFSET}px`,
            pt: `${TOP_OFFSET}px`,
          }}
        >
          {/* Month labels */}
          {monthPositions.map(({ label, col }) => (
            <Typography
              key={`${label}-${col}`}
              sx={{
                position: 'absolute',
                top: 0,
                left: LEFT_OFFSET + col * STEP,
                fontSize: '0.6rem',
                color: 'text.tertiary',
                opacity: 0.45,
                lineHeight: 1,
                userSelect: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </Typography>
          ))}

          {/* Day labels */}
          {[0, 1, 2, 3, 4, 5, 6].map(dayIdx => (
            DAY_LABELS[dayIdx] ? (
              <Typography
                key={dayIdx}
                sx={{
                  position: 'absolute',
                  top: TOP_OFFSET + dayIdx * STEP,
                  left: 0,
                  width: LEFT_OFFSET - 4,
                  fontSize: '0.58rem',
                  color: 'text.tertiary',
                  opacity: 0.4,
                  lineHeight: `${CELL}px`,
                  textAlign: 'right',
                  userSelect: 'none',
                }}
              >
                {DAY_LABELS[dayIdx]}
              </Typography>
            ) : null
          ))}

          {/* Grid */}
          <Box
            sx={{
              position: 'relative',
              width: gridWidth,
              height: gridHeight,
            }}
          >
            {weeks.map((week, colIdx) =>
              week.map((cell, rowIdx) => {
                if (cell === null) return null
                const x = colIdx * STEP
                const y = rowIdx * STEP
                // Color based on column position for gradient feel
                const t = colIdx / Math.max(weeks.length - 1, 1)
                const color = cell.hasCheckIn
                  ? lerpColor(t)
                  : undefined

                return (
                  <Box
                    key={`${colIdx}-${rowIdx}`}
                    onMouseEnter={(e) => {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                      setTooltip({
                        text: `${formatDateLabel(cell.dateStr)} — ${cell.hasCheckIn ? 'checked in' : 'no check-in'}`,
                        x: rect.left + rect.width / 2,
                        y: rect.top - 8,
                      })
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    sx={{
                      position: 'absolute',
                      left: x,
                      top: y,
                      width: CELL,
                      height: CELL,
                      borderRadius: '2px',
                      bgcolor: cell.hasCheckIn
                        ? undefined
                        : (theme) =>
                            theme.palette.mode === 'dark'
                              ? 'rgba(255,255,255,0.04)'
                              : 'rgba(0,0,0,0.06)',
                      background: cell.hasCheckIn ? color : undefined,
                      cursor: 'default',
                      transition: 'transform 0.1s',
                      '&:hover': {
                        transform: 'scale(1.3)',
                        zIndex: 1,
                      },
                    }}
                  />
                )
              })
            )}
          </Box>
        </Box>
      </Box>

      {/* Stats row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 2 }}>
        <Typography
          level="body-xs"
          sx={{ color: 'text.tertiary', fontSize: '0.7rem', opacity: 0.5 }}
        >
          {totalCheckIns} check-in{totalCheckIns !== 1 ? 's' : ''} in {currentYear}
        </Typography>
        <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider', opacity: 0.4 }} />
      </Box>

      {/* Fixed tooltip rendered in portal-like fixed positioning */}
      {tooltip && (
        <Box
          sx={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
            zIndex: 9999,
            bgcolor: 'background.surface',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '6px',
            px: 1.25,
            py: 0.5,
            pointerEvents: 'none',
            boxShadow: 'sm',
          }}
        >
          <Typography
            level="body-xs"
            sx={{ fontSize: '0.7rem', color: 'text.secondary', whiteSpace: 'nowrap' }}
          >
            {tooltip.text}
          </Typography>
        </Box>
      )}
    </Box>
  )
}
