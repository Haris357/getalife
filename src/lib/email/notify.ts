import { createAdminClient } from '@/lib/supabase/admin'
import { generateEmail } from '@/lib/openai/generateEmail'
import { sendEmail } from '@/lib/email/sender'
import type { EmailType, CheckIn, Goal } from '@/types'

interface NotifyParams {
  userId: string
  emailType: EmailType
  goalId?: string | null
  goalDescription?: string
  currentStreak?: number
  daysSinceStart?: number
  recentCheckIns?: CheckIn[]
  goal?: Goal
  checkinWhatIDid?: string
  storyName?: string
}

const NOTIF_MESSAGE: Partial<Record<EmailType, string>> = {
  welcome:          'welcome to getalife — set your first goal!',
  goal_created:     'new goal set — let\'s get to work!',
  goal_completed:           'you completed a goal — incredible work!',
  goal_completed_followup:  '30 days on — how has life changed since completing your goal?',
  goal_paused:      'goal paused — resume anytime',
  goal_resumed:     'goal resumed — welcome back!',
  goal_deleted:     'goal deleted',
  checkin_done:     'check-in logged — keep the streak alive!',
  story_submitted:  'your story is now live!',
  story_deleted:    'story deleted',
  reminder:         'don\'t forget to check in today!',
  countdown_start:  'countdown started — deadline is set',
  countdown_mid:    'halfway through your countdown — keep going!',
  countdown_end:    'deadline is tomorrow — finish strong!',
  coaching:         'your weekly coaching is ready',
  newsletter:       'your weekly newsletter is here',
}

/** Fire-and-forget — call with void, never await */
export function notifyEmail(params: NotifyParams): void {
  void _send(params)
}

async function _send({
  userId, emailType, goalId, goalDescription, currentStreak,
  daysSinceStart, recentCheckIns, goal, checkinWhatIDid, storyName,
}: NotifyParams) {
  try {
    const admin = createAdminClient()

    const [authRes, profileRes] = await Promise.all([
      admin.auth.admin.getUserById(userId),
      admin.from('profiles').select('unsubscribed').eq('id', userId).single(),
    ])

    const email = authRes.data.user?.email
    if (!email) return
    if (profileRes.data?.unsubscribed) return

    const { subject, html } = await generateEmail({
      userEmail: email,
      goalDescription: goalDescription ?? '',
      recentCheckIns: recentCheckIns ?? [],
      emailType,
      daysSinceStart: daysSinceStart ?? 0,
      currentStreak: currentStreak ?? 0,
      userId,
      goal,
      checkinWhatIDid,
      storyName,
    })

    await sendEmail({ to: email, subject, html })

    // Insert in-app notification alongside the email
    const notifMessage = NOTIF_MESSAGE[emailType]
    await Promise.all([
      admin.from('email_logs').insert({
        user_id: userId,
        goal_id: goalId ?? null,
        type: emailType,
        subject,
      }),
      notifMessage
        ? admin.from('notifications').insert({
            user_id: userId,
            type: emailType,
            actor_name: notifMessage,
            post_id: null,
            comment_id: null,
            actor_id: null,
            read: false,
          })
        : Promise.resolve(),
    ])
  } catch (err) {
    console.error(`[notifyEmail] ${emailType}:`, err)
  }
}
