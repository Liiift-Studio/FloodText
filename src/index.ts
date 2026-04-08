// floodText/src/index.ts — public API exports
export { applyFloodText, startFloodText, removeFloodText, getCleanHTML, computeWave } from './core/adjust'
export { useFloodText } from './react/useFloodText'
export { FloodText } from './react/FloodText'
export type { FloodTextOptions, FloodEffect } from './core/types'
export { FLOOD_TEXT_CLASSES } from './core/types'
