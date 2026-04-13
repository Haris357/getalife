import { getOpenAIClient } from './client'
import { wrapWithBaseTemplate } from '@/lib/email/templates/base'
import type { EmailType, CheckIn, Goal } from '@/types'

export interface EmailContext {
  userEmail: string
  goalDescription: string
  recentCheckIns: CheckIn[]
  emailType: EmailType
  daysSinceStart: number
  currentStreak: number
  userId: string
  goal?: Goal
  checkinWhatIDid?: string
  storyName?: string
}

// ─── YouTube search ───────────────────────────────────────────────────────────

async function searchYouTubeVideo(query: string): Promise<{ videoId: string; title: string } | null> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return null
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=id,snippet&q=${encodeURIComponent(query)}&type=video&maxResults=1&key=${apiKey}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json() as { items?: { id: { videoId: string }; snippet: { title: string } }[] }
    const item = data.items?.[0]
    if (!item?.id?.videoId) return null
    return { videoId: item.id.videoId, title: item.snippet.title }
  } catch {
    return null
  }
}

// ─── Static templates (no AI needed) ─────────────────────────────────────────

function buildReminderBody(goalDescription: string): string {
  return `<p style="margin:0 0 16px;">still on it?</p>
<p style="margin:0 0 16px;color:#555;font-style:italic;">&ldquo;${goalDescription.slice(0, 120)}${goalDescription.length > 120 ? '...' : ''}&rdquo;</p>
<p style="margin:0;">one check-in today. that&rsquo;s all.</p>`
}

function buildCountdownBody(type: 'start' | 'mid' | 'end', daysLeft: number, goalDescription: string): string {
  const goal = `&ldquo;${goalDescription.slice(0, 100)}${goalDescription.length > 100 ? '...' : ''}&rdquo;`

  if (type === 'start') {
    return `<p style="margin:0 0 16px;font-size:22px;font-weight:bold;font-family:-apple-system,sans-serif;letter-spacing:-0.5px;">${daysLeft} days.</p>
<p style="margin:0 0 16px;">the clock is running on ${goal}.</p>
<p style="margin:0;">make today count.</p>`
  }
  if (type === 'mid') {
    return `<p style="margin:0 0 16px;font-size:22px;font-weight:bold;font-family:-apple-system,sans-serif;letter-spacing:-0.5px;">${daysLeft} days left.</p>
<p style="margin:0 0 16px;">you&rsquo;re past the halfway point on ${goal}.</p>
<p style="margin:0;">the second half is where it gets decided.</p>`
  }
  return `<p style="margin:0 0 16px;font-size:22px;font-weight:bold;font-family:-apple-system,sans-serif;letter-spacing:-0.5px;">last day.</p>
<p style="margin:0 0 16px;">tomorrow you find out what these days added up to.</p>
<p style="margin:0;color:#555;font-style:italic;">${goal}</p>`
}

function buildWelcomeBody(goalDescription: string): string {
  return `<p style="margin:0 0 20px;">welcome.</p>
<p style="margin:0 0 20px;">you just set your goal:</p>
<p style="margin:0 0 20px;color:#555;font-style:italic;">&ldquo;${goalDescription.slice(0, 150)}${goalDescription.length > 150 ? '...' : ''}&rdquo;</p>
<p style="margin:0 0 20px;">that&rsquo;s the hard part done. the rest is just showing up.</p>
<p style="margin:0 0 20px;">every day you check in, you build proof that you&rsquo;re actually doing it. not planning. doing.</p>
<p style="margin:0;">check in when you&rsquo;ve done something today. takes 2 minutes.</p>`
}

function buildGoalCreatedBody(goalDescription: string): string {
  return `<p style="margin:0 0 16px;">you set a goal.</p>
<p style="margin:0 0 16px;color:#555;font-style:italic;">&ldquo;${goalDescription.slice(0, 150)}${goalDescription.length > 150 ? '...' : ''}&rdquo;</p>
<p style="margin:0 0 16px;">that&rsquo;s the declaration. now it&rsquo;s about the daily showing up.</p>
<p style="margin:0;">check in every day. even the bad ones — especially the bad ones.</p>`
}

