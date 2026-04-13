import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import { requireUser } from '@/lib/utils/auth'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import SettingsClient from './SettingsClient'
import DisplayNameInput from './DisplayNameInput'
import AvatarUpload from './AvatarUpload'
import SignOutButton from './SignOutButton'
import CoachToggle from '@/components/goals/CoachToggle'

export default async function SettingsPage() {
  const user = await requireUser()
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('unsubscribed, display_name, avatar_url')
    .eq('id', user.id)
    .single()

  const token = Buffer.from(user.id).toString('base64')

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.body' }}>
      <Header email={user.email ?? undefined} backHref="/dashboard" backLabel="dashboard" />

      <Box sx={{ maxWidth: 580, mx: 'auto', px: { xs: 3, md: 4 }, py: 6 }}>
        {/* Page header with gradient left accent */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2.5,
            mb: 6,
          }}
        >
          <Box
            sx={{
              width: 4,
              height: 40,
              borderRadius: '4px',
              background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
              flexShrink: 0,
            }}
          />
          <Box>
            <Typography
              level="body-xs"
              sx={{
                color: 'text.tertiary',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontSize: '0.65rem',
                opacity: 0.5,
                mb: 0.25,
              }}
            >
              account
            </Typography>
            <Typography
              level="h3"
              sx={{ color: 'text.primary', fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.02em' }}
            >
              Settings
            </Typography>
          </Box>
        </Box>

        {/* Profile card — avatar + display name */}
        <Box
          sx={{
            bgcolor: 'background.surface',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '12px',
            p: 3,
            mb: 2.5,
            '&:hover': { borderColor: 'neutral.outlinedHoverBorder' },
            transition: 'border-color 0.15s',
          }}
        >
          <Typography
            level="body-xs"
            sx={{
              color: 'text.tertiary',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontSize: '0.62rem',
              opacity: 0.5,
              mb: 2.5,
            }}
          >
            profile
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <AvatarUpload
              avatarUrl={profile?.avatar_url ?? null}
              displayName={profile?.display_name ?? null}
            />
            <DisplayNameInput displayName={profile?.display_name ?? null} />
          </Box>
        </Box>

        {/* Email card */}
        <Box
          sx={{
            bgcolor: 'background.surface',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '12px',
            p: 3,
            mb: 2.5,
          }}
        >
          <Typography
            level="body-xs"
            sx={{
              color: 'text.tertiary',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontSize: '0.62rem',
              opacity: 0.5,
              mb: 2,
            }}
          >
            email
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Lock icon */}
            <Box sx={{ color: 'text.tertiary', opacity: 0.35, flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </Box>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                bgcolor: 'background.level1',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '20px',
                px: 2,
                py: 0.75,
              }}
            >
              <Typography level="body-xs" sx={{ color: 'text.secondary', fontSize: '0.85rem', fontWeight: 500 }}>
                {user.email}
              </Typography>
            </Box>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.4, fontSize: '0.72rem' }}>
              read-only
            </Typography>
          </Box>
        </Box>

        {/* Notifications card */}
        <Box
          sx={{
            bgcolor: 'background.surface',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '12px',
            p: 3,
            mb: 2.5,
            '&:hover': { borderColor: 'neutral.outlinedHoverBorder' },
            transition: 'border-color 0.15s',
          }}
        >
          <Typography
            level="body-xs"
            sx={{
              color: 'text.tertiary',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontSize: '0.62rem',
              opacity: 0.5,
              mb: 2.5,
            }}
          >
            notifications
          </Typography>
          <SettingsClient
            unsubscribed={profile?.unsubscribed ?? false}
            token={token}
          />
        </Box>

        {/* Coach Mode card */}
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '12px',
            px: 3,
            py: 3,
            mb: 2.5,
            bgcolor: 'background.surface',
            '&:hover': { borderColor: 'neutral.outlinedHoverBorder' },
            transition: 'border-color 0.15s',
          }}
        >
          <Typography
            level="body-xs"
            sx={{
              color: 'text.tertiary',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontSize: '0.62rem',
              opacity: 0.5,
              mb: 2.5,
            }}
          >
            coach mode
          </Typography>
          <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.55, fontSize: '0.78rem', mb: 2 }}>
            get notified when someone you're coaching checks in or misses a day
          </Typography>
          <CoachToggle />
        </Box>

        {/* Danger zone card */}
        <Box
          sx={{
            bgcolor: 'background.surface',
            border: '1px solid',
            borderColor: 'danger.200',
            borderRadius: '12px',
            p: 3,
            background: 'linear-gradient(135deg, rgba(249,115,22,0.03) 0%, rgba(14,165,233,0.03) 100%)',
          }}
        >
          <Typography
            level="body-xs"
            sx={{
              color: 'danger.400',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontSize: '0.62rem',
              opacity: 0.7,
              mb: 2.5,
            }}
          >
            danger zone
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography level="body-sm" sx={{ color: 'text.primary', fontWeight: 600, mb: 0.25, fontSize: '0.9rem' }}>
                signed in as
              </Typography>
              <Typography level="body-xs" sx={{ color: 'text.tertiary', opacity: 0.55, fontSize: '0.8rem' }}>
                {user.email}
              </Typography>
            </Box>
            <SignOutButton />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
