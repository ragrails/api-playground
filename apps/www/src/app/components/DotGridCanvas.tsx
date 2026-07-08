import { useEffect, useRef } from 'react'

/** Grid geometry: 16px tiles, 1px dots. */
const SPACING = 16
const DOT_RADIUS = 1
/** Dot opacity, 0–1. Applied on top of the CSS `color` from `.lp-hero-grid`. */
const DOT_OPACITY = 0.65
/** Cursor influence radius (px) and how far dots get pushed at its center. */
const INFLUENCE = 150
const MAX_SHIFT = 50
/** Per-frame lerp rates: dots take on displacement quickly near the cursor
    (attack) and drift home slowly once it passes (release). No velocity or
    spring — displacement decays exponentially, so nothing ever bounces. */
const ATTACK = 0.16
const RELEASE = 0.014
/** Below this a dot snaps home and stops costing frames. */
const SETTLE_DIST = 0.05
/** Per-frame movement below this counts as "at rest" — the loop stops. */
const REST_DELTA = 0.01
/** Cap the backing bitmap at 2x; denser displays gain nothing visible here. */
const MAX_DPR = 2

interface Rect {
  x0: number
  y0: number
  x1: number
  y1: number
}

/**
 * Interactive dot-grid backdrop. Fills its positioned parent, draws a dot
 * grid, and pushes dots away from the pointer, easing them slowly home once
 * it passes. Used by the Home hero (`.lp-hero-grid`) and the playground
 * showcase canvas (`.pg-canvas`).
 *
 * The pointer is tracked on `window` in the capture phase, so the effect works
 * no matter what sits above the canvas — child components can't swallow the
 * events. If the parent is a scroll container, the canvas counter-translates
 * with its scroll offset so the grid stays pinned to the scrollport (matching
 * how a CSS background behaves on a scrolling element).
 *
 * Performance model: dot positions live in flat typed arrays indexed by grid
 * cell, so the cells under the cursor and the settling trail are found by
 * arithmetic, not by scanning every dot. Each frame simulates only those dots
 * and repaints only the dirty rectangle around them (snapped to grid lines so
 * partial repaints can't double-paint a dot's antialiased edge). The rAF loop
 * stops whenever nothing moved a visible amount — including while the cursor
 * rests over the hero — and event handlers restart it.
 *
 * Dot color comes from the canvas's own CSS `color` (inherited or set via
 * `className`), so masks and theming stay in CSS; it is re-read when an
 * ancestor's `data-theme` changes.
 */
