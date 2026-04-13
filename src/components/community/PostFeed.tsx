'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import PostCard from './PostCard'
import type { CommunityPost, SortMode } from '@/types'

interface Props {
  initialPosts: CommunityPost[]
  currentUserId?: string
  initialSort?: SortMode
  isMod?: boolean
}

function IconNew() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function IconHot() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  )
}

function IconTop() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" /><line x1="12" y1="9" x2="12" y2="20" /><line x1="4" y1="4" x2="20" y2="4" />
    </svg>
  )
}

const SORTS: { value: SortMode; label: string; icon: React.ReactNode }[] = [
  { value: 'new', label: 'New', icon: <IconNew /> },
  { value: 'hot', label: 'Hot', icon: <IconHot /> },
  { value: 'top', label: 'Top', icon: <IconTop /> },
]

export default function PostFeed({ initialPosts, currentUserId, initialSort = 'new', isMod = false }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [sort, setSort] = useState<SortMode>(initialSort)
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts)
  const [loading, setLoading] = useState(false)

  const fetchPosts = useCallback(async (s: SortMode) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/community/posts?sort=${s}&limit=30`)
      if (res.ok) {
        const data = await res.json()
        setPosts(data.posts ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  function handleSort(s: SortMode) {
    setSort(s)
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', s)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    fetchPosts(s)
  }

  return (
    <Box>
      {/* Sort pills */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        {SORTS.map(s => {
          const active = sort === s.value
          return (
            <Box
              key={s.value}
              component="button"
              onClick={() => handleSort(s.value)}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                px: 2,
                py: 0.75,
                borderRadius: '20px',
                border: '1px solid',
                borderColor: active ? 'rgb(14,165,233)' : 'divider',
                bgcolor: active ? 'rgba(14,165,233,0.1)' : 'background.surface',
                cursor: 'pointer',
                transition: 'all 0.15s',
                color: active ? 'rgb(14,165,233)' : 'text.tertiary',
                opacity: active ? 1 : 0.55,
                '&:hover': {
                  opacity: 1,
                  borderColor: active ? 'rgb(14,165,233)' : 'neutral.outlinedHoverBorder',
                  bgcolor: active ? 'rgba(14,165,233,0.12)' : 'background.level1',
                },
              }}
            >
              {s.icon}
              <Typography
                sx={{
                  fontSize: '0.78rem',
                  fontWeight: active ? 700 : 500,
                  color: 'inherit',
                  lineHeight: 1,
                  letterSpacing: '0.01em',
                }}
              >
                {s.label}
              </Typography>
            </Box>
          )
        })}
      </Box>

      {loading ? (
        <Box sx={{ py: 10, textAlign: 'center' }}>
          <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.3 }}>loading...</Typography>
        </Box>
      ) : posts.length === 0 ? (
        <Box sx={{ py: 10, textAlign: 'center' }}>
          <Typography level="body-sm" sx={{ color: 'text.tertiary', opacity: 0.3 }}>
            no posts yet — be the first to post
          </Typography>
        </Box>
      ) : (
        <Box>
          {[...posts]
            .sort((a, b) => {
              if ((b.pinned ? 1 : 0) !== (a.pinned ? 1 : 0)) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)
              return 0
            })
            .map(post => (
              <PostCard key={post.id} post={post} currentUserId={currentUserId} isMod={isMod} />
            ))}
        </Box>
      )}
    </Box>
  )
}
