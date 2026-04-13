import { createClient } from '@/lib/supabase/server'

export async function isUserMod(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('community_moderators')
    .select('id')
    .eq('user_id', userId)
    .single()
  return !!data
}
