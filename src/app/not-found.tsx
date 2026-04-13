import Link from 'next/link'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'

export default function NotFound() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.body',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 4,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle gradient background blob */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
          opacity: 0.04,
          pointerEvents: 'none',
          filter: 'blur(80px)',
        }}
      />

      {/* Brand logo mark */}
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: '10px',
          background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 5,
        }}
      >
        <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', lineHeight: 1 }}>g</Typography>
      </Box>

      {/* Gradient 404 */}
      <Typography
        sx={{
          fontSize: { xs: '5rem', md: '7rem' },
          fontWeight: 700,
          letterSpacing: '-0.05em',
          lineHeight: 1,
          mb: 2,
          background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        404
      </Typography>

      <Typography
        level="body-lg"
        sx={{ color: 'text.secondary', opacity: 0.6, mb: 1.5, fontWeight: 500, fontSize: '1rem' }}
      >
        page not found
      </Typography>
      <Typography
        level="body-sm"
        sx={{ color: 'text.tertiary', opacity: 0.4, mb: 6, maxWidth: 280, lineHeight: 1.6 }}
      >
        the page you&apos;re looking for doesn&apos;t exist or has been moved.
      </Typography>

      <Link href="/" style={{ textDecoration: 'none' }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            px: 3.5,
            py: 1.25,
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
            color: '#fff',
            fontSize: '0.88rem',
            fontWeight: 700,
            letterSpacing: '0.01em',
            transition: 'opacity 0.15s, transform 0.15s',
            '&:hover': { opacity: 0.9, transform: 'translateY(-1px)' },
          }}
        >
          go home →
        </Box>
      </Link>
    </Box>
  )
}
