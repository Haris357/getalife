import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/utils/auth'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ podId: string }> }
) {
  const user = await requireUser()
  const { podId } = await params
  const supabase = await createClient()

  // Check membership
  const { data: membership } = await supabase
    .from('pod_members')
    .select('pod_id')
    .eq('pod_id', podId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) {
    return NextResponse.json({ error: 'not_member', message: 'You are not a member of this pod.' }, { status: 403 })
  }

  // Check if user is the creator
  const { data: pod } = await supabase
    .from('pods')
    .select('created_by')
    .eq('id', podId)
    .maybeSingle()

  if (!pod) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const isCreator = pod.created_by === user.id

  if (isCreator) {
    // Find other members to transfer ownership
    const { data: otherMembers } = await supabase
      .from('pod_members')
      .select('user_id, joined_at')
      .eq('pod_id', podId)
      .neq('user_id', user.id)
      .order('joined_at', { ascending: true })
      .limit(1)

    if (otherMembers && otherMembers.length > 0) {
      // Transfer creator to the next oldest member
      const newCreator = otherMembers[0].user_id
      const { error: transferError } = await supabase
        .from('pods')
        .update({ created_by: newCreator })
        .eq('id', podId)

      if (transferError) {
        return NextResponse.json({ error: transferError.message }, { status: 500 })
      }
    }
    // If no other members, pod just loses its creator (and will be alone then empty after delete)
  }

  // Remove user from pod
  const { error: leaveError } = await supabase
    .from('pod_members')
    .delete()
    .eq('pod_id', podId)
    .eq('user_id', user.id)

  if (leaveError) {
    return NextResponse.json({ error: leaveError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
