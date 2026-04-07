# axis-tide

> Slow ambient wave animation of variable font axes across paragraph lines — the paragraph breathes in weight and width

## Concept

A wdth or wght value drifts across lines in a slow sine wave. Lines near the crest are slightly wider/heavier, near the trough slightly narrower/lighter. The wave moves up or down the paragraph over 3–8 seconds. Total gray value stays constant (deltas cancel across the paragraph). The texture lives — axis-rhythm made temporal.

## Install

```bash
npm install axis-tide
```

## Usage

### React

```tsx
import { AxisTideText } from 'axis-tide'

<AxisTideText>
  Your paragraph text here.
</AxisTideText>
```

### Vanilla JS

```ts
import { applyAxisTide, getCleanHTML } from 'axis-tide'

const el = document.querySelector('p')
const original = getCleanHTML(el)
applyAxisTide(el, original, { /* options */ })
```

## Options

| Option | Description |
|--------|-------------|
| `axis` | 'wdth' | 'wght' | string |
| `amplitude` | axis units, e.g. 5 for wdth |
| `period` | seconds per full cycle, default 4 |
| `direction` | 'up' | 'down' |
| `waveShape` | 'sine' | 'sawtooth' | 'triangle' |

## Development

```bash
npm install
npm test
npm run build
```

---

Part of the [Liiift Studio](https://liiift.studio) typography tools family.
See also: [Ragtooth](https://ragtooth.liiift.studio)
