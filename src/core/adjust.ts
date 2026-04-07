// axis-tide/src/core/adjust.ts — framework-agnostic DOM algorithm and animation engine
import { AXIS_TIDE_CLASSES, type AxisTideOptions } from './types'

/** Resolved defaults applied when options are omitted */
const DEFAULTS = {
	axis: 'wdth',
	baseValue: 100,
	amplitude: 5,
	period: 4,
	direction: 'down' as const,
	waveShape: 'sine' as const,
}

/** Inline style applied to every line span so the browser treats each line as one unit */
const LINE_STYLE = 'display:inline-block;white-space:nowrap;vertical-align:top;'

/**
 * Strip any prior axis-tide markup from an element and return clean innerHTML.
 * Unwraps .at-word and .at-line spans in place, leaving inner content intact.
 * Safe to call multiple times — idempotent.
 *
 * @param el - Element that may contain axis-tide markup
 */
export function getCleanHTML(el: HTMLElement): string {
	const clone = el.cloneNode(true) as HTMLElement
	const spans = clone.querySelectorAll(
		`.${AXIS_TIDE_CLASSES.word}, .${AXIS_TIDE_CLASSES.line}`,
	)
	// Walk in reverse document order so inner spans are unwrapped before outer ones
	Array.from(spans)
		.reverse()
		.forEach((node) => {
			const parent = node.parentNode
			if (!parent) return
			while (node.firstChild) parent.insertBefore(node.firstChild, node)
			parent.removeChild(node)
		})
	// Remove <br> tags injected between lines
	clone.querySelectorAll('br.at-br').forEach((br) => br.parentNode?.removeChild(br))
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
 * Apply axis-tide line detection to an element, wrapping words and lines in spans.
 * Returns the array of line span elements so the caller can start animation.
 *
 * Algorithm:
 *   Pass 1 — Reset element to originalHTML
 *   Pass 2 — Walk text nodes, wrap each word in <span class="at-word">
 *   Pass 3 — Read BCR.top for each word span, group into lines by top coordinate
 *   Pass 4 — Rebuild innerHTML with <span class="at-line"> per line, <br> between lines
 *
 * @param element      - Live DOM element (must be rendered and visible)
 * @param originalHTML - HTML snapshot taken before the first call
 * @param options      - AxisTideOptions (merged with defaults)
 */
export function applyAxisTide(
	element: HTMLElement,
	originalHTML: string,
	options: AxisTideOptions = {},
): HTMLElement[] {
	if (typeof window === 'undefined') return []

	// --- Pass 1: Reset ---
	element.innerHTML = originalHTML

	// Early exit for empty elements
	if (!element.textContent?.trim() && !element.innerHTML.trim()) return []

	// --- Pass 2: Word wrap ---
	// Collect text nodes before mutating to avoid live-NodeList issues.
	const textNodes: Text[] = []
	collectTextNodes(element, textNodes)

	const wordSpans: HTMLElement[] = []

	for (const textNode of textNodes) {
		const text = textNode.textContent ?? ''
		if (!text) continue

		// Split into alternating [whitespace, word, whitespace, word, …] tokens.
		// Odd-indexed entries are words; even-indexed are the gaps before them.
		const tokens = text.split(/(\S+)/)
		const fragment = document.createDocumentFragment()

		for (let i = 0; i < tokens.length; i += 2) {
			const space = tokens[i]      // whitespace gap before this word
			const word  = tokens[i + 1] // word (undefined at end of string)
			if (!word) continue

			// Include trailing whitespace in the last word span to avoid orphan text
			// nodes at inline-element boundaries being silently dropped.
			const isLastWord = tokens[i + 3] === undefined
			const trailingSpace = isLastWord ? (tokens[i + 2] ?? '') : ''

			const span = document.createElement('span')
			span.className = AXIS_TIDE_CLASSES.word
			span.appendChild(document.createTextNode(space + word + trailingSpace))
			fragment.appendChild(span)
			wordSpans.push(span)
		}

		textNode.parentNode!.replaceChild(fragment, textNode)
	}

	if (wordSpans.length === 0) return []

	// --- Pass 3: Read BCR.top for each word span, group into lines ---
	// Batch all reads before any writes to avoid layout thrashing.
	const wordTops = wordSpans.map((span) => span.getBoundingClientRect().top)

	// Group word spans into lines by matching top coordinate (within 1px tolerance).
	const lines: HTMLElement[][] = []
	let currentLineTop = wordTops[0]
	let currentLine: HTMLElement[] = []

	for (let i = 0; i < wordSpans.length; i++) {
		const top = wordTops[i]
		if (Math.abs(top - currentLineTop) > 1 && currentLine.length > 0) {
			lines.push(currentLine)
			currentLine = []
			currentLineTop = top
		}
		currentLine.push(wordSpans[i])
	}
	if (currentLine.length > 0) lines.push(currentLine)

	if (lines.length === 0) return []

	// --- Pass 4: Wrap each line in <span class="at-line">, add <br> between lines ---
	// Build the new HTML string from the current live DOM (word spans are already in place).
	// We collect outerHTML from each word span and reassemble rather than mutating in-place
	// to keep the logic simple and avoid issues with inline-element nesting.
	let html = ''
	for (let li = 0; li < lines.length; li++) {
		const lineWords = lines[li]
		html += `<span class="${AXIS_TIDE_CLASSES.line}" style="${LINE_STYLE}">`
		for (const wordSpan of lineWords) {
			// Wrap the word span in its ancestor inline elements up to the container,
			// preserving em/strong/a context across line breaks.
			let wordHTML = wordSpan.outerHTML
			let ancestor: Element | null = wordSpan.parentElement
			while (ancestor && ancestor !== element) {
				const shallow = ancestor.cloneNode(false) as Element
				const shallowHTML = shallow.outerHTML
				const split = shallowHTML.lastIndexOf('</')
				wordHTML = shallowHTML.slice(0, split) + wordHTML + shallowHTML.slice(split)
				ancestor = ancestor.parentElement
			}
			html += wordHTML
		}
		html += '</span>'
		if (li < lines.length - 1) {
			html += `<br class="at-br">`
		}
	}

	element.innerHTML = html

	// Return live references to the line spans for use by startTide.
	const lineSpans = Array.from(
		element.querySelectorAll<HTMLElement>(`.${AXIS_TIDE_CLASSES.line}`),
	)
	return lineSpans
}

/**
 * Compute a wave sample in the range [-1, 1] for a given phase value.
 * Exported for direct unit testing of wave math.
 *
 * @param phase      - Continuous phase value (fractional part used)
 * @param waveShape  - 'sine' | 'sawtooth' | 'triangle'
 */
export function computeWave(
	phase: number,
	waveShape: AxisTideOptions['waveShape'] = 'sine',
): number {
	if (waveShape === 'sawtooth') {
		// Normalise phase to [0, 1) then map to [-1, 1]
		return 2 * ((phase % 1 + 1) % 1) - 1
	}
	if (waveShape === 'triangle') {
		const x = ((phase % 1) + 1) % 1
		return x < 0.5 ? 4 * x - 1 : 3 - 4 * x
	}
	// Default: sine
	return Math.sin(2 * Math.PI * phase)
}

/**
 * Start the axis-tide animation on an array of line span elements.
 * Returns a stop function — call it to cancel the animation loop.
 *
 * @param lineSpans - Array of .at-line span elements from applyAxisTide
 * @param options   - AxisTideOptions (merged with defaults)
 */
export function startTide(
	lineSpans: HTMLElement[],
	options: AxisTideOptions = {},
): () => void {
	const axis      = options.axis      ?? DEFAULTS.axis
	const baseValue = options.baseValue ?? DEFAULTS.baseValue
	const amplitude = options.amplitude ?? DEFAULTS.amplitude
	const period    = options.period    ?? DEFAULTS.period
	const direction = options.direction ?? DEFAULTS.direction
	const waveShape = options.waveShape ?? DEFAULTS.waveShape

	const startTime    = performance.now()
	const n            = lineSpans.length
	const travelSpeed  = 1 / period // cycles per second

	let rafId = 0

	function tick() {
		const t = (performance.now() - startTime) / 1000

		lineSpans.forEach((span, i) => {
			// Each line's position within the paragraph, normalised to [0, 1]
			const pos = n > 1 ? i / (n - 1) : 0

			// Phase: direction 'up' → wave travels bottom-to-top (pos - t*speed)
			//        direction 'down' → wave travels top-to-bottom (pos + t*speed)
			const phase = direction === 'up'
				? pos - t * travelSpeed
				: pos + t * travelSpeed

			const wave = computeWave(phase, waveShape)
			const axisValue = baseValue + amplitude * wave
			span.style.fontVariationSettings = `'${axis}' ${axisValue.toFixed(2)}`
		})

		rafId = requestAnimationFrame(tick)
	}

	rafId = requestAnimationFrame(tick)

	// Return stop function
	return () => cancelAnimationFrame(rafId)
}

/**
 * Remove axis-tide markup and restore the element to its original HTML.
 *
 * @param element      - Element previously processed by applyAxisTide
 * @param originalHTML - The clean HTML snapshot passed to applyAxisTide
 */
export function removeAxisTide(element: HTMLElement, originalHTML: string): void {
	element.innerHTML = originalHTML
}
