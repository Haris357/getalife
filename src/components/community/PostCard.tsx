'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Textarea from '@mui/joy/Textarea'
import Button from '@mui/joy/Button'
import VoteButtons from './VoteButtons'
import UserBadge from './UserBadge'
import ModTools from './ModTools'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import type { CommunityPost } from '@/types'

interface Props {
  post: CommunityPost
  currentUserId?: string
  isMod?: boolean
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function IconChat() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function IconBookmark({ filled }: { filled: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function IconPencil() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  )
}

function ActionPill({ icon, label, onClick, active, danger }: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  active?: boolean
  danger?: boolean
}) {
  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.5,
        py: 0.6,
        borderRadius: '20px',
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        color: active ? 'rgb(14,165,233)' : 'text.tertiary',
        opacity: active ? 1 : 0.4,
        transition: 'opacity 0.12s, background-color 0.12s, color 0.12s',
        '&:hover': {
          opacity: 1,
          bgcolor: danger ? 'danger.softBg' : 'background.level1',
          ...(danger && { color: 'danger.plainColor' }),
        },
      }}
    >
      {icon}
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: 'inherit', lineHeight: 1 }}>
        {label}
      </Typography>
    </Box>
  )
}

export default function PostCard({ post, currentUserId, isMod = false }: Props) {
  const router = useRouter()
  const isOwner = currentUserId === post.user_id

  if (post.removed && !isMod && !isOwner) return null

  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(post.title)
  const [editBody, setEditBody] = useState(post.body ?? '')
  const [saving, setSaving] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isSaved, setIsSaved] = useState(post.is_saved ?? false)

  async function handleVote(value: 1 | -1 | 0) {
    await fetch(`/api/community/posts/${post.id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    })
  }

  async function handleSave() {
    setIsSaved(s => !s)
    await fetch(`/api/community/posts/${post.id}/save`, { method: 'POST' })
  }

  async function handleEdit() {
    setSaving(true)
    await fetch(`/api/community/posts/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle, body: editBody }),
    })
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/community/posts/${post.id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <>
      <Box
        sx={{
          bgcolor: 'background.surface',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '12px',
          mb: 2,
          overflow: 'hidden',
          transition: 'border-color 0.15s',
          '&:hover': { borderColor: 'neutral.outlinedHoverBorder' },
        }}
      >
        {/* Removed banner */}
        {post.removed && (isMod || isOwner) && (
          <Box sx={{ px: 3, py: 1, bgcolor: 'danger.softBg', borderBottom: '1px solid', borderColor: 'danger.outlinedBorder' }}>
            <Typography sx={{ fontSize: '0.72rem', color: 'danger.plainColor', fontWeight: 600 }}>
              removed by mod{post.removed_reason ? `: ${post.removed_reason}` : ''}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 2, p: { xs: 2, md: 2.5 } }}>
          {/* Vote column */}
          <Box sx={{ flexShrink: 0 }}>
            <VoteButtons
              score={post.score}
              userVote={post.user_vote}
              onVote={handleVote}
              vertical
            />
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Status badges */}
            {(post.pinned || post.locked || post.type === 'milestone') && (
              <Box sx={{ display: 'flex', gap: 0.75, mb: 1, flexWrap: 'wrap' }}>
                {post.pinned && (
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.2, borderRadius: '20px', bgcolor: 'success.softBg', border: '1px solid', borderColor: 'success.outlinedBorder' }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="rgb(21,128,61)"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" /></svg>
                    <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: 'success.plainColor', letterSpacing: '0.07em' }}>PINNED</Typography>
                  </Box>
                )}
                {post.locked && (
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.2, borderRadius: '20px', bgcolor: 'warning.softBg', border: '1px solid', borderColor: 'warning.outlinedBorder' }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="rgb(161,98,7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: 'warning.plainColor', letterSpacing: '0.07em' }}>LOCKED</Typography>
                  </Box>
                )}
                {post.type === 'milestone' && (
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 1, py: 0.2, borderRadius: '20px', background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)' }}>
                    <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: '#fff', letterSpacing: '0.07em' }}>MILESTONE</Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Meta line */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
              {post.is_anonymous || post.display_name === null ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {/* Anonymous avatar — grey circle with lock */}
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'background.level2',
                      border: '1px solid',
                      borderColor: 'divider',
                      color: 'text.tertiary',
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </Box>
                  <Typography
                    sx={{ fontSize: '0.75rem', color: 'text.tertiary', fontWeight: 600, fontStyle: 'italic', opacity: 0.55 }}
                  >
                    anonymous
                  </Typography>
                </Box>
              ) : (
                <UserBadge
                  displayName={post.display_name}
                  level={post.author_level}
                  title={post.author_title}
                  avatarUrl={post.author_avatar}
                />
              )}
              <Typography sx={{ fontSize: '0.68rem', color: 'text.tertiary', opacity: 0.35 }}>
                {timeAgo(post.created_at)}
              </Typography>
            </Box>

            {/* Title / Edit mode */}
            {editing ? (
              <Box sx={{ mb: 1.5 }}>
                <Textarea
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  minRows={1}
                  maxRows={3}
                  sx={{ mb: 1, fontSize: '0.9rem', borderRadius: '8px', '--Textarea-focusedThickness': '0px' }}
                />
                <Textarea
                  value={editBody}
                  onChange={e => setEditBody(e.target.value)}
                  placeholder="body (optional)"
                  minRows={2}
                  maxRows={8}
                  sx={{ mb: 1.5, fontSize: '0.85rem', borderRadius: '8px', '--Textarea-focusedThickness': '0px', color: 'text.tertiary' }}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="sm" loading={saving} onClick={handleEdit} sx={{ borderRadius: '20px', fontWeight: 600, fontSize: '0.78rem' }}>
                    save
                  </Button>
                  <Button size="sm" variant="plain" onClick={() => setEditing(false)} sx={{ borderRadius: '20px', color: 'text.tertiary', fontSize: '0.78rem' }}>
                    cancel
                  </Button>
                </Box>
              </Box>
            ) : (
              <Link href={`/community/${post.id}`} style={{ textDecoration: 'none' }}>
                <Typography
                  level="body-md"
                  sx={{
                    color: 'text.primary',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    lineHeight: 1.45,
                    mb: post.body ? 0.75 : 0,
                    '&:hover': { opacity: 0.75 },
                    transition: 'opacity 0.15s',
                  }}
                >
                  {post.title}
                </Typography>
              </Link>
            )}

            {/* Body preview */}
            {post.body && !editing && (
              <Typography
                level="body-sm"
                sx={{
                  color: 'text.tertiary',
                  opacity: 0.65,
                  fontSize: '0.875rem',
                  lineHeight: 1.6,
                  mb: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {post.body}
              </Typography>
            )}

            {/* Image */}
            {post.image_url && !editing && (
              <Box
                component="img"
                src={post.image_url}
                alt={post.title}
                sx={{
                  width: '100%',
                  maxHeight: 320,
                  objectFit: 'cover',
                  borderRadius: '8px',
                  mb: 1.5,
                  display: 'block',
                }}
              />
            )}

            {/* Action bar */}
            {!editing && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0, mt: 0.75, flexWrap: 'wrap', ml: -1.5 }}>
                <ActionPill
                  icon={<IconChat />}
                  label={`${post.comment_count} comment${post.comment_count === 1 ? '' : 's'}`}
                  onClick={() => router.push(`/community/${post.id}`)}
                />

                {currentUserId && (
                  <ActionPill
                    icon={<IconBookmark filled={isSaved} />}
                    label={isSaved ? 'saved' : 'save'}
                    active={isSaved}
                    onClick={handleSave}
                  />
                )}

                {isOwner && (
                  <>
                    <ActionPill icon={<IconPencil />} label="edit" onClick={() => setEditing(true)} />
                    <ActionPill icon={<IconTrash />} label="delete" danger onClick={() => setShowDelete(true)} />
                  </>
                )}

                <ModTools
                  postId={post.id}
                  pinned={post.pinned ?? false}
                  removed={post.removed ?? false}
                  locked={post.locked ?? false}
                  flair={post.flair}
                  isMod={isMod}
                  isOwner={isOwner}
                  currentUserId={currentUserId}
                />
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      <ConfirmDialog
        open={showDelete}
        title="killing your own post?"
        description={`"${post.title.slice(0, 60)}${post.title.length > 60 ? '…' : ''}" — all comments die with it. someone out there might have needed to read this.`}
        confirmLabel="yeah, nuke it"
        cancelLabel="leave it up"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </>
  )
}
