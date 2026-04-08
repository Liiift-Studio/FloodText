// floodText/src/core/adjust.ts — framework-agnostic DOM algorithm and per-character animation
import { FLOOD_TEXT_CLASSES, type FloodTextOptions, type FloodEffect } from './types'

/** Neutral base values and default amplitudes per effect type */
const EFFECT_DEFAULTS: Record<FloodEffect, { base: number; amplitude: number }> = {
	wght:    { base: 400, amplitude: 200 },
	wdth:    { base: 100, amplitude: 20  },
	oblique: { base: 0,   amplitude: 15  },
	opacity: { base: 0.7, amplitude: 0.3 },
}

/**
 * Strip any prior flood-text markup from an element and return clean innerHTML.
 * Unwraps .ft-char spans in place, leaving inner text content intact.
 * Safe to call multiple times — idempotent.
 *
 * @param el - Element that may contain flood-text markup
 */
export function getCleanHTML(el: HTMLElement): string {
	const clone = el.cloneNode(true) as HTMLElement
	const chars = clone.querySelectorAll(`.${FLOOD_TEXT_CLASSES.char}`)
	// Walk in reverse document order so inner spans are unwrapped before outer ones
	Array.from(chars)
		.reverse()
		.forEach((node) => {
			const parent = node.parentNode
			if (!parent) return
			while (node.firstChild) parent.insertBefore(node.firstChild, node)
			parent.removeChild(node)
		})
	return clone.innerHTML
}

/**
 * Collect all Text nodes under a root node via recursive childNodes traversal.
 * Uses childNodes rather than TreeWalker to ensure reliable descent into inline
 * elements (<em>, <strong>, etc.) across all DOM implementations including happy-dom.
 *
 * @param root      - Root node to walk
 * @param collected - Accumulator array (modified in place)
 */
function collectTextNodes(root: Node, collected: Text[]): void {
	if (root.nodeType === Node.TEXT_NODE) {
		collected.push(root as Text)
	} else {
		root.childNodes.forEach((child) => collectTextNodes(child, collected))
	}
}

/**
 * Apply flood-text character wrapping to an element.
 * Every non-whitespace character is wrapped in <span class="ft-char">.
 * Whitespace is preserved as bare text nodes — no layout impact.
 * Returns the array of character span elements so the caller can start animation.
 *
 * Algorithm:
 *   Pass 1 — Reset element to originalHTML
 *   Pass 2 — Walk text nodes, wrap each visible character in <span class="ft-char">
 *
 * @param element      - Live DOM element (must be rendered and visible)
 * @param originalHTML - HTML snapshot taken before the first call
 * @param _options     - FloodTextOptions (unused during apply — kept for API symmetry)
 */
export function applyFloodText(
	element: HTMLElement,
	originalHTML: string,
	_options: FloodTextOptions = {},
): HTMLElement[] {
	if (typeof window === 'undefined') return []

	// --- Pass 1: Reset ---
	element.innerHTML = originalHTML

	if (!element.textContent?.trim()) return []

	// --- Pass 2: Walk text nodes, wrap each character ---
	const textNodes: Text[] = []
	collectTextNodes(element, textNodes)

	const charSpans: HTMLElement[] = []

	for (const textNode of textNodes) {
		const text = textNode.textContent ?? ''
		if (!text) continue

		const fragment = document.createDocumentFragment()

		for (const char of text) {
			if (/\s/.test(char)) {
				// Preserve whitespace as a bare text node — no layout change
				fragment.appendChild(document.createTextNode(char))
			} else {
				const span = document.createElement('span')
				span.className = FLOOD_TEXT_CLASSES.char
				span.textContent = char
				fragment.appendChild(span)
				charSpans.push(span)
			}
		}

		textNode.parentNode!.replaceChild(fragment, textNode)
	}

	return charSpans
}

/**
 * Compute a wave sample in the range [-1, 1] for a given phase value.
 * Exported for direct unit testing of wave math.
 *
 * @param phase     - Continuous phase value (fractional part used)
 * @param waveShape - 'sine' | 'sawtooth' | 'triangle'
 */
export function computeWave(
	phase: number,
	waveShape: FloodTextOptions['waveShape'] = 'sine',
): number {
	if (waveShape === 'sawtooth') {
		return 2 * ((phase % 1 + 1) % 1) - 1
	}
	if (waveShape === 'triangle') {
		const x = ((phase % 1) + 1) % 1
		return x < 0.5 ? 4 * x - 1 : 3 - 4 * x
	}
	return Math.sin(2 * Math.PI * phase)
}

/**
 * Apply a computed wave value to a character span's style property.
 *
 * @param span      - The character span element to style
 * @param style     - Style property to drive
 * @param base      - Neutral value around which the wave oscillates
 * @param amplitude - Peak deviation from base
 * @param wave      - Wave sample in [-1, 1]
 */
function applyEffectValue(
	span: HTMLElement,
	effect: FloodEffect,
	base: number,
	amplitude: number,
	wave: number,
): void {
	const value = base + amplitude * wave

	if (effect === 'wght') {
		span.style.fontVariationSettings = `'wght' ${value.toFixed(1)}`
	} else if (effect === 'wdth') {
		span.style.fontVariationSettings = `'wdth' ${value.toFixed(1)}`
	} else if (effect === 'oblique') {
		span.style.fontStyle = `oblique ${value.toFixed(1)}deg`
	} else if (effect === 'opacity') {
		span.style.opacity = Math.max(0, Math.min(1, value)).toFixed(3)
	}
}

/**
 * Start the flood-text animation on an array of character span elements.
 * Returns a stop function — call it to cancel the animation loop.
 *
 * @param charSpans - Array of .ft-char span elements from applyFloodText
 * @param options   - FloodTextOptions (merged with defaults)
 */
export function startFloodText(
	charSpans: HTMLElement[],
	options: FloodTextOptions = {},
): () => void {
	if (charSpans.length === 0) return () => {}

	const effect    = options.effect    ?? 'wght'
	const defaults  = EFFECT_DEFAULTS[effect]
	const amplitude = options.amplitude ?? defaults.amplitude
	const base      = defaults.base
	const period    = options.period    ?? 4
	const density   = options.density   ?? 1
	const direction = options.direction ?? 'right'
	const waveShape = options.waveShape ?? 'sine'

	const n         = charSpans.length
	const speed     = 1 / period // cycles per second
	const startTime = performance.now()
	let rafId       = 0

	function tick() {
		const t = (performance.now() - startTime) / 1000

		charSpans.forEach((span, i) => {
			// Normalised position of this character within the full text [0, 1]
			const pos = n > 1 ? i / (n - 1) : 0

			// Phase: 'right' → wave travels left-to-right through the text
			//        'left'  → wave travels right-to-left
			const phase = direction === 'left'
				? pos * density + t * speed
				: pos * density - t * speed

			const wave = computeWave(phase, waveShape)
			applyEffectValue(span, effect, base, amplitude, wave)
		})

		rafId = requestAnimationFrame(tick)
	}

	rafId = requestAnimationFrame(tick)

	return () => cancelAnimationFrame(rafId)
}

/**
 * Remove flood-text markup and restore the element to its original HTML.
 *
 * @param element      - Element previously processed by applyFloodText
 * @param originalHTML - The clean HTML snapshot passed to applyFloodText
 */
export function removeFloodText(element: HTMLElement, originalHTML: string): void {
	element.innerHTML = originalHTML
}
