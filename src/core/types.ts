// axis-tide/src/core/types.ts — types and class constants
export interface AxisTideOptions {
	// axis ('wdth' | 'wght' | string)
	// amplitude (axis units, e.g. 5 for wdth)
	// period (seconds per full cycle, default 4)
	// direction ('up' | 'down')
	// waveShape ('sine' | 'sawtooth' | 'triangle')
}

/** CSS class names injected by axis-tide — use these to target generated markup */
export const AXIS_TIDE_CLASSES = {
	word: 'axis-tide-word',
	line: 'axis-tide-line',
	probe: 'axis-tide-probe',
} as const
