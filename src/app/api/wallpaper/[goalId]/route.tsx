import { ImageResponse } from 'next/og'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'edge'

const W = 1920
const H = 1080

interface Goal {
  id: string
  description: string
  current_streak: number
  deadline: string | null
  created_at: string
  last_checkin_date: string | null
}

export async function GET(
  _request: Request,
  { params }: { params: { goalId: string } }
) {
  const supabase = createAdminClient()

  const { data: goal, error } = await supabase
    .from('goals')
    .select('id, description, current_streak, deadline, created_at, last_checkin_date')
    .eq('id', params.goalId)
    .single()

  if (error || !goal) {
    return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
  }

  const g = goal as Goal

  const now = Date.now()
  const startMs = new Date(g.created_at).getTime()
  const daysSinceStart = Math.floor((now - startMs) / (1000 * 60 * 60 * 24))
  const dayNumber = daysSinceStart + 1

  let daysLeft: number | null = null
  let totalDays: number | null = null
  let progressPercent = 0

  if (g.deadline) {
    const deadlineMs = new Date(g.deadline).getTime()
    daysLeft = Math.max(0, Math.ceil((deadlineMs - now) / (1000 * 60 * 60 * 24)))
    totalDays = Math.ceil((deadlineMs - startMs) / (1000 * 60 * 60 * 24))
    progressPercent = totalDays > 0
      ? Math.min(100, Math.round((daysSinceStart / totalDays) * 100))
      : 0
  }

  const progressBarWidth = Math.round((progressPercent / 100) * W)

  // Truncate description to ~100 chars for display safety
  const desc = g.description.length > 100
    ? g.description.slice(0, 97) + '…'
    : g.description

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          background: '#0a0a0a',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          fontFamily: '"Inter","Helvetica Neue",system-ui,sans-serif',
          overflow: 'hidden',
        }}
      >
        {/* Diagonal gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(135deg, rgba(14,165,233,0.05) 0%, rgba(249,115,22,0.04) 100%)',
          }}
        />

        {/* Top-left: wordmark */}
        <div
          style={{
            position: 'absolute',
            top: 48,
            left: 64,
            color: 'rgba(255,255,255,0.3)',
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: '0.04em',
          }}
        >
          getalife
        </div>

        {/* Top-center: streak badge */}
        {g.current_streak > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 48,
              left: '50%',
              transform: 'translateX(-50%)',
              background:
                g.current_streak >= 7
                  ? 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)'
                  : 'rgba(255,255,255,0.06)',
              border: g.current_streak >= 7 ? 'none' : '1px solid rgba(255,255,255,0.12)',
              borderRadius: 40,
              padding: '10px 28px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                color: '#fff',
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '0.01em',
              }}
            >
              {g.current_streak >= 7 ? '🔥 ' : ''}{g.current_streak} day streak
            </span>
          </div>
        )}

        {/* Center: main content */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0,
            padding: '0 160px',
          }}
        >
          {/* Goal description */}
          <div
            style={{
              color: '#ffffff',
              fontSize: 54,
              fontWeight: 700,
              letterSpacing: '-0.025em',
              lineHeight: 1.25,
              textAlign: 'center',
              maxWidth: 1200,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              marginBottom: 40,
            }}
          >
            {desc}
          </div>

          {/* Day number in gradient */}
          <div
            style={{
              fontSize: 120,
              fontWeight: 700,
              letterSpacing: '-0.04em',
              lineHeight: 1,
              background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              marginBottom: daysLeft !== null ? 36 : 0,
            }}
          >
            Day {dayNumber}
          </div>

          {/* Days left pill */}
          {daysLeft !== null && (
            <div
              style={{
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 40,
                padding: '14px 36px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: 26,
                  fontWeight: 500,
                  letterSpacing: '0.01em',
                }}
              >
                {daysLeft === 0 ? 'deadline today' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}
              </span>
            </div>
          )}
        </div>

        {/* Bottom-right: URL watermark */}
        <div
          style={{
            position: 'absolute',
            bottom: g.deadline ? 56 : 48,
            right: 64,
            color: 'rgba(255,255,255,0.2)',
            fontSize: 18,
            fontWeight: 400,
            letterSpacing: '0.04em',
          }}
        >
          getalife.app
        </div>

        {/* Bottom progress bar (only when deadline set) */}
        {g.deadline && totalDays !== null && totalDays > 0 && (
          <>
            {/* Track */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: W,
                height: 6,
                background: 'rgba(255,255,255,0.06)',
              }}
            />
            {/* Fill */}
            {progressBarWidth > 0 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: progressBarWidth,
                  height: 6,
                  background:
                    'linear-gradient(90deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                }}
              />
            )}
          </>
        )}
      </div>
    ),
    {
      width: W,
      height: H,
    }
  )
}
