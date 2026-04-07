---
name: project-brief
description: Core identity, scope, and constraints for axis-tide
type: project
---

# axis-tide — Project Brief

## Identity
- **Package name**: `axis-tide`
- **Version**: 0.0.1 (pre-release)
- **Author**: Quinn Keaveney / Liiift Studio

## What It Is
A wdth or wght value drifts across lines in a slow sine wave. Lines near the crest are slightly wider/heavier, near the trough slightly narrower/lighter. The wave moves up or down the paragraph over 3–8 seconds. Total gray value stays constant (deltas cancel across the paragraph). The texture lives — axis-rhythm made temporal.

## What It Is Not
- Not a general animation library
- Not a CSS preprocessor
- Not a font loading utility

## API Surface (target)
Options: axis, amplitude, period, direction, waveShape

## Constraints
- Framework-agnostic core (vanilla JS)
- Optional React bindings (peer deps)
- SSR safe (guard typeof window)
- Zero required dependencies (opentype.js optional)
- TypeScript strict mode

## Status
Bootstrap complete. Algorithm not yet implemented.
See PROCESS.md for the build guide.
