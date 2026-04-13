import { getOpenAIClient } from './client'
import { createAdminClient } from '@/lib/supabase/admin'

export async function analyzeCheckinPattern(
  userId: string,
  goalId: string,
  goalDescription: string,
): Promise<void> {
  const admin = createAdminClient()

  // Fetch last 14 check-ins for the goal
  const { data: checkIns } = await admin
    .from('check_ins')
    .select('date, what_i_did, commitment, ai_response')
    .eq('goal_id', goalId)
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(14)

  if (!checkIns || checkIns.length === 0) return

  const entriesText = checkIns
    .map((ci, i) => `Entry ${i + 1} (${ci.date}):\nWhat I did: ${ci.what_i_did}\nCommitment: ${ci.commitment}`)
    .join('\n\n')

  const client = getOpenAIClient()

  const completion = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an accountability coach analyzing a user's check-in journal entries. Analyze their pattern, identify their strongest days, any struggles, progress trends, and give ONE specific personalized insight in 2-3 sentences. Be direct, honest, and motivating. Don't use generic advice.`,
      },
      {
        role: 'user',
        content: `Goal: ${goalDescription}\n\nRecent check-ins (newest first):\n\n${entriesText}`,
      },
    ],
  })

  const analysis = completion.choices[0]?.message?.content?.trim() ?? ''
  if (!analysis) return

  const now = new Date().toISOString()

  await Promise.all([
    admin
      .from('goals')
      .update({ pattern_analysis: analysis, pattern_analyzed_at: now })
      .eq('id', goalId),

    admin.from('notifications').insert({
      user_id: userId,
      type: 'pattern_analysis',
      actor_name: 'your weekly pattern analysis is ready',
    }),
  ])
}
