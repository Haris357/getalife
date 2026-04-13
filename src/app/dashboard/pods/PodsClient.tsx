'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Input from '@mui/joy/Input'
import GradientButton from '@/components/shared/GradientButton'
import PodCard from '@/components/community/PodCard'
import type { Pod } from '@/types'

interface Props {
  pods: Pod[]
}

export default function PodsClient({ pods }: Props) {
  const router = useRouter()

  // Join state
  const [joinCode, setJoinCode] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)
  const [joinError, setJoinError] = useState('')

  // Create state
  const [showCreate, setShowCreate] = useState(false)
  const [podName, setPodName] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    const code = joinCode.trim().toUpperCase()
    if (!code) return
    setJoinLoading(true)
    setJoinError('')

    try {
      const res = await fetch('/api/pods/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_code: code }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'already_member') {
          // Navigate to that pod
          router.push(`/dashboard/pods/${data.pod.id}`)
          return
        }
        setJoinError(data.message ?? 'Something went wrong.')
        return
      }

      router.push(`/dashboard/pods/${data.pod.id}`)
      router.refresh()
    } catch {
      setJoinError('Network error. Try again.')
    } finally {
      setJoinLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const name = podName.trim()
    if (!name) return
    setCreateLoading(true)
    setCreateError('')

    try {
      const res = await fetch('/api/pods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()

      if (!res.ok) {
        setCreateError(data.error ?? 'Something went wrong.')
        return
      }

      router.push(`/dashboard/pods/${data.pod.id}`)
      router.refresh()
    } catch {
      setCreateError('Network error. Try again.')
    } finally {
      setCreateLoading(false)
    }
  }

  return (
    <Box>
      {/* ── Join by code ── */}
      <Box
        component="form"
        onSubmit={handleJoin}
        sx={{
          display: 'flex',
          gap: 1.5,
          mb: 5,
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ flex: 1, minWidth: 140 }}>
          <Input
            placeholder="enter code"
            value={joinCode}
            onChange={(e) => {
              setJoinCode(e.target.value.toUpperCase())
              setJoinError('')
            }}
            slotProps={{
              input: {
                maxLength: 6,
                style: { fontFamily: 'monospace', letterSpacing: '0.15em', fontWeight: 700, textTransform: 'uppercase' },
              },
            }}
            sx={{
              borderRadius: '8px',
              fontSize: '0.9rem',
              '--Input-focusedThickness': '0px',
              borderColor: joinError ? 'danger.500' : 'divider',
              '&:hover': { borderColor: 'neutral.outlinedBorder' },
            }}
          />
          {joinError && (
            <Typography level="body-xs" sx={{ color: 'danger.500', mt: 0.75, fontSize: '0.75rem' }}>
              {joinError}
            </Typography>
          )}
        </Box>
        <GradientButton
          type="submit"
          loading={joinLoading}
          disabled={joinCode.trim().length < 4}
          size="md"
        >
          join pod
        </GradientButton>
      </Box>

      {/* ── Pods list ── */}
      {pods.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 5 }}>
          {pods.map((pod) => (
            <PodCard
              key={pod.id}
              pod={pod}
              onClick={() => router.push(`/dashboard/pods/${pod.id}`)}
            />
          ))}
        </Box>
      )}

      {pods.length === 0 && !showCreate && (
        <Box
          sx={{
            py: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.5,
            mb: 4,
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '16px',
              bgcolor: 'background.surface',
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 0.5,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.2 }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </Box>
          <Typography level="body-sm" sx={{ color: 'text.tertiary', opacity: 0.4, fontWeight: 500 }}>
            no pods yet
          </Typography>
          <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.25, fontSize: '0.78rem' }}>
            join one with a code or create your own
          </Typography>
        </Box>
      )}

      {/* ── Create pod ── */}
      {!showCreate ? (
        <Box
          component="button"
          onClick={() => setShowCreate(true)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: 2.5,
            py: 1.5,
            borderRadius: '10px',
            border: '1px dashed',
            borderColor: 'divider',
            bgcolor: 'transparent',
            cursor: 'pointer',
            width: '100%',
            transition: 'border-color 0.15s, background 0.15s',
            '&:hover': {
              borderColor: 'neutral.outlinedHoverBorder',
              bgcolor: 'background.level1',
            },
          }}
        >
          <Box
            sx={{
              width: 22,
              height: 22,
              borderRadius: '6px',
              background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </Box>
          <Typography level="body-sm" sx={{ color: 'text.tertiary', opacity: 0.6, fontSize: '0.875rem' }}>
            create a new pod
          </Typography>
        </Box>
      ) : (
        <Box
          component="form"
          onSubmit={handleCreate}
          sx={{
            bgcolor: 'background.surface',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '12px',
            p: 3,
          }}
        >
          <Typography
            level="body-xs"
            sx={{
              color: 'text.tertiary',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontSize: '0.62rem',
              opacity: 0.45,
              mb: 2,
            }}
          >
            new pod
          </Typography>

          <Input
            placeholder="pod name"
            value={podName}
            onChange={(e) => {
              setPodName(e.target.value)
              setCreateError('')
            }}
            autoFocus
            slotProps={{ input: { maxLength: 100 } }}
            sx={{
              mb: 2,
              fontSize: '0.9rem',
              borderRadius: '8px',
              '--Input-focusedThickness': '0px',
              '&:hover': { borderColor: 'neutral.outlinedBorder' },
            }}
          />

          {createError && (
            <Typography level="body-xs" sx={{ color: 'danger.500', mb: 1.5, fontSize: '0.75rem' }}>
              {createError}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <GradientButton
              type="submit"
              loading={createLoading}
              disabled={podName.trim().length === 0}
              size="md"
            >
              create pod
            </GradientButton>
            <Box
              component="button"
              type="button"
              onClick={() => {
                setShowCreate(false)
                setPodName('')
                setCreateError('')
              }}
              sx={{
                px: 2,
                py: 0.75,
                borderRadius: '8px',
                border: 'none',
                bgcolor: 'transparent',
                cursor: 'pointer',
                color: 'text.tertiary',
                fontSize: '0.875rem',
                opacity: 0.5,
                '&:hover': { opacity: 0.8 },
                transition: 'opacity 0.15s',
              }}
            >
              cancel
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  )
}
