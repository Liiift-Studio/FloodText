// axis-tide/src/core/adjust.ts — framework-agnostic algorithm
import type { AxisTideOptions } from './types'

/**
 * Strip any prior axis-tide markup from an element and return clean innerHTML.
 * Safe to call multiple times — idempotent.
 */
export function getCleanHTML(el: HTMLElement): string {
	const clone = el.cloneNode(true) as HTMLElement
	clone.querySelectorAll('[data-axis-tide]').forEach((node) => {
		node.replaceWith(...node.childNodes)
	})
	return clone.innerHTML
}

/**
 * Apply axis-tide effect to an element.
 * @param element   - Target element
 * @param originalHTML - Clean HTML snapshot from getCleanHTML()
 * @param options   - AxisTideOptions
 */
export function applyAxisTide(
	element: HTMLElement,
	originalHTML: string,
	options: AxisTideOptions,
): void {
	if (typeof window === 'undefined') return

	// Save scroll position — iOS Safari does not support overflow-anchor: none
	const scrollY = window.scrollY

	// Pass 1: Reset to original HTML (idempotent)
	element.innerHTML = originalHTML

	// TODO: implement axis-tide algorithm
	// Follow the pattern from PROCESS.md:
	//   - Batch all DOM reads before writes
	//   - Use recursive childNodes walk (not createTreeWalker — happy-dom bug)
	//   - Give measurement probes a distinct CSS class

	// Restore scroll after DOM mutations
	requestAnimationFrame(() => {
		if (Math.abs(window.scrollY - scrollY) > 2) {
			window.scrollTo({ top: scrollY, behavior: 'instant' })
		}
	})
}

/**
 * Remove axis-tide markup and restore original HTML.
 */
export function removeAxisTide(element: HTMLElement, originalHTML: string): void {
	element.innerHTML = originalHTML
}
