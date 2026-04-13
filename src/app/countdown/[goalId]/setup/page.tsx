import { notFound } from 'next/navigation'
import Link from 'next/link'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

interface Props {
  params: { goalId: string }
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <Box
      sx={{
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        overflow: 'hidden',
        mb: 3,
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 2.5,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          bgcolor: 'rgba(255,255,255,0.03)',
        }}
      >
        <Typography sx={{ fontSize: '1.2rem' }}>{icon}</Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
          {title}
        </Typography>
      </Box>
      <Box sx={{ px: 3, py: 3 }}>
        {children}
      </Box>
    </Box>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}>
      <Box
        sx={{
          width: 24, height: 24, borderRadius: '50%',
          background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, mt: 0.15,
        }}
      >
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#fff' }}>{n}</Typography>
      </Box>
      <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', lineHeight: 1.6 }}>
        {children}
      </Typography>
    </Box>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        px: 1.25, py: 0.2,
        borderRadius: '6px',
        bgcolor: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: 'rgba(255,255,255,0.85)',
        fontSize: '0.8rem',
        fontFamily: 'monospace',
        mx: 0.25,
      }}
    >
      {children}
    </Box>
  )
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        px: 1.25, py: 0.2,
        borderRadius: '20px',
        bgcolor: color,
        color: '#fff',
        fontSize: '0.68rem',
        fontWeight: 700,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        ml: 1,
      }}
    >
      {label}
    </Box>
  )
}

