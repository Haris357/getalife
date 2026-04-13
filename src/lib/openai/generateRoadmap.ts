import { getOpenAIClient } from './client'
import type { RoadmapPhase } from '@/types'

export async function generateRoadmap(description: string): Promise<RoadmapPhase[]> {
  const client = getOpenAIClient()

  const completion = await client.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You write the chapter titles of someone's personal story. Given their goal, create exactly 3 chapters that map the journey.

Rules:
- Each chapter title must be SHORT (3-6 words), punchy, and specific to THIS exact goal — like a book chapter title, not a corporate milestone
- GOOD titles: "The First Bad Week", "When It Clicks", "No Excuses Left", "Just Show Up", "The Last 10 Days"
- BAD titles: "Foundation Phase", "Building Momentum", "Final Mastery", "Phase 1", anything generic
- Focus items: 3-4 per chapter, concrete and specific to the goal, under 12 words each. Real things to do, not vague motivational fluff.
- Tone: honest, real, like a friend who's been there — not a life coach
- The arc should feel like: getting off the ground → surviving the hard middle → finishing strong

Respond ONLY with valid JSON:
{
  "roadmap": [
    { "phase": 1, "title": "chapter title here", "focus": ["specific thing 1", "specific thing 2", "specific thing 3"] },
    { "phase": 2, "title": "chapter title here", "focus": ["specific thing 1", "specific thing 2", "specific thing 3"] },
    { "phase": 3, "title": "chapter title here", "focus": ["specific thing 1", "specific thing 2", "specific thing 3"] }
  ]
}`,
      },
      {
        role: 'user',
        content: `Goal: ${description}`,
      },
    ],
  })

  const raw = completion.choices[0]?.message?.content ?? '{}'
  const parsed = JSON.parse(raw)
  return parsed.roadmap as RoadmapPhase[]
}
