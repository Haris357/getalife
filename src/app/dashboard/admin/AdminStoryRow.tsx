'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Button from '@mui/joy/Button'
import type { Story } from '@/types'

export default function AdminStoryRow({ story }: { story: Story }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function publish() {
    setLoading(true)
    await fetch(`/api/stories/${story.id}/publish`, { method: 'PATCH' })
    router.refresh()
  }

  async function remove() {
    setLoading(true)
    await fetch(`/api/stories/${story.id}/publish`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <Box
      sx={{
        py: 3,
        borderBottom: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 3,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <Typography level="body-sm" sx={{ color: 'text.primary', fontWeight: 600, fontSize: '0.9rem' }}>
            {story.name}
          </Typography>
          {story.published && (
            <Box sx={{ px: 1, py: 0.25, borderRadius: '4px', bgcolor: 'success.softBg' }}>
              <Typography level="body-xs" sx={{ color: 'success.700', fontSize: '0.65rem' }}>live</Typography>
            </Box>
          )}
        </Box>
        <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.6, mb: 1, fontSize: '0.8rem' }}>
          {story.tagline}
        </Typography>
        <Typography
          level="body-xs"
          sx={{
            color: 'text.tertiary',
            opacity: 0.4,
            fontSize: '0.78rem',
            lineHeight: 1.55,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {story.body}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
        {!story.published && (
          <Button
            size="sm"
            loading={loading}
            onClick={publish}
            sx={{ borderRadius: '6px', fontWeight: 600, fontSize: '0.78rem' }}
          >
            publish
          </Button>
        )}
        <Button
          size="sm"
          variant="outlined"
          color="danger"
          loading={loading}
          onClick={remove}
          sx={{ borderRadius: '6px', fontWeight: 600, fontSize: '0.78rem', borderColor: 'divider' }}
        >
          delete
        </Button>
      </Box>
    </Box>
  )
}
