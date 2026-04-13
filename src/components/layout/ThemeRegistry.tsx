'use client'

import { CssVarsProvider, extendTheme } from '@mui/joy/styles'
import CssBaseline from '@mui/joy/CssBaseline'

const theme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        background: {
          body: '#ffffff',
          surface: '#fafafa',
          level1: '#f4f4f4',
          level2: '#eeeeee',
          level3: '#e8e8e8',
        },
        text: {
          primary: '#0a0a0a',
          secondary: '#404040',
          tertiary: '#737373',
        },
        divider: '#ebebeb',
        primary: {
          solidBg: '#0a0a0a',
          solidColor: '#ffffff',
          solidHoverBg: '#262626',
          solidActiveBg: '#404040',
          outlinedBorder: '#d0d0d0',
          outlinedColor: '#0a0a0a',
          outlinedHoverBg: 'rgba(0,0,0,0.04)',
          plainColor: '#0a0a0a',
          plainHoverBg: 'rgba(0,0,0,0.04)',
          50: '#f5f5f5',
          100: '#e5e5e5',
          200: '#d4d4d4',
          300: '#a3a3a3',
          400: '#737373',
          500: '#525252',
          600: '#404040',
          700: '#262626',
          800: '#171717',
          900: '#0a0a0a',
        },
        neutral: {
          outlinedBorder: '#e0e0e0',
          outlinedColor: '#0a0a0a',
          outlinedHoverBg: 'rgba(0,0,0,0.04)',
          plainColor: '#525252',
          plainHoverBg: 'rgba(0,0,0,0.04)',
        },
        success: {
          500: '#16a34a',
        },
      },
    },
    dark: {
      palette: {
        background: {
          body: '#0a0a0a',
          surface: '#0d0d0d',
          level1: '#111111',
          level2: '#1a1a1a',
          level3: '#222222',
        },
        text: {
          primary: '#ffffff',
          secondary: '#d4d4d4',
          tertiary: '#525252',
        },
        divider: '#1a1a1a',
        primary: {
          solidBg: '#ffffff',
          solidColor: '#0a0a0a',
          solidHoverBg: '#e5e5e5',
          solidActiveBg: '#d4d4d4',
          outlinedBorder: '#3d3d3d',
          outlinedColor: '#ffffff',
          outlinedHoverBg: 'rgba(255,255,255,0.06)',
          plainColor: '#e5e5e5',
          plainHoverBg: 'rgba(255,255,255,0.06)',
          50: '#f5f5f5',
          100: '#e5e5e5',
          200: '#d4d4d4',
          300: '#a3a3a3',
          400: '#737373',
          500: '#525252',
          600: '#404040',
          700: '#262626',
          800: '#171717',
          900: '#0a0a0a',
        },
        neutral: {
          outlinedBorder: '#3d3d3d',
          outlinedColor: '#e5e5e5',
          outlinedHoverBg: 'rgba(255,255,255,0.06)',
          plainColor: '#a3a3a3',
          plainHoverBg: 'rgba(255,255,255,0.06)',
        },
        success: {
          500: '#22c55e',
        },
      },
    },
  },
  typography: {
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
  },
})

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <CssVarsProvider theme={theme} defaultMode="dark">
      <CssBaseline />
      {children}
    </CssVarsProvider>
  )
}
