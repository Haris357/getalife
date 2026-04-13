'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/joy/Box'
import Textarea from '@mui/joy/Textarea'
import Typography from '@mui/joy/Typography'
import MediaUpload from '@/components/shared/MediaUpload'
import SocialLinksInput, { type SocialLinks } from '@/components/shared/SocialLinksInput'
import XPToast from '@/components/game/XPToast'
import GradientButton from '@/components/shared/GradientButton'
import type { BadgeType } from '@/types'
import type { XPGain } from '@/lib/game/xp'

const fieldSx = {
  bgcolor: 'background.body',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: '8px',
  fontSize: '0.9rem',
  lineHeight: 1.6,
  resize: 'none',
  color: 'text.secondary',
  '--Textarea-focusedThickness': '0px',
  '&:hover': { borderColor: 'neutral.outlinedBorder' },
  '&:focus-within': { borderColor: 'rgb(14,165,233)' },
  textarea: { '&::placeholder': { color: 'text.tertiary', opacity: 0.35 } },
} as const

function FieldCard({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        bgcolor: 'background.level1',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '10px',
        p: 2.5,
        mb: 2,
      }}
    >
      {children}
    </Box>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      level="body-xs"
      sx={{
        color: 'text.tertiary',
        mb: 1.25,
        fontSize: '0.75rem',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        opacity: 0.55,
        fontWeight: 600,
      }}
    >
      {children}
    </Typography>
  )
}

interface Props {
  goalId: string
  streak: number
}

type Status = 'idle' | 'submitting' | 'done'

