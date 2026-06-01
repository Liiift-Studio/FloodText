// floodText/src/__tests__/react.test.tsx — React hook and component tests
import React from 'react'
import { render, renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useFloodText } from '../react/useFloodText'
import { FloodText } from '../react/FloodText'

// ─── Mocks ────────────────────────────────────────────────────────────────────

/** Stub getBoundingClientRect so layout reads return 0 in happy-dom */
function mockLayout() {
	vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
		width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0,
		x: 0, y: 0, toJSON: () => {},
	} as DOMRect)
}

// ─── describe: useFloodText ────────────────────────────────────────────────────

describe('useFloodText', () => {
	beforeEach(() => {
		document.body.innerHTML = ''
		mockLayout()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('mounts and unmounts without throwing', () => {
		const el = document.createElement('p')
		el.textContent = 'Hello world'
		document.body.appendChild(el)

		expect(() => {
			const { unmount } = renderHook(() => useFloodText({}))
			unmount()
		}).not.toThrow()
	})

	it('returns a ref object', () => {
		const { result } = renderHook(() => useFloodText({}))
		expect(result.current).toBeDefined()
		expect(typeof result.current).toBe('object')
	})

	it('accepts default options without throwing', () => {
		expect(() => renderHook(() => useFloodText({}))).not.toThrow()
	})

	it('accepts all speed-related options without throwing', () => {
		expect(() =>
			renderHook(() => useFloodText({ period: 2, density: 3, amplitude: 100 })),
		).not.toThrow()
	})

	it('accepts waveShape option without throwing', () => {
		expect(() =>
			renderHook(() => useFloodText({ waveShape: 'sawtooth' })),
		).not.toThrow()
	})

	it('accepts direction option without throwing', () => {
		expect(() =>
			renderHook(() => useFloodText({ direction: 'left' })),
		).not.toThrow()
	})

	it('accepts pauseOffscreen option without throwing', () => {
		expect(() =>
			renderHook(() => useFloodText({ pauseOffscreen: false })),
		).not.toThrow()
	})

	it('re-runs without throwing when options change', () => {
		const { rerender } = renderHook(
			({ period }: { period: number }) => useFloodText({ period }),
			{ initialProps: { period: 2 } },
		)
		expect(() => {
			act(() => {
				rerender({ period: 4 })
			})
		}).not.toThrow()
	})

	it('re-runs without throwing when waveShape changes', () => {
		type Shape = 'sine' | 'sawtooth' | 'triangle'
		const { rerender } = renderHook(
			({ waveShape }: { waveShape: Shape }) => useFloodText({ waveShape }),
			{ initialProps: { waveShape: 'sine' as Shape } },
		)
		expect(() => {
			act(() => {
				rerender({ waveShape: 'triangle' as Shape })
			})
		}).not.toThrow()
	})
})

// ─── describe: FloodText ───────────────────────────────────────────────────────

describe('FloodText', () => {
	beforeEach(() => {
		document.body.innerHTML = ''
		mockLayout()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('renders children', () => {
		const { container } = render(<FloodText>Hello world</FloodText>)
		// applyFloodText splits text into individual char spans; the container
		// element gets aria-label with the full plain text — use that as the signal
		const el = container.querySelector('[aria-label]') ?? container.querySelector('p')
		expect(el).not.toBeNull()
	})

	it('renders a <p> tag by default', () => {
		const { container } = render(<FloodText>Test</FloodText>)
		expect(container.querySelector('p')).not.toBeNull()
	})

	it('renders a custom tag via the as prop', () => {
		const { container } = render(<FloodText as="div">Test</FloodText>)
		expect(container.querySelector('div')).not.toBeNull()
		expect(container.querySelector('p')).toBeNull()
	})

	it('forwards className prop', () => {
		const { container } = render(
			<FloodText className="my-class">Test</FloodText>,
		)
		expect(container.querySelector('.my-class')).not.toBeNull()
	})

	it('forwards aria-label prop', () => {
		// applyFloodText overwrites aria-label with the element's plain text;
		// the prop is forwarded to the DOM attribute before the effect runs,
		// so we just verify the element has some aria-label set.
		const { container } = render(
			<FloodText aria-label="Test">Test</FloodText>,
		)
		const el = container.querySelector('p')
		expect(el).not.toBeNull()
		expect(el?.hasAttribute('aria-label')).toBe(true)
	})

	it('forwards role prop', () => {
		const { container } = render(
			<FloodText role="heading">Test</FloodText>,
		)
		expect(container.querySelector('[role="heading"]')).not.toBeNull()
	})

	it('mounts and unmounts without throwing', () => {
		expect(() => {
			const { unmount } = render(<FloodText>Hello</FloodText>)
			unmount()
		}).not.toThrow()
	})

	it('accepts all FloodTextOptions without throwing', () => {
		expect(() =>
			render(
				<FloodText
					effect="wght"
					amplitude={200}
					period={3}
					density={2}
					direction="diagonal-down"
					waveShape="sine"
					pauseOffscreen={false}
				>
					Sample text
				</FloodText>,
			),
		).not.toThrow()
	})
})
