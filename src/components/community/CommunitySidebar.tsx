import Link from 'next/link'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import type { CommunitySettings, CommunityRule } from '@/types'

interface Moderator {
  user_id: string
  display_name: string | null
}

interface Props {
  settings: CommunitySettings
  rules: CommunityRule[]
  isMod: boolean
  currentUserId?: string
  memberCount?: number
  postCount?: number
  moderators?: Moderator[]
}

export default function CommunitySidebar({
  settings,
  rules,
  isMod,
  currentUserId,
  memberCount = 0,
  postCount = 0,
  moderators = [],
}: Props) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '10px',
        bgcolor: 'background.surface',
        overflow: 'hidden',
      }}
    >
      {/* Community identity */}
      <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              overflow: 'hidden',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: settings.avatar_url
                ? 'none'
                : 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
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
              <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
                r/g
              </Typography>
            )}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: 'text.primary' }}>
              {settings.name}
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: 'text.tertiary', opacity: 0.55, lineHeight: 1.4 }}>
              {settings.description}
            </Typography>
          </Box>
        </Box>

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 3, mb: 2.5 }}>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: 'text.primary' }}>
              {memberCount.toLocaleString()}
            </Typography>
            <Typography sx={{ fontSize: '0.68rem', color: 'text.tertiary', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              members
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: 'text.primary' }}>
              {postCount.toLocaleString()}
            </Typography>
            <Typography sx={{ fontSize: '0.68rem', color: 'text.tertiary', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              posts
            </Typography>
          </Box>
        </Box>

        {/* Buttons */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box
            sx={{
              px: 2,
              py: 1,
              borderRadius: '20px',
              border: '1px solid',
              borderColor: 'primary.500',
              cursor: 'default',
              textAlign: 'center',
            }}
          >
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: 'primary.500' }}>
              Joined
            </Typography>
          </Box>

          {currentUserId && (
            <Link href="/community/new" style={{ textDecoration: 'none' }}>
              <Box
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': { filter: 'brightness(1.08)' },
                  transition: 'filter 0.15s',
                }}
              >
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
                  + Create Post
                </Typography>
              </Box>
            </Link>
          )}
        </Box>
      </Box>

      {/* Rules */}
      {rules.length > 0 && (
        <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'text.tertiary', opacity: 0.6, mb: 2 }}>
            Rules
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {rules.map((rule, i) => (
              <Box key={rule.id} sx={{ display: 'flex', gap: 1.5 }}>
                <Typography sx={{ fontSize: '0.75rem', color: 'text.tertiary', opacity: 0.4, flexShrink: 0, fontWeight: 600, minWidth: 16 }}>
                  {i + 1}.
                </Typography>
                <Box>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, lineHeight: 1.3 }}>
                    {rule.title}
                  </Typography>
                  {rule.description && (
                    <Typography sx={{ fontSize: '0.73rem', color: 'text.tertiary', opacity: 0.55, lineHeight: 1.45, mt: 0.25 }}>
                      {rule.description}
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Moderators */}
      {moderators.length > 0 && (
        <Box sx={{ p: 3, borderBottom: isMod ? '1px solid' : 'none', borderColor: 'divider' }}>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'text.tertiary', opacity: 0.6, mb: 2 }}>
            Moderators
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {moderators.map(mod => (
              <Box key={mod.user_id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                  {mod.display_name ?? 'mod'}
                </Typography>
                <Box
                  sx={{
                    px: 1,
                    py: 0.15,
                    borderRadius: '4px',
                    background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                  }}
                >
                  <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: '#fff', letterSpacing: '0.06em' }}>
                    MOD
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Mod tools link */}
      {isMod && (
        <Box sx={{ p: 3 }}>
          <Link href="/community/mod" style={{ textDecoration: 'none' }}>
            <Typography
              sx={{
                fontSize: '0.78rem',
                color: 'text.tertiary',
                opacity: 0.5,
                '&:hover': { opacity: 1 },
                transition: 'opacity 0.15s',
              }}
            >
              mod tools →
            </Typography>
          </Link>
        </Box>
      )}
    </Box>
  )
}