export default function CheckinForm({ goalId, streak }: Props) {
  const router = useRouter()
  const [whatIDid, setWhatIDid] = useState('')
  const [commitment, setCommitment] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({})
  const [showSocial, setShowSocial] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [aiResponse, setAiResponse] = useState('')
  const [newStreak, setNewStreak] = useState(streak)
  const [error, setError] = useState('')
  const [xpGain, setXpGain] = useState<XPGain | null>(null)
  const [leveledUp, setLeveledUp] = useState(false)
  const [newLevel, setNewLevel] = useState(1)
  const [newTitle, setNewTitle] = useState('')
  const [shieldUsed, setShieldUsed] = useState(false)
  const [shieldEarned, setShieldEarned] = useState(false)
  const [newShields, setNewShields] = useState(0)
  const [newBadges, setNewBadges] = useState<BadgeType[]>([])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!whatIDid.trim() || !commitment.trim()) return
    setStatus('submitting')
    setError('')

    const filteredLinks = Object.fromEntries(
      Object.entries(socialLinks).filter(([, v]) => v?.trim())
    )

    try {
      const res = await fetch(`/api/goals/${goalId}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          what_i_did: whatIDid,
          commitment,
          media_url: mediaUrl || null,
          social_links: Object.keys(filteredLinks).length ? filteredLinks : null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Something went wrong')
      }
      const data = await res.json()
      setAiResponse(data.checkIn.ai_response ?? '')
      setNewStreak(data.streak)
      setXpGain(data.xpGain)
      setLeveledUp(data.leveledUp)
      setNewLevel(data.newLevel)
      setNewTitle(data.newTitle)
      setShieldUsed(data.shieldUsed)
      setShieldEarned(data.shieldEarned)
      setNewShields(data.newShields)
      setNewBadges(data.newBadges ?? [])
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('idle')
    }
  }

  // ── Done state ─────────────────────────────────────────────
  if (status === 'done') {
    return (
      <Box>
        {/* XP / badge toast */}
        {xpGain && (
          <XPToast
            xpGain={xpGain}
            leveledUp={leveledUp}
            newLevel={newLevel}
            newTitle={newTitle}
            shieldUsed={shieldUsed}
            shieldEarned={shieldEarned}
            newShields={newShields}
            newBadges={newBadges}
          />
        )}

        {/* Streak badge */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              px: 2.5,
              py: 0.75,
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
              boxShadow: '0 0 20px rgba(14,165,233,0.3)',
            }}
          >
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
              {newStreak} day streak{newStreak >= 7 ? ' 🔥' : ''}
            </Typography>
          </Box>
        </Box>

        {/* AI coaching response */}
        <Box
          sx={{
            bgcolor: 'background.level1',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '12px',
            p: 3,
            mb: 5,
            animation: 'fadeIn 0.4s ease',
            '@keyframes fadeIn': {
              from: { opacity: 0, transform: 'translateY(6px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
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
              mb: 1.25,
            }}
          >
            coach
          </Typography>
          <Typography
            level="body-md"
            sx={{
              color: 'text.secondary',
              lineHeight: 1.75,
              fontSize: '0.95rem',
              fontStyle: 'italic',
            }}
          >
            {aiResponse}
          </Typography>
        </Box>

        <Box
          sx={{
            px: 3,
            py: 1.25,
            borderRadius: '20px',
            border: '1px solid',
            borderColor: 'divider',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'center',
            bgcolor: 'background.surface',
            transition: 'border-color 0.15s, background 0.15s',
            '&:hover': {
              borderColor: 'neutral.outlinedHoverBorder',
              bgcolor: 'background.level1',
            },
          }}
          component="button"
          onClick={() => { router.refresh(); router.push(`/dashboard/goal/${goalId}`) }}
        >
          <Typography level="body-sm" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.9rem' }}>
            back to goal
          </Typography>
        </Box>
      </Box>
    )
  }

  // ── Form ───────────────────────────────────────────────────
  return (
    <Box component="form" onSubmit={handleSubmit}>

      {/* What I did */}
      <FieldCard>
        <SectionLabel>what did you actually do today?</SectionLabel>
        <Textarea
          placeholder="Be specific — what actions did you take? Even small progress counts."
          value={whatIDid}
          onChange={(e) => setWhatIDid(e.target.value)}
          minRows={4}
          maxRows={10}
          required
          disabled={status === 'submitting'}
          sx={fieldSx}
        />
      </FieldCard>

      {/* Tomorrow's commitment */}
      <FieldCard>
        <SectionLabel>what will you do tomorrow?</SectionLabel>
        <Textarea
          placeholder="Make a specific commitment — not 'work on it' but exactly what you'll do."
          value={commitment}
          onChange={(e) => setCommitment(e.target.value)}
          minRows={3}
          maxRows={6}
          required
          disabled={status === 'submitting'}
          sx={fieldSx}
        />
      </FieldCard>

      {/* Media upload */}
      <FieldCard>
        <SectionLabel>show your work (optional)</SectionLabel>
        <MediaUpload
          folder="checkins"
          onUploaded={setMediaUrl}
          disabled={status === 'submitting'}
        />
      </FieldCard>

      {/* Social links — collapsible */}
      <Box sx={{ mb: 4 }}>
        <Box
          component="button"
          type="button"
          onClick={() => setShowSocial((v) => !v)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            background: 'none',
            border: '1px solid',
            borderColor: showSocial ? 'neutral.outlinedHoverBorder' : 'divider',
            borderRadius: '20px',
            cursor: 'pointer',
            px: 1.75,
            py: 0.6,
            mb: showSocial ? 2 : 0,
            transition: 'border-color 0.15s, background 0.15s',
            '&:hover': { borderColor: 'neutral.outlinedHoverBorder', bgcolor: 'background.level1' },
          }}
        >
          <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '0.78rem', opacity: 0.7 }}>
            {showSocial ? '▾' : '▸'} add social links (optional)
          </Typography>
        </Box>

        {showSocial && (
          <Box
            sx={{
              bgcolor: 'background.level1',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '10px',
              p: 2.5,
            }}
          >
            <SocialLinksInput
              value={socialLinks}
              onChange={setSocialLinks}
              disabled={status === 'submitting'}
            />
          </Box>
        )}
      </Box>

      {error && (
        <Typography level="body-xs" sx={{ color: 'danger.500', mb: 2 }}>
          {error}
        </Typography>
      )}

      {/* Gradient pill submit button */}
      <GradientButton
        type="submit"
        loading={status === 'submitting'}
        disabled={!whatIDid.trim() || !commitment.trim()}
        size="lg"
        fullWidth
        sx={{ borderRadius: '20px' }}
      >
        submit check-in →
      </GradientButton>
    </Box>
  )
}
