'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Button from '@mui/joy/Button'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import type { Pod, PodMember } from '@/types'

interface Props {
  pod: Pod
  members: PodMember[]
  currentUserId: string
}

function AvatarCircle({ name, avatarUrl, size = 36 }: { name: string | null; avatarUrl: string | null; size?: number }) {
  const initials = name ? name.slice(0, 2).toUpperCase() : '??'
  if (avatarUrl) {
    return (
      <Box
        component="img"
        src={avatarUrl}
        alt={name ?? 'member'}
        sx={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          border: '1px solid',
          borderColor: 'divider',
        }}
      />
    )
  }
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Typography sx={{ fontSize: size * 0.33 + 'px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>
        {initials}
      </Typography>
    </Box>
  )
}

function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <Button
      variant="outlined"
      size="sm"
      onClick={handleCopy}
      sx={{
        flexShrink: 0,
        fontWeight: 600,
        fontSize: '0.75rem',
        borderRadius: '6px',
        borderColor: 'divider',
        color: 'text.tertiary',
        minWidth: 64,
        '&:hover': { borderColor: 'neutral.outlinedBorder', bgcolor: 'background.level1' },
      }}
    >
      {copied ? 'copied!' : 'copy'}
    </Button>
  )
}

export default function PodDetailClient({ pod, members, currentUserId }: Props) {
  const router = useRouter()
  const [showLeave, setShowLeave] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const isCreator = pod.created_by === currentUserId

  async function handleLeave() {
    setLeaving(true)
    try {
      const res = await fetch(`/api/pods/${pod.id}/leave`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/dashboard/pods')
        router.refresh()
      }
    } finally {
      setLeaving(false)
      setShowLeave(false)
    }
  }

  return (
    <>
      {/* ── Invite code card ── */}
      <Box
        sx={{
          bgcolor: 'background.surface',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '12px',
          overflow: 'hidden',
          display: 'flex',
          mb: 4,
        }}
      >
        <Box
          sx={{
            width: 4,
            flexShrink: 0,
            background: 'linear-gradient(180deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
          }}
        />
        <Box
          sx={{
            flex: 1,
            px: 3,
            py: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Box>
            <Typography
              level="body-xs"
              sx={{
                color: 'text.tertiary',
                opacity: 0.4,
                fontSize: '0.62rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                mb: 0.5,
              }}
            >
              invite code
            </Typography>
            <Typography
              sx={{
                fontFamily: 'monospace',
                fontSize: '1.5rem',
                fontWeight: 700,
                letterSpacing: '0.18em',
                background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {pod.invite_code}
            </Typography>
          </Box>
          <CopyCodeButton code={pod.invite_code} />
        </Box>
      </Box>

      {/* ── Members list ── */}
      <Box sx={{ mb: 5 }}>
        <Typography
          level="body-xs"
          sx={{
            color: 'text.tertiary',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontSize: '0.62rem',
            opacity: 0.45,
            mb: 2.5,
          }}
        >
          members · {members.length} / {pod.max_members}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {members.map((member) => {
            const isCreatorMember = pod.created_by === member.user_id
            const isCurrentUser = member.user_id === currentUserId

            return (
              <Box
                key={member.user_id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  px: 2.5,
                  py: 1.75,
                  bgcolor: 'background.surface',
                  border: '1px solid',
                  borderColor: isCurrentUser ? 'rgba(14,165,233,0.2)' : 'divider',
                  borderRadius: '10px',
                  transition: 'border-color 0.15s',
                }}
              >
                <AvatarCircle name={member.display_name} avatarUrl={member.avatar_url} />

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography
                      sx={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: 'text.primary',
                        lineHeight: 1.3,
                      }}
                    >
                      {member.display_name ?? 'anonymous'}
                    </Typography>
                    {isCurrentUser && (
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.4, fontSize: '0.68rem' }}>
                        (you)
                      </Typography>
                    )}
                    {isCreatorMember && (
                      <Box
                        sx={{
                          px: 1,
                          py: 0.15,
                          borderRadius: '4px',
                          background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                        }}
                      >
                        <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: '#fff', letterSpacing: '0.06em' }}>
                          CREATOR
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  {member.title && (
                    <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.45, fontSize: '0.72rem', mt: 0.2 }}>
                      {member.title}{member.level ? ` · lv ${member.level}` : ''}
                    </Typography>
                  )}
                </Box>

                {/* Level badge */}
                {member.level != null && (
                  <Box
                    sx={{
                      px: 1.25,
                      py: 0.3,
                      borderRadius: '20px',
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.level1',
                      flexShrink: 0,
                    }}
                  >
                    <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '0.68rem', fontWeight: 600, opacity: 0.6 }}>
                      lv {member.level}
                    </Typography>
                  </Box>
                )}
              </Box>
            )
          })}
        </Box>
      </Box>

      {/* ── Leave pod ── */}
      <Box
        sx={{
          pt: 4,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Button
          variant="outlined"
          size="sm"
          onClick={() => setShowLeave(true)}
          sx={{
            borderColor: 'divider',
            color: 'text.tertiary',
            fontSize: '0.78rem',
            fontWeight: 600,
            borderRadius: '8px',
            '&:hover': { borderColor: 'danger.300', color: 'danger.500', bgcolor: 'danger.softBg' },
            transition: 'all 0.15s',
          }}
        >
          leave pod
        </Button>
      </Box>

      <ConfirmDialog
        open={showLeave}
        title="leave this pod?"
        description={
          isCreator && members.length > 1
            ? `You're the creator — leaving will transfer ownership to the next member.`
            : `You'll need the invite code to rejoin.`
        }
        confirmLabel="leave pod"
        cancelLabel="stay"
        danger
        loading={leaving}
        onConfirm={handleLeave}
        onCancel={() => setShowLeave(false)}
      />
    </>
  )
}