function buildGoalDeletedBody(goalDescription: string): string {
  return `<p style="margin:0 0 16px;">you deleted your goal.</p>
<p style="margin:0 0 16px;color:#555;font-style:italic;">&ldquo;${goalDescription.slice(0, 150)}${goalDescription.length > 150 ? '...' : ''}&rdquo;</p>
<p style="margin:0;">it&rsquo;s gone. when you&rsquo;re ready to start something new, we&rsquo;ll be here.</p>`
}

function buildGoalPausedBody(goalDescription: string): string {
  return `<p style="margin:0 0 16px;">goal paused.</p>
<p style="margin:0 0 16px;color:#555;font-style:italic;">&ldquo;${goalDescription.slice(0, 150)}${goalDescription.length > 150 ? '...' : ''}&rdquo;</p>
<p style="margin:0;">rest is not the same as quitting. come back when you&rsquo;re ready.</p>`
}

function buildGoalResumedBody(goalDescription: string): string {
  return `<p style="margin:0 0 16px;">you&rsquo;re back.</p>
<p style="margin:0 0 16px;color:#555;font-style:italic;">&ldquo;${goalDescription.slice(0, 150)}${goalDescription.length > 150 ? '...' : ''}&rdquo;</p>
<p style="margin:0;">pick up where you left off. every day forward counts.</p>`
}

function buildGoalCompletedBody(goalDescription: string, streak: number, daysSinceStart: number): string {
  return `<p style="margin:0 0 16px;font-size:22px;font-weight:bold;font-family:-apple-system,sans-serif;letter-spacing:-0.5px;">you did it.</p>
<p style="margin:0 0 16px;color:#555;font-style:italic;">&ldquo;${goalDescription.slice(0, 150)}${goalDescription.length > 150 ? '...' : ''}&rdquo;</p>
<p style="margin:0 0 16px;">${daysSinceStart} day${daysSinceStart !== 1 ? 's' : ''}. ${streak > 0 ? `${streak}-day streak. ` : ''}finished.</p>
<p style="margin:0;">most people never get here. you did.</p>`
}

function buildGoalCompletedFollowupBody(goalDescription: string): string {
  return `<p style="margin:0 0 16px;">30 days ago, you completed your goal.</p>
<p style="margin:0 0 16px;color:#555;font-style:italic;">&ldquo;${goalDescription.slice(0, 150)}${goalDescription.length > 150 ? '...' : ''}&rdquo;</p>
<p style="margin:0 0 16px;">we&rsquo;re curious: how has life changed since you crossed that finish line?</p>
<p style="margin:0 0 16px;">the real transformation often shows up weeks later — in how you carry yourself, what you believe is possible, what you do next.</p>
<p style="margin:0;">if you want to share your story, we&rsquo;d love to hear it. the community would too.</p>`
}

function buildCheckinDoneBody(whatIDid: string, streak: number): string {
  const streakLine = streak > 1
    ? `<p style="margin:0 0 16px;font-weight:600;font-family:-apple-system,sans-serif;">${streak} days in a row.</p>`
    : ''
  return `<p style="margin:0 0 16px;">check-in logged.</p>
<p style="margin:0 0 16px;color:#555;font-style:italic;">&ldquo;${whatIDid.slice(0, 120)}${whatIDid.length > 120 ? '...' : ''}&rdquo;</p>
${streakLine}<p style="margin:0;">same time tomorrow.</p>`
}

function buildStorySubmittedBody(storyName: string): string {
  return `<p style="margin:0 0 16px;">your story is live.</p>
<p style="margin:0 0 16px;font-weight:600;font-family:-apple-system,sans-serif;">&ldquo;${storyName.slice(0, 100)}&rdquo;</p>
<p style="margin:0;">other people are going to read what you went through. that matters.</p>`
}

function buildStoryDeletedBody(): string {
  return `<p style="margin:0 0 16px;">your story has been deleted.</p>
<p style="margin:0;">when you&rsquo;re ready to share again, we&rsquo;ll be here.</p>`
}

// ─── AI-generated templates ───────────────────────────────────────────────────

