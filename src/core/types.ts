// floodText/src/core/types.ts — types and class constants

/** Style effect driven by the per-character wave */
export type FloodEffect = 'wght' | 'wdth' | 'oblique' | 'opacity' | 'rotation' | 'blur'

/** Options controlling the flood-text character wave animation */
export interface FloodTextOptions {
	/**
	 * Visual effect(s) to animate per character. Pass an array to layer multiple effects simultaneously.
	 * (default: 'wght')
	 */
	effect?: FloodEffect | FloodEffect[]
	/**
	 * Peak deviation from the neutral value, in style-specific units.
	 * Only used when a single effect is active — for multiple effects use `amplitudes`.
	 * (default: auto per effect)
	 */
	amplitude?: number
	/**
	 * Per-effect amplitude overrides when layering multiple effects.
	 * Defaults: wght 200, wdth 20, oblique 15deg, opacity 0.3, rotation 15deg, blur 2px.
	 */
	amplitudes?: Partial<Record<FloodEffect, number>>
	/** Seconds per full wave cycle (default: 4) */
	period?: number
	/** Number of wave cycles visible across the full paragraph at once (default: 2) */
	density?: number
	/** Wave travel direction through the text (default: 'diagonal-down') */
	direction?: 'right' | 'left' | 'diagonal-down' | 'diagonal-up'
	/** Shape of the wave (default: 'sine') */
	waveShape?: 'sine' | 'sawtooth' | 'triangle'
}

/** CSS class names injected by flood-text — use these to target generated markup */
export const FLOOD_TEXT_CLASSES = {
	char: 'ft-char',
	probe: 'ft-probe',
} as const
