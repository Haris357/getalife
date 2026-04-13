'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Textarea from '@mui/joy/Textarea'
import Button from '@mui/joy/Button'
import Modal from '@mui/joy/Modal'
import ModalDialog from '@mui/joy/ModalDialog'
import VoteButtons from './VoteButtons'
import UserBadge from './UserBadge'
import type { CommunityComment } from '@/types'

interface Props {
  postId: string
  comments: CommunityComment[]
  currentUserId?: string
  isMod?: boolean
  depth?: number
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return d < 30 ? `${d}d ago` : new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function buildTree(comments: CommunityComment[]): CommunityComment[] {
  const map = new Map<string, CommunityComment>()
  const roots: CommunityComment[] = []

  for (const c of comments) {
    map.set(c.id, { ...c, replies: [] })
  }
  map.forEach(c => {
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.replies!.push(c)
    } else {
      roots.push(c)
    }
  })
  return roots
}

interface CommentItemProps {
  comment: CommunityComment
  postId: string
  currentUserId?: string
  isMod?: boolean
  depth: number
}

function CommentItem({ comment, postId, currentUserId, isMod = false, depth }: CommentItemProps) {
  const router = useRouter()
  const isOwner = currentUserId === comment.user_id
  const [replying, setReplying] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(comment.body)
  const [saving, setSaving] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  const [reportDone, setReportDone] = useState(false)
  const [isRemoved, setIsRemoved] = useState(comment.removed ?? false)
  const [modRemoving, setModRemoving] = useState(false)

  if (deleted) return null

  async function handleModRemove() {
    setModRemoving(true)
    await fetch(`/api/community/comments/${comment.id}/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ removed: !isRemoved }),
    })
    setIsRemoved(r => !r)
    setModRemoving(false)
  }

  async function handleReport() {
    if (!reportReason.trim()) return
    setReportLoading(true)
    await fetch(`/api/community/comments/${comment.id}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reportReason }),
    })
    setReportLoading(false)
    setReportDone(true)
    setTimeout(() => { setReportOpen(false); setReportDone(false); setReportReason('') }, 1500)
  }

  async function handleVote(value: 1 | -1 | 0) {
    await fetch(`/api/community/comments/${comment.id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    })
  }

  async function handleReply() {
    if (!replyText.trim()) return
    setSubmitting(true)
    await fetch(`/api/community/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: replyText, parent_id: comment.id }),
    })
    setReplyText('')
    setReplying(false)
    setSubmitting(false)
    router.refresh()
  }

  async function handleEdit() {
    setSaving(true)
    await fetch(`/api/community/comments/${comment.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: editText }),
    })
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  async function handleDelete() {
    await fetch(`/api/community/comments/${comment.id}`, { method: 'DELETE' })
    setDeleted(true)
    router.refresh()
  }

  return (
    <Box
      sx={{
        borderLeft: depth > 0 ? '2px solid' : 'none',
        borderColor: 'divider',
        pl: depth > 0 ? 2 : 0,
        ml: depth > 0 ? 1 : 0,
        mb: 0,
      }}
    >
      <Box sx={{ py: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
          <UserBadge
            displayName={comment.display_name}
            level={comment.author_level}
            title={comment.author_title}
            avatarUrl={comment.author_avatar}
          />
          <Typography sx={{ fontSize: '0.68rem', color: 'text.tertiary', opacity: 0.3 }}>
            {timeAgo(comment.created_at)}
            {comment.updated_at !== comment.created_at ? ' · edited' : ''}
          </Typography>
          <Box
            component="button"
            onClick={() => setCollapsed(c => !c)}
            sx={{ background: 'none', border: 'none', cursor: 'pointer', p: 0, ml: 'auto' }}
          >
            <Typography sx={{ fontSize: '0.68rem', color: 'text.tertiary', opacity: 0.25, '&:hover': { opacity: 0.6 } }}>
              [{collapsed ? '+' : '−'}]
            </Typography>
          </Box>
        </Box>

        {!collapsed && (
          <>
            {isRemoved && !isMod ? (
              <Typography level="body-sm" sx={{ color: 'text.tertiary', opacity: 0.35, fontSize: '0.875rem', mb: 1.5, fontStyle: 'italic' }}>
                [removed]
              </Typography>
            ) : isRemoved && isMod ? (
              <Box sx={{ mb: 1.5, px: 2, py: 1, borderRadius: '6px', bgcolor: 'danger.softBg', border: '1px solid', borderColor: 'danger.300' }}>
                <Typography level="body-sm" sx={{ color: 'danger.600', fontSize: '0.8rem', fontStyle: 'italic' }}>
                  removed by mod: {comment.body}
                </Typography>
              </Box>
            ) : editing ? (
              <Box sx={{ mb: 1.5 }}>
                <Textarea
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  minRows={2}
                  maxRows={6}
                  sx={{ mb: 1, fontSize: '0.875rem', '--Textarea-focusedThickness': '0px', borderRadius: '6px' }}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="sm" loading={saving} onClick={handleEdit} sx={{ borderRadius: '6px', fontWeight: 600, fontSize: '0.75rem' }}>
                    save
                  </Button>
                  <Button size="sm" variant="plain" onClick={() => setEditing(false)} sx={{ borderRadius: '6px', color: 'text.tertiary', fontSize: '0.75rem' }}>
                    cancel
                  </Button>
                </Box>
              </Box>
            ) : (
              <Typography
                level="body-sm"
                sx={{ color: 'text.secondary', lineHeight: 1.65, fontSize: '0.875rem', mb: 1.5, whiteSpace: 'pre-wrap' }}
              >
                {comment.body}
              </Typography>
            )}

            {!editing && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <VoteButtons
                  score={comment.score}
                  userVote={comment.user_vote}
                  onVote={handleVote}
                />

                {currentUserId && depth < 2 && (
                  <Box
                    component="button"
                    onClick={() => setReplying(r => !r)}
                    sx={{ background: 'none', border: 'none', cursor: 'pointer', p: 0 }}
                  >
                    <Typography sx={{ fontSize: '0.72rem', color: 'text.tertiary', opacity: 0.4, '&:hover': { opacity: 0.8 } }}>
                      reply
                    </Typography>
                  </Box>
                )}

                {isOwner && !editing && !confirmingDelete && (
                  <>
                    <Box
                      component="button"
                      onClick={() => setEditing(true)}
                      sx={{ background: 'none', border: 'none', cursor: 'pointer', p: 0 }}
                    >
                      <Typography sx={{ fontSize: '0.72rem', color: 'text.tertiary', opacity: 0.35, '&:hover': { opacity: 0.7 } }}>
                        edit
                      </Typography>
                    </Box>
                    <Box
                      component="button"
                      onClick={() => setConfirmingDelete(true)}
                      sx={{ background: 'none', border: 'none', cursor: 'pointer', p: 0 }}
                    >
                      <Typography sx={{ fontSize: '0.72rem', color: 'text.tertiary', opacity: 0.35, '&:hover': { opacity: 0.7, color: 'danger.400' } }}>
                        delete
                      </Typography>
                    </Box>
                  </>
                )}

                {confirmingDelete && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography sx={{ fontSize: '0.72rem', color: 'text.tertiary', opacity: 0.55 }}>
                      say it with your chest —
                    </Typography>
                    <Box component="button" onClick={handleDelete} sx={{ background: 'none', border: 'none', cursor: 'pointer', p: 0 }}>
                      <Typography sx={{ fontSize: '0.72rem', color: 'danger.500', opacity: 0.8, '&:hover': { opacity: 1 } }}>
                        yeah delete it
                      </Typography>
                    </Box>
                    <Box component="button" onClick={() => setConfirmingDelete(false)} sx={{ background: 'none', border: 'none', cursor: 'pointer', p: 0 }}>
                      <Typography sx={{ fontSize: '0.72rem', color: 'text.tertiary', opacity: 0.35, '&:hover': { opacity: 0.7 } }}>
                        cancel
                      </Typography>
                    </Box>
                  </Box>
                )}

                {isMod && (
                  <Box component="button" onClick={handleModRemove} disabled={modRemoving} sx={{ background: 'none', border: 'none', cursor: 'pointer', p: 0 }}>
                    <Typography sx={{ fontSize: '0.72rem', color: isRemoved ? 'danger.500' : 'text.tertiary', opacity: isRemoved ? 0.8 : 0.35, '&:hover': { opacity: 0.9 } }}>
                      {isRemoved ? 'restore' : 'mod remove'}
                    </Typography>
                  </Box>
                )}

                {currentUserId && !isOwner && !isMod && (
                  <Box component="button" onClick={() => setReportOpen(true)} sx={{ background: 'none', border: 'none', cursor: 'pointer', p: 0 }}>
                    <Typography sx={{ fontSize: '0.72rem', color: 'text.tertiary', opacity: 0.25, '&:hover': { opacity: 0.6 } }}>
                      report
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            <Modal open={reportOpen} onClose={() => setReportOpen(false)}>
              <ModalDialog sx={{ borderRadius: '10px', maxWidth: 380, width: '100%' }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', mb: 0.5 }}>report comment</Typography>
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
                      minRows={2}
                      maxRows={5}
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

            {replying && (
              <Box sx={{ mt: 2 }}>
                <Textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="your reply..."
                  minRows={2}
                  maxRows={6}
                  autoFocus
                  sx={{
                    mb: 1,
                    fontSize: '0.875rem',
                    '--Textarea-focusedThickness': '0px',
                    borderRadius: '6px',
                  }}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="sm"
                    loading={submitting}
                    disabled={!replyText.trim()}
                    onClick={handleReply}
                    sx={{ borderRadius: '6px', fontWeight: 600, fontSize: '0.75rem' }}
                  >
                    reply
                  </Button>
                  <Button
                    size="sm"
                    variant="plain"
                    onClick={() => { setReplying(false); setReplyText('') }}
                    sx={{ borderRadius: '6px', color: 'text.tertiary', fontSize: '0.75rem' }}
                  >
                    cancel
                  </Button>
                </Box>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Replies */}
      {!collapsed && comment.replies && comment.replies.length > 0 && (
        <Box>
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              currentUserId={currentUserId}
              isMod={isMod}
              depth={depth + 1}
            />
          ))}
        </Box>
      )}
    </Box>
  )
}

export default function CommentThread({ postId, comments, currentUserId, isMod = false }: Props) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const tree = buildTree(comments)

  async function handleSubmit() {
    if (!text.trim()) return
    setSubmitting(true)
    await fetch(`/api/community/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: text }),
    })
    setText('')
    setSubmitting(false)
    router.refresh()
  }

  return (
    <Box>
      {/* Comment input */}
      {currentUserId && (
        <Box sx={{ mb: 4 }}>
          <Textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="add a comment..."
            minRows={3}
            maxRows={8}
            sx={{
              mb: 1.5,
              fontSize: '0.9rem',
              bgcolor: 'background.surface',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '8px',
              '--Textarea-focusedThickness': '0px',
              '&:focus-within': { borderColor: 'text.tertiary' },
              textarea: { '&::placeholder': { color: 'text.tertiary', opacity: 0.35 } },
            }}
          />
          <Button
            size="sm"
            disabled={!text.trim() || submitting}
            loading={submitting}
            onClick={handleSubmit}
            sx={{ borderRadius: '8px', fontWeight: 600, fontSize: '0.8rem' }}
          >
            comment
          </Button>
        </Box>
      )}

      {/* Comment list */}
      {tree.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.3 }}>
            no comments yet — be the first
          </Typography>
        </Box>
      ) : (
        <Box>
          {tree.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              currentUserId={currentUserId}
              isMod={isMod}
              depth={0}
            />
          ))}
        </Box>
      )}
    </Box>
  )
}
