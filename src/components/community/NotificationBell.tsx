import dynamic from 'next/dynamic'

// ssr: false: the bell fetches notifications and subscribes to realtime on mount.
// Skipping SSR avoids mismatches when the server and client notification state differ.
const NotificationBell = dynamic(
  () => import('./NotificationBellCore'),
  { ssr: false, loading: () => null }
)

export default NotificationBell
