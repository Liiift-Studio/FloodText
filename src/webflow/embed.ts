// floodText/src/webflow/embed.ts — zero-config browser bundle for Webflow Custom Code Embed.
// Auto-initialises floodText on any element marked with [data-floodtext], reading options
// from data-* attributes, and exposes a small window.FloodText API for manual control.
import { applyFloodText, startFloodText, removeFloodText } from '../core/adjust'
import type { FloodTextOptions, FloodEffect, WaveShape } from '../core/types'

/** Attribute that opts an element in to the flood-text wave. */
const OPT_IN_ATTR = 'data-floodtext'

/** Per-element teardown record so destroy() can stop the loop and restore markup. */
interface Instance {
	/** Stop function returned by startFloodText */
	stop: () => void
	/** Clean HTML snapshot taken before wrapping, for restoration */
	originalHTML: string
}

/** Tracks live instances keyed by their element — WeakMap so removed nodes are GC'd. */
const INSTANCES = new WeakMap<HTMLElement, Instance>()

/** Valid built-in effect names — used to filter the data-ft-effect list. */
const VALID_EFFECTS: readonly FloodEffect[] = ['wght', 'wdth', 'oblique', 'opacity', 'rotation', 'blur', 'size']

/** Valid wave shapes for data-ft-wave. */
const VALID_WAVES: readonly WaveShape[] = ['sine', 'sawtooth', 'triangle']

/** Valid travel directions for data-ft-direction. */
const VALID_DIRECTIONS: readonly string[] = ['right', 'left', 'diagonal-down', 'diagonal-up']

/**
 * Read floodText options from an element's data-* attributes.
 * Unset attributes fall through to the library defaults.
 *
 * Supported attributes:
 *   data-ft-effect          — comma-separated effect list (e.g. "wght" or "wght,opacity")
 *   data-ft-amplitude       — peak deviation (single-effect only)
 *   data-ft-period          — seconds per wave cycle
 *   data-ft-density         — visible wave cycles across the paragraph
 *   data-ft-direction       — right | left | diagonal-down | diagonal-up
 *   data-ft-wave            — sine | sawtooth | triangle
 *   data-ft-pause-offscreen — "false" to keep animating off-screen
 *
 * @param el - The opted-in element
 */
function readOptions(el: HTMLElement): FloodTextOptions {
	const opts: FloodTextOptions = {}
	const d = el.dataset

	if (d.ftEffect) {
		const effects = d.ftEffect
			.split(',')
			.map((s) => s.trim())
			.filter((s): s is FloodEffect => (VALID_EFFECTS as readonly string[]).includes(s))
		if (effects.length === 1) opts.effect = effects[0]
		else if (effects.length > 1) opts.effect = effects
	}
	if (d.ftAmplitude !== undefined) {
		const n = parseFloat(d.ftAmplitude)
		if (!isNaN(n)) opts.amplitude = n
	}
	if (d.ftPeriod !== undefined) {
		const n = parseFloat(d.ftPeriod)
		if (!isNaN(n)) opts.period = n
	}
	if (d.ftDensity !== undefined) {
		const n = parseFloat(d.ftDensity)
		if (!isNaN(n)) opts.density = n
	}
	if (d.ftDirection && VALID_DIRECTIONS.includes(d.ftDirection)) {
		opts.direction = d.ftDirection as FloodTextOptions['direction']
	}
	if (d.ftWave && (VALID_WAVES as readonly string[]).includes(d.ftWave)) {
		opts.waveShape = d.ftWave as WaveShape
	}
	if (d.ftPauseOffscreen === 'false') {
		opts.pauseOffscreen = false
	}

	return opts
}

/**
 * Initialise a single element: snapshot its markup, wrap characters, start the wave.
 * Idempotent — re-initialising an element tears down the previous instance first.
 *
 * @param el - Element to animate
 */
function initElement(el: HTMLElement): void {
	// Tear down any previous run so re-init doesn't double-wrap.
	destroy(el)

	const originalHTML = el.innerHTML
	const options = readOptions(el)
	const spans = applyFloodText(el, originalHTML, options)
	// Empty result means reduced-motion / e-ink / no text — nothing to animate.
	if (spans.length === 0) return
	const stop = startFloodText(spans, options)
	INSTANCES.set(el, { stop, originalHTML })
}

/**
 * Stop and restore a single element if it has a live instance.
 *
 * @param el - Element previously initialised
 */
function destroy(el: HTMLElement): void {
	const inst = INSTANCES.get(el)
	if (!inst) return
	inst.stop()
	removeFloodText(el, inst.originalHTML)
	INSTANCES.delete(el)
}

/**
 * Scan a root for opted-in elements and initialise each one.
 *
 * @param root - Element or document to search (default: document)
 */
function init(root: ParentNode = document): void {
	root.querySelectorAll<HTMLElement>(`[${OPT_IN_ATTR}]`).forEach(initElement)
}

/**
 * Auto-initialise once the DOM is parsed and web fonts have loaded.
 * Fonts must settle first: variable-axis effects and per-character positions
 * both depend on final glyph metrics, which shift when a web font swaps in.
 */
function autoInit(): void {
	const run = () => {
		if (document.fonts?.ready) {
			document.fonts.ready.then(() => init()).catch(() => init())
		} else {
			init()
		}
	}
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', run, { once: true })
	} else {
		run()
	}
}

autoInit()

// Public browser API — assigned to window.FloodText via the IIFE global name.
export { init, destroy }
