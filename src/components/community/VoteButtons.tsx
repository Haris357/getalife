'use client'

import { useState } from 'react'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'

interface Props {
  score: number
  userVote: 1 | -1 | null | undefined
  onVote: (value: 1 | -1 | 0) => Promise<void>
  vertical?: boolean
}

function ArrowUp({ active }: { active: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  )
}

function ArrowDown({ active }: { active: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export default function VoteButtons({ score: initialScore, userVote: initialVote, onVote, vertical = false }: Props) {
  const [score, setScore] = useState(initialScore)
  const [vote, setVote] = useState<1 | -1 | null>(initialVote ?? null)
  const [loading, setLoading] = useState(false)

  async function handleVote(value: 1 | -1) {
    if (loading) return
    const newVote = vote === value ? 0 : value
    const scoreDelta = newVote === 0
      ? (vote === 1 ? -1 : 1)
      : (vote === null ? value : value - vote)

    setVote(newVote === 0 ? null : newVote as 1 | -1)
    setScore(s => s + scoreDelta)
    setLoading(true)
    try {
      await onVote(newVote as 1 | -1 | 0)
    } catch {
      setVote(vote)
      setScore(initialScore)
    } finally {
      setLoading(false)
    }
  }

  const upActive = vote === 1
  const downActive = vote === -1

  if (vertical) {
    return (
      <Box
        sx={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.25,
          bgcolor: 'background.level1',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '20px',
          px: 0.75,
          py: 0.75,
          minWidth: 36,
        }}
      >
        <Box
          component="button"
          onClick={() => handleVote(1)}
          disabled={loading}
          sx={{
            background: 'none', border: 'none',
            cursor: loading ? 'default' : 'pointer',
            p: 0.5, borderRadius: '50%', display: 'flex',
            color: upActive ? 'rgb(14,165,233)' : 'text.tertiary',
            opacity: upActive ? 1 : 0.4,
            '&:hover': { opacity: 1, bgcolor: 'background.level2' },
            transition: 'opacity 0.1s, color 0.1s, background 0.1s',
          }}
        >
          <ArrowUp active={upActive} />
        </Box>
        <Typography
          sx={{
            fontSize: '0.72rem', fontWeight: 700, lineHeight: 1,
            color: upActive ? 'rgb(14,165,233)' : downActive ? 'rgb(249,115,22)' : 'text.tertiary',
            opacity: (upActive || downActive) ? 1 : 0.55,
            fontVariantNumeric: 'tabular-nums',
            minWidth: '1.8ch', textAlign: 'center',
            transition: 'color 0.1s',
          }}
        >
          {score}
        </Typography>
        <Box
          component="button"
          onClick={() => handleVote(-1)}
          disabled={loading}
          sx={{
            background: 'none', border: 'none',
            cursor: loading ? 'default' : 'pointer',
            p: 0.5, borderRadius: '50%', display: 'flex',
            color: downActive ? 'rgb(249,115,22)' : 'text.tertiary',
            opacity: downActive ? 1 : 0.4,
            '&:hover': { opacity: 1, bgcolor: 'background.level2' },
            transition: 'opacity 0.1s, color 0.1s, background 0.1s',
          }}
        >
          <ArrowDown active={downActive} />
        </Box>
      </Box>
    )
  }

  // Horizontal pill
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        bgcolor: 'background.level1',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '20px',
        px: 0.75,
        py: 0.4,
      }}
    >
      <Box
        component="button"
        onClick={() => handleVote(1)}
        disabled={loading}
        sx={{
          background: 'none', border: 'none',
          cursor: loading ? 'default' : 'pointer',
          p: 0.4, borderRadius: '50%', display: 'flex',
          color: upActive ? 'rgb(14,165,233)' : 'text.tertiary',
          opacity: upActive ? 1 : 0.4,
          '&:hover': { opacity: 1, bgcolor: 'background.level2' },
          transition: 'opacity 0.1s, color 0.1s',
        }}
      >
        <ArrowUp active={upActive} />
      </Box>
      <Typography
        sx={{
          fontSize: '0.72rem', fontWeight: 700,
          color: upActive ? 'rgb(14,165,233)' : downActive ? 'rgb(249,115,22)' : 'text.tertiary',
          opacity: (upActive || downActive) ? 1 : 0.55,
          fontVariantNumeric: 'tabular-nums',
          minWidth: '1.8ch', textAlign: 'center',
          lineHeight: 1, transition: 'color 0.1s',
        }}
      >
        {score}
      </Typography>
      <Box
        component="button"
        onClick={() => handleVote(-1)}
        disabled={loading}
        sx={{
          background: 'none', border: 'none',
          cursor: loading ? 'default' : 'pointer',
          p: 0.4, borderRadius: '50%', display: 'flex',
          color: downActive ? 'rgb(249,115,22)' : 'text.tertiary',
          opacity: downActive ? 1 : 0.4,
          '&:hover': { opacity: 1, bgcolor: 'background.level2' },
          transition: 'opacity 0.1s, color 0.1s',
        }}
      >
        <ArrowDown active={downActive} />
      </Box>
    </Box>
  )
}
