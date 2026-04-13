'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Textarea from '@mui/joy/Textarea'
import Button from '@mui/joy/Button'
import Modal from '@mui/joy/Modal'
import ModalDialog from '@mui/joy/ModalDialog'

interface Props {
  postId: string
  pinned: boolean
  removed: boolean
  locked: boolean
  flair?: string | null
  isMod: boolean
  isOwner: boolean
  currentUserId?: string
}

export default function ModTools({ postId, pinned, removed, locked, flair, isMod, isOwner, currentUserId }: Props) {
  const router = useRouter()
  const [pinLoading, setPinLoading] = useState(false)
  const [removeLoading, setRemoveLoading] = useState(false)
  const [lockLoading, setLockLoading] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  const [reportDone, setReportDone] = useState(false)
  const [removeReason, setRemoveReason] = useState('')
  const [removeModalOpen, setRemoveModalOpen] = useState(false)

  async function handlePin() {
    setPinLoading(true)
    await fetch(`/api/community/posts/${postId}/pin`, { method: 'POST' })
    setPinLoading(false)
    router.refresh()
  }

  async function handleRemove() {
    setRemoveLoading(true)
    await fetch(`/api/community/posts/${postId}/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ removed: !removed, reason: removeReason || undefined }),
    })
    setRemoveLoading(false)
    setRemoveModalOpen(false)
    setRemoveReason('')
    router.refresh()
  }

  async function handleLock() {
    setLockLoading(true)
    await fetch(`/api/community/posts/${postId}/lock`, { method: 'POST' })
    setLockLoading(false)
    router.refresh()
  }

  async function handleReport() {
    if (!reportReason.trim()) return
    setReportLoading(true)
    await fetch(`/api/community/posts/${postId}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reportReason }),
    })
    setReportLoading(false)
    setReportDone(true)
    setTimeout(() => { setReportOpen(false); setReportDone(false); setReportReason('') }, 1500)
  }

  const btnSx = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    p: 0,
  }

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        {flair && (
          <Box sx={{ px: 1.5, py: 0.25, borderRadius: '20px', border: '1px solid', borderColor: 'primary.300', bgcolor: 'primary.softBg' }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: 'primary.500' }}>
              {flair}
            </Typography>
          </Box>
        )}

        {isMod && (
          <>
            <Box component="button" onClick={handlePin} disabled={pinLoading} sx={btnSx}>
              <Typography sx={{ fontSize: '0.7rem', color: pinned ? 'rgb(14,165,233)' : 'text.tertiary', opacity: pinned ? 0.9 : 0.4, '&:hover': { opacity: 0.9 }, transition: 'opacity 0.15s' }}>
                {pinned ? 'unpin' : 'pin'}
              </Typography>
            </Box>
            <Box component="button" onClick={() => { if (removed) { void handleRemove() } else { setRemoveModalOpen(true) } }} disabled={removeLoading} sx={btnSx}>
              <Typography sx={{ fontSize: '0.7rem', color: removed ? 'danger.500' : 'text.tertiary', opacity: removed ? 0.8 : 0.4, '&:hover': { opacity: 0.9 }, transition: 'opacity 0.15s' }}>
                {removed ? 'restore' : 'remove'}
              </Typography>
            </Box>
            <Box component="button" onClick={handleLock} disabled={lockLoading} sx={btnSx}>
              <Typography sx={{ fontSize: '0.7rem', color: locked ? 'warning.500' : 'text.tertiary', opacity: locked ? 0.8 : 0.4, '&:hover': { opacity: 0.9 }, transition: 'opacity 0.15s' }}>
                {locked ? 'unlock' : 'lock'}
              </Typography>
            </Box>
          </>
        )}

        {currentUserId && !isOwner && (
          <Box component="button" onClick={() => setReportOpen(true)} sx={btnSx}>
            <Typography sx={{ fontSize: '0.7rem', color: 'text.tertiary', opacity: 0.3, '&:hover': { opacity: 0.7 }, transition: 'opacity 0.15s' }}>
              report
            </Typography>
          </Box>
        )}
      </Box>

      {/* Remove reason modal */}
      <Modal open={removeModalOpen} onClose={() => setRemoveModalOpen(false)}>
        <ModalDialog sx={{ borderRadius: '10px', maxWidth: 400, width: '100%' }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', mb: 0.5 }}>remove post</Typography>
          <Typography sx={{ fontSize: '0.8rem', color: 'text.tertiary', opacity: 0.6, mb: 2 }}>
            optionally add a reason shown to the author
          </Typography>
          <Textarea
            placeholder="reason (optional)"
            value={removeReason}
            onChange={e => setRemoveReason(e.target.value)}
            minRows={2}
            maxRows={4}
            sx={{ mb: 2, fontSize: '0.85rem', borderRadius: '6px', '--Textarea-focusedThickness': '0px' }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="sm" color="danger" loading={removeLoading} onClick={handleRemove} sx={{ borderRadius: '6px', fontWeight: 600, fontSize: '0.78rem' }}>
              remove
            </Button>
            <Button size="sm" variant="plain" onClick={() => setRemoveModalOpen(false)} sx={{ borderRadius: '6px', color: 'text.tertiary', fontSize: '0.78rem' }}>
              cancel
            </Button>
          </Box>
        </ModalDialog>
      </Modal>

      {/* Report modal */}
      <Modal open={reportOpen} onClose={() => setReportOpen(false)}>
        <ModalDialog sx={{ borderRadius: '10px', maxWidth: 400, width: '100%' }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', mb: 0.5 }}>report post</Typography>
          <Typography sx={{ fontSize: '0.8rem', color: 'text.tertiary', opacity: 0.6, mb: 2 }}>
            let the mods know what is wrong
          </Typography>
          {reportDone ? (
            <Typography sx={{ fontSize: '0.85rem', color: 'success.500' }}>report submitted</Typography>
          ) : (
            <>
              <Textarea
                placeholder="describe the issue..."
                value={reportReason}
                onChange={e => setReportReason(e.target.value)}
                minRows={3}
                maxRows={6}
                sx={{ mb: 2, fontSize: '0.85rem', borderRadius: '6px', '--Textarea-focusedThickness': '0px' }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="sm" loading={reportLoading} disabled={!reportReason.trim()} onClick={handleReport} sx={{ borderRadius: '6px', fontWeight: 600, fontSize: '0.78rem' }}>
                  submit
                </Button>
                <Button size="sm" variant="plain" onClick={() => setReportOpen(false)} sx={{ borderRadius: '6px', color: 'text.tertiary', fontSize: '0.78rem' }}>
                  cancel
                </Button>
              </Box>
            </>
          )}
        </ModalDialog>
      </Modal>
    </>
  )
}
