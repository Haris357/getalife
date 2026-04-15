'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Dropdown from '@mui/joy/Dropdown'
import MenuButton from '@mui/joy/MenuButton'
import Menu from '@mui/joy/Menu'
import MenuItem from '@mui/joy/MenuItem'
import Drawer from '@mui/joy/Drawer'
import ModalClose from '@mui/joy/ModalClose'
import ThemeToggle from './ThemeToggle'
import NotificationBell from '@/components/community/NotificationBell'

interface Props {
  email?: string
  userId?: string
  backHref?: string
  backLabel?: string
}

const PRIMARY_NAV = [
  { href: '/community', label: 'community' },
  { href: '/community/challenges', label: 'challenges' },
  { href: '/leaderboard', label: 'leaderboard' },
  
]

const MORE_NAV = [
  { href: '/goals', label: 'goals board' },
  { href: '/dashboard/buddies', label: 'buddies' },
  { href: '/dashboard/pods', label: 'pods' },
  { href: '/dashboard/coach', label: 'coach' },
  { href: '/dashboard/profile', label: 'profile & rank' },
  { href: '/dashboard/settings', label: 'settings' },
]

const ALL_MOBILE_NAV = [
  { href: '/dashboard', label: 'dashboard', section: 'home' },
  ...PRIMARY_NAV.map(l => ({ ...l, section: 'discover' })),
  ...MORE_NAV.map(l => ({ ...l, section: 'more' })),
]

