import { notFound } from 'next/navigation'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import { requireUser } from '@/lib/utils/auth'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import AdminStoryRow from './AdminStoryRow'
import type { Story } from '@/types'

function isAdmin(email: string) {
  const admins = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim())
  return admins.includes(email)
}

export default async function AdminPage() {
  const user = await requireUser()
  if (!user.email || !isAdmin(user.email)) notFound()

  const supabase = await createClient()
  const { data } = await supabase
    .from('stories')
    .select('*')
    .order('created_at', { ascending: false })

  const stories = (data ?? []) as Story[]
  const pending = stories.filter((s) => !s.published)
  const published = stories.filter((s) => s.published)

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.body' }}>
      <Header email={user.email} backHref="/dashboard" backLabel="dashboard" />

      <Box sx={{ maxWidth: 720, mx: 'auto', px: { xs: 3, md: 4 }, py: 6 }}>
        <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 1, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.68rem', opacity: 0.5 }}>
          admin
        </Typography>
        <Typography level="h3" sx={{ color: 'text.primary', fontWeight: 700, fontSize: '1.3rem', mb: 6 }}>
          story queue
        </Typography>

        <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 3, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.68rem', opacity: 0.5 }}>
          pending · {pending.length}
        </Typography>

        {pending.length === 0 && (
          <Typography level="body-sm" sx={{ color: 'text.tertiary', opacity: 0.3, mb: 6 }}>
            nothing waiting
          </Typography>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0, mb: 8 }}>
          {pending.map((story) => (
            <AdminStoryRow key={story.id} story={story} />
          ))}
        </Box>

        <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 3, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.68rem', opacity: 0.5 }}>
          published · {published.length}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {published.map((story) => (
            <AdminStoryRow key={story.id} story={story} />
          ))}
        </Box>
      </Box>
    </Box>
  )
}
