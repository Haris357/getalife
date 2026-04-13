import dynamic from 'next/dynamic'

// ssr: false ensures this never renders during SSR, avoiding hydration mismatches
// from null-returning client components inside server component trees.
const RealtimeRefresher = dynamic(
  () => import('./RealtimeRefresherCore'),
  { ssr: false }
)

export default RealtimeRefresher
