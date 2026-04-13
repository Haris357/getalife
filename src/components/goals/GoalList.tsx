import Box from '@mui/joy/Box'
import GoalCard from './GoalCard'
import type { Goal } from '@/types'

interface Props {
  goals: Goal[]
}

export default function GoalList({ goals }: Props) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {goals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} />
      ))}
    </Box>
  )
}
