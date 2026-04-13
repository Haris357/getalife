'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  table: string
  filter?: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
}

export default function RealtimeRefresherCore({ table, filter, event = '*' }: Props) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pgConfig: any = { event, schema: 'public', table }
    if (filter) pgConfig.filter = filter

    const channel = supabase
      .channel(`rt-${table}-${filter ?? 'all'}`)
      .on('postgres_changes', pgConfig, () => {
        router.refresh()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [table, filter, event, router])

  return null
}
