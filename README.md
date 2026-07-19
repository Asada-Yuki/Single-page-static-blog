# yuki.art — 凪 — Slumber in Blue

Single-page personal brand site for **Asada Yuki (朝田由纪)**.

> *Currently, I am a slime, cold and soft, sleeping peacefully. I hope to receive love.*

The site opens like a sleeping slime at the bottom of a deep sea — cold, dark,
quiet, but breathing. A faint warm glow answers only when you reach out.

---

## Tech stack

- **Vite** — zero-config dev server & build.
- **Vanilla CSS** — CSS Custom Properties for the full colour palette, type
  scale, spacing, radii and motion tokens. No CSS framework, no Tailwind.
- **Vanilla ES6+ JavaScript** — no jQuery, no UI framework. Three tiny modules:
  `main.js`, `typewriter.js`, `reveal.js`.
- **Google Fonts** — Fraunces + Noto Serif SC (display), Inter + Noto Sans SC
  (body), JetBrains Mono (typewriter / tags).

## Project structure

```
yuki-art/
├── index.html
├── package.json
├── vite.config.js
├── README.md
└── src/
    ├── styles/
    │   ├── variables.css      # colour palette, type scale, tokens
    │   ├── base.css           # reset + base typography
    │   ├── animations.css     # five signature keyframes
    │   ├── components.css     # avatar / buttons / bars / tags / glass …
    │   └── main.css           # @import entry + page layout
    ├── scripts/
    │   ├── main.js            # boot
    │   ├── typewriter.js      # typewriter + afterglow
    │   └── reveal.js          # dissolve reveal (IntersectionObserver)
    └── assets/
        └── images/
            ├── avatar.jpg     # 站主头像
            ├── logo.svg       # brand mark
            └── favicon.png    # favicon
```

## Run locally

```bash
cd yuki-art
npm install
npm run dev
```

Vite serves the site at `http://localhost:5173` (opens automatically).

### Build & preview

```bash
npm run build     # outputs to ./dist
npm run preview   # serves the production build locally
```

## The five signature motions

| # | Motion | Where | How |
|---|--------|-------|-----|
| 1 | **Breathing Glow** | avatar ring | `@keyframes breathing`, 4s, `opacity` + `box-shadow` |
| 2 | **Gel Drift** | hero background blobs | `@keyframes drift1/2/3`, 24–30s, `transform` + `blur(80px)` |
| 3 | **Typewriter Afterglow** | hero typewriter | per-char `<span>` + `@keyframes afterglow`, 0.6s 淡蓝尾迹 |
| 4 | **Dissolve Reveal** | scroll-in blocks | `IntersectionObserver` toggles `.revealed`; `blur(12px)→0`, 0.8s |
| 5 | **Warm Response** | all `[data-warm]` elements | `:hover` radial `#FB7185` glow (`opacity 0→0.18`), 0.4s |

## Accessibility

- Every image has `alt`; interactive elements have `aria-label`.
- `prefers-reduced-motion: reduce` disables all animation and reveals content
  immediately.
- Colour contrast on body text meets WCAG AA (moonlight `#E2E8F0` on abyss
  `#0B1426` ≈ 13:1).
- Touch targets ≥ 44px.
- Right-click / text selection / copy are **not** disabled — the old site's
  anti-UX is intentionally dropped.

## Assets

- `avatar.jpg` — provided by the site owner.
- `logo.svg` — brand mark, shown subtly in the footer.
- `favicon.png` — browser tab icon.

All background effects (gel blobs, grain, gradients, glows) are pure CSS / SVG —
no image assets required, no WebGL/Canvas.

## Design fidelity notes

- Colour values, type scale, radii and motion durations are taken verbatim from
  the visual spec *"yuki.art 情绪化视觉方案 — 凪 — Slumber in Blue"*.
- One deliberate, documented deviation: the global film-grain overlay opacity is
  `0.04` instead of the spec's `0.015`. At `0.015` with `mix-blend-mode: overlay`
  on a near-black background the grain is effectively invisible; `0.04` keeps it
  "极淡" while remaining perceptible as the intended tactile film texture.

---

© 2026 Asada Yuki · Slime's Home