async function aiGenerate(prompt: string, systemPrompt: string): Promise<Record<string, string>> {
  const openai = getOpenAIClient()
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    max_tokens: 600,
    temperature: 0.88,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
  })
  const content = response.choices[0].message.content
  if (!content) throw new Error('No content from OpenAI')
  return JSON.parse(content)
}

const COACHING_SYSTEM = `You write short, personal weekly coaching emails for a goal-tracking app called Get A Life.

Rules:
- Output JSON only: {"subject": string, "body": string}
- Subject: under 8 words, personal, no emojis. E.g. "the thing about week two", "what the data says"
- Body: HTML using only <p> tags. Max 200 words. No headings, no bullet points.
- Tone: direct, honest, like a smart friend — not a coach. Not corporate.
- End with one concrete thing they can try this week.
- Do NOT mention AI. Do NOT sign off.`

const NEWSLETTER_SYSTEM = `You write short weekly motivational newsletters for a goal-tracking app.

Rules:
- Output JSON only: {"subject": string, "body": string, "person": string, "searchQuery": string}
- "person": pick ANY real motivational, entrepreneurial, athletic, scientific, or historical figure. Be diverse — vary across genders, eras, sports, business, art, science. Never repeat obvious defaults. Think: lesser-known but powerful stories.
- "searchQuery": a specific YouTube search string to find a motivational/interview/talk video by this person. Make it targeted, e.g. "Kobe Bryant work ethic interview", "Malala Yousafzai speech courage", "Roger Federer on losing press conference"
- Subject: under 8 words, intriguing, no emojis
- Body: HTML using only <p> and <blockquote> tags. Max 220 words.
- Structure: open with a real specific story or moment (3-4 sentences) → one key lesson → one question for the reader
- <blockquote style="margin:20px 0;padding:0 16px;border-left:2px solid #ddd;font-style:italic;color:#555;"> for the key quote
- Tone: serious, human, no hype
- Do NOT mention AI. Do NOT sign off.`

async function generateCoachingEmail(ctx: EmailContext): Promise<{ subject: string; body: string }> {
  const recentSummary = ctx.recentCheckIns
    .slice(0, 4)
    .map(ci => `[${ci.date}] ${ci.what_i_did.slice(0, 80)}`)
    .join('\n')

  const result = await aiGenerate(
    `GOAL: ${ctx.goalDescription}
DAYS: ${ctx.daysSinceStart} | STREAK: ${ctx.currentStreak}
RECENT: ${recentSummary || 'none'}

Write a weekly coaching email. Reference their specific goal type and recent activity. One key insight, one action.`,
    COACHING_SYSTEM
  )
  return { subject: result.subject, body: result.body }
}

