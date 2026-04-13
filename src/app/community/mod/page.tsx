export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import { isUserMod } from '@/lib/utils/community'
import ModSettingsForm from './ModSettingsForm'
import ModRulesEditor from './ModRulesEditor'
import ModReportsQueue from './ModReportsQueue'
import ModBanList from './ModBanList'
import type { CommunitySettings, CommunityRule } from '@/types'

export default async function ModCenterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')
  if (!(await isUserMod(user.id))) redirect('/community')

  const [settingsRes, rulesRes, postReportsRes, commentReportsRes, bansRes] = await Promise.all([
    supabase.from('community_settings').select('*').eq('id', 1).single(),
    supabase.from('community_rules').select('*').order('display_order', { ascending: true }),
    supabase
      .from('post_reports')
      .select('*, posts(id, title, user_id, removed)')
      .eq('reviewed', false)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('comment_reports')
      .select('*, comments(id, body, user_id, removed, post_id)')
      .eq('reviewed', false)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('community_bans').select('*, profiles!user_id(display_name)').order('created_at', { ascending: false }),
  ])

  const settings: CommunitySettings = settingsRes.data ?? {
    id: 1, name: 'r/getalife', description: 'one community · one focus · do the work', cover_url: null, avatar_url: null,
  }
  const rules: CommunityRule[] = rulesRes.data ?? []
  const postReports = postReportsRes.data ?? []
  const commentReports = commentReportsRes.data ?? []
  const bans = bansRes.data ?? []

  const totalReports = postReports.length + commentReports.length

  const sectionCardSx = {
    bgcolor: 'background.surface',
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: '12px',
    p: { xs: 3, md: 4 },
  }

  const sectionHeadingSx = {
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
    mb: 3,
    pb: 2.5,
    borderBottom: '1px solid',
    borderColor: 'divider',
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.body' }}>
      <Header email={user.email ?? undefined} userId={user.id} backHref="/community" backLabel="r/getalife" />

      <Box sx={{ maxWidth: 820, mx: 'auto', px: { xs: 3, md: 4 }, py: 6 }}>
        {/* Page header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          {/* Shield SVG */}
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </Box>
          <Box>
            <Typography
              level="h3"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.4rem', md: '1.7rem' },
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Mod Tools
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: 'text.tertiary', opacity: 0.5 }}>
              r/getalife
            </Typography>
          </Box>
        </Box>

        {/* Pill navigation tabs */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            mt: 4,
            mb: 5,
            flexWrap: 'wrap',
          }}
        >
          {[
            { label: 'Settings', href: '#settings' },
            { label: 'Rules', href: '#rules' },
            { label: `Reports${totalReports > 0 ? ` (${totalReports})` : ''}`, href: '#reports' },
            { label: 'Bans', href: '#bans' },
            { label: 'Challenges', href: '#challenges' },
          ].map(tab => (
            <Link key={tab.href} href={tab.href} style={{ textDecoration: 'none' }}>
              <Box
                sx={{
                  px: 2.5,
                  py: 0.75,
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.surface',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  '&:hover': {
                    borderColor: 'rgb(14,165,233)',
                    bgcolor: 'background.level1',
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'text.secondary',
                    lineHeight: 1,
                  }}
                >
                  {tab.label}
                </Typography>
              </Box>
            </Link>
          ))}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Settings section */}
          <Box id="settings" sx={sectionCardSx}>
            <Box sx={sectionHeadingSx}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.45 }}>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14" />
                <path d="M2 12h1M21 12h1M12 2v1M12 21v1" />
              </svg>
              <Typography
                sx={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'text.tertiary',
                  opacity: 0.55,
                }}
              >
                Community Settings
              </Typography>
            </Box>
            <ModSettingsForm settings={settings} />
          </Box>

          {/* Rules section */}
          <Box id="rules" sx={sectionCardSx}>
            <Box sx={sectionHeadingSx}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.45 }}>
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              <Typography
                sx={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'text.tertiary',
                  opacity: 0.55,
                }}
              >
                Rules
              </Typography>
            </Box>
            <ModRulesEditor initialRules={rules} />
          </Box>

          {/* Reports section */}
          <Box id="reports" sx={sectionCardSx}>
            <Box sx={sectionHeadingSx}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.45 }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <Typography
                sx={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'text.tertiary',
                  opacity: 0.55,
                }}
              >
                Reports
                {totalReports > 0 && (
                  <Box
                    component="span"
                    sx={{
                      ml: 1.5,
                      px: 1,
                      py: 0.25,
                      borderRadius: '20px',
                      bgcolor: 'danger.softBg',
                      color: 'danger.600',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      verticalAlign: 'middle',
                    }}
                  >
                    {totalReports}
                  </Box>
                )}
              </Typography>
            </Box>
            <ModReportsQueue
              postReports={postReports}
              commentReports={commentReports}
            />
          </Box>

          {/* Bans section */}
          <Box id="bans" sx={sectionCardSx}>
            <Box sx={sectionHeadingSx}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.45 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
              <Typography
                sx={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'text.tertiary',
                  opacity: 0.55,
                }}
              >
                Banned Users
              </Typography>
            </Box>
            <ModBanList bans={bans} />
          </Box>

          {/* Challenges section */}
          <Box id="challenges" sx={sectionCardSx}>
            <Box sx={sectionHeadingSx}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.45 }}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <Typography
                sx={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'text.tertiary',
                  opacity: 0.55,
                }}
              >
                Challenges
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', opacity: 0.7, mb: 2.5 }}>
              Create and manage community accountability challenges. Only mods can create challenges.
            </Typography>
            <Link href="/community/challenges/new" style={{ textDecoration: 'none' }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2.5,
                  py: 1,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                  cursor: 'pointer',
                  transition: 'opacity 0.15s',
                  '&:hover': { opacity: 0.85 },
                }}
              >
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                  + Create Challenge
                </Typography>
              </Box>
            </Link>
            <Box sx={{ mt: 2 }}>
              <Link href="/community/challenges" style={{ textDecoration: 'none' }}>
                <Typography sx={{ fontSize: '0.78rem', color: 'text.tertiary', opacity: 0.5, '&:hover': { opacity: 1 }, transition: 'opacity 0.15s' }}>
                  view all challenges →
                </Typography>
              </Link>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
