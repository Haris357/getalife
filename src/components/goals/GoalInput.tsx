'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/joy/Box'
import Input from '@mui/joy/Input'
import Textarea from '@mui/joy/Textarea'
import Typography from '@mui/joy/Typography'
import Skeleton from '@mui/joy/Skeleton'
import Switch from '@mui/joy/Switch'
import GradientButton from '@/components/shared/GradientButton'
import type { RoadmapPhase } from '@/types'

type Phase = 'input' | 'generating' | 'review'

const SKELETON_WIDTHS = ['60%', '80%', '50%', '70%', '65%', '75%', '55%', '68%', '72%', '58%']

function RoadmapSkeleton() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {[0, 1, 2].map((p) => (
        <Box key={p} sx={{ animation: `fadeInUp 0.3s ease both`, animationDelay: `${p * 80}ms`, '@keyframes fadeInUp': { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
          <Skeleton variant="text" level="body-xs" sx={{ width: '30%', mb: 1 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {SKELETON_WIDTHS.slice(p * 3, p * 3 + 3).map((w, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Skeleton variant="rectangular" width={4} height={4} sx={{ borderRadius: '50%', flexShrink: 0 }} />
                <Skeleton variant="text" level="body-sm" sx={{ width: w }} />
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  )
}

interface PhaseCardProps {
  phase: RoadmapPhase
  index: number
}

function PhaseCard({ phase, index }: PhaseCardProps) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 80)
    return () => clearTimeout(t)
  }, [index])

  return (
    <Box
      sx={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
        pb: 4,
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:last-child': { borderBottom: 'none', pb: 0 },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mb: 1.25 }}>
        <Typography
          sx={{
            color: 'text.tertiary',
            fontSize: '0.68rem',
            fontFamily: '-apple-system, sans-serif',
            opacity: 0.3,
            letterSpacing: '0.05em',
            flexShrink: 0,
          }}
        >
          {String(index + 1).padStart(2, '0')}
        </Typography>
        <Typography level="body-sm" sx={{ color: 'text.primary', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '-0.01em' }}>
          {phase.title}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6, pl: '2.2rem' }}>
        {phase.focus.map((item, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Typography sx={{ color: 'text.tertiary', opacity: 0.35, fontSize: '0.75rem', lineHeight: 1.6, flexShrink: 0 }}>
              —
            </Typography>
            <Typography level="body-sm" sx={{ color: 'text.tertiary', fontSize: '0.875rem', lineHeight: 1.55, opacity: 0.75 }}>
              {item}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

interface GoalInputProps {
  hasActiveGoal?: boolean
}

export default function GoalInput({ hasActiveGoal = false }: GoalInputProps) {
  const router = useRouter()
  const [description, setDescription] = useState('')
  const [phase, setPhase] = useState<Phase>('input')
  const [roadmap, setRoadmap] = useState<RoadmapPhase[]>([])
  const [goalId, setGoalId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [statusText, setStatusText] = useState('Analysing your goal...')
  const [pledgeExpanded, setPledgeExpanded] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [pledge, setPledge] = useState('')
  const [category, setCategory] = useState('other')

  useEffect(() => {
    if (phase !== 'generating') return
    const messages = ['Analysing your goal...', 'Mapping the journey...', 'Building your roadmap...', 'Almost ready...']
    let i = 0
    const interval = setInterval(() => {
      i = (i + 1) % messages.length
      setStatusText(messages[i])
    }, 1800)
    return () => clearInterval(interval)
  }, [phase])

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (description.trim().length < 10) return
    setError('')
    setStatusText('Analysing your goal...')
    setPhase('generating')

    try {
      const goalRes = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          is_public: isPublic,
          pledge: pledge.trim() || undefined,
          category,
        }),
      })
      if (!goalRes.ok) {
        const data = await goalRes.json()
        if (data.error === 'one_active_goal') {
          setError(data.message)
          setPhase('input')
          return
        }
        throw new Error('Failed to create goal')
      }
      const { goal } = await goalRes.json()
      setGoalId(goal.id)

      const roadmapRes = await fetch('/api/ai/generate-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId: goal.id, description }),
      })
      if (!roadmapRes.ok) throw new Error('Roadmap generation failed')
      const { roadmap: generated } = await roadmapRes.json()
      setRoadmap(generated)
      setPhase('review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setPhase('input')
    }
  }

  function handleStart() {
    if (!goalId) return
    router.push(`/dashboard/goal/${goalId}`)
  }

  // ── GENERATING ──────────────────────────────────────────────
  if (phase === 'generating') {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
          <Box
            sx={{
              width: 6, height: 6, borderRadius: '50%', bgcolor: 'text.tertiary',
              animation: 'pulse 1.2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                '50%': { opacity: 0.3, transform: 'scale(0.7)' },
              },
            }}
          />
          <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '0.8rem', letterSpacing: '0.03em' }}>
            {statusText}
          </Typography>
        </Box>
        <RoadmapSkeleton />
      </Box>
    )
  }

  // ── REVIEW ───────────────────────────────────────────────────
  if (phase === 'review') {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 3 }}>
          <Typography level="body-xs" sx={{ color: 'text.tertiary', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.68rem', opacity: 0.6 }}>
            your arc · 3 chapters
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 5 }}>
          {roadmap.map((p, i) => (
            <PhaseCard key={p.phase} phase={p} index={i} />
          ))}
        </Box>

        {error && (
          <Typography level="body-xs" sx={{ color: 'danger.500', mb: 2 }}>
            {error}
          </Typography>
        )}

        <GradientButton onClick={handleStart} size="lg" fullWidth sx={{ borderRadius: '6px' }}>
          start this goal →
        </GradientButton>
      </Box>
    )
  }

  // ── INPUT ────────────────────────────────────────────────────
  if (hasActiveGoal) {
    return (
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '10px',
          px: 3,
          py: 3,
          bgcolor: 'background.surface',
          textAlign: 'center',
        }}
      >
        <Typography level="body-sm" sx={{ color: 'text.tertiary', opacity: 0.55, fontSize: '0.875rem', lineHeight: 1.6 }}>
          do one thing at a time
        </Typography>
        <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.35, mt: 0.75, fontSize: '0.78rem' }}>
          pause or complete your active goal first
        </Typography>
      </Box>
    )
  }

  return (
    <Box component="form" onSubmit={handleGenerate}>
      <Typography level="title-md" sx={{ color: 'text.primary', mb: 1.5, fontWeight: 600, fontSize: '1rem' }}>
        what do you want to achieve?
      </Typography>
      <Textarea
        placeholder="e.g. I want to get fit and lose 10kg in 3 months. I haven't been to a gym in 2 years."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        minRows={4}
        maxRows={8}
        required
        sx={{
          mb: 1,
          bgcolor: 'background.surface',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '6px',
          fontSize: '0.9rem',
          lineHeight: 1.6,
          resize: 'none',
          color: 'text.secondary',
          '--Textarea-focusedThickness': '0px',
          '&:hover': { borderColor: 'neutral.outlinedBorder' },
          '&:focus-within': { borderColor: 'text.tertiary' },
          textarea: {
            '&::placeholder': { color: 'text.tertiary', opacity: 0.35 },
          },
        }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.4 }}>
          more detail = sharper roadmap
        </Typography>
        <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: description.length > 50 ? 0.5 : 0.2 }}>
          {description.length}
        </Typography>
      </Box>

      {/* Public pledge toggle */}
      <Box sx={{ mb: 2 }}>
        <Box
          component="button"
          type="button"
          onClick={() => setPledgeExpanded(v => !v)}
          sx={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            p: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
          }}
        >
          <Typography
            level="body-xs"
            sx={{
              color: 'text.tertiary',
              opacity: pledgeExpanded ? 0.7 : 0.4,
              fontSize: '0.78rem',
              transition: 'opacity 0.15s',
              userSelect: 'none',
            }}
          >
            {pledgeExpanded ? '− hide pledge' : '+ add public pledge'}
          </Typography>
        </Box>

        {pledgeExpanded && (
          <Box
            sx={{
              mt: 2,
              p: 2.5,
              border: '1px dashed',
              borderColor: 'warning.300',
              borderRadius: '8px',
              bgcolor: 'warning.softBg',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {/* Make public switch */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography level="body-sm" sx={{ color: 'warning.800', fontWeight: 600, fontSize: '0.85rem' }}>
                  make this goal public
                </Typography>
                <Typography level="body-xs" sx={{ color: 'warning.700', opacity: 0.7, fontSize: '0.75rem', mt: 0.25 }}>
                  shows on your profile page
                </Typography>
              </Box>
              <Switch
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                size="sm"
                sx={{
                  '--Switch-thumbSize': '14px',
                  '--Switch-trackWidth': '32px',
                  '--Switch-trackHeight': '18px',
                }}
              />
            </Box>

            {/* Pledge consequence */}
            <Box>
              <Typography level="body-xs" sx={{ color: 'warning.700', fontSize: '0.75rem', mb: 0.75, opacity: 0.8 }}>
                what's your consequence if you miss 3 days?
              </Typography>
              <Input
                placeholder="e.g. I'll donate $20 to charity"
                value={pledge}
                onChange={(e) => setPledge(e.target.value)}
                size="sm"
                sx={{
                  bgcolor: 'background.surface',
                  border: '1px solid',
                  borderColor: 'warning.200',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  '--Input-focusedThickness': '0px',
                  '&:focus-within': { borderColor: 'warning.400' },
                }}
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* Category selector */}
      <Box sx={{ mb: 3 }}>
        <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.45, fontSize: '0.75rem', mb: 1.25 }}>
          category
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: 0.75,
            flexWrap: 'nowrap',
            overflowX: 'auto',
            pb: 0.5,
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {[
            { value: 'fitness', label: '🏋️ fitness' },
            { value: 'career', label: '💼 career' },
            { value: 'learning', label: '📚 learning' },
            { value: 'money', label: '💰 money' },
            { value: 'creativity', label: '🎨 creativity' },
            { value: 'health', label: '❤️ health' },
            { value: 'relationships', label: '🤝 relationships' },
            { value: 'mindfulness', label: '🧘 mindfulness' },
            { value: 'other', label: '✨ other' },
          ].map((cat) => (
            <Box
              key={cat.value}
              component="button"
              type="button"
              onClick={() => setCategory(cat.value)}
              sx={{
                flexShrink: 0,
                px: 1.5,
                py: 0.5,
                borderRadius: '20px',
                border: '1px solid',
                borderColor: category === cat.value ? 'transparent' : 'divider',
                background: category === cat.value
                  ? 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)'
                  : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <Typography
                level="body-xs"
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: category === cat.value ? 600 : 400,
                  color: category === cat.value ? '#fff' : 'text.tertiary',
                  whiteSpace: 'nowrap',
                }}
              >
                {cat.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {error && (
        <Typography level="body-xs" sx={{ color: 'danger.500', mb: 2 }}>
          {error}
        </Typography>
      )}

      <GradientButton
        type="submit"
        size="lg"
        fullWidth
        disabled={description.trim().length < 10}
        sx={{ borderRadius: '6px' }}
      >
        map my roadmap →
      </GradientButton>
    </Box>
  )
}