export function DotGridCanvas({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const parent = canvas?.parentElement
    if (!canvas || !parent) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    /** Grid dimensions; dot i sits at column i % cols, row (i / cols) | 0. */
    let cols = 0
    let rows = 0
    /** Current dot positions (CSS px). Home positions derive from the index. */
    let posX = new Float32Array(0)
    let posY = new Float32Array(0)
    /** Indices of dots away from home — the only ones that need repainting. */
    const active = new Set<number>()
    /** Region repainted last frame; must be repainted again to erase it. */
    let prevDirty: Rect | null = null

    let raf = 0
    let running = false
    /** Pointer in canvas space; `active` while it is over the backdrop. */
    const pointer = { x: -1e4, y: -1e4, active: false }
    /** Last viewport position, so scrolling under a still cursor re-aims. */
    const client = { x: -1e4, y: -1e4 }

    const homeX = (i: number) => SPACING / 2 + (i % cols) * SPACING
    const homeY = (i: number) => SPACING / 2 + ((i / cols) | 0) * SPACING

    /** Clamp a rect to the canvas and snap it outward to grid lines. Dot
        centers sit mid-cell, so snapped edges never cut through a dot. */
    const snapRect = (x0: number, y0: number, x1: number, y1: number): Rect => ({
      x0: Math.max(0, Math.floor(x0 / SPACING) * SPACING),
      y0: Math.max(0, Math.floor(y0 / SPACING) * SPACING),
      x1: Math.min(width, Math.ceil(x1 / SPACING) * SPACING),
      y1: Math.min(height, Math.ceil(y1 / SPACING) * SPACING),
    })

    const unionRect = (a: Rect | null, b: Rect | null): Rect | null =>
      !a
        ? b
        : !b
          ? a
          : {
              x0: Math.min(a.x0, b.x0),
              y0: Math.min(a.y0, b.y0),
              x1: Math.max(a.x1, b.x1),
              y1: Math.max(a.y1, b.y1),
            }

    /** Clear a snapped rect and redraw every dot whose home cell is in it, at
        its current position. Displaced dots are always inside the rect too —
        the dirty bounds include both ends of every moving dot. */
    const drawRegion = (r: Rect) => {
      if (r.x1 <= r.x0 || r.y1 <= r.y0) return
      ctx.clearRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0)
      const c0 = Math.max(0, Math.round(r.x0 / SPACING))
      const c1 = Math.min(cols - 1, Math.round(r.x1 / SPACING) - 1)
      const r0 = Math.max(0, Math.round(r.y0 / SPACING))
      const r1 = Math.min(rows - 1, Math.round(r.y1 / SPACING) - 1)
      ctx.beginPath()
      for (let row = r0; row <= r1; row++) {
        const base = row * cols
        for (let col = c0; col <= c1; col++) {
          const i = base + col
          ctx.moveTo(posX[i] + DOT_RADIUS, posY[i])
          ctx.arc(posX[i], posY[i], DOT_RADIUS, 0, Math.PI * 2)
        }
      }
      ctx.fill()
    }

    // Per-frame scratch state for moveDot/step (primitive fields, not a
    // nullable object — TS narrowing can't follow mutation through calls).
    let anyMoved = false
    let hasBounds = false
    let bx0 = 0
    let by0 = 0
    let bx1 = 0
    let by1 = 0

    const extendBounds = (x: number, y: number) => {
      if (!hasBounds) {
        hasBounds = true
        bx0 = bx1 = x
        by0 = by1 = y
        return
      }
      if (x < bx0) bx0 = x
      else if (x > bx1) bx1 = x
      if (y < by0) by0 = y
      else if (y > by1) by1 = y
    }

    /** Advance one dot toward its target (displaced radially from home while
        the cursor is near, home otherwise). Targets derive from the fixed home
        position, so motion is a plain exponential approach — it can't bounce. */
    const moveDot = (i: number) => {
      const hx = homeX(i)
      const hy = homeY(i)
      let tx = hx
      let ty = hy
      let pushed = false
      if (pointer.active) {
        const dx = hx - pointer.x
        const dy = hy - pointer.y
        const d2 = dx * dx + dy * dy
        if (d2 < INFLUENCE * INFLUENCE && d2 > 1e-6) {
          const dist = Math.sqrt(d2)
          const f = ((1 - dist / INFLUENCE) * MAX_SHIFT) / dist
          tx = hx + dx * f
          ty = hy + dy * f
          pushed = true
        }
      }
      const rate = pushed ? ATTACK : RELEASE
      const mx = (tx - posX[i]) * rate
      const my = (ty - posY[i]) * rate
      posX[i] += mx
      posY[i] += my
      if (Math.abs(mx) > REST_DELTA || Math.abs(my) > REST_DELTA) anyMoved = true
      if (Math.abs(posX[i] - hx) > SETTLE_DIST || Math.abs(posY[i] - hy) > SETTLE_DIST) {
        active.add(i)
        extendBounds(hx, hy)
        extendBounds(posX[i], posY[i])
      } else {
        posX[i] = hx
        posY[i] = hy
        active.delete(i)
      }
    }

    const step = () => {
      anyMoved = false
      hasBounds = false

      // Grid-index window of cells the cursor can currently push.
      let ic0 = 0
      let ic1 = -1
      let ir0 = 0
      let ir1 = -1
      if (pointer.active) {
        ic0 = Math.max(0, Math.ceil((pointer.x - INFLUENCE - SPACING / 2) / SPACING))
        ic1 = Math.min(cols - 1, Math.floor((pointer.x + INFLUENCE - SPACING / 2) / SPACING))
        ir0 = Math.max(0, Math.ceil((pointer.y - INFLUENCE - SPACING / 2) / SPACING))
        ir1 = Math.min(rows - 1, Math.floor((pointer.y + INFLUENCE - SPACING / 2) / SPACING))
        for (let row = ir0; row <= ir1; row++) {
          const base = row * cols
          for (let col = ic0; col <= ic1; col++) moveDot(base + col)
        }
      }
      // Settling trail outside the cursor window.
      for (const i of active) {
        const col = i % cols
        const row = (i / cols) | 0
        if (pointer.active && col >= ic0 && col <= ic1 && row >= ir0 && row <= ir1) continue
        moveDot(i)
      }

      const pad = DOT_RADIUS + 1
      const dirty = hasBounds ? snapRect(bx0 - pad, by0 - pad, bx1 + pad, by1 + pad) : null
      const repaint = unionRect(prevDirty, dirty)
      if (repaint) drawRegion(repaint)
      prevDirty = dirty

      if (anyMoved) {
        raf = requestAnimationFrame(step)
        return
      }
      // At rest. If the cursor is gone, clear the sub-pixel residue (< REST
      // px per frame is invisible) so the grid is bit-exact again, then stop.
      if (!pointer.active && active.size > 0) {
        let rect: Rect | null = null
        for (const i of active) {
          const hx = homeX(i)
          const hy = homeY(i)
          const dotRect = snapRect(
            Math.min(hx, posX[i]) - pad,
            Math.min(hy, posY[i]) - pad,
            Math.max(hx, posX[i]) + pad,
            Math.max(hy, posY[i]) + pad,
          )
          rect = unionRect(rect, dotRect)
          posX[i] = hx
          posY[i] = hy
        }
        active.clear()
        const final = unionRect(prevDirty, rect)
        if (final) drawRegion(final)
        prevDirty = null
      }
      running = false
    }

    const start = () => {
      if (running) return
      running = true
      raf = requestAnimationFrame(step)
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      width = parent.clientWidth
      height = parent.clientHeight
      cols = Math.max(0, Math.ceil((width - SPACING / 2) / SPACING))
      rows = Math.max(0, Math.ceil((height - SPACING / 2) / SPACING))
      posX = new Float32Array(cols * rows)
      posY = new Float32Array(cols * rows)
      for (let i = 0; i < posX.length; i++) {
        posX[i] = homeX(i)
        posY[i] = homeY(i)
      }
      active.clear()
      prevDirty = null
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      // Setting canvas.width resets all context state — reapply it here.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.globalAlpha = DOT_OPACITY
      ctx.fillStyle = getComputedStyle(canvas).color
      drawRegion({ x0: 0, y0: 0, x1: width, y1: height })
    }

    /** Map a viewport position into canvas space and (de)activate the field. */
    const aim = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = clientX - rect.left
      pointer.y = clientY - rect.top
      pointer.active =
        clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
      start()
    }

    const onPointerMove = (e: PointerEvent) => {
      client.x = e.clientX
      client.y = e.clientY
      aim(e.clientX, e.clientY)
    }

    // Keep the dispersal point under a stationary cursor while the page
    // scrolls, and keep the grid pinned to the scrollport when the parent
    // itself is the scroller (e.g. the playground canvas).
    const onScroll = () => {
      if (parent.scrollLeft || parent.scrollTop || canvas.style.transform) {
        canvas.style.transform = `translate(${parent.scrollLeft}px, ${parent.scrollTop}px)`
      }
      if (client.x > -1e3) aim(client.x, client.y)
    }

    const deactivate = () => {
      pointer.active = false
      start()
    }

    // Pointer left the window entirely (relatedTarget is null on real exits).
    const onPointerOut = (e: PointerEvent) => {
      if (e.relatedTarget === null) deactivate()
    }

    const observer = new ResizeObserver(resize)
    observer.observe(parent)
    resize()

    // The dot color derives from theme tokens; re-read it when the nearest
    // themed ancestor flips (e.g. the playground's light/dark switch).
    const themeRoot = parent.closest('[data-theme]')
    const themeObserver = themeRoot
      ? new MutationObserver(() => {
          ctx.fillStyle = getComputedStyle(canvas).color
          drawRegion({ x0: 0, y0: 0, x1: width, y1: height })
        })
      : null
    if (themeRoot && themeObserver) {
      themeObserver.observe(themeRoot, { attributes: true, attributeFilter: ['data-theme'] })
    }

    // Capture phase: fires before any child handler can stop propagation.
    window.addEventListener('pointermove', onPointerMove, { capture: true, passive: true })
    window.addEventListener('pointerout', onPointerOut, { capture: true, passive: true })
    window.addEventListener('scroll', onScroll, { capture: true, passive: true })
    window.addEventListener('blur', deactivate)

    return () => {
      observer.disconnect()
      themeObserver?.disconnect()
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onPointerMove, { capture: true })
      window.removeEventListener('pointerout', onPointerOut, { capture: true })
      window.removeEventListener('scroll', onScroll, { capture: true })
      window.removeEventListener('blur', deactivate)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      // h-full/w-full are load-bearing: a canvas is a replaced element, so
      // `inset-0` alone leaves it at its intrinsic bitmap size — 2x the parent
      // on retina displays.
      className={`pointer-events-none absolute inset-0 z-0 h-full w-full ${className}`}
    />
  )
}
