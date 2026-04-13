'use client'

import Link from 'next/link'
import Box from '@mui/joy/Box'

export const BRAND_GRADIENT = 'linear-gradient(135deg, rgb(14, 165, 233) 0%, rgb(249, 115, 22) 100%)'

function LogoMark({ size = 28 }: { size?: number }) {
  const radius = Math.round(size * 0.28)
  const fontSize = Math.round(size * 0.52)

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: `${radius}px`,
        background: BRAND_GRADIENT,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        // Subtle inner gloss
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          borderRadius: `${radius}px`,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 55%)',
          pointerEvents: 'none',
        },
        position: 'relative',
      }}
    >
      <Box
        component="span"
        sx={{
          color: '#fff',
          fontSize: `${fontSize}px`,
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: '-0.04em',
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
          userSelect: 'none',
          position: 'relative',
          zIndex: 1,
        }}
      >
        G
      </Box>
    </Box>
  )
}

interface Props {
  href?: string
  size?: number
}

export default function Logo({ href = '/dashboard', size = 28 }: Props) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <Box
          component="span"
          sx={{
            fontWeight: 700,
            fontSize: size >= 28 ? '1rem' : '0.88rem',
            color: 'text.primary',
            letterSpacing: '-0.025em',
            lineHeight: 1,
            fontFamily: 'inherit',
          }}
        >
          get a life
        </Box>
      </Box>
    </Link>
  )
}
