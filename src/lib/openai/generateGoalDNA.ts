import { getOpenAIClient } from './client'
import { createAdminClient } from '@/lib/supabase/admin'

interface GoalDNA {
  style: string
  strength: string
  struggle: string
  description: string
  archetype: string
}

export async function generateGoalDNA(userId: string): Promise<void> {
  try {
    const admin = createAdminClient()

    // Fetch last 20 check-ins for user
    const { data: checkIns } = await admin
      .from('check_ins')
      .select('what_i_did, date')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(20)

    if (!checkIns || checkIns.length < 5) return

    // Fetch profile
    const { data: profile } = await admin
      .from('profiles')
      .select('display_name, xp, level, title')
      .eq('id', userId)
      .single()

    const entriesSummary = checkIns
      .map((ci, i) => `Entry ${i + 1} [${ci.date}]: ${ci.what_i_did.slice(0, 150)}`)
      .join('\n')

    const displayName = profile?.display_name ?? 'this person'

    const client = getOpenAIClient()

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      max_tokens: 400,
      temperature: 0.85,
      messages: [
        {
          role: 'system',
          content: `You are analyzing someone's accountability journal to build their unique Goal DNA profile. Based on their check-in entries, identify: their primary motivation style (intrinsic/extrinsic), their consistency pattern (daily habits vs. binge sessions), their biggest strength (1 word), their typical struggle (1 word), and write a 2-sentence 'accountability personality' description. Be insightful, specific, and encouraging. Format as valid JSON: { "style": string, "strength": string, "struggle": string, "description": string, "archetype": string (e.g. 'The Consistent Grinder', 'The Sprint Champion', etc.) }`,
        },
        {
          role: 'user',
          content: `Analyzing the accountability journal of ${displayName} (Level ${profile?.level ?? 1}, ${profile?.xp ?? 0} XP).\n\nRecent check-in entries:\n${entriesSummary}`,
        },
      ],
    })

    const content = response.choices[0]?.message?.content
    if (!content) return

    const dna: GoalDNA = JSON.parse(content)

    // Validate the response has all required fields
    if (!dna.style || !dna.strength || !dna.struggle || !dna.description || !dna.archetype) return

    // Store in profiles
    await admin
      .from('profiles')
      .update({
        goal_dna: JSON.stringify(dna),
        goal_dna_at: new Date().toISOString(),
      })
      .eq('id', userId)

    // Insert notification
    await admin.from('notifications').insert({
      user_id: userId,
      type: 'goal_dna',
      actor_name: 'your accountability DNA profile is ready — check your profile!',
      post_id: null,
      comment_id: null,
      actor_id: null,
      read: false,
    })
  } catch (err) {
    console.error('[generateGoalDNA]', err)
  }
}
