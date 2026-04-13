import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/utils/auth'
import { isUserMod } from '@/lib/utils/community'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await isUserMod(user.id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createClient()

  const [{ data: postReports }, { data: commentReports }] = await Promise.all([
    supabase
      .from('post_reports')
      .select('*, posts(id, title, user_id, removed)')
      .eq('reviewed', false)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('comment_reports')
      .select('*, comments(id, body, user_id, removed, post_id)')
      .eq('reviewed', false)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  return NextResponse.json({
    postReports: postReports ?? [],
    commentReports: commentReports ?? [],
  })
}
