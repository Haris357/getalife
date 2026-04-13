import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/lib/utils/auth'
import { getMediaUploadUrl } from '@/lib/storage/mediaUpload'
import { checkRateLimit } from '@/lib/utils/rateLimit'

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/quicktime', 'video/webm',
]

const schema = z.object({
  folder: z.enum(['checkins', 'stories', 'community', 'avatars']),
  fileName: z.string().min(1).max(255),
  fileType: z.string().refine((t) => ALLOWED_TYPES.includes(t), {
    message: 'File type not allowed',
  }),
})

export async function POST(request: Request) {
  const user = await requireUser()

  const { allowed } = checkRateLimit({
    key: `upload:${user.id}`,
    limit: 30,
    windowMs: 60 * 60 * 1000,
  })
  if (!allowed) {
    return NextResponse.json({ error: 'Too many uploads. Try again later.' }, { status: 429 })
  }

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

  try {
    const result = await getMediaUploadUrl(user.id, parsed.data.folder, parsed.data.fileName)
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
