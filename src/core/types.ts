// floodText/src/core/types.ts — types and class constants

/** Options controlling the flood-text wave animation */
export interface FloodTextOptions {
	/** Variable font axis tag, e.g. 'wdth' or 'wght' (default: 'wdth') */
	axis?: string
	/** Center value for the axis — the animation oscillates around this (default: 100) */
	baseValue?: number
	/** Max deviation from baseValue in axis units (default: 5) */
	amplitude?: number
	/** Seconds per full wave cycle passing through the paragraph (default: 4) */
	period?: number
	/** Wave travel direction through the paragraph (default: 'down') */
	direction?: 'up' | 'down'
	/** Shape of the wave (default: 'sine') */
	waveShape?: 'sine' | 'sawtooth' | 'triangle'
}

/** CSS class names injected by flood-text — use these to target generated markup */
export const FLOOD_TEXT_CLASSES = {
	word: 'ft-word',
	line: 'ft-line',
	probe: 'ft-probe',
} as const
