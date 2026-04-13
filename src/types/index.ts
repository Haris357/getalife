export type GoalStatus = 'active' | 'completed' | 'paused'
export type EmailType =
  | 'welcome'
  | 'reminder'
  | 'countdown_start'
  | 'countdown_mid'
  | 'countdown_end'
  | 'coaching'
  | 'newsletter'
  | 'goal_created'
  | 'goal_deleted'
  | 'goal_paused'
  | 'goal_resumed'
  | 'goal_completed'
  | 'goal_completed_followup'
  | 'checkin_done'
  | 'story_submitted'
  | 'story_deleted'
  | 'community_comment'
  | 'community_reply'
  | 'digest'

export interface RoadmapPhase {
  phase: number
  title: string
  focus: string[]
}

export interface Goal {
  id: string
  user_id: string
  description: string
  status: GoalStatus
  roadmap: RoadmapPhase[] | null
  current_streak: number
  longest_streak: number
  last_checkin_date: string | null
  deadline: string | null
  created_at: string
  is_public: boolean
  pledge: string | null
  pattern_analysis: string | null
  pattern_analyzed_at: string | null
  category?: string | null
  check_ins?: CheckIn[]
}

export interface CheckIn {
  id: string
  goal_id: string
  user_id: string
  date: string
  what_i_did: string
  commitment: string
  ai_response: string | null
  media_url: string | null
  social_links: Record<string, string> | null
  created_at: string
}

export interface EmailLog {
  id: string
  user_id: string
  goal_id: string
  type: EmailType
  sent_at: string
  subject: string
}

export interface Story {
  id: string
  user_id: string
  goal_id: string | null
  name: string
  tagline: string
  body: string
  image_url: string | null
  social_links: Record<string, string> | null
  published: boolean
  created_at: string
}

export type BadgeType =
  | 'first_checkin'
  | 'week_warrior'
  | 'fortnight'
  | 'month_strong'
  | 'iron_will'
  | 'century'
  | 'goal_crusher'
  | 'comeback_kid'
  | 'show_off'
  | 'storyteller'

export interface Achievement {
  id: string
  user_id: string
  type: BadgeType
  earned_at: string
  metadata: Record<string, unknown> | null
}

export interface Profile {
  id: string
  unsubscribed: boolean
  xp: number
  level: number
  title: string
  streak_shields: number
  display_name: string | null
  created_at: string
  goal_dna?: string | null
  goal_dna_at?: string | null
}

// ── Community ──────────────────────────────────────────────

export type PostType = 'text' | 'image' | 'milestone'
export type SortMode = 'new' | 'hot' | 'top'

export interface CommunityPost {
  id: string
  user_id: string
  title: string
  body: string | null
  image_url: string | null
  type: PostType
  goal_id: string | null
  score: number
  comment_count: number
  created_at: string
  updated_at: string
  pinned?: boolean
  removed?: boolean
  locked?: boolean
  flair?: string | null
  removed_reason?: string | null
  // joined from view
  display_name: string | null
  author_avatar: string | null
  author_level: number | null
  author_title: string | null
  // anonymous post
  is_anonymous?: boolean
  // client-side extras
  user_vote?: 1 | -1 | null
  is_saved?: boolean
  is_mod?: boolean
}

export interface CommunityComment {
  id: string
  post_id: string
  user_id: string
  parent_id: string | null
  body: string
  score: number
  created_at: string
  updated_at: string
  removed?: boolean
  // joined from view
  display_name: string | null
  author_avatar: string | null
  author_level: number | null
  author_title: string | null
  // client-side extras
  user_vote?: 1 | -1 | null
  replies?: CommunityComment[]
}

export interface CommunitySettings {
  id: number
  name: string
  description: string
  cover_url: string | null
  avatar_url: string | null
}

export interface CommunityRule {
  id: string
  title: string
  description: string | null
  display_order: number
}

export interface Notification {
  id: string
  user_id: string
  type: string
  post_id: string | null
  comment_id: string | null
  actor_id: string | null
  actor_name: string | null
  read: boolean
  created_at: string
}

// ── Pods ──────────────────────────────────────────────

export interface Pod {
  id: string
  name: string
  created_by: string
  invite_code: string
  max_members: number
  created_at: string
  creator_name: string | null
  creator_avatar: string | null
  member_count: number
}

export interface PodMember {
  user_id: string
  display_name: string | null
  avatar_url: string | null
  level: number | null
  title: string | null
  joined_at: string
}

// ── Buddies ──────────────────────────────────────────────

export interface Buddy {
  id: string
  requester_id: string
  buddy_id: string
  requester_goal_id: string | null
  buddy_goal_id: string | null
  status: 'pending' | 'active' | 'declined'
  created_at: string
  // joined from profiles:
  display_name?: string | null
  avatar_url?: string | null
  level?: number | null
  active_goal?: string | null
}

// ── Challenges ──────────────────────────────────────────────

export interface Challenge {
  id: string
  title: string
  description: string
  category: string
  duration_days: number
  start_date: string
  end_date: string
  created_by: string
  created_at: string
  participant_count?: number
}

export interface ChallengeParticipant {
  challenge_id: string
  user_id: string
  goal_id: string | null
  joined_at: string
  checkins_done: number
}

export interface ChallengeLeaderboardEntry {
  challenge_id: string
  user_id: string
  checkins_done: number
  joined_at: string
  display_name: string | null
  avatar_url: string | null
  level: number | null
  title: string | null
  rank: number
}
