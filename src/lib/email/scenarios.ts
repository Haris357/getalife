import type { EmailType } from '@/types'

export const SCENARIOS: {
  type: EmailType
  label: string
  description: string
  useGoal: boolean
  streak: number
  days: number
}[] = [
  // ── Lifecycle ─────────────────────────────────────────────────────
  { type: 'welcome',         label: 'Welcome',          description: "Sent when a user signs up and sets their first goal",  useGoal: true,  streak: 0,  days: 0  },
  // ── Goal events ───────────────────────────────────────────────────
  { type: 'goal_created',    label: 'Goal Created',     description: "Sent when a user sets a new goal",                    useGoal: true,  streak: 0,  days: 0  },
  { type: 'goal_deleted',    label: 'Goal Deleted',     description: "Sent when a user deletes a goal",                     useGoal: true,  streak: 0,  days: 0  },
  { type: 'goal_paused',     label: 'Goal Paused',      description: "Sent when a user pauses an active goal",              useGoal: true,  streak: 5,  days: 10 },
  { type: 'goal_resumed',    label: 'Goal Resumed',     description: "Sent when a user resumes a paused goal",              useGoal: true,  streak: 5,  days: 10 },
  { type: 'goal_completed',          label: 'Goal Completed',          description: "Sent when a user marks a goal as complete",                              useGoal: true,  streak: 12, days: 30 },
  { type: 'goal_completed_followup', label: 'Goal Followup (30-day)',   description: "Sent 30 days after goal completion — how is life different?",             useGoal: true,  streak: 0,  days: 30 },
  // ── Check-in ──────────────────────────────────────────────────────
  { type: 'checkin_done',    label: 'Check-in Done',    description: "Sent after every successful check-in",                useGoal: true,  streak: 7,  days: 14 },
  // ── Countdown ─────────────────────────────────────────────────────
  { type: 'countdown_start', label: 'Countdown Start',  description: "Sent on day 1 when a goal has a deadline set",        useGoal: true,  streak: 3,  days: 0  },
  { type: 'countdown_mid',   label: 'Countdown Mid',    description: "Sent at the halfway point of the countdown",          useGoal: true,  streak: 7,  days: 15 },
  { type: 'countdown_end',   label: 'Countdown End',    description: "Sent the day before the deadline",                   useGoal: true,  streak: 12, days: 29 },
  // ── Reminder ──────────────────────────────────────────────────────
  { type: 'reminder',        label: 'Daily Reminder',   description: "Sent every day the user hasn't checked in yet",       useGoal: true,  streak: 5,  days: 5  },
  // ── Stories ───────────────────────────────────────────────────────
  { type: 'story_submitted', label: 'Story Submitted',  description: "Sent when a user publishes a story",                  useGoal: false, streak: 0,  days: 0  },
  { type: 'story_deleted',   label: 'Story Deleted',    description: "Sent when a user deletes their story",                useGoal: false, streak: 0,  days: 0  },
  // ── AI-generated ──────────────────────────────────────────────────
  { type: 'coaching',        label: 'Weekly Coaching',  description: "AI-generated weekly coaching email (Sundays)",        useGoal: true,  streak: 7,  days: 14 },
  { type: 'newsletter',      label: 'Newsletter',       description: "AI-generated motivational story email (Wednesdays)", useGoal: false, streak: 0,  days: 0  },
]
