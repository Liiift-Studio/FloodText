# Flood Text

A wave washes through the paragraph character by character — weight surges as it crests, oblique angles tilt, opacity breathes. Every letterform sits at its own position in the curve.

**[floodtext.com](https://floodtext.com)** · [npm](https://www.npmjs.com/package/@liiift-studio/floodtext) · [GitHub](https://github.com/Liiift-Studio/FloodText)

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

<FloodText effect="wght" amplitude={200} period={4} density={2}>
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

function Paragraph({ children }) {
  const ref = useFloodText({ effect: 'wdth', amplitude: 20, period: 4 })
  return <p ref={ref}>{children}</p>
}
```

### Vanilla JS

```ts
import { startFloodText, removeFloodText, getCleanHTML } from '@liiift-studio/floodtext'

const el = document.querySelector('p')
const originalHTML = getCleanHTML(el)

// Returns a cleanup function — call it to stop the animation
const stop = startFloodText(el, originalHTML, { effect: 'wght', amplitude: 200 })
```

---

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `effect` | `FloodEffect \| FloodEffect[]` | `'wght'` | Built-in effect(s) to animate — `'wght'`, `'wdth'`, `'oblique'`, `'opacity'`, `'rotation'`, `'blur'`, `'size'` |
| `amplitude` | `number` | auto per effect | Peak deviation from neutral. Used when a single effect is active |
| `amplitudes` | `Partial<Record<FloodEffect, number>>` | — | Per-effect overrides when layering multiple effects |
| `properties` | `FloodProperty[]` | — | Custom CSS properties to animate per character alongside built-in effects |
| `period` | `number` | `4` | Seconds per full wave cycle |
| `density` | `number` | `2` | Number of wave cycles visible across the full paragraph |
| `direction` | `'right' \| 'left' \| 'diagonal-down' \| 'diagonal-up'` | `'diagonal-down'` | Wave travel direction |
| `waveShape` | `'sine' \| 'sawtooth' \| 'triangle'` | `'sine'` | Wave shape |

### Custom properties

Animate any CSS property or CSS variable per character using `FloodProperty`:

```tsx
<FloodText
  properties={[
    { property: 'letter-spacing', base: 0, amplitude: 0.05, unit: 'em' },
    { property: '--my-axis', base: 100, amplitude: 20, unit: '' },
  ]}
>
  Your text here...
</FloodText>
```

---

## Dev notes

### `next` in root devDependencies

`package.json` at the repo root lists `next` as a devDependency. This is a **Vercel detection workaround** — not a real dependency of the npm package. Vercel's build system inspects the root `package.json` to detect the framework; without `next` present it falls back to a static build and skips the Next.js pipeline, breaking the `/site` subdirectory deploy.

The package itself has zero runtime dependencies. Do not remove this entry.

---

Current version: v1.0.0