async function generateNewsletterEmail(): Promise<{ subject: string; body: string; videoId?: string; videoCaption?: string }> {
  const result = await aiGenerate(
    `Write this week's newsletter. Pick a real person with a powerful story — be unpredictable, avoid the obvious choices. Output the searchQuery field so we can find a real YouTube video of them.`,
    NEWSLETTER_SYSTEM
  )

  let videoId: string | undefined
  let videoCaption: string | undefined

  if (result.searchQuery) {
    const video = await searchYouTubeVideo(result.searchQuery)
    if (video) {
      videoId = video.videoId
      videoCaption = `${result.person} — ${video.title.slice(0, 70)}`
    }
  }

  return { subject: result.subject, body: result.body, videoId, videoCaption }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateEmail(ctx: EmailContext): Promise<{ subject: string; html: string }> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const unsubscribeUrl = `${siteUrl}/unsubscribe?token=${Buffer.from(ctx.userId).toString('base64')}`
  const dashboardUrl = `${siteUrl}/dashboard`

  let subject = ''
  let body = ''
  let ctaText: string | undefined
  let ctaUrl: string | undefined = dashboardUrl
  let videoId: string | undefined
  let videoCaption: string | undefined

  switch (ctx.emailType) {
    case 'reminder': {
      subject = 'did you check in today?'
      body = buildReminderBody(ctx.goalDescription)
      ctaText = 'check in now'
      break
    }

    case 'countdown_start': {
      const daysLeft = ctx.goal?.deadline
        ? Math.ceil((new Date(ctx.goal.deadline).getTime() - Date.now()) / 86400000)
        : 30
      subject = `${daysLeft} days on the clock`
      body = buildCountdownBody('start', daysLeft, ctx.goalDescription)
      ctaText = 'check in today'
      break
    }

    case 'countdown_mid': {
      const daysLeft = ctx.goal?.deadline
        ? Math.ceil((new Date(ctx.goal.deadline).getTime() - Date.now()) / 86400000)
        : 15
      subject = `halfway. ${daysLeft} days left`
      body = buildCountdownBody('mid', daysLeft, ctx.goalDescription)
      ctaText = 'check in today'
      break
    }

    case 'countdown_end': {
      subject = 'last day'
      body = buildCountdownBody('end', 1, ctx.goalDescription)
      ctaText = 'check in today'
      break
    }

    case 'coaching': {
      const result = await generateCoachingEmail(ctx)
      subject = result.subject
      body = result.body
      ctaText = 'check in today'
      break
    }

    case 'newsletter': {
      const result = await generateNewsletterEmail()
      subject = result.subject
      body = result.body
      videoId = result.videoId
      videoCaption = result.videoCaption
      ctaText = undefined
      ctaUrl = undefined
      break
    }

    case 'welcome': {
      subject = 'welcome. now do the work.'
      body = buildWelcomeBody(ctx.goalDescription)
      ctaText = 'open dashboard'
      break
    }

    case 'goal_created': {
      subject = 'goal set. now do the work.'
      body = buildGoalCreatedBody(ctx.goalDescription)
      ctaText = 'open dashboard'
      break
    }

    case 'goal_deleted': {
      subject = 'goal deleted'
      body = buildGoalDeletedBody(ctx.goalDescription)
      ctaText = 'start a new goal'
      break
    }

    case 'goal_paused': {
      subject = 'goal paused'
      body = buildGoalPausedBody(ctx.goalDescription)
      ctaText = 'view dashboard'
      break
    }

    case 'goal_resumed': {
      subject = "you're back"
      body = buildGoalResumedBody(ctx.goalDescription)
      ctaText = 'check in today'
      break
    }

    case 'goal_completed': {
      subject = 'you actually did it'
      body = buildGoalCompletedBody(ctx.goalDescription, ctx.currentStreak, ctx.daysSinceStart)
      ctaText = 'view your journey'
      break
    }

    case 'goal_completed_followup': {
      subject = '30 days on — how has life changed?'
      body = buildGoalCompletedFollowupBody(ctx.goalDescription)
      ctaText = 'share your story'
      ctaUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/stories`
      break
    }

    case 'checkin_done': {
      subject = `day ${ctx.currentStreak > 1 ? ctx.currentStreak + ' — ' : ''}logged`
      body = buildCheckinDoneBody(ctx.checkinWhatIDid ?? ctx.goalDescription, ctx.currentStreak)
      ctaText = undefined
      ctaUrl = undefined
      break
    }

    case 'story_submitted': {
      subject = 'your story is live'
      body = buildStorySubmittedBody(ctx.storyName ?? 'your story')
      ctaText = 'view stories'
      ctaUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/stories`
      break
    }

    case 'story_deleted': {
      subject = 'story deleted'
      body = buildStoryDeletedBody()
      ctaText = undefined
      ctaUrl = undefined
      break
    }

    case 'community_comment': {
      subject = 'someone commented on your post'
      body = `<p style="margin:0 0 16px;">someone left a comment on your post in r/getalife.</p>
<p style="margin:0;">head over to see what they said.</p>`
      ctaText = 'view post'
      ctaUrl = `${siteUrl}/community`
      break
    }

    case 'community_reply': {
      subject = 'someone replied to your comment'
      body = `<p style="margin:0 0 16px;">someone replied to your comment in r/getalife.</p>
<p style="margin:0;">see what they said.</p>`
      ctaText = 'view thread'
      ctaUrl = `${siteUrl}/community`
      break
    }

    default: {
      subject = 'check in today'
      body = buildReminderBody(ctx.goalDescription)
      ctaText = 'check in'
    }
  }

  const html = wrapWithBaseTemplate({ body, unsubscribeUrl, ctaText, ctaUrl, videoId, videoCaption })
  return { subject, html }
}
