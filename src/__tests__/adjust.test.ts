// floodText/src/__tests__/adjust.test.ts — core algorithm tests
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { applyFloodText, removeFloodText, getCleanHTML, startFloodText, computeWave } from '../core/adjust'
import { FLOOD_TEXT_CLASSES } from '../core/types'

// ─── DOM measurement mock ─────────────────────────────────────────────────────
const CONTAINER_WIDTH = 600
const WORD_WIDTH = 80

/**
 * Mock getBoundingClientRect so line-detection works without a real layout engine.
 * Word spans (ft-word) are assigned top=0 for the first 7 words and top=20 afterward,
 * simulating two wrapped lines.
 */
function mockMeasurement() {
	let wordCallCount = 0

	Element.prototype.getBoundingClientRect = function (this: Element) {
		const el = this as HTMLElement
		if (el.classList?.contains(FLOOD_TEXT_CLASSES.probe)) {
			return { width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => {} } as DOMRect
		}
		if (el.classList?.contains(FLOOD_TEXT_CLASSES.word)) {
			const idx = wordCallCount++
			const top = idx < 7 ? 0 : 20
			return {
				width: WORD_WIDTH,
				height: 20,
				top,
				left: (idx % 7) * WORD_WIDTH,
				right: (idx % 7 + 1) * WORD_WIDTH,
				bottom: top + 20,
				x: 0,
				y: top,
				toJSON: () => {},
			} as DOMRect
		}
		return {
			width: CONTAINER_WIDTH,
			height: 200,
			top: 0,
			left: 0,
			right: CONTAINER_WIDTH,
			bottom: 200,
			x: 0,
			y: 0,
			toJSON: () => {},
		} as DOMRect
	}
}

/** Create a paragraph element with the given inner HTML and attach to document.body */
function makeElement(html: string): HTMLElement {
	const el = document.createElement('p')
	el.innerHTML = html
	el.style.width = `${CONTAINER_WIDTH}px`
	document.body.appendChild(el)
	return el
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('flood-text', () => {
	beforeEach(() => {
		document.body.innerHTML = ''
		mockMeasurement()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	// 1. applyFloodText produces .ft-line spans
	it('applyFloodText produces ft-line spans', () => {
		const el = makeElement('one two three four five six seven eight nine ten')
		const original = getCleanHTML(el)
		applyFloodText(el, original, {})
		const lineSpans = el.querySelectorAll(`.${FLOOD_TEXT_CLASSES.line}`)
		expect(lineSpans.length).toBeGreaterThan(0)
	})

	// 2. removeFloodText restores original HTML
	it('removeFloodText restores original HTML', () => {
		const el = makeElement('<em>Hello</em> world')
		const original = getCleanHTML(el)
		applyFloodText(el, original, {})
		removeFloodText(el, original)
		expect(el.innerHTML).toBe(original)
	})

	// 3. getCleanHTML is idempotent
	it('getCleanHTML is idempotent', () => {
		const el = makeElement('<em>Hello</em> world')
		const html = getCleanHTML(el)
		const html2 = getCleanHTML(el)
		expect(html).toBe(html2)
	})

	// 4. Inline elements preserved after applyFloodText
	it('preserves inline elements', () => {
		const el = makeElement('<em>italic</em> and <strong>bold</strong>')
		const original = getCleanHTML(el)
		applyFloodText(el, original, {})
		expect(el.querySelector('em')).toBeTruthy()
		expect(el.querySelector('strong')).toBeTruthy()
	})

	// 5. startFloodText returns a function
	it('startFloodText returns a stop function', () => {
		const el = makeElement('alpha beta gamma delta epsilon zeta eta theta iota kappa')
		const original = getCleanHTML(el)
		const lineSpans = applyFloodText(el, original, {})
		const stop = startFloodText(lineSpans, {})
		expect(typeof stop).toBe('function')
		stop()
	})

	// 6. sawtooth wave values stay within [baseValue - amplitude, baseValue + amplitude]
	it('sawtooth wave values stay within [baseValue - amplitude, baseValue + amplitude]', () => {
		const baseValue = 100
		const amplitude = 10
		const el = makeElement('one two three four five six seven eight nine ten')
		const original = getCleanHTML(el)
		const lineSpans = applyFloodText(el, original, {})

		const n = lineSpans.length
		for (let i = 0; i < n; i++) {
			const pos = n > 1 ? i / (n - 1) : 0
			const wave = computeWave(pos, 'sawtooth')
			const axisValue = baseValue + amplitude * wave
			expect(axisValue).toBeGreaterThanOrEqual(baseValue - amplitude - 0.001)
			expect(axisValue).toBeLessThanOrEqual(baseValue + amplitude + 0.001)
		}
	})

	// 7. amplitude: 0 → all lines get baseValue
	it('with amplitude 0 all lines get baseValue', () => {
		const el = makeElement('word one two three four five six seven eight nine ten')
		const original = getCleanHTML(el)
		const lineSpans = applyFloodText(el, original, {})
		const stop = startFloodText(lineSpans, { amplitude: 0, baseValue: 100 })

		const n = lineSpans.length
		for (let i = 0; i < n; i++) {
			const pos = n > 1 ? i / (n - 1) : 0
			const wave = computeWave(pos, 'sine')
			const axisValue = 100 + 0 * wave
			expect(axisValue).toBe(100)
		}
		stop()
	})

	// 8. Empty element doesn't throw
	it('applyFloodText does not throw on empty element', () => {
		const el = makeElement('')
		const original = getCleanHTML(el)
		expect(() => applyFloodText(el, original, {})).not.toThrow()
	})

	// 9. Wave utility functions return values in [-1, 1]
	describe('computeWave returns values in [-1, 1]', () => {
		const phases = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1.0, -0.3, 1.7, 2.5, -1.5]

		it('sine wave is always in [-1, 1]', () => {
			for (const p of phases) {
				const v = computeWave(p, 'sine')
				expect(v).toBeGreaterThanOrEqual(-1 - 1e-9)
				expect(v).toBeLessThanOrEqual(1 + 1e-9)
			}
		})

		it('sawtooth wave is always in [-1, 1]', () => {
			for (const p of phases) {
				const v = computeWave(p, 'sawtooth')
				expect(v).toBeGreaterThanOrEqual(-1 - 1e-9)
				expect(v).toBeLessThanOrEqual(1 + 1e-9)
			}
		})

		it('triangle wave is always in [-1, 1]', () => {
			for (const p of phases) {
				const v = computeWave(p, 'triangle')
				expect(v).toBeGreaterThanOrEqual(-1 - 1e-9)
				expect(v).toBeLessThanOrEqual(1 + 1e-9)
			}
		})
	})
})
