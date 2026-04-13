'use client'

import { useState } from 'react'
import Link from 'next/link'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Button from '@mui/joy/Button'

interface PostReport {
  id: string
  reason: string
  created_at: string
  posts: { id: string; title: string; user_id: string; removed: boolean } | null
}

interface CommentReport {
  id: string
  reason: string
  created_at: string
  comments: { id: string; body: string; user_id: string; removed: boolean; post_id: string } | null
}

interface Props {
  postReports: PostReport[]
  commentReports: CommentReport[]
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function EmptyState({ label }: { label: string }) {
  return (
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
        mb: 2,
      }}
    >
      <Typography sx={{ fontSize: '0.82rem', color: 'text.tertiary', opacity: 0.4 }}>
        {label}
      </Typography>
    </Box>
  )
}

export default function ModReportsQueue({ postReports: initialPostReports, commentReports: initialCommentReports }: Props) {
  const [postReports, setPostReports] = useState(initialPostReports)
  const [commentReports, setCommentReports] = useState(initialCommentReports)

  async function dismissPostReport(id: string) {
    await fetch(`/api/community/mod`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'post_report', id }) })
    setPostReports(r => r.filter(x => x.id !== id))
  }

  async function removePost(postId: string, reportId: string) {
    await fetch(`/api/community/posts/${postId}/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ removed: true }),
    })
    setPostReports(r => r.filter(x => x.id !== reportId))
  }

  async function removeComment(commentId: string, reportId: string) {
    await fetch(`/api/community/comments/${commentId}/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ removed: true }),
    })
    setCommentReports(r => r.filter(x => x.id !== reportId))
  }

  async function dismissCommentReport(id: string) {
    setCommentReports(r => r.filter(x => x.id !== id))
  }

  const subheadSx = {
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: 'text.tertiary',
    opacity: 0.5,
    mb: 2,
  }

  return (
    <Box>
      {/* Post reports */}
      <Typography sx={subheadSx}>
        Post Reports ({postReports.length})
      </Typography>

      {postReports.length === 0 ? (
        <EmptyState label="no post reports — all clear" />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
          {postReports.map(r => (
            <Box
              key={r.id}
              sx={{
                p: 2.5,
                borderRadius: '10px',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.level1',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {r.posts && (
                    <Link href={`/community/${r.posts.id}`} style={{ textDecoration: 'none' }}>
                      <Typography
                        sx={{
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          color: 'text.primary',
                          mb: 0.5,
                          '&:hover': { opacity: 0.7 },
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {r.posts.title}
                      </Typography>
                    </Link>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Box
                      sx={{
                        px: 1.5,
                        py: 0.3,
                        borderRadius: '20px',
                        bgcolor: 'warning.softBg',
                        border: '1px solid',
                        borderColor: 'warning.outlinedBorder',
                      }}
                    >
                      <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: 'warning.600' }}>
                        {r.reason}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.68rem', color: 'text.tertiary', opacity: 0.4 }}>
                      {timeAgo(r.created_at)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                {r.posts && !r.posts.removed && (
                  <Button
                    size="sm"
                    color="danger"
                    variant="soft"
                    onClick={() => removePost(r.posts!.id, r.id)}
                    sx={{ borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, px: 2 }}
                  >
                    remove post
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outlined"
                  onClick={() => dismissPostReport(r.id)}
                  sx={{
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    borderColor: 'divider',
                    color: 'text.tertiary',
                    px: 2,
                    '&:hover': { borderColor: 'text.tertiary' },
                  }}
                >
                  dismiss
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Comment reports */}
      <Typography sx={{ ...subheadSx, mt: 4 }}>
        Comment Reports ({commentReports.length})
      </Typography>

      {commentReports.length === 0 ? (
        <EmptyState label="no comment reports — all clear" />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {commentReports.map(r => (
            <Box
              key={r.id}
              sx={{
                p: 2.5,
                borderRadius: '10px',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.level1',
              }}
            >
              {r.comments && (
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '6px',
                    bgcolor: 'background.surface',
                    border: '1px solid',
                    borderColor: 'divider',
                    mb: 2,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.82rem',
                      color: 'text.secondary',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      fontStyle: 'italic',
                    }}
                  >
                    &ldquo;{r.comments.body}&rdquo;
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.3,
                    borderRadius: '20px',
                    bgcolor: 'warning.softBg',
                    border: '1px solid',
                    borderColor: 'warning.outlinedBorder',
                  }}
                >
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: 'warning.600' }}>
                    {r.reason}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.68rem', color: 'text.tertiary', opacity: 0.4 }}>
                  {timeAgo(r.created_at)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                {r.comments && !r.comments.removed && (
                  <Button
                    size="sm"
                    color="danger"
                    variant="soft"
                    onClick={() => removeComment(r.comments!.id, r.id)}
                    sx={{ borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, px: 2 }}
                  >
                    remove comment
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outlined"
                  onClick={() => dismissCommentReport(r.id)}
                  sx={{
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    borderColor: 'divider',
                    color: 'text.tertiary',
                    px: 2,
                    '&:hover': { borderColor: 'text.tertiary' },
                  }}
                >
                  dismiss
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}
