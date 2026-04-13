import { getOpenAIClient } from './client'

interface CheckinContext {
  goalDescription: string
  whatIDid: string
  commitment: string
  streak: number
}

export async function generateCheckinResponse(ctx: CheckinContext): Promise<string> {
  const client = getOpenAIClient()

  const completion = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a straight-talking accountability coach. The user just submitted their daily check-in.
Write a 2-3 sentence response that:
- Directly references what they specifically did (not generic praise)
- Acknowledges their streak if it's meaningful (3+, 7+, 14+, 30+)
- Calls out their commitment for tomorrow and makes it feel real
Be concise, honest, and energising. No emojis. No corporate language.`,
      },
      {
        role: 'user',
        content: `Goal: ${ctx.goalDescription}
What I did today: ${ctx.whatIDid}
What I'll do tomorrow: ${ctx.commitment}
Current streak: ${ctx.streak} day${ctx.streak === 1 ? '' : 's'}`,
      },
    ],
  })

  return completion.choices[0]?.message?.content?.trim() ?? ''
}
