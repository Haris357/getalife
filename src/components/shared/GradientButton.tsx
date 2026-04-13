'use client'

import Box from '@mui/joy/Box'
import type { SxProps } from '@mui/joy/styles/types'

// Blue → orange brand gradient
const GRADIENT = 'linear-gradient(135deg, rgb(14, 165, 233) 0%, rgb(249, 115, 22) 100%)'
const GRADIENT_HOVER = 'linear-gradient(135deg, rgb(2, 132, 199) 0%, rgb(234, 88, 12) 100%)'

interface Props {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  size?: 'sm' | 'md' | 'lg'
  sx?: SxProps
}

const sizeMap = {
  sm: { px: 2,   py: 0.75, fontSize: '0.82rem', minHeight: 36 },
  md: { px: 2.5, py: 1,    fontSize: '0.875rem', minHeight: 40 },
  lg: { px: 3,   py: 1.25, fontSize: '0.92rem',  minHeight: 48 },
}

export default function GradientButton({
  children,
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  fullWidth = false,
  size = 'md',
  sx,
}: Props) {
  const sz = sizeMap[size]
  const isDisabled = disabled || loading

  return (
    <Box
      component="button"
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        width: fullWidth ? '100%' : 'auto',
        minHeight: sz.minHeight,
        px: sz.px,
        py: sz.py,
        fontFamily: 'inherit',
        fontWeight: 700,
        fontSize: sz.fontSize,
        color: '#fff',
        letterSpacing: '-0.01em',
        borderRadius: '8px',
        border: 'none',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        background: GRADIENT,
        transition: 'transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease',
        opacity: isDisabled ? 0.45 : 1,
        '&:hover:not(:disabled)': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 28px rgba(14, 165, 233, 0.35)',
          filter: 'brightness(1.08)',
        },
        '&:active:not(:disabled)': {
          transform: 'translateY(0px)',
          boxShadow: '0 2px 10px rgba(14, 165, 233, 0.25)',
          filter: 'brightness(0.96)',
        },
        ...sx,
      }}
    >
      {loading ? (
        <>
          <Box
            sx={{
              width: 15,
              height: 15,
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.35)',
              borderTopColor: '#fff',
              animation: 'gal-spin 0.65s linear infinite',
              flexShrink: 0,
            }}
          />
          <Box component="span" sx={{ opacity: 0.75 }}>{children}</Box>
        </>
      ) : (
        children
      )}
    </Box>
  )
}
