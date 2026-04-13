'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@mui/joy/Button'
import { createClient } from '@/lib/supabase/client'

export default function SignOutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <Button
      size="sm"
      variant="outlined"
      loading={loading}
      onClick={handleSignOut}
      sx={{
        borderRadius: '20px',
        fontWeight: 600,
        fontSize: '0.78rem',
        px: 2.5,
        borderColor: 'rgba(239,68,68,0.35)',
        color: 'rgb(239,68,68)',
        bgcolor: 'rgba(239,68,68,0.05)',
        '&:hover': {
          borderColor: 'rgb(239,68,68)',
          bgcolor: 'rgba(239,68,68,0.1)',
          color: 'rgb(239,68,68)',
        },
        transition: 'all 0.15s',
      }}
    >
      sign out
    </Button>
  )
}
