import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'media'

export async function getMediaUploadUrl(
  userId: string,
  folder: string,
  fileName: string
): Promise<{ signedUploadUrl: string; publicUrl: string }> {
  const supabase = createAdminClient()
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${folder}/${userId}/${Date.now()}-${safeName}`

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(path)

  if (error || !data) {
    throw new Error(`Storage error: ${error?.message ?? 'unknown'}`)
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)

  return {
    signedUploadUrl: data.signedUrl,
    publicUrl: urlData.publicUrl,
  }
}
