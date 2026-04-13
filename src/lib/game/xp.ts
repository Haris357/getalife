export interface XPGain {
  base: number
  streakBonus: number
  mediaBonus: number
  socialBonus: number
  total: number
}

export function calcXPGain(opts: {
  streak: number
  hasMedia: boolean
  hasSocialLinks: boolean
}): XPGain {
  const base = 10
  const streakBonus = Math.min(Math.floor(opts.streak / 7) * 5, 50) // +5 per 7-day block, max +50
  const mediaBonus = opts.hasMedia ? 5 : 0
  const socialBonus = opts.hasSocialLinks ? 3 : 0
  return { base, streakBonus, mediaBonus, socialBonus, total: base + streakBonus + mediaBonus + socialBonus }
}

const LEVELS = [
  { min: 0,     level: 1,  title: 'Starting Out' },
  { min: 100,   level: 2,  title: 'Getting Serious' },
  { min: 300,   level: 3,  title: 'Committed' },
  { min: 700,   level: 4,  title: 'On a Roll' },
  { min: 1500,  level: 5,  title: 'Relentless' },
  { min: 3000,  level: 6,  title: 'Unstoppable' },
  { min: 6000,  level: 7,  title: 'Elite' },
  { min: 12000, level: 8,  title: 'Legend' },
]

export function getLevelInfo(xp: number): { level: number; title: string; currentMin: number; nextMin: number | null; progress: number } {
  let current = LEVELS[0]
  for (const l of LEVELS) {
    if (xp >= l.min) current = l
    else break
  }
  const idx = LEVELS.indexOf(current)
  const next = LEVELS[idx + 1] ?? null
  const progress = next
    ? Math.round(((xp - current.min) / (next.min - current.min)) * 100)
    : 100

  return { level: current.level, title: current.title, currentMin: current.min, nextMin: next?.min ?? null, progress }
}

// XP needed for next level from current XP
export function xpToNextLevel(xp: number): number | null {
  const { nextMin } = getLevelInfo(xp)
  return nextMin !== null ? nextMin - xp : null
}