export default async function SetupPage({ params }: Props) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('goals')
    .select('id, description')
    .eq('id', params.goalId)
    .single()

  if (!data) notFound()

  const countdownUrl = `{YOUR_DOMAIN}/countdown/${params.goalId}`
  const goalDesc = data.description.length > 60
    ? data.description.slice(0, 60) + '…'
    : data.description

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0a0a0a',
        color: '#fff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* Top bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 3, md: 6 },
          py: 2.5,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Typography
          sx={{
            fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.04em',
            background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}
        >
          getalife
        </Typography>
        <Box
          component={Link}
          href={`/countdown/${params.goalId}`}
          sx={{
            px: 2, py: 0.75, borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.4)',
            fontSize: '0.78rem', textDecoration: 'none',
            '&:hover': { borderColor: 'rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.7)' },
            transition: 'all 0.15s',
          }}
        >
          ← back to countdown
        </Box>
      </Box>

      <Box sx={{ maxWidth: 680, mx: 'auto', px: { xs: 3, md: 4 }, py: 5 }}>

        {/* Header */}
        <Box sx={{ mb: 5, textAlign: 'center' }}>
          <Typography
            sx={{
              fontSize: { xs: '1.6rem', md: '2rem' }, fontWeight: 700,
              letterSpacing: '-0.03em', lineHeight: 1.2, mb: 1,
              color: 'rgba(255,255,255,0.92)',
            }}
          >
            add your live countdown
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            "{goalDesc}" — everywhere you look
          </Typography>
        </Box>

        {/* ── WINDOWS ── */}
        <Section title="Windows — Live Wallpaper" icon="🖥️">
          <Box
            sx={{
              px: 2.5, py: 2, borderRadius: '10px',
              background: 'rgba(14,165,233,0.07)',
              border: '1px solid rgba(14,165,233,0.15)',
              mb: 3,
            }}
          >
            <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem', lineHeight: 1.6 }}>
              <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Lively Wallpaper</strong> (free, open source) renders any webpage as a live animated wallpaper. Your countdown updates in real time on your desktop.
            </Typography>
          </Box>
          <Step n={1}>
            Download <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Lively Wallpaper</strong> from the Microsoft Store or
            {' '}<Chip>github.com/rocksdanister/lively</Chip>
          </Step>
          <Step n={2}>
            Open Lively → click the <Chip>+</Chip> button → choose <strong style={{ color: 'rgba(255,255,255,0.85)' }}>"Add URL"</strong>
          </Step>
          <Step n={3}>
            Paste your countdown URL: <Chip>/countdown/{params.goalId}</Chip>
          </Step>
          <Step n={4}>
            Click <strong style={{ color: 'rgba(255,255,255,0.85)' }}>OK</strong> → set as wallpaper. Done — it's live.
          </Step>
          <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', mt: 1 }}>
            Alternative: Wallpaper Engine (paid, $4 on Steam) works the same way.
          </Typography>
        </Section>

        {/* ── MAC ── */}
        <Section title="Mac — Live Wallpaper" icon="🍎">
          <Box
            sx={{
              px: 2.5, py: 2, borderRadius: '10px',
              background: 'rgba(14,165,233,0.07)',
              border: '1px solid rgba(14,165,233,0.15)',
              mb: 3,
            }}
          >
            <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem', lineHeight: 1.6 }}>
              <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Plash</strong> is a free Mac app that displays any webpage as your desktop background. Available on the Mac App Store.
            </Typography>
          </Box>
          <Step n={1}>
            Download <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Plash</strong> from the Mac App Store (search "Plash" or find it at <Chip>sindresorhus.com/plash</Chip>)
          </Step>
          <Step n={2}>
            Open Plash from your menu bar → <Chip>Preferences</Chip>
          </Step>
          <Step n={3}>
            In the URL field, paste: <Chip>/countdown/{params.goalId}</Chip>
          </Step>
          <Step n={4}>
            Click <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Apply</strong>. Your countdown is now your Mac wallpaper.
          </Step>
        </Section>

        {/* ── CHROME EXTENSION ── */}
        <Section title="Chrome — New Tab Countdown" icon="🌐">
          <Box
            sx={{
              px: 2.5, py: 2, borderRadius: '10px',
              background: 'rgba(249,115,22,0.07)',
              border: '1px solid rgba(249,115,22,0.15)',
              mb: 3,
            }}
          >
            <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem', lineHeight: 1.6 }}>
              Every new tab shows your live goal countdown with a real-time seconds ticker.
            </Typography>
          </Box>
          <Step n={1}>
            Download the extension folder: <Chip>/extension/</Chip> from your getalife dashboard
          </Step>
          <Step n={2}>
            Open Chrome → go to <Chip>chrome://extensions</Chip>
          </Step>
          <Step n={3}>
            Enable <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Developer mode</strong> (toggle top-right)
          </Step>
          <Step n={4}>
            Click <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Load unpacked</strong> → select the downloaded extension folder
          </Step>
          <Step n={5}>
            Open a new tab → paste your countdown URL when prompted → done
          </Step>
        </Section>

        {/* ── iOS ── */}
        <Section title="iPhone — Home Screen Widget" icon="📱">
          <Box
            sx={{
              px: 2.5, py: 2, borderRadius: '10px',
              background: 'rgba(14,165,233,0.07)',
              border: '1px solid rgba(14,165,233,0.15)',
              mb: 3,
            }}
          >
            <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem', lineHeight: 1.6 }}>
              Two options: add the countdown page to your home screen as a web app, or use Scriptable for a native widget.
            </Typography>
          </Box>

          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', mb: 1.5 }}>
            Option A — Web App (easiest)
          </Typography>
          <Step n={1}>
            Open Safari → go to your countdown URL: <Chip>/countdown/{params.goalId}</Chip>
          </Step>
          <Step n={2}>
            Tap the <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Share</strong> button (box with arrow) → <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Add to Home Screen</strong>
          </Step>
          <Step n={3}>
            Tap <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Add</strong>. Opens as a full-screen app from your home screen.
          </Step>

          <Box sx={{ my: 2.5, height: '1px', bgcolor: 'rgba(255,255,255,0.06)' }} />

          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', mb: 1.5 }}>
            Option B — Scriptable Widget (live on home screen) <Badge label="free" color="rgb(34,197,94)" />
          </Typography>
          <Step n={1}>
            Download <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Scriptable</strong> from the App Store (free)
          </Step>
          <Step n={2}>
            Open Scriptable → tap <Chip>+</Chip> → paste this code:
          </Step>

          <Box
            sx={{
              px: 2.5, py: 2, borderRadius: '10px',
              bgcolor: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.07)',
              mb: 2, mt: 1,
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.7,
              whiteSpace: 'pre',
              overflowX: 'auto',
            }}
          >
{`const url = "https://YOUR_DOMAIN/api/public/goal/${params.goalId}"
const req = new Request(url)
const data = await req.loadJSON()

const now = new Date()
const start = new Date(data.created_at)
const dayIn = Math.floor((now-start)/86400000)+1
const deadline = data.deadline ? new Date(data.deadline) : null
const daysLeft = deadline
  ? Math.max(0,Math.ceil((deadline-now)/86400000))
  : null

const w = new ListWidget()
w.backgroundColor = new Color("#0a0a0a")
const big = w.addText(String(daysLeft ?? dayIn))
big.font = Font.boldSystemFont(52)
big.textColor = new Color("#0ea5e9")
const lbl = w.addText(daysLeft != null ? "days left" : "days in")
lbl.font = Font.systemFont(12)
lbl.textColor = new Color("#ffffff40")
const goal = w.addText(data.description.slice(0,60))
goal.font = Font.systemFont(10)
goal.textColor = new Color("#ffffff50")
Script.setWidget(w)
Script.complete()`}
          </Box>

          <Step n={3}>
            Replace <Chip>YOUR_DOMAIN</Chip> with your actual domain → tap Run to test
          </Step>
          <Step n={4}>
            Long-press home screen → tap <Chip>+</Chip> → find Scriptable → add widget → select your script
          </Step>
        </Section>

        {/* ── ANDROID ── */}
        <Section title="Android — Live Widget" icon="🤖">
          <Box
            sx={{
              px: 2.5, py: 2, borderRadius: '10px',
              background: 'rgba(14,165,233,0.07)',
              border: '1px solid rgba(14,165,233,0.15)',
              mb: 3,
            }}
          >
            <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem', lineHeight: 1.6 }}>
              Two options: add the page to your home screen as a PWA, or use KWGT for a native widget.
            </Typography>
          </Box>

          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', mb: 1.5 }}>
            Option A — PWA (easiest)
          </Typography>
          <Step n={1}>
            Open Chrome on Android → go to <Chip>/countdown/{params.goalId}</Chip>
          </Step>
          <Step n={2}>
            Tap the 3-dot menu → <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Add to Home screen</strong>
          </Step>
          <Step n={3}>
            It opens as a full-screen app. Live countdown every time you open it.
          </Step>

          <Box sx={{ my: 2.5, height: '1px', bgcolor: 'rgba(255,255,255,0.06)' }} />

          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', mb: 1.5 }}>
            Option B — KWGT Widget <Badge label="free" color="rgb(34,197,94)" />
          </Typography>
          <Step n={1}>
            Download <strong style={{ color: 'rgba(255,255,255,0.85)' }}>KWGT Kustom Widget Maker</strong> from Play Store
          </Step>
          <Step n={2}>
            Long-press your home screen → Widgets → KWGT → add a widget
          </Step>
          <Step n={3}>
            Inside KWGT, add a <strong style={{ color: 'rgba(255,255,255,0.85)' }}>TEXT</strong> element with formula:
            <Box
              sx={{
                mt: 1, px: 2, py: 1.5, borderRadius: '8px',
                bgcolor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.07)',
                fontFamily: 'monospace', fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)',
              }}
            >
              $df(dd)$ days in
            </Box>
          </Step>
          <Step n={4}>
            Add a <strong style={{ color: 'rgba(255,255,255,0.85)' }}>JSON API</strong> data source pointing to: <Chip>/api/public/goal/{params.goalId}</Chip> and bind the <Chip>description</Chip> field to a text element.
          </Step>
        </Section>

        {/* Lock screen note */}
        <Box
          sx={{
            px: 3, py: 2.5, borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.06)',
            bgcolor: 'rgba(255,255,255,0.02)',
            textAlign: 'center',
          }}
        >
          <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem', lineHeight: 1.6 }}>
            For iOS lock screen widgets (iOS 16+): use the Scriptable widget approach above — Scriptable supports lock screen widget sizes.
          </Typography>
        </Box>

      </Box>
    </Box>
  )
}
