import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/utils/auth'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ podId: string }> }
) {
  const user = await requireUser()
  const { podId } = await params
  const supabase = await createClient()

  // Verify requester is a member
  const { data: membership } = await supabase
    .from('pod_members')
    .select('pod_id')
    .eq('pod_id', podId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) {
    return NextResponse.json({ error: 'not_member', message: 'You are not a member of this pod.' }, { status: 403 })
  }

  // Fetch pod info
  const { data: pod, error: podError } = await supabase
    .from('pods_with_members')
    .select('*')
    .eq('id', podId)
    .maybeSingle()

  if (podError) {
    return NextResponse.json({ error: podError.message }, { status: 500 })
  }
  if (!pod) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  // Fetch members with profile info
  const { data: memberRows, error: membersError } = await supabase
    .from('pod_members')
    .select('user_id, joined_at, profiles(display_name, avatar_url, level, title)')
    .eq('pod_id', podId)
    .order('joined_at', { ascending: true })

  if (membersError) {
    return NextResponse.json({ error: membersError.message }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const members = (memberRows ?? []).map((row: any) => ({
    user_id: row.user_id as string,
    display_name: (Array.isArray(row.profiles) ? row.profiles[0] : row.profiles)?.display_name ?? null,
    avatar_url: (Array.isArray(row.profiles) ? row.profiles[0] : row.profiles)?.avatar_url ?? null,
    level: (Array.isArray(row.profiles) ? row.profiles[0] : row.profiles)?.level ?? null,
    title: (Array.isArray(row.profiles) ? row.profiles[0] : row.profiles)?.title ?? null,
    joined_at: row.joined_at as string,
  }))

  return NextResponse.json({ pod, members })
}
