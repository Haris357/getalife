'use client'

import { useState } from 'react'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Button from '@mui/joy/Button'
import Input from '@mui/joy/Input'
import Textarea from '@mui/joy/Textarea'

interface Ban {
  id: string
  user_id: string
  reason: string | null
  expires_at: string | null
  created_at: string
  profiles: { display_name: string | null } | null
}

interface Props {
  bans: Ban[]
}

export default function ModBanList({ bans: initialBans }: Props) {
  const [bans, setBans] = useState(initialBans)
  const [banUserId, setBanUserId] = useState('')
  const [banReason, setBanReason] = useState('')
  const [banning, setBanning] = useState(false)
  const [showForm, setShowForm] = useState(false)

  async function handleBan() {
    if (!banUserId.trim()) return
    setBanning(true)
    const res = await fetch('/api/community/bans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: banUserId, reason: banReason || undefined }),
    })
    if (res.ok) {
      const { ban } = await res.json()
      setBans(b => [ban, ...b])
      setBanUserId('')
      setBanReason('')
      setShowForm(false)
    }
    setBanning(false)
  }

  async function handleUnban(userId: string) {
    await fetch(`/api/community/bans/${userId}`, { method: 'DELETE' })
    setBans(b => b.filter(ban => ban.user_id !== userId))
  }

  return (
    <Box>
      {bans.length === 0 ? (
        <Box
          sx={{
            py: 3,
            px: 3,
            borderRadius: '10px',
            border: '1px dashed',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
          }}
        >
          <Typography sx={{ fontSize: '0.82rem', color: 'text.tertiary', opacity: 0.4 }}>
            no banned users
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          {bans.map(ban => (
            <Box
              key={ban.id}
              sx={{
                p: 2.5,
                borderRadius: '10px',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.level1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
                {/* Avatar placeholder */}
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    bgcolor: 'background.surface',
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.35 }}>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: 'text.primary', mb: 0.2 }}>
                    {ban.profiles?.display_name ?? ban.user_id.slice(0, 8)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    {ban.reason && (
                      <Typography sx={{ fontSize: '0.72rem', color: 'text.tertiary', opacity: 0.55 }}>
                        {ban.reason}
                      </Typography>
                    )}
                    {ban.expires_at && (
                      <Box
                        sx={{
                          px: 1.25,
                          py: 0.2,
                          borderRadius: '20px',
                          bgcolor: 'background.surface',
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Typography sx={{ fontSize: '0.65rem', color: 'text.tertiary', opacity: 0.5 }}>
                          expires {new Date(ban.expires_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>

              <Button
                size="sm"
                variant="outlined"
                onClick={() => handleUnban(ban.user_id)}
                sx={{
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderColor: 'divider',
                  color: 'text.tertiary',
                  flexShrink: 0,
                  px: 2,
                  '&:hover': { borderColor: 'success.400', color: 'success.600', bgcolor: 'success.softBg' },
                }}
              >
                unban
              </Button>
            </Box>
          ))}
        </Box>
      )}

      {showForm ? (
        <Box
          sx={{
            p: 3,
            borderRadius: '10px',
            border: '1px solid',
            borderColor: 'danger.outlinedBorder',
            bgcolor: 'danger.softBg',
          }}
        >
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'danger.600', mb: 2 }}>
            Ban User
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Input
              placeholder="user ID (UUID)"
              value={banUserId}
              onChange={e => setBanUserId(e.target.value)}
              sx={{ borderRadius: '8px', fontSize: '0.875rem', '--Input-focusedThickness': '0px', bgcolor: 'background.surface' }}
            />
            <Textarea
              placeholder="reason (optional)"
              value={banReason}
              onChange={e => setBanReason(e.target.value)}
              minRows={2}
              maxRows={4}
              sx={{ borderRadius: '8px', fontSize: '0.875rem', '--Textarea-focusedThickness': '0px', bgcolor: 'background.surface' }}
            />
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                size="sm"
                color="danger"
                loading={banning}
                disabled={!banUserId.trim()}
                onClick={handleBan}
                sx={{ borderRadius: '20px', fontWeight: 700, fontSize: '0.78rem', px: 2.5 }}
              >
                ban user
              </Button>
              <Button
                size="sm"
                variant="plain"
                onClick={() => { setShowForm(false); setBanUserId(''); setBanReason('') }}
                sx={{ borderRadius: '20px', color: 'text.tertiary', fontSize: '0.78rem', px: 2 }}
              >
                cancel
              </Button>
            </Box>
          </Box>
        </Box>
      ) : (
        <Button
          size="sm"
          color="danger"
          variant="outlined"
          onClick={() => setShowForm(true)}
          sx={{
            borderRadius: '20px',
            fontWeight: 600,
            fontSize: '0.78rem',
            px: 2.5,
            '&:hover': { bgcolor: 'danger.softBg' },
          }}
        >
          + ban user
        </Button>
      )}
    </Box>
  )
}
