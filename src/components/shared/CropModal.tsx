'use client'

import { useRef, useState, useEffect } from 'react'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'

interface Props {
  src: string
  shape?: 'circle' | 'rect'
  /** For rect: width/height ratio (e.g. 4 = 4:1). Default 1 (square). */
  aspect?: number
  /** Output image width in px. Height derived from aspect. Default 256. */
  outputWidth?: number
  onApply: (blob: Blob) => void
  onCancel: () => void
}

const PREVIEW_W = 360  // crop area width
const PADDING   = 24   // padding inside the crop area for the mask

export default function CropModal({
  src,
  shape = 'circle',
  aspect = 1,
  outputWidth = 256,
  onApply,
  onCancel,
}: Props) {
  const outputH = Math.round(outputWidth / aspect)

  // Crop mask dimensions inside the preview area
  const maskW = PREVIEW_W - PADDING * 2
  const maskH = shape === 'circle' ? maskW : Math.round(maskW / aspect)
  const PREVIEW_H = maskH + PADDING * 2

  const [naturalW, setNaturalW] = useState(0)
  const [naturalH, setNaturalH] = useState(0)
  const [baseScale, setBaseScale] = useState(1)
  const [zoom, setZoom]   = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragOrigin = useRef({ mx: 0, my: 0, ox: 0, oy: 0 })
  const pinchRef   = useRef(0)
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      const nw = img.naturalWidth
      const nh = img.naturalHeight
      setNaturalW(nw)
      setNaturalH(nh)
      // Scale so image fills the mask area
      setBaseScale(Math.max(maskW / nw, maskH / nh))
      setZoom(1)
      setOffset({ x: 0, y: 0 })
    }
    img.src = src
  }, [src, maskW, maskH])

  // ── crop + output ──────────────────────────────────────────────────────────
  async function handleApply() {
    if (applying) return
    setApplying(true)
    try {
      const blob = await buildBlob()
      onApply(blob)
    } finally {
      setApplying(false)
    }
  }

  function buildBlob(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width  = outputWidth
        canvas.height = outputH
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('no context')); return }

        if (shape === 'circle') {
          ctx.beginPath()
          ctx.arc(outputWidth / 2, outputH / 2, Math.min(outputWidth, outputH) / 2, 0, Math.PI * 2)
          ctx.clip()
        }

        const totalScale = baseScale * zoom
        // Mask center in preview space
        const cx = PREVIEW_W / 2
        const cy = PREVIEW_H / 2
        // Rendered image top-left
        const imgLeft = (PREVIEW_W - naturalW * totalScale) / 2 + offset.x
        const imgTop  = (PREVIEW_H - naturalH * totalScale) / 2 + offset.y
        // Mask top-left in preview space
        const maskLeft = cx - maskW / 2
        const maskTop  = cy - maskH / 2
        // Source rect in original image px
        const srcX = (maskLeft - imgLeft) / totalScale
        const srcY = (maskTop  - imgTop)  / totalScale
        const srcW = maskW / totalScale
        const srcH = maskH / totalScale

        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outputWidth, outputH)

        canvas.toBlob(
          b => (b ? resolve(b) : reject(new Error('toBlob failed'))),
          'image/jpeg', 0.93,
        )
      }
      img.onerror = reject
      img.src = src
    })
  }

  // ── drag ──────────────────────────────────────────────────────────────────
  function onMouseDown(e: React.MouseEvent) {
    setDragging(true)
    dragOrigin.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y }
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragging) return
    const { mx, my, ox, oy } = dragOrigin.current
    setOffset({ x: ox + e.clientX - mx, y: oy + e.clientY - my })
  }
  function onMouseUp() { setDragging(false) }

  // ── touch ─────────────────────────────────────────────────────────────────
  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      pinchRef.current = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY,
      )
    } else {
      const t = e.touches[0]
      dragOrigin.current = { mx: t.clientX, my: t.clientY, ox: offset.x, oy: offset.y }
    }
  }
  function onTouchMove(e: React.TouchEvent) {
    e.preventDefault()
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY,
      )
      if (pinchRef.current > 0) setZoom(z => Math.min(5, Math.max(0.5, z * (dist / pinchRef.current))))
      pinchRef.current = dist
    } else {
      const t = e.touches[0]
      const { mx, my, ox, oy } = dragOrigin.current
      setOffset({ x: ox + t.clientX - mx, y: oy + t.clientY - my })
    }
  }
  function onTouchEnd() { pinchRef.current = 0 }
  function onWheel(e: React.WheelEvent) {
    e.preventDefault()
    setZoom(z => Math.min(5, Math.max(0.5, z - e.deltaY * 0.002)))
  }

  // ── image position ─────────────────────────────────────────────────────────
  const totalScale = baseScale * zoom
  const imgLeft = (PREVIEW_W - naturalW * totalScale) / 2 + offset.x
  const imgTop  = (PREVIEW_H - naturalH * totalScale) / 2 + offset.y

  return (
    <Box
      sx={{
        position: 'fixed', inset: 0, zIndex: 9999,
        bgcolor: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Box sx={{
        bgcolor: 'background.surface',
        borderRadius: '16px',
        overflow: 'hidden',
        width: PREVIEW_W + 48,
        maxWidth: '96vw',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
      }}>

        {/* header */}
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
            {shape === 'circle' ? 'crop photo' : 'crop cover'}
          </Typography>
          <Box component="button" onClick={onCancel} sx={{ background: 'none', border: 'none', cursor: 'pointer', p: 0.5, borderRadius: '50%', display: 'flex', color: 'text.tertiary', '&:hover': { bgcolor: 'background.level1' } }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </Box>
        </Box>

        {/* crop area */}
        <Box
          sx={{
            width: PREVIEW_W, height: PREVIEW_H,
            mx: 'auto',
            position: 'relative', overflow: 'hidden',
            bgcolor: '#0a0a0a',
            cursor: dragging ? 'grabbing' : 'grab',
            userSelect: 'none', touchAction: 'none',
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={onWheel}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* image */}
          {naturalW > 0 && (
            <Box
              component="img"
              src={src}
              draggable={false}
              sx={{
                position: 'absolute',
                left: imgLeft, top: imgTop,
                width: naturalW * totalScale,
                height: naturalH * totalScale,
                maxWidth: 'none',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            />
          )}

          {/* mask overlay — box-shadow creates dark outside-the-mask area */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: maskW, height: maskH,
              borderRadius: shape === 'circle' ? '50%' : '8px',
              border: '2px solid rgba(255,255,255,0.8)',
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.52)',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />

          {/* guide lines (rule of thirds) */}
          {shape === 'rect' && (
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: maskW, height: maskH, zIndex: 3, pointerEvents: 'none' }}>
              {[1/3, 2/3].map(f => (
                <Box key={f} sx={{ position: 'absolute', top: `${f * 100}%`, left: 0, right: 0, height: '1px', bgcolor: 'rgba(255,255,255,0.15)' }} />
              ))}
              {[1/3, 2/3].map(f => (
                <Box key={f} sx={{ position: 'absolute', left: `${f * 100}%`, top: 0, bottom: 0, width: '1px', bgcolor: 'rgba(255,255,255,0.15)' }} />
              ))}
            </Box>
          )}
        </Box>

        {/* zoom slider */}
        <Box sx={{ px: 3, pt: 2, pb: 0.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box component="button" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} sx={{ background: 'none', border: 'none', cursor: 'pointer', p: 0, color: 'text.tertiary', opacity: 0.5, '&:hover': { opacity: 1 }, lineHeight: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
          </Box>
          <Box
            component="input" type="range"
            min={0.5} max={5} step={0.01} value={zoom}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setZoom(parseFloat(e.target.value))}
            sx={{ flex: 1, accentColor: 'rgb(14,165,233)', cursor: 'pointer', height: 3 }}
          />
          <Box component="button" onClick={() => setZoom(z => Math.min(5, z + 0.1))} sx={{ background: 'none', border: 'none', cursor: 'pointer', p: 0, color: 'text.tertiary', opacity: 0.5, '&:hover': { opacity: 1 }, lineHeight: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
          </Box>
        </Box>
        <Typography sx={{ textAlign: 'center', fontSize: '0.65rem', color: 'text.tertiary', opacity: 0.3, pb: 0.5 }}>
          drag · scroll · pinch to adjust
        </Typography>

        {/* actions */}
        <Box sx={{ px: 3, pb: 3, pt: 1.5, display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Box component="button" onClick={onCancel} sx={{ background: 'none', border: '1px solid', borderColor: 'divider', borderRadius: '20px', px: 2.5, py: 0.85, cursor: 'pointer', '&:hover': { bgcolor: 'background.level1' }, transition: 'background 0.15s' }}>
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: 'text.secondary' }}>cancel</Typography>
          </Box>
          <Box component="button" onClick={handleApply} disabled={applying} sx={{ border: 'none', borderRadius: '20px', px: 2.5, py: 0.85, cursor: applying ? 'default' : 'pointer', background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)', opacity: applying ? 0.7 : 1, transition: 'opacity 0.15s' }}>
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
              {applying ? 'saving…' : 'apply'}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