export default function Header({ email, userId, backHref, backLabel }: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isDashboard = pathname === '/dashboard'
  const showAutoBack = !!userId && !isDashboard && !backHref
  const effectiveBackHref = backHref ?? (showAutoBack ? '/dashboard' : undefined)
  const effectiveBackLabel = backLabel ?? (showAutoBack ? '← dashboard' : undefined)

  const isActive = (href: string) => pathname === href

  return (
    <>
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          bgcolor: 'rgba(255,255,255,0.92)',
          '[data-joy-color-scheme="dark"] &': { bgcolor: 'rgba(9,9,9,0.93)' },
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          px: { xs: 3, md: 5 },
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 3,
        }}
      >
        {/* ── Left: Logo + back ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <Typography
              sx={{
                fontSize: '1rem',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              getalife
            </Typography>
          </Link>

          {effectiveBackHref && effectiveBackLabel && (
            <>
              <Box sx={{ width: '1px', height: 14, bgcolor: 'divider', flexShrink: 0 }} />
              <Link href={effectiveBackHref} style={{ textDecoration: 'none' }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    px: 1.25,
                    py: 0.5,
                    borderRadius: 8,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'border-color 0.15s, background 0.15s',
                    '&:hover': {
                      borderColor: 'rgba(14,165,233,0.4)',
                      bgcolor: 'rgba(14,165,233,0.06)',
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.72rem',
                      color: 'text.tertiary',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {effectiveBackLabel}
                  </Typography>
                </Box>
              </Link>
            </>
          )}
        </Box>

        {/* ── Center: Primary nav (desktop) ── */}
        {email && (
          <Box
            sx={{
              display: { xs: 'none', lg: 'flex' },
              alignItems: 'center',
              gap: 0.25,
              flex: 1,
              justifyContent: 'center',
            }}
          >
            {PRIMARY_NAV.map(link => (
              <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
                <Box
                  sx={{
                    px: 1.75,
                    py: 0.85,
                    borderRadius: 8,
                    position: 'relative',
                    transition: 'background 0.15s',
                    bgcolor: isActive(link.href) ? 'rgba(14,165,233,0.08)' : 'transparent',
                    '&:hover': {
                      bgcolor: isActive(link.href)
                        ? 'rgba(14,165,233,0.1)'
                        : 'rgba(0,0,0,0.04)',
                    },
                    '[data-joy-color-scheme="dark"] &:hover': {
                      bgcolor: isActive(link.href)
                        ? 'rgba(14,165,233,0.12)'
                        : 'rgba(255,255,255,0.05)',
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.8rem',
                      fontWeight: isActive(link.href) ? 600 : 400,
                      color: isActive(link.href) ? 'primary.600' : 'text.secondary',
                      '[data-joy-color-scheme="dark"] &': {
                        color: isActive(link.href) ? 'primary.300' : 'text.secondary',
                      },
                      whiteSpace: 'nowrap',
                      transition: 'color 0.15s',
                    }}
                  >
                    {link.label}
                  </Typography>
                  {isActive(link.href) && (
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 16,
                        height: 2,
                        borderRadius: 2,
                        background:
                          'linear-gradient(90deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                      }}
                    />
                  )}
                </Box>
              </Link>
            ))}

            {/* More dropdown */}
            <Dropdown>
              <MenuButton
                variant="plain"
                size="sm"
                sx={{
                  px: 1.75,
                  py: 0.85,
                  fontSize: '0.8rem',
                  color: 'text.secondary',
                  fontWeight: 400,
                  minHeight: 'unset',
                  borderRadius: 8,
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                  '[data-joy-color-scheme="dark"] &:hover': {
                    bgcolor: 'rgba(255,255,255,0.05)',
                  },
                }}
              >
                more ↓
              </MenuButton>
              <Menu
                placement="bottom"
                size="sm"
                sx={{
                  '--List-padding': '6px',
                  '--ListItem-radius': '6px',
                  minWidth: 180,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
                }}
              >
                {MORE_NAV.map(link => (
                  <MenuItem
                    key={link.href}
                    component={Link}
                    href={link.href}
                    selected={isActive(link.href)}
                    sx={{ fontSize: '0.82rem', py: 0.9 }}
                  >
                    {link.label}
                  </MenuItem>
                ))}
              </Menu>
            </Dropdown>
          </Box>
        )}

        {/* ── Right: Actions ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          {userId && <NotificationBell userId={userId} />}
          <ThemeToggle />

          {/* Mobile hamburger */}
          {email && (
            <Box
              component="button"
              onClick={() => setMobileOpen(true)}
              sx={{
                display: { xs: 'flex', lg: 'none' },
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '5px',
                cursor: 'pointer',
                p: '9px',
                border: 'none',
                bgcolor: 'transparent',
                borderRadius: 6,
                ml: 0.5,
                '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' },
                '[data-joy-color-scheme="dark"] &:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
              }}
              aria-label="Open menu"
            >
              <Box sx={{ width: 18, height: '1.5px', bgcolor: 'text.primary', borderRadius: 2 }} />
              <Box sx={{ width: 18, height: '1.5px', bgcolor: 'text.primary', borderRadius: 2 }} />
              <Box
                sx={{
                  width: 12,
                  height: '1.5px',
                  bgcolor: 'text.primary',
                  borderRadius: 2,
                  alignSelf: 'flex-start',
                }}
              />
            </Box>
          )}
        </Box>
      </Box>

      {/* ── Mobile drawer ── */}
      {email && (
        <Drawer
          anchor="right"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{ '--Drawer-transitionDuration': '0.22s' }}
          slotProps={{
            content: {
              sx: { bgcolor: 'background.body', width: 300, p: 0 },
            },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Drawer header */}
            <Box
              sx={{
                px: 3,
                py: 2.5,
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography
                sx={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  background:
                    'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                getalife
              </Typography>
              <ModalClose sx={{ position: 'static', '--IconButton-size': '30px' }} />
            </Box>

            {/* Nav links */}
            <Box sx={{ flex: 1, overflow: 'auto', px: 2, py: 2.5 }}>
              {(() => {
                const sections: Record<string, typeof ALL_MOBILE_NAV> = {}
                ALL_MOBILE_NAV.forEach(link => {
                  if (!sections[link.section]) sections[link.section] = []
                  sections[link.section].push(link)
                })
                return Object.entries(sections).map(([section, links]) => (
                  <Box key={section} sx={{ mb: 3 }}>
                    <Typography
                      sx={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'text.tertiary',
                        opacity: 0.4,
                        px: 1.5,
                        mb: 0.75,
                      }}
                    >
                      {section}
                    </Typography>
                    {links.map(link => (
                      <Link
                        key={link.href}
                        href={link.href}
                        style={{ textDecoration: 'none' }}
                        onClick={() => setMobileOpen(false)}
                      >
                        <Box
                          sx={{
                            px: 1.75,
                            py: 1.1,
                            borderRadius: 10,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            bgcolor: isActive(link.href)
                              ? 'rgba(14,165,233,0.08)'
                              : 'transparent',
                            transition: 'background 0.15s',
                            '&:hover': {
                              bgcolor: isActive(link.href)
                                ? 'rgba(14,165,233,0.1)'
                                : 'rgba(0,0,0,0.04)',
                            },
                            '[data-joy-color-scheme="dark"] &:hover': {
                              bgcolor: isActive(link.href)
                                ? 'rgba(14,165,233,0.12)'
                                : 'rgba(255,255,255,0.05)',
                            },
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: '0.9rem',
                              fontWeight: isActive(link.href) ? 600 : 400,
                              color: isActive(link.href)
                                ? 'primary.600'
                                : 'text.secondary',
                              '[data-joy-color-scheme="dark"] &': {
                                color: isActive(link.href)
                                  ? 'primary.300'
                                  : 'text.secondary',
                              },
                            }}
                          >
                            {link.label}
                          </Typography>
                          {isActive(link.href) && (
                            <Box
                              sx={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background:
                                  'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                              }}
                            />
                          )}
                        </Box>
                      </Link>
                    ))}
                  </Box>
                ))
              })()}
            </Box>

            {/* Drawer footer */}
            <Box
              sx={{
                px: 3,
                py: 2,
                borderTop: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background:
                    'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Typography
                  sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}
                >
                  {email[0].toUpperCase()}
                </Typography>
              </Box>
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  color: 'text.tertiary',
                  opacity: 0.55,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {email}
              </Typography>
            </Box>
          </Box>
        </Drawer>
      )}
    </>
  )
}
