// floodText/src/core/types.ts — types and class constants

/** Style effect driven by the per-character wave */
export type FloodEffect = 'wght' | 'wdth' | 'oblique' | 'opacity'

/** Options controlling the flood-text character wave animation */
export interface FloodTextOptions {
	/** Visual effect to animate per character (default: 'wght') */
	effect?: FloodEffect
	/** Peak deviation from the neutral value, in style-specific units (default: auto per style) */
	amplitude?: number
	/** Seconds per full wave cycle (default: 4) */
	period?: number
	/** Number of wave cycles visible across the full paragraph at once (default: 1) */
	density?: number
	/** Wave travel direction through the text (default: 'right') */
	direction?: 'left' | 'right'
	/** Shape of the wave (default: 'sine') */
	waveShape?: 'sine' | 'sawtooth' | 'triangle'
}

/** CSS class names injected by flood-text — use these to target generated markup */
export const FLOOD_TEXT_CLASSES = {
	char: 'ft-char',
	probe: 'ft-probe',
} as const
