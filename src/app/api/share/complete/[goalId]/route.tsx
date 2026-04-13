export const runtime = 'edge'

import { ImageResponse } from 'next/og'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _req: Request,
  { params }: { params: { goalId: string } }
) {
  const supabase = createAdminClient()

  const [{ data: goal }, { count: checkInCount }] = await Promise.all([
    supabase
      .from('goals')
      .select('description, current_streak, created_at, status')
      .eq('id', params.goalId)
      .single(),
    supabase
      .from('check_ins')
      .select('id', { count: 'exact', head: true })
      .eq('goal_id', params.goalId),
  ])

  if (!goal) {
    return new Response('Not Found', { status: 404 })
  }

  const daysSinceStart = Math.floor(
    (Date.now() - new Date(goal.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )
  const totalDays = daysSinceStart + 1
  const totalCheckIns = checkInCount ?? 0
  const streak = goal.current_streak ?? 0

  // Truncate description to ~80 chars for 2-line display
  const desc =
    goal.description.length > 80
      ? goal.description.slice(0, 78) + '…'
      : goal.description

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: '#0a0a0a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          fontFamily: 'sans-serif',
          overflow: 'hidden',
        }}
      >
        {/* Gradient overlay blob */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            left: -120,
            width: 600,
            height: 600,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(14,165,233,0.18) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -140,
            right: -100,
            width: 580,
            height: 580,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)',
          }}
        />

        {/* Wordmark top-left */}
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 52,
            fontSize: 22,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.25)',
            letterSpacing: '-0.03em',
          }}
        >
          getalife
        </div>

        {/* Center content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 28,
            padding: '0 80px',
          }}
        >
          {/* Checkmark circle */}
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              background:
                'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 48px rgba(14,165,233,0.35)',
            }}
          >
            <svg
              width="44"
              height="44"
              viewBox="0 0 44 44"
              fill="none"
            >
              <path
                d="M9 22L18 31L35 14"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Goal Achieved heading */}
          <div
            style={{
              fontSize: 52,
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.035em',
              lineHeight: 1.1,
            }}
          >
            Goal Achieved
          </div>

          {/* Goal description */}
          <div
            style={{
              fontSize: 28,
              color: 'rgba(255,255,255,0.72)',
              fontWeight: 500,
              textAlign: 'center',
              lineHeight: 1.4,
              maxWidth: 820,
            }}
          >
            {desc}
          </div>

          {/* Stats row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginTop: 8,
            }}
          >
            {[
              `${totalDays} day${totalDays !== 1 ? 's' : ''}`,
              `${totalCheckIns} check-in${totalCheckIns !== 1 ? 's' : ''}`,
              `${streak} day streak`,
            ].map((stat, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {i > 0 && (
                  <div
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.25)',
                    }}
                  />
                )}
                <div
                  style={{
                    fontSize: 20,
                    color: 'rgba(255,255,255,0.5)',
                    fontWeight: 600,
                    letterSpacing: '0.01em',
                  }}
                >
                  {stat}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom watermark */}
        <div
          style={{
            position: 'absolute',
            bottom: 36,
            right: 52,
            fontSize: 16,
            color: 'rgba(255,255,255,0.2)',
            fontWeight: 600,
            letterSpacing: '0.02em',
          }}
        >
          getalife.app
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
