import type { BadgeType } from '@/types'

export interface BadgeDef {
  type: BadgeType
  label: string
  description: string
  icon: string  // emoji
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export const BADGE_DEFS: BadgeDef[] = [
  { type: 'first_checkin',  label: 'First Step',     description: 'Completed your first check-in.',              icon: '👣', rarity: 'common'    },
  { type: 'week_warrior',   label: 'Week Warrior',   description: '7-day streak on any goal.',                    icon: '⚡', rarity: 'common'    },
  { type: 'fortnight',      label: 'Fortnight',      description: '14-day streak on any goal.',                   icon: '🔥', rarity: 'rare'      },
  { type: 'month_strong',   label: 'Month Strong',   description: '30-day streak on any goal.',                   icon: '💎', rarity: 'rare'      },
  { type: 'iron_will',      label: 'Iron Will',      description: '60-day streak on any goal.',                   icon: '🏆', rarity: 'epic'      },
  { type: 'century',        label: 'Century',        description: '100-day streak on any goal.',                  icon: '👑', rarity: 'legendary' },
  { type: 'goal_crusher',   label: 'Goal Crusher',   description: 'Marked a goal as complete.',                   icon: '✅', rarity: 'rare'      },
  { type: 'comeback_kid',   label: 'Comeback Kid',   description: 'Resumed after a 3+ day break.',                icon: '🦅', rarity: 'rare'      },
  { type: 'show_off',       label: 'Show Off',       description: 'Uploaded media in 5+ check-ins.',              icon: '📸', rarity: 'common'    },
  { type: 'storyteller',    label: 'Storyteller',    description: 'Submitted a success story.',                   icon: '📖', rarity: 'epic'      },
]

export const BADGE_MAP = Object.fromEntries(BADGE_DEFS.map((b) => [b.type, b])) as Record<BadgeType, BadgeDef>

export const RARITY_COLORS: Record<BadgeDef['rarity'], string> = {
  common:    '#737373',
  rare:      '#3b82f6',
  epic:      '#8b5cf6',
  legendary: '#f59e0b',
}

/** Returns list of badge types that should be awarded after a check-in */
export function getBadgesToAward(opts: {
  isFirstCheckin: boolean
  streak: number
  hadLongBreak: boolean
  mediaCheckinCount: number
}): BadgeType[] {
  const awards: BadgeType[] = []
  if (opts.isFirstCheckin)       awards.push('first_checkin')
  if (opts.streak === 7)         awards.push('week_warrior')
  if (opts.streak === 14)        awards.push('fortnight')
  if (opts.streak === 30)        awards.push('month_strong')
  if (opts.streak === 60)        awards.push('iron_will')
  if (opts.streak === 100)       awards.push('century')
  if (opts.hadLongBreak)         awards.push('comeback_kid')
  if (opts.mediaCheckinCount === 5) awards.push('show_off')
  return awards
}
