---
name: verify
description: Build, run, and drive the xendr www app (Vite + React) to verify changes at the browser surface.
---

# Verifying apps/www changes

## Launch

```bash
cd apps/www && npm run dev   # Vite on http://localhost:5173, ready in <1s
```

Run it in the background and read the output file for the port.

## Routes

- `/` — marketing Home page (uses `ApiPlaygroundShowcase embedded` inside `.pg-embed`)
- `/playground` — full-viewport Landing playground (`.pg-shell`: dot-grid canvas + inspector rail)
- `/embed` — bare embed variant
- `/preview`, `/preview/component`, `/preview/widget` — component library previews

## Drive with Playwright

No Playwright in the repo. Install in the scratchpad (`npm i playwright`), and if launch fails on a missing browser, `npx playwright install chromium-headless-shell` (~95MB).

Useful checks:

- Home hero dot backdrop is `canvas.lp-hero-grid` (Home/DotGridCanvas.tsx); compare `canvas.toDataURL()` before/during/after hover to assert dispersal and spring-back. Pointer events are listened on the canvas's parent wrapper, so hovering the hero text also disperses dots.
- Playground `.pg-canvas` dot grid is plain CSS (`radial-gradient` in Landing.css).
- Desktop playground: workspace grid is `1fr 380px` (inspector rail). Mobile (≤1024px): panes stack, `.pg-workspace` scrolls, `.pg-canvas` gets `min-height: 55svh`.

## Gotchas

Headless Playwright defaults to `deviceScaleFactor: 1`, which hides retina-only bugs (e.g. a `<canvas>` is a replaced element, so `inset-0` without `w-full h-full` leaves it at its intrinsic bitmap size — only visible at dpr≥2). Run visual checks with `deviceScaleFactor: 2` too.


First-ever page load triggers Vite dep optimization and a **full page reload mid-session** — screenshots/state captured before that reload are garbage. Either hit the page once to warm it before measuring, or wait ~2s after first navigation.
