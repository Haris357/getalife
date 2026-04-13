export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Button from '@mui/joy/Button'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import PostCard from '@/components/community/PostCard'
import CommentThread from '@/components/community/CommentThread'
import CommunitySidebar from '@/components/community/CommunitySidebar'
import { isUserMod } from '@/lib/utils/community'
import type { CommunityPost, CommunityComment, CommunitySettings, CommunityRule } from '@/types'

interface Props {
  params: { postId: string }
}

export default async function PostDetailPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: rawPost }, { data: rawComments }, settingsRes, rulesRes] = await Promise.all([
    supabase.from('posts_with_authors').select('*').eq('id', params.postId).single(),
    supabase
      .from('comments_with_authors')
      .select('*')
      .eq('post_id', params.postId)
      .order('score', { ascending: false })
      .order('created_at', { ascending: true }),
    supabase.from('community_settings').select('*').eq('id', 1).single(),
    supabase.from('community_rules').select('*').order('display_order', { ascending: true }),
  ])

  if (!rawPost) notFound()

  let post = rawPost as CommunityPost
  let comments = (rawComments ?? []) as CommunityComment[]

  const isMod = user ? await isUserMod(user.id) : false

  if (post.removed && !isMod && user?.id !== post.user_id) notFound()

  const settings: CommunitySettings = settingsRes.data ?? {
    id: 1, name: 'r/getalife', description: 'one community · one focus · do the work', cover_url: null, avatar_url: null,
  }
  const rules: CommunityRule[] = rulesRes.data ?? []

  if (user) {
    const commentIds = comments.map(c => c.id)
    const [{ data: postVote }, { data: save }, { data: commentVotes }] = await Promise.all([
      supabase.from('post_votes').select('value').eq('post_id', params.postId).eq('user_id', user.id).single(),
      supabase.from('saved_posts').select('post_id').eq('post_id', params.postId).eq('user_id', user.id).single(),
      commentIds.length > 0
        ? supabase.from('comment_votes').select('comment_id, value').eq('user_id', user.id).in('comment_id', commentIds)
        : Promise.resolve({ data: [] }),
    ])
    post = { ...post, user_vote: (postVote as { value: 1 | -1 } | null)?.value ?? null, is_saved: !!save }
    const voteMap = new Map(((commentVotes as { comment_id: string; value: 1 | -1 }[] | null) ?? []).map(v => [v.comment_id, v.value]))
    comments = comments.map(c => ({ ...c, user_vote: voteMap.get(c.id) ?? null }))
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.body' }}>
      <Header
        email={user?.email ?? undefined}
        userId={user?.id}
        backHref="/community"
        backLabel="r/getalife"
      />

      <Box
        sx={{
          maxWidth: 1100,
          mx: 'auto',
          px: { xs: 3, md: 6 },
          py: 4,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 320px' },
          gap: 4,
        }}
      >
        {/* Left: post + comments */}
        <Box>
          {/* Breadcrumb */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <Link href="/community" style={{ textDecoration: 'none' }}>
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'text.tertiary',
                  opacity: 0.6,
                  letterSpacing: '0.04em',
                  transition: 'opacity 0.15s',
                  '&:hover': { opacity: 1 },
                }}
              >
                r/getalife
              </Typography>
            </Link>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.tertiary', opacity: 0.3 }}>→</Typography>
            <Typography
              sx={{
                fontSize: '0.75rem',
                color: 'text.tertiary',
                opacity: 0.45,
                maxWidth: 320,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {post.title}
            </Typography>
          </Box>

          <PostCard post={post} currentUserId={user?.id} isMod={isMod} />

          {post.body && post.body.length > 200 && (
            <Box
              sx={{
                mt: 3,
                mb: 2,
                p: { xs: 2.5, md: 3 },
                bgcolor: 'background.surface',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '12px',
              }}
            >
              <Typography
                level="body-sm"
                sx={{ color: 'text.secondary', lineHeight: 1.75, fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}
              >
                {post.body}
              </Typography>
            </Box>
          )}

          {/* Comment count header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 5, mb: 3 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--joy-palette-text-tertiary)', opacity: 0.45 }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <Typography
              level="body-xs"
              sx={{
                color: 'text.tertiary',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontSize: '0.68rem',
                opacity: 0.5,
                fontWeight: 700,
              }}
            >
              {comments.length} comment{comments.length === 1 ? '' : 's'}
            </Typography>
          </Box>

          <CommentThread
            postId={params.postId}
            comments={comments}
            currentUserId={user?.id}
            isMod={isMod}
          />

          {/* Back pill button */}
          <Box sx={{ mt: 6, pb: 4 }}>
            <Link href="/community" style={{ textDecoration: 'none' }}>
              <Button
                variant="outlined"
                size="sm"
                sx={{
                  borderRadius: '20px',
                  borderColor: 'divider',
                  color: 'text.tertiary',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  px: 2.5,
                  '&:hover': { borderColor: 'text.tertiary', bgcolor: 'background.level1' },
                }}
              >
                ← back to community
              </Button>
            </Link>
          </Box>
        </Box>

        {/* Right: sidebar */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <CommunitySidebar
            settings={settings}
            rules={rules}
            isMod={isMod}
            currentUserId={user?.id}
          />
        </Box>
      </Box>
    </Box>
  )
}
