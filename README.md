# Flood Text

A wave washes through the paragraph character by character — modulating weight, width, oblique angle, or opacity as it passes. Not line by line, not word by word: every letterform sits at its own moment in the curve. At low amplitude it reads as texture; at high amplitude, as transformation.

**[floodtext.com](https://floodtext.com)** · [npm](https://www.npmjs.com/package/@liiift-studio/floodtext) · [GitHub](https://github.com/Liiift-Studio/FloodText)

TypeScript · Zero dependencies · React + Vanilla JS

---

## Install

```bash
npm install @liiift-studio/floodtext
```

---

## Usage

### React component

```tsx
import { FloodText } from '@liiift-studio/floodtext'

<FloodText effect="wght" amplitude={200} period={4} density={2} direction="diagonal-down">
  Your paragraph text here...
</FloodText>
```

Layer multiple effects simultaneously:

```tsx
<FloodText effect={['wght', 'oblique']} period={4} density={2}>
  Your paragraph text here...
</FloodText>
```

### React hook

```tsx
import { useFloodText } from '@liiift-studio/floodtext'

const ref = useFloodText({ effect: 'wght', amplitude: 200, period: 4, density: 2 })
<p ref={ref}>{children}</p>
```

### Vanilla JS

`applyFloodText` wraps characters and returns them. `startFloodText` drives the animation loop and returns a stop function.

```ts
import { applyFloodText, startFloodText, removeFloodText, getCleanHTML } from '@liiift-studio/floodtext'

const el = document.querySelector('p')
const original = getCleanHTML(el)
const opts = { effect: 'wght', amplitude: 200, period: 4, density: 2 }

const chars = applyFloodText(el, original, opts)
const stop = startFloodText(chars, opts)

// Later — stop the animation loop and restore the DOM:
stop()
removeFloodText(el, original)
```

---

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `effect` | `'wght'` | `'wght'` \| `'wdth'` \| `'oblique'` \| `'opacity'` \| `'rotation'` \| `'blur'` \| `'size'`. Pass an array to layer multiple effects simultaneously. Note: `oblique` requires Chrome 87+, Firefox 88+, Safari 14.1+. `size` causes layout recalculation per frame — use low amplitude |
| `amplitude` | auto | Peak deviation from neutral. Used in single-effect mode. Defaults: `wght` 200, `wdth` 20, `oblique` 15°, `opacity` 0.3, `rotation` 15°, `blur` 2px, `size` 0.15em |
| `amplitudes` | — | Per-effect overrides when layering multiple effects, e.g. `{ wght: 300, blur: 3 }` |
| `properties` | — | Custom CSS properties or variables to animate per character. Each entry: `{ property, base, amplitude, unit?, clamp? }`. E.g. `[{ property: 'letter-spacing', base: 0, amplitude: 0.05, unit: 'em' }]` or `[{ property: '--my-axis', base: 100, amplitude: 20 }]` |
| `period` | `4` | Seconds per full wave cycle |
| `density` | `2` | Wave cycles visible across the paragraph at once. Higher = more bands |
| `direction` | `'diagonal-down'` | `'diagonal-down'` ↘ \| `'diagonal-up'` ↗ \| `'right'` → \| `'left'` ←. Diagonal directions use 2D character positions |
| `waveShape` | `'sine'` | `'sine'` \| `'sawtooth'` \| `'triangle'` |
| `as` | `'p'` | HTML element to render, e.g. `'h1'`, `'span'`. *(React component only)* |

---

## How it works

Every visible character is wrapped in an inline `<span>`. Whitespace is left as bare text nodes — no layout impact, no reflow. Each frame, the wave function is evaluated at that character's normalised position in the paragraph. The `density` option controls how many wave cycles are visible at once; `direction` controls whether position is measured along a horizontal, vertical, or diagonal axis. Speed is consistent regardless of display refresh rate. The animation loop cleans up on unmount.

---

## Dev notes

### `next` in root devDependencies

`package.json` at the repo root lists `next` as a devDependency. This is a **Vercel detection workaround** — not a real dependency of the npm package. Vercel's build system inspects the root `package.json` to detect the framework; without `next` present it falls back to a static build and skips the Next.js pipeline, breaking the `/site` subdirectory deploy.

The package itself has zero runtime dependencies. Do not remove this entry.

---

## Future improvements

- **Pause/resume API** — explicit `pause()` and `resume()` methods rather than stop-and-restart, so animation phase is preserved across pauses
- **Intersection Observer** — automatic pause when the element scrolls out of view; resume on re-entry
- **Per-character easing** — apply a custom easing curve to individual character offsets, not just the raw wave value
- **More built-in effects** — `hue` (color hue rotation), `shadow` (text-shadow offset), `skew` (CSS skewX)
- **SSR-compatible static snapshot** — render a stable mid-wave frame on the server so there is no FOUC before hydration

---

Current version: v1.0.0
