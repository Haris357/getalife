import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/utils/auth'
import { getSignedUploadUrl } from '@/lib/storage/upload'

const schema = z.object({
  goalId: z.string().uuid(),
  todoId: z.string().uuid(),
  fileName: z.string().min(1).max(255),
  fileType: z.string(),
})

export async function POST(request: Request) {
  const user = await requireUser()

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const supabase = await createClient()

  // Verify goal ownership
  const { data: goal, error: goalError } = await supabase
    .from('goals')
    .select('id')
    .eq('id', parsed.data.goalId)
    .eq('user_id', user.id)
    .single()

  if (goalError || !goal) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const result = await getSignedUploadUrl(
      parsed.data.goalId,
      parsed.data.todoId,
      parsed.data.fileName
    )
    return NextResponse.json(result)
  } catch (err) {
    console.error('Upload URL error:', err)
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 })
  }
}
