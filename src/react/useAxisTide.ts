// axis-tide/src/react/useAxisTide.ts — React hook: line detection + animation lifecycle
import { useCallback, useLayoutEffect, useRef } from 'react'
import { applyAxisTide, startTide, getCleanHTML } from '../core/adjust'
import type { AxisTideOptions } from '../core/types'

/**
 * React hook that applies the axis-tide wave animation to a ref'd element.
 * Detects lines in a useLayoutEffect, starts the rAF animation loop, and
 * automatically re-detects lines and restarts animation on container width change.
 * Respects `prefers-reduced-motion` — skips animation when the user has opted out.
 *
 * @param options - AxisTideOptions controlling axis, amplitude, period, etc.
 * @returns A ref to attach to the target HTMLElement
 */
export function useAxisTide(options: AxisTideOptions) {
	const ref             = useRef<HTMLElement>(null)
	const originalHTMLRef = useRef<string | null>(null)
	const optionsRef      = useRef(options)
	optionsRef.current = options

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

		const lineSpans = applyAxisTide(el, originalHTMLRef.current, optionsRef.current)

		if (prefersReduced || lineSpans.length === 0) {
			return () => {}
		}

		// Start animation loop and return its stop function
		return startTide(lineSpans, optionsRef.current)
	}, [])

	useLayoutEffect(() => {
		let stopTide = run()

		let lastWidth = 0
		let rafId = 0

		const ro = new ResizeObserver((entries) => {
			const w = Math.round(entries[0].contentRect.width)
			if (w === lastWidth) return
			lastWidth = w
			// Stop existing animation, then re-detect lines and restart on next frame
			stopTide()
			cancelAnimationFrame(rafId)
			rafId = requestAnimationFrame(() => {
				stopTide = run()
			})
		})

		ro.observe(ref.current!)

		return () => {
			ro.disconnect()
			cancelAnimationFrame(rafId)
			stopTide()
		}
	}, [run])

	return ref
}
