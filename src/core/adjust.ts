// floodText/src/core/adjust.ts — framework-agnostic DOM algorithm and per-character animation
import { FLOOD_TEXT_CLASSES, type FloodTextOptions, type FloodEffect, type FloodProperty } from './types'

// ─── Sentiment (optional peer dep) ────────────────────────────────────────────

type SentimentModule = { default: new () => { analyze: (text: string) => { score: number } } }
let _Sentiment: (new () => { analyze: (text: string) => { score: number } }) | null = null
let _sentimentLoading = false

function tryLoadSentiment(): void {
	if (_Sentiment !== null || _sentimentLoading) return
	_sentimentLoading = true
	import(/* @vite-ignore */ 'sentiment')
		.then((m) => { _Sentiment = (m as SentimentModule).default })
		.catch(() => {
			console.warn('[floodtext] source: "sentiment" requires the `sentiment` package — falling back to "fixed"')
		})
}

/** Neutral base values and default amplitudes per effect type */
const EFFECT_DEFAULTS: Record<FloodEffect, { base: number; amplitude: number }> = {
	wght:     { base: 400, amplitude: 200  },
	wdth:     { base: 100, amplitude: 20   },
	oblique:  { base: 0,   amplitude: 15   },
	opacity:  { base: 0.7, amplitude: 0.3  },
	rotation: { base: 0,   amplitude: 15   },
	blur:     { base: 0,   amplitude: 2    },
	size:     { base: 1,   amplitude: 0.15 },
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
	options: FloodTextOptions = {},
): HTMLElement[] {
	if (typeof window === 'undefined') return []

	// Kick off background sentiment load when the source will be 'sentiment'
	if (options.source === 'sentiment') tryLoadSentiment()

	// --- Pass 1: Reset ---
	element.innerHTML = originalHTML

	if (!element.textContent?.trim()) return []

	// --- Pass 2: Walk text nodes, wrap each character ---
	// When source is 'sentiment', score each word via the sentiment package (once loaded)
	// and stamp the normalised score onto each char span as data-ft-sentiment.
	// startFloodText reads these to scale amplitude per character.
	const useSentiment = options.source === 'sentiment' && _Sentiment !== null
	const analyser = useSentiment ? new _Sentiment!() : null

	const textNodes: Text[] = []
	collectTextNodes(element, textNodes)

	const charSpans: HTMLElement[] = []

	for (const textNode of textNodes) {
		const text = textNode.textContent ?? ''
		if (!text) continue

		const fragment = document.createDocumentFragment()

		// Split into word-level tokens to score each word when in sentiment mode
		const wordTokens = text.split(/(\S+)/)
		for (let wi = 0; wi < wordTokens.length; wi++) {
			const token = wordTokens[wi]
			// Preserve whitespace tokens as bare text nodes
			if (/^\s*$/.test(token)) {
				if (token) fragment.appendChild(document.createTextNode(token))
				continue
			}
			// Score this word if sentiment mode is active
			const rawScore = analyser ? analyser.analyze(token).score : 0

			for (const char of token) {
				if (/\s/.test(char)) {
					fragment.appendChild(document.createTextNode(char))
				} else {
					const span = document.createElement('span')
					span.className = FLOOD_TEXT_CLASSES.char
					span.textContent = char
					if (useSentiment) {
						span.dataset.ftSentiment = String(rawScore)
					}
					fragment.appendChild(span)
					charSpans.push(span)
				}
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
 * Apply all active built-in effects and custom properties to a character span.
 * wght and wdth are merged into a single fontVariationSettings declaration so
 * they do not overwrite each other when both are active.
 * rotation uses CSS transform — callers must ensure spans are display:inline-block first.
 * size uses font-size in em units.
 * Custom properties are applied via style.setProperty() — works for CSS variables too.
 *
 * @param span         - The character span element to style
 * @param effects      - Active built-in effects
 * @param customProps  - Active custom property definitions
 * @param wave         - Wave sample in [-1, 1]
 * @param amplitudeMap - Per-effect amplitude overrides (falls back to EFFECT_DEFAULTS)
 */
function applyEffectsToSpan(
	span: HTMLElement,
	effects: FloodEffect[],
	customProps: FloodProperty[],
	wave: number,
	amplitudeMap: Partial<Record<FloodEffect, number>>,
): void {
	const fvsParts: string[] = []

	// --- Built-in effects ---
	for (const effect of effects) {
		const { base, amplitude } = EFFECT_DEFAULTS[effect]
		const amp = amplitudeMap[effect] ?? amplitude
		const value = base + amp * wave

		switch (effect) {
			case 'wght':
				fvsParts.push(`'wght' ${value.toFixed(1)}`)
				break
			case 'wdth':
				fvsParts.push(`'wdth' ${value.toFixed(1)}`)
				break
			case 'oblique':
				span.style.fontStyle = `oblique ${value.toFixed(1)}deg`
				break
			case 'opacity':
				span.style.opacity = Math.max(0, Math.min(1, value)).toFixed(3)
				break
			case 'rotation':
				span.style.transform = `rotate(${value.toFixed(2)}deg)`
				break
			case 'blur':
				span.style.filter = `blur(${Math.max(0, value).toFixed(2)}px)`
				break
			case 'size':
				// font-size in em — relative to parent element's font size
				span.style.fontSize = `${Math.max(0.1, value).toFixed(4)}em`
				break
		}
	}

	// Merge wght + wdth into a single declaration so they don't overwrite each other
	if (fvsParts.length > 0) {
		span.style.fontVariationSettings = fvsParts.join(', ')
	}

	// --- Custom CSS properties ---
	for (const prop of customProps) {
		const raw = prop.base + prop.amplitude * wave
		const clamped = prop.clamp
			? Math.max(prop.clamp[0], Math.min(prop.clamp[1], raw))
			: raw
		const unit = prop.unit ?? ''
		// style.setProperty works for both regular properties and CSS custom properties
		span.style.setProperty(prop.property, `${clamped}${unit}`)
	}
}

/**
 * Compute a normalised [0, 1] position for each character span based on wave direction.
 * All directions use screen coordinates from getBoundingClientRect — read once as a
 * single batch before the animation loop begins.
 *
 * right/left:     position = character's x-coordinate within the text bounds.
 *                 Characters at the same horizontal column across lines are in phase,
 *                 so the wave sweeps as vertical stripes — not in reading order.
 *                 Previously this used sequential character index, which caused
 *                 each line to start the wave mid-cycle relative to the line above.
 *
 * diagonal-down:  top-left → bottom-right projection — (nx + ny) / 2
 * diagonal-up:    bottom-left → top-right projection — (nx + (1 - ny)) / 2
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

	// Batch-read all BCRs before any writes (no layout thrash)
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

		if (direction === 'right' || direction === 'left') {
			// Spatial x position: characters at the same column across lines are in phase.
			// The reversed flag in startFloodText handles the left/right travel direction.
			return nx
		}
		if (direction === 'diagonal-down') {
			// Top-left → bottom-right: project onto (1,1) axis
			return (nx + ny) / 2
		}
		// diagonal-up: bottom-left → top-right: project onto (1,-1) axis
		return (nx + (1 - ny)) / 2
	})
}

/**
 * Start the flood-text animation on an array of character span elements.
 * Returns a stop function — call it to cancel the animation loop.
 *
 * Built-in effects and custom properties share the same wave — they stay in phase.
 * Use `amplitudes` to control per-effect intensity when layering built-in effects.
 * Use `properties` to animate any CSS property or CSS custom property.
 *
 * Note: the `rotation` effect requires character spans to be display:inline-block
 * (CSS transform does not apply to non-replaced inline elements). This is set
 * automatically. The `size` effect causes layout recalculation each frame because
 * font-size changes affect text flow — use at low amplitude to minimise reflow cost.
 *
 * @param charSpans - Array of .ft-char span elements from applyFloodText
 * @param options   - FloodTextOptions (merged with defaults)
 */
export function startFloodText(
	charSpans: HTMLElement[],
	options: FloodTextOptions = {},
): () => void {
	if (charSpans.length === 0) return () => {}

	// Skip animation on e-ink / slow-update displays — wave animation produces no
	// visible effect and wastes power. matchMedia('(update: slow)') is true on
	// Kindle, Remarkable, and other e-ink panels.
	if (typeof window !== 'undefined' && window.matchMedia('(update: slow)').matches) return () => {}

	// Normalise effect input to an array
	const effectInput  = options.effect ?? 'wght'
	const effects: FloodEffect[] = Array.isArray(effectInput) ? effectInput : [effectInput]
	const customProps: FloodProperty[] = options.properties ?? []

	// Build per-effect amplitude map
	// Single built-in effect: `amplitude` option is used directly
	// Multiple effects: fall back to per-effect defaults, overridden by `amplitudes`
	const amplitudeMap: Partial<Record<FloodEffect, number>> = {}
	for (const eff of effects) {
		if (effects.length === 1 && customProps.length === 0 && options.amplitude !== undefined) {
			amplitudeMap[eff] = options.amplitude
		} else {
			amplitudeMap[eff] = options.amplitudes?.[eff] ?? EFFECT_DEFAULTS[eff].amplitude
		}
	}

	const period    = Math.max(0.1, options.period ?? 4)  // clamp to prevent Infinity speed
	const density   = options.density   ?? 2
	const direction = options.direction ?? 'diagonal-down'
	const waveShape = options.waveShape ?? 'sine'

	// Build per-char amplitude multipliers from sentiment scores when source === 'sentiment'.
	// Scores are normalised so the most extreme word always reaches full amplitude (multiplier = 1).
	// Neutral function words (score 0) use a minimum multiplier of 0.2 so they still pulse faintly.
	let charMultipliers: number[] | null = null
	if (options.source === 'sentiment') {
		const scores = charSpans.map((s) => {
			const raw = parseFloat(s.dataset.ftSentiment ?? '0')
			return isNaN(raw) ? 0 : raw
		})
		const absScores = scores.map(Math.abs)
		const maxAbs = Math.max(...absScores, 1) // avoid division by zero
		charMultipliers = absScores.map((abs) => 0.2 + 0.8 * (abs / maxAbs))
	}

	const speed     = 1 / period // cycles per second
	// elapsed tracks total animation time, excluding time the tab was hidden.
	// Without this, performance.now() jumps forward when a hidden tab becomes visible
	// again, causing the wave phase to teleport instead of continuing smoothly.
	let elapsed     = 0
	let lastTick    = performance.now()
	let rafId       = 0

	// Compute per-character spatial positions once before the loop
	const positions = computeCharPositions(charSpans, direction)

	// For left/diagonal-up: wave travels in the reverse direction along the axis
	const reversed = direction === 'left' || direction === 'diagonal-up'

	// rotation uses CSS transform which does not apply to inline elements — set inline-block first
	if (effects.includes('rotation')) {
		charSpans.forEach((span) => { span.style.display = 'inline-block' })
	}

	function tick() {
		const now = performance.now()
		// Only advance elapsed when the tab is visible — document.hidden is true when
		// the tab is in the background and rAF has been paused by the browser.
		if (!document.hidden) {
			elapsed += (now - lastTick) / 1000
		}
		lastTick = now
		const t = elapsed

		charSpans.forEach((span, i) => {
			const pos   = positions[i]
			// Reversed directions: wave peak moves toward lower pos over time
			const phase = reversed
				? pos * density + t * speed
				: pos * density - t * speed

			const wave = computeWave(phase, waveShape)

			// Apply per-char sentiment multiplier when active — scale the amplitude map
			if (charMultipliers !== null) {
				const multiplier = charMultipliers[i] ?? 1
				const scaledMap: Partial<Record<FloodEffect, number>> = {}
				for (const [k, v] of Object.entries(amplitudeMap) as [FloodEffect, number][]) {
					scaledMap[k] = v * multiplier
				}
				applyEffectsToSpan(span, effects, customProps, wave, scaledMap)
			} else {
				applyEffectsToSpan(span, effects, customProps, wave, amplitudeMap)
			}
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
