'use client'

import { useEffect, useState } from 'react'
import { useColorScheme } from '@mui/joy/styles'
import Box from '@mui/joy/Box'

const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#737373" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
)

const MoonIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#737373" strokeWidth="2" strokeLinecap="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

export default function ThemeToggle() {
  const { mode, setMode } = useColorScheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Before mount: render sun (matches defaultMode="dark") so server and client agree
  const isDark = mounted ? mode !== 'light' : true

  return (
    <Box
      component="button"
      onClick={() => setMode(isDark ? 'light' : 'dark')}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      sx={{
        width: 32,
        height: 32,
        borderRadius: '7px',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.level1',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'border-color 0.15s, background 0.15s',
        '&:hover': {
          borderColor: 'text.tertiary',
          bgcolor: 'background.level2',
        },
      }}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </Box>
  )
}
