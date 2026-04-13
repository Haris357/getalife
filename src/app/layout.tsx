import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import InitColorSchemeScript from '@mui/joy/InitColorSchemeScript'
import ThemeRegistry from '@/components/layout/ThemeRegistry'
import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://getalife.app'

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'Get A Life — Stop planning. Start doing.',
  description:
    'Write your goal, get an AI roadmap, check in daily, and get followed up every day until you actually finish it.',
  metadataBase: new URL(siteUrl),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GetALife',
  },
  openGraph: {
    title: 'Get A Life — Stop planning. Start doing.',
    description: 'Write your goal, get an AI roadmap, check in daily, and get followed up every day until you actually finish it.',
    url: siteUrl,
    siteName: 'Get A Life',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Get A Life — Stop planning. Start doing.',
    description: 'Write your goal, get an AI roadmap, check in daily, and get followed up every day until you actually finish it.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <InitColorSchemeScript defaultMode="dark" />
        <ThemeRegistry>{children}</ThemeRegistry>
        <Analytics />
      </body>
    </html>
  )
}
