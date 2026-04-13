import Box from '@mui/joy/Box'
import Skeleton from '@mui/joy/Skeleton'

export default function DashboardLoading() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.body' }}>
      {/* Header skeleton */}
      <Box
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          px: { xs: 3, md: 5 },
          py: 1.75,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 52,
        }}
      >
        <Skeleton variant="rectangular" width={100} height={22} sx={{ borderRadius: '5px' }} />
        <Skeleton variant="rectangular" width={32} height={32} sx={{ borderRadius: '7px' }} />
      </Box>

      <Box sx={{ maxWidth: 640, mx: 'auto', px: { xs: 3, md: 4 }, py: 6 }}>
        <Skeleton variant="text" level="body-xs" sx={{ width: '40%', mb: 2 }} />
        <Skeleton variant="rectangular" height={120} sx={{ borderRadius: '8px', mb: 2 }} />
        <Skeleton variant="rectangular" height={44} sx={{ borderRadius: '6px', mb: 6 }} />

        <Skeleton variant="text" level="body-xs" sx={{ width: '25%', mb: 3 }} />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rectangular" height={80} sx={{ borderRadius: '10px', mb: 1.5 }} />
        ))}
      </Box>
    </Box>
  )
}
