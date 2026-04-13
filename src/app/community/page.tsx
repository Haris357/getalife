export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import dynamicImport from 'next/dynamic'
import Link from 'next/link'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import PostFeed from '@/components/community/PostFeed'
import CommunitySidebar from '@/components/community/CommunitySidebar'
import GradientButton from '@/components/shared/GradientButton'
import { isUserMod } from '@/lib/utils/community'
import type { CommunityPost, CommunitySettings, CommunityRule, SortMode } from '@/types'

const ActivityFeed = dynamicImport(() => import('@/components/community/ActivityFeed'), { ssr: false })

interface Props {
  searchParams: { sort?: string }
}

export default async function CommunityPage({ searchParams }: Props) {
  const supabase = await createClient()
  const sort = (['new', 'hot', 'top'].includes(searchParams.sort ?? '') ? searchParams.sort : 'new') as SortMode

  const { data: { user } } = await supabase.auth.getUser()

  const [settingsRes, rulesRes, modsRes, postCountRes] = await Promise.all([
    supabase.from('community_settings').select('*').eq('id', 1).single(),
    supabase.from('community_rules').select('*').order('display_order', { ascending: true }),
    supabase.from('community_moderators').select('user_id, profiles(display_name)').limit(10),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('removed', false),
  ])

  const settings: CommunitySettings = settingsRes.data ?? {
    id: 1,
    name: 'r/getalife',
    description: 'one community · one focus · do the work',
    cover_url: null,
    avatar_url: null,
  }
  const rules: CommunityRule[] = rulesRes.data ?? []
  const moderators = (modsRes.data ?? []).map((m: { user_id: string; profiles: unknown }) => {
    const profile = m.profiles as { display_name: string | null } | null
    return { user_id: m.user_id, display_name: profile?.display_name ?? null }
  })
  const postCount = postCountRes.count ?? 0

  let query = supabase
    .from('posts_with_authors')
    .select('*')
    .limit(30)

  if (sort === 'new') {
    query = query.order('created_at', { ascending: false })
  } else if (sort === 'top') {
    query = query.order('score', { ascending: false }).order('created_at', { ascending: false })
  } else {
    query = query.order('score', { ascending: false }).order('comment_count', { ascending: false }).order('created_at', { ascending: false })
  }

  const { data: rawPosts } = await query
  let posts: CommunityPost[] = (rawPosts ?? []) as CommunityPost[]

  const [isMod, memberCount] = await Promise.all([
    user ? isUserMod(user.id) : Promise.resolve(false),
    // member count approximated by distinct post authors
    Promise.resolve(moderators.length > 0 ? 1 : 0),
  ])

  const { count: profileCount } = await supabase.from('profiles').select('id', { count: 'exact', head: true })

  if (user && posts.length > 0) {
    const postIds = posts.map(p => p.id)
    const [{ data: votes }, { data: saves }] = await Promise.all([
      supabase.from('post_votes').select('post_id, value').eq('user_id', user.id).in('post_id', postIds),
      supabase.from('saved_posts').select('post_id').eq('user_id', user.id).in('post_id', postIds),
    ])
    const voteMap = new Map((votes ?? []).map(v => [v.post_id, v.value as 1 | -1]))
    const saveSet = new Set((saves ?? []).map(s => s.post_id))
    posts = posts.map(p => ({ ...p, user_vote: voteMap.get(p.id) ?? null, is_saved: saveSet.has(p.id) }))
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.body' }}>
      <Header email={user?.email ?? undefined} userId={user?.id} />

      {/* Cover photo — contained to same width as content, with rounded corners */}
      <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2, md: 4 }, pt: { xs: 2, md: 3 } }}>
        <Box
          sx={{
            height: { xs: 100, md: 200 },
            position: 'relative',
            overflow: 'hidden',
            bgcolor: 'background.level2',
            borderRadius: '16px',
          }}
        >
          {settings.cover_url ? (
            <Box
              component="img"
              src={settings.cover_url}
              alt="community cover"
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, rgba(14,165,233,0.4) 0%, rgba(99,102,241,0.3) 50%, rgba(249,115,22,0.25) 100%)',
              }}
            />
          )}
        </Box>
      </Box>

      {/* Identity bar — avatar overlaps cover bottom edge, matches cover width */}
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box
          sx={{
            maxWidth: 1100,
            mx: 'auto',
            px: { xs: 2, md: 4 },
            pt: 0,
            pb: 2,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 2.5,
            flexWrap: 'wrap',
          }}
        >
          {/* Avatar — pulled up to overlap cover */}
          <Box
            sx={{
              width: { xs: 60, md: 76 },
              height: { xs: 60, md: 76 },
              borderRadius: '50%',
              border: '4px solid',
              borderColor: 'background.surface',
              overflow: 'hidden',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: settings.avatar_url
                ? 'none'
                : 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
              mt: { xs: '-30px', md: '-38px' },
              zIndex: 1,
            }}
          >
            {settings.avatar_url ? (
              <Box
                component="img"
                src={settings.avatar_url}
                alt={settings.name}
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
                r/g
              </Typography>
            )}
          </Box>

          {/* Name + meta */}
          <Box sx={{ mb: 0.5, flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Typography sx={{ fontWeight: 700, fontSize: { xs: '1.15rem', md: '1.4rem' }, letterSpacing: '-0.03em', color: 'text.primary', lineHeight: 1.1 }}>
                {settings.name}
              </Typography>
              {isMod && (
                <Box sx={{ px: 1, py: 0.2, borderRadius: '20px', background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)' }}>
                  <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: '#fff', letterSpacing: '0.06em' }}>MOD</Typography>
                </Box>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mt: 0.4 }}>
              <Typography sx={{ fontSize: '0.72rem', color: 'text.tertiary', opacity: 0.45 }}>
                {(profileCount ?? 0).toLocaleString()} members
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: 'text.tertiary', opacity: 0.45 }}>
                {postCount.toLocaleString()} posts
              </Typography>
            </Box>
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 0.5, flexShrink: 0 }}>
            <Link href="/community/challenges" style={{ textDecoration: 'none' }}>
              <Box
                sx={{
                  px: 2, py: 0.75, borderRadius: '20px',
                  border: '1px solid', borderColor: 'divider',
                  cursor: 'pointer',
                  '&:hover': { borderColor: 'neutral.outlinedHoverBorder' },
                  transition: 'border-color 0.15s',
                }}
              >
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: 'text.tertiary' }}>
                  challenges
                </Typography>
              </Box>
            </Link>
            {isMod && (
              <Link href="/community/mod" style={{ textDecoration: 'none' }}>
                <Box
                  sx={{
                    px: 2, py: 0.75, borderRadius: '20px',
                    border: '1px solid', borderColor: 'divider',
                    cursor: 'pointer',
                    '&:hover': { borderColor: 'neutral.outlinedHoverBorder' },
                    transition: 'border-color 0.15s',
                  }}
                >
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: 'text.tertiary' }}>
                    mod tools
                  </Typography>
                </Box>
              </Link>
            )}
            <Box
              sx={{
                px: 2.5, py: 0.85, borderRadius: '20px',
                border: '1px solid', borderColor: 'primary.outlinedBorder',
                cursor: 'default',
              }}
            >
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'primary.plainColor' }}>
                Joined
              </Typography>
            </Box>
            {user && (
              <Link href="/community/new" style={{ textDecoration: 'none' }}>
                <GradientButton>+ Create Post</GradientButton>
              </Link>
            )}
          </Box>
        </Box>
      </Box>

      {/* Main content */}
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
        {/* Left: posts */}
        <Box>
          <Suspense fallback={null}>
            <PostFeed initialPosts={posts} currentUserId={user?.id} initialSort={sort} isMod={isMod} />
          </Suspense>
        </Box>

        {/* Right: sidebar */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <ActivityFeed />
          <CommunitySidebar
            settings={settings}
            rules={rules}
            isMod={isMod}
            currentUserId={user?.id}
            memberCount={profileCount ?? 0}
            postCount={postCount}
            moderators={moderators}
          />
        </Box>
      </Box>
    </Box>
  )
}
