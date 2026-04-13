import { createAdminClient } from '@/lib/supabase/admin'

export async function getSignedUploadUrl(
  goalId: string,
  todoId: string,
  fileName: string
): Promise<{ signedUploadUrl: string; path: string; publicUrl: string }> {
  const supabase = createAdminClient()
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `proofs/${goalId}/${todoId}/${Date.now()}-${safeName}`

  const { data, error } = await supabase.storage
    .from('proofs')
    .createSignedUploadUrl(path)

  if (error || !data) {
    throw new Error(`Storage error: ${error?.message ?? 'unknown'}`)
  }

  const { data: urlData } = supabase.storage.from('proofs').getPublicUrl(path)

  return {
    signedUploadUrl: data.signedUrl,
    path,
    publicUrl: urlData.publicUrl,
  }
}
