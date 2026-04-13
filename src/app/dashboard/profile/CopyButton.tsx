'use client'

import { useState } from 'react'
import Button from '@mui/joy/Button'

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select text
    }
  }

  return (
    <Button
      variant="outlined"
      size="sm"
      onClick={handleCopy}
      sx={{
        flexShrink: 0,
        fontWeight: 600,
        fontSize: '0.75rem',
        borderRadius: '6px',
        borderColor: 'divider',
        color: 'text.tertiary',
        minWidth: 64,
        '&:hover': { borderColor: 'neutral.outlinedBorder', bgcolor: 'background.level1' },
      }}
    >
      {copied ? 'copied!' : 'copy'}
    </Button>
  )
}
