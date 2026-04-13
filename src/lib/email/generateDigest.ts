import { getOpenAIClient } from '@/lib/openai/client'
import { wrapWithBaseTemplate } from '@/lib/email/templates/base'
import type { Goal } from '@/types'

export interface WeeklyGoalStat {
  goalId: string
  goalDescription: string
  checkinsThisWeek: number
  streak: number
}

export interface DigestContext {
  userEmail: string
  userId: string
  goals: Goal[]
  weeklyStats: WeeklyGoalStat[]
}

const DIGEST_SYSTEM = `You write short, personal weekly progress digest emails for a goal-tracking app called Get A Life.

Rules:
- Output JSON only: {"subject": string, "body": string}
- Subject: under 8 words, personal, no emojis. E.g. "your week in numbers", "this week added up"
- Body: HTML using only <p> tags. Max 180 words. No headings, no bullet points.
- Tone: direct, honest, like a smart friend — not a coach. Not corporate.
- Reference their specific goals and real numbers from the data.
- End with one forward-looking sentence about next week.
- Do NOT mention AI. Do NOT sign off.`

function buildDigestFallbackBody(
  totalCheckins: number,
  goalCount: number,
  bestStreak: number
): string {
  if (totalCheckins === 0) {
    return `<p style="margin:0 0 16px;">this week was quiet.</p>
<p style="margin:0 0 16px;">no check-ins across your ${goalCount} goal${goalCount !== 1 ? 's' : ''}.</p>
<p style="margin:0;">next week, just one. that's all it takes to get moving again.</p>`
  }

  return `<p style="margin:0 0 16px;">this week: ${totalCheckins} check-in${totalCheckins !== 1 ? 's' : ''} across ${goalCount} goal${goalCount !== 1 ? 's' : ''}.</p>
${bestStreak > 0 ? `<p style="margin:0 0 16px;font-weight:600;font-family:-apple-system,sans-serif;">best streak: ${bestStreak} day${bestStreak !== 1 ? 's' : ''}.</p>` : ''}
<p style="margin:0;">keep the momentum going into next week.</p>`
}

export async function generateDigest({
  userEmail,
  userId,
  goals,
  weeklyStats,
}: DigestContext): Promise<{ subject: string; html: string }> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const unsubscribeUrl = `${siteUrl}/unsubscribe?token=${Buffer.from(userId).toString('base64')}`
  const dashboardUrl = `${siteUrl}/dashboard`

  const totalCheckins = weeklyStats.reduce((sum, s) => sum + s.checkinsThisWeek, 0)
  const bestStreak = weeklyStats.reduce((best, s) => Math.max(best, s.streak), 0)
  const goalCount = goals.length

  let subject = 'your week in numbers'
  let body = ''

  try {
    const openai = getOpenAIClient()

    const goalSummary = weeklyStats
      .map(s => `- "${s.goalDescription.slice(0, 80)}": ${s.checkinsThisWeek} check-in${s.checkinsThisWeek !== 1 ? 's' : ''} this week, ${s.streak}-day streak`)
      .join('\n')

    const prompt = `USER: ${userEmail}
GOALS THIS WEEK:
${goalSummary || '- no active goals'}
TOTAL CHECK-INS: ${totalCheckins}
BEST STREAK: ${bestStreak} days

Write a personal weekly digest email. Reference the specific goals and numbers above.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      max_tokens: 500,
      temperature: 0.82,
      messages: [
        { role: 'system', content: DIGEST_SYSTEM },
        { role: 'user', content: prompt },
      ],
    })

    const content = response.choices[0].message.content
    if (content) {
      const parsed = JSON.parse(content) as { subject?: string; body?: string }
      if (parsed.subject) subject = parsed.subject
      if (parsed.body) body = parsed.body
    }
  } catch {
    // Fallback to static template if AI fails
    body = buildDigestFallbackBody(totalCheckins, goalCount, bestStreak)
  }

  if (!body) {
    body = buildDigestFallbackBody(totalCheckins, goalCount, bestStreak)
  }

  const html = wrapWithBaseTemplate({
    body,
    unsubscribeUrl,
    ctaText: 'view dashboard',
    ctaUrl: dashboardUrl,
  })

  return { subject, html }
}
