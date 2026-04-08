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
 * Compute a normalised [0, 1] position for each character span based on wave direction.
 * For left/right: position is the sequential character index.
 * For diagonal directions: position is derived from the span's 2D screen coordinates,
 * projected onto the wave's travel axis. BCRs are read once before the animation loop.
 *
 * @param charSpans - Live character span elements
 * @param direction - Wave travel direction
 */
function computeCharPositions(
	charSpans: HTMLElement[],
	direction: NonNullable<FloodTextOptions['direction']>,
): number[] {
	const n = charSpans.length
	if (n === 0) return []

	if (direction === 'right' || direction === 'left') {
		// Sequential index — no DOM reads needed
		return charSpans.map((_, i) => (n > 1 ? i / (n - 1) : 0))
	}

	// Diagonal: read BCRs once (batch reads, no writes — no layout thrash)
	const rects = charSpans.map((s) => s.getBoundingClientRect())
	const xs = rects.map((r) => r.left + r.width / 2)
	const ys = rects.map((r) => r.top + r.height / 2)

	const minX = Math.min(...xs)
	const maxX = Math.max(...xs)
	const minY = Math.min(...ys)
	const maxY = Math.max(...ys)
	const rangeX = maxX - minX || 1
	const rangeY = maxY - minY || 1

	return rects.map((_, i) => {
		const nx = (xs[i] - minX) / rangeX // 0 = leftmost, 1 = rightmost
		const ny = (ys[i] - minY) / rangeY // 0 = topmost,  1 = bottommost

		if (direction === 'diagonal-down') {
			// Top-left → bottom-right: project onto (1,1) axis
			return (nx + ny) / 2
		} else {
			// diagonal-up: bottom-left → top-right: project onto (1,-1) axis
			return (nx + (1 - ny)) / 2
		}
	})
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
	const density   = options.density   ?? 2
	const direction = options.direction ?? 'diagonal-down'
	const waveShape = options.waveShape ?? 'sine'

	const speed     = 1 / period // cycles per second
	const startTime = performance.now()
	let rafId       = 0

	// Compute per-character spatial positions once before the loop
	const positions = computeCharPositions(charSpans, direction)

	// For left/diagonal-up: wave travels in the reverse direction along the axis
	const reversed = direction === 'left' || direction === 'diagonal-up'

	function tick() {
		const t = (performance.now() - startTime) / 1000

		charSpans.forEach((span, i) => {
			const pos   = positions[i]
			// Reversed directions: wave peak moves toward lower pos over time
			const phase = reversed
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
