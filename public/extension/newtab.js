/* GetALife — New Tab Countdown */

const $ = id => document.getElementById(id)

// ── Views ──────────────────────────────────────────────────────────────────
function showView(name) {
  $('countdown-view').style.display = 'none'
  $('setup-view').style.display     = 'none'
  $('error-view').style.display     = 'none'
  $(name + '-view').style.display   = 'flex'
}

// ── Time ticker — live HH:MM:SS until midnight ─────────────────────────────
let tickerInterval = null
function startTicker() {
  function tick() {
    const now      = new Date()
    const midnight = new Date(now)
    midnight.setHours(24, 0, 0, 0)
    const secs = Math.floor((midnight - now) / 1000)
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    $('time-ticker').textContent =
      pad(h) + ':' + pad(m) + ':' + pad(s) + ' until next day'
  }
  tick()
  if (tickerInterval) clearInterval(tickerInterval)
  tickerInterval = setInterval(tick, 1000)
}
function pad(n) { return String(n).padStart(2, '0') }

// ── Render countdown ────────────────────────────────────────────────────────
function renderCountdown(goal) {
  const now       = Date.now()
  const startMs   = new Date(goal.created_at).getTime()
  const daysSince = Math.floor((now - startMs) / 86400000)
  const dayNum    = daysSince + 1

  // streak badge
  if (goal.current_streak > 0) {
    const badge = $('streak-badge')
    badge.style.display = 'inline-flex'
    badge.textContent   = (goal.current_streak >= 7 ? '🔥 ' : '') + goal.current_streak + ' day streak'
    if (goal.current_streak >= 7) badge.classList.add('hot')
  }

  // big number
  let daysLeft = null, totalDays = null, progressPct = 0
  if (goal.deadline) {
    const deadlineMs = new Date(goal.deadline).getTime()
    daysLeft   = Math.max(0, Math.ceil((deadlineMs - now) / 86400000))
    totalDays  = Math.ceil((deadlineMs - startMs) / 86400000)
    progressPct = totalDays > 0 ? Math.min(100, Math.round((daysSince / totalDays) * 100)) : 0
  }

  $('big-number').textContent = daysLeft !== null ? daysLeft : dayNum
  $('big-label').textContent  = daysLeft !== null ? 'days left' : 'days in'
  $('goal-desc').textContent  = goal.description

  // progress bar
  if (goal.deadline && totalDays) {
    $('progress-wrap').style.display = 'block'
    $('stat-day').textContent   = 'day ' + dayNum
    $('stat-pct').textContent   = progressPct + '% done'
    $('stat-total').textContent = totalDays + ' days total'
    $('progress-fill').style.width = progressPct + '%'
  }

  startTicker()
  showView('countdown')
}

// ── Parse URL → { goalId, apiBase } ────────────────────────────────────────
function parseCountdownUrl(raw) {
  try {
    const url    = new URL(raw.trim())
    const match  = url.pathname.match(/\/countdown\/([a-zA-Z0-9-]+)/)
    if (!match) return null
    return { goalId: match[1], apiBase: url.origin }
  } catch {
    return null
  }
}

// ── Fetch goal from public API ──────────────────────────────────────────────
async function fetchGoal(goalId, apiBase) {
  const res = await fetch(apiBase + '/api/public/goal/' + goalId)
  if (!res.ok) throw new Error('not found')
  return res.json()
}

// ── Init ────────────────────────────────────────────────────────────────────
async function init() {
  const { goalId, apiBase } = await chrome.storage.local.get(['goalId', 'apiBase'])

  if (!goalId) {
    showView('setup')
    return
  }

  try {
    const goal = await fetchGoal(goalId, apiBase || 'https://getalife.app')
    renderCountdown(goal)
  } catch {
    showView('error')
  }
}

// ── Setup form ──────────────────────────────────────────────────────────────
$('save-btn').addEventListener('click', async () => {
  const raw = $('url-input').value.trim()
  if (!raw) return

  const parsed = parseCountdownUrl(raw)
  if (!parsed) {
    $('error-msg').textContent = 'paste the full countdown URL — e.g. https://getalife.app/countdown/abc123'
    $('error-msg').style.display = 'block'
    return
  }

  $('error-msg').style.display = 'none'
  $('save-btn').disabled = true
  $('save-btn').textContent = 'connecting...'

  try {
    const goal = await fetchGoal(parsed.goalId, parsed.apiBase)
    await chrome.storage.local.set({ goalId: parsed.goalId, apiBase: parsed.apiBase })
    renderCountdown(goal)
  } catch {
    $('error-msg').textContent = 'couldn\'t reach that goal — check the URL and try again'
    $('error-msg').style.display = 'block'
    $('save-btn').disabled = false
    $('save-btn').textContent = 'save & start countdown'
  }
})

$('url-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') $('save-btn').click()
})

// ── Settings / reset ────────────────────────────────────────────────────────
$('settings-btn').addEventListener('click', () => {
  if (tickerInterval) clearInterval(tickerInterval)
  showView('setup')
})

$('retry-btn').addEventListener('click', init)

$('reset-btn').addEventListener('click', async () => {
  await chrome.storage.local.remove(['goalId', 'apiBase'])
  showView('setup')
})

// ── Start ───────────────────────────────────────────────────────────────────
init()
