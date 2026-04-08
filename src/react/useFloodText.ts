// floodText/src/react/useFloodText.ts — React hook: character detection + animation lifecycle
import { useCallback, useLayoutEffect, useRef } from 'react'
import { applyFloodText, startFloodText, getCleanHTML } from '../core/adjust'
import type { FloodTextOptions } from '../core/types'

/**
 * React hook that applies the flood-text per-character wave animation to a ref'd element.
 * Wraps characters in a useLayoutEffect, starts the rAF animation loop, and
 * automatically re-wraps and restarts animation on container width change.
 * Respects `prefers-reduced-motion` — skips animation when the user has opted out.
 *
 * @param options - FloodTextOptions controlling style, amplitude, period, density, etc.
 * @returns A ref to attach to the target HTMLElement
 */
export function useFloodText(options: FloodTextOptions) {
	const ref             = useRef<HTMLElement>(null)
	const originalHTMLRef = useRef<string | null>(null)
	const optionsRef      = useRef(options)
	optionsRef.current = options

	const { effect, amplitude, period, density, direction, waveShape } = options

	const run = useCallback((): (() => void) => {
		const el = ref.current
		if (!el) return () => {}

		// Snapshot original HTML once — subsequent calls reuse the same snapshot
		if (originalHTMLRef.current === null) {
			originalHTMLRef.current = getCleanHTML(el)
		}

		// Check prefers-reduced-motion — skip animation entirely if true
		const prefersReduced =
			typeof window !== 'undefined' &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches

		const charSpans = applyFloodText(el, originalHTMLRef.current, optionsRef.current)

		if (prefersReduced || charSpans.length === 0) {
			return () => {}
		}

		// Start animation loop and return its stop function
		return startFloodText(charSpans, optionsRef.current)
	}, [effect, amplitude, period, density, direction, waveShape])

	useLayoutEffect(() => {
		let stopAnimation = run()

		let lastWidth = 0
		let rafId = 0

		const ro = new ResizeObserver((entries) => {
			const w = Math.round(entries[0].contentRect.width)
			if (w === lastWidth) return
			lastWidth = w
			// Stop existing animation, then re-wrap and restart on next frame
			stopAnimation()
			cancelAnimationFrame(rafId)
			rafId = requestAnimationFrame(() => {
				stopAnimation = run()
			})
		})

		ro.observe(ref.current!)

		return () => {
			ro.disconnect()
			cancelAnimationFrame(rafId)
			stopAnimation()
		}
	}, [run])

	return ref
}
