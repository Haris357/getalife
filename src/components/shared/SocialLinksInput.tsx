'use client'

import Box from '@mui/joy/Box'
import Input from '@mui/joy/Input'
import Typography from '@mui/joy/Typography'

export type SocialLinks = {
  twitter?: string
  instagram?: string
  tiktok?: string
  youtube?: string
  linkedin?: string
  github?: string
  other?: string
}

const PLATFORMS: { key: keyof SocialLinks; label: string; placeholder: string; icon: string }[] = [
  { key: 'twitter',   label: 'X / Twitter',  placeholder: 'https://x.com/...',          icon: '𝕏' },
  { key: 'instagram', label: 'Instagram',     placeholder: 'https://instagram.com/...',  icon: '📷' },
  { key: 'tiktok',    label: 'TikTok',        placeholder: 'https://tiktok.com/...',     icon: '♪' },
  { key: 'youtube',   label: 'YouTube',       placeholder: 'https://youtube.com/...',    icon: '▶' },
  { key: 'linkedin',  label: 'LinkedIn',      placeholder: 'https://linkedin.com/...',   icon: 'in' },
  { key: 'github',    label: 'GitHub',        placeholder: 'https://github.com/...',     icon: '⌥' },
  { key: 'other',     label: 'Other link',    placeholder: 'https://...',                icon: '↗' },
]

interface Props {
  value: SocialLinks
  onChange: (links: SocialLinks) => void
  disabled?: boolean
}

const inputSx = {
  bgcolor: 'background.surface',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: '6px',
  fontSize: '0.85rem',
  color: 'text.secondary',
  '--Input-focusedThickness': '0px',
  '&:hover': { borderColor: 'neutral.outlinedBorder' },
  '&:focus-within': { borderColor: 'text.tertiary' },
} as const

export default function SocialLinksInput({ value, onChange, disabled }: Props) {
  function update(key: keyof SocialLinks, val: string) {
    onChange({ ...value, [key]: val || undefined })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {PLATFORMS.map(({ key, label, placeholder, icon }) => (
        <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '6px',
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.surface',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: key === 'twitter' ? '0.7rem' : '0.75rem',
              color: 'text.tertiary',
              fontWeight: 600,
              letterSpacing: '-0.01em',
              opacity: 0.6,
            }}
          >
            {icon}
          </Box>
          <Input
            placeholder={placeholder}
            value={value[key] ?? ''}
            onChange={(e) => update(key, e.target.value)}
            disabled={disabled}
            size="sm"
            sx={{ flex: 1, ...inputSx }}
            slotProps={{ input: { 'aria-label': label } }}
          />
        </Box>
      ))}
    </Box>
  )
}
