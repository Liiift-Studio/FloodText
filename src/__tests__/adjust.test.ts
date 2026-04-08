// floodText/src/__tests__/adjust.test.ts — core algorithm tests
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { applyFloodText, removeFloodText, getCleanHTML, startFloodText, computeWave } from '../core/adjust'
import { FLOOD_TEXT_CLASSES } from '../core/types'

/** Create a paragraph element with the given inner HTML and attach to document.body */
function makeElement(html: string): HTMLElement {
	const el = document.createElement('p')
	el.innerHTML = html
	document.body.appendChild(el)
	return el
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('flood-text', () => {
	beforeEach(() => {
		document.body.innerHTML = ''
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	// 1. applyFloodText produces .ft-char spans
	it('applyFloodText wraps each character in an ft-char span', () => {
		const el = makeElement('Hello')
		const original = getCleanHTML(el)
		const charSpans = applyFloodText(el, original, {})
		expect(charSpans.length).toBe(5) // H, e, l, l, o
		charSpans.forEach(span => {
			expect(span.classList.contains(FLOOD_TEXT_CLASSES.char)).toBe(true)
			expect(span.textContent?.length).toBe(1)
		})
	})

	// 2. Spaces are preserved as text nodes, not wrapped
	it('whitespace is not wrapped in ft-char spans', () => {
		const el = makeElement('Hi there')
		const original = getCleanHTML(el)
		const charSpans = applyFloodText(el, original, {})
		// 'Hi there' = 7 visible characters (H, i, t, h, e, r, e), space is not wrapped
		expect(charSpans.length).toBe(7)
	})

	// 3. removeFloodText restores original HTML
	it('removeFloodText restores original HTML', () => {
		const el = makeElement('<em>Hello</em> world')
		const original = getCleanHTML(el)
		applyFloodText(el, original, {})
		removeFloodText(el, original)
		expect(el.innerHTML).toBe(original)
	})

	// 4. getCleanHTML is idempotent
	it('getCleanHTML is idempotent', () => {
		const el = makeElement('<em>Hello</em> world')
		const html = getCleanHTML(el)
		const html2 = getCleanHTML(el)
		expect(html).toBe(html2)
	})

	// 5. Inline elements preserved after applyFloodText
	it('preserves inline elements', () => {
		const el = makeElement('<em>italic</em> and <strong>bold</strong>')
		const original = getCleanHTML(el)
		applyFloodText(el, original, {})
		expect(el.querySelector('em')).toBeTruthy()
		expect(el.querySelector('strong')).toBeTruthy()
	})

	// 6. startFloodText returns a function
	it('startFloodText returns a stop function', () => {
		const el = makeElement('Hello world')
		const original = getCleanHTML(el)
		const charSpans = applyFloodText(el, original, {})
		const stop = startFloodText(charSpans, {})
		expect(typeof stop).toBe('function')
		stop()
	})

	// 7. startFloodText is a no-op for empty char array
	it('startFloodText with empty array returns noop', () => {
		const stop = startFloodText([], {})
		expect(typeof stop).toBe('function')
		expect(() => stop()).not.toThrow()
	})

	// 8. Empty element doesn't throw
	it('applyFloodText does not throw on empty element', () => {
		const el = makeElement('')
		const original = getCleanHTML(el)
		expect(() => applyFloodText(el, original, {})).not.toThrow()
	})

	// 9. getCleanHTML after apply strips all ft-char class names
	it('getCleanHTML after apply strips all injected markup', () => {
		const el = makeElement('Hello world')
		const original = getCleanHTML(el)
		applyFloodText(el, original, {})
		const cleaned = getCleanHTML(el)
		expect(cleaned).not.toContain(FLOOD_TEXT_CLASSES.char)
	})

	// 10. Applying twice from same original gives same char count
	it('applying twice from same original gives same char count', () => {
		const el = makeElement('Hello world')
		const original = getCleanHTML(el)
		const spans1 = applyFloodText(el, original, {})
		const spans2 = applyFloodText(el, original, {})
		expect(spans2.length).toBe(spans1.length)
	})

	// 11. All direction options work without throwing
	it.each(['right', 'left', 'diagonal-down', 'diagonal-up'] as const)(
		'direction %s works without throwing',
		(direction) => {
			const el = makeElement('Hello world')
			const original = getCleanHTML(el)
			const charSpans = applyFloodText(el, original, { direction })
			expect(charSpans.length).toBeGreaterThan(0)
			const stop = startFloodText(charSpans, { direction })
			expect(typeof stop).toBe('function')
			stop()
		},
	)

	// 12. All supported effect types start without throwing
	it.each(['wght', 'wdth', 'oblique', 'opacity'] as const)(
		'effect %s starts without throwing',
		(effect) => {
			const el = makeElement('Hello world')
			const original = getCleanHTML(el)
			const charSpans = applyFloodText(el, original, { effect })
			const stop = startFloodText(charSpans, { effect })
			expect(typeof stop).toBe('function')
			stop()
		},
	)

	// 13. Wave utility functions return values in [-1, 1]
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

	// 14. computeWave: sine at phase 0 returns 0
	it('computeWave sine at phase 0 returns 0', () => {
		expect(computeWave(0, 'sine')).toBeCloseTo(0)
	})

	// 15. computeWave: sine at phase 0.25 returns 1
	it('computeWave sine at phase 0.25 returns 1', () => {
		expect(computeWave(0.25, 'sine')).toBeCloseTo(1)
	})

	// 16. waveShape:'triangle' never exceeds [-1, 1]
	it('waveShape triangle stays within [-1, 1]', () => {
		const phases = [0, 0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9, 1.0, 1.5, -0.5]
		for (const p of phases) {
			const v = computeWave(p, 'triangle')
			expect(v).toBeGreaterThanOrEqual(-1)
			expect(v).toBeLessThanOrEqual(1)
		}
	})

	// 17. Character count matches visible characters in text
	it('char span count matches non-whitespace character count', () => {
		const text = 'ABC DEF'
		const el = makeElement(text)
		const original = getCleanHTML(el)
		const charSpans = applyFloodText(el, original, {})
		const expectedCount = text.replace(/\s/g, '').length // 6
		expect(charSpans.length).toBe(expectedCount)
	})

	// 18. Density option is accepted without throwing
	it('density option is accepted without throwing', () => {
		const el = makeElement('Hello world')
		const original = getCleanHTML(el)
		const charSpans = applyFloodText(el, original, {})
		const stop = startFloodText(charSpans, { density: 3 })
		expect(typeof stop).toBe('function')
		stop()
	})
})
