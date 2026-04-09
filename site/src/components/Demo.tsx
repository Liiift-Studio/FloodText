"use client"

import { useState, useDeferredValue } from "react"
import { FloodText } from "@liiift-studio/floodtext"
import type { FloodEffect } from "@liiift-studio/floodtext"

const SAMPLE = `A wave washes through the body copy — character by character. Weight surges and falls, oblique angles tilt and recover, opacity pulses through the sentence. Not line by line, not word by word: every individual letterform sits at its own moment in the curve. The effect ranges from barely-perceptible texture at low amplitude to full expressive transformation at high. Density controls how many cycles are visible across the paragraph at once. Period controls how fast the wave moves. The waveShape changes the character of the motion.`

type Direction = 'diagonal-down' | 'diagonal-up' | 'right' | 'left'

const DIRECTION_LABELS: Record<Direction, string> = {
	'diagonal-down': '↘',
	'diagonal-up':   '↗',
	'right':         '→',
	'left':          '←',
}

function Slider({ label, value, min, max, step, fmt, onChange }: { label: string; value: number; min: number; max: number; step: number; fmt?: (v: number) => string; onChange: (v: number) => void }) {
	return (
		<div className="flex flex-col gap-1">
			<span className="text-xs uppercase tracking-widest opacity-50">{label}</span>
			<input type="range" min={min} max={max} step={step} value={value} aria-label={label} onChange={e => onChange(Number(e.target.value))} onTouchStart={e => e.stopPropagation()} style={{ touchAction: 'none' }} />
			<span className="tabular-nums text-xs opacity-50 text-right">{fmt ? fmt(value) : value}</span>
		</div>
	)
}

/** Before/after toggle */
function BeforeAfterToggle({ active, onClick }: { active: boolean; onClick: () => void }) {
	return (
		<button
			onClick={onClick}
			aria-label="Toggle before/after comparison"
			title={active ? 'Hide comparison' : 'Compare without effect'}
			style={{
				position: 'absolute', bottom: 0, right: 0,
				width: 32, height: 32, borderRadius: '50%',
				border: '1px solid currentColor',
				opacity: active ? 0.8 : 0.45,
				background: 'transparent',
				display: 'flex', alignItems: 'center', justifyContent: 'center',
				cursor: 'pointer', transition: 'opacity 0.15s ease',
			}}
		>
			<svg width="14" height="10" viewBox="0 0 14 10" fill="none">
				<rect x="0.5" y="0.5" width="13" height="9" rx="1" stroke="currentColor" strokeWidth="1"/>
				<line x1="7" y1="0.5" x2="7" y2="9.5" stroke="currentColor" strokeWidth="1"/>
				<rect x="8" y="1.5" width="5" height="7" fill="currentColor"/>
			</svg>
		</button>
	)
}

/** Amplitude defaults and slider ranges per effect type */
const EFFECT_CONFIG: Record<FloodEffect, { default: number; min: number; max: number; step: number; unit: string }> = {
	wght:     { default: 200,  min: 10,   max: 400,  step: 10,   unit: 'wght units' },
	wdth:     { default: 20,   min: 1,    max: 50,   step: 1,    unit: 'wdth units' },
	oblique:  { default: 15,   min: 1,    max: 30,   step: 1,    unit: 'deg'        },
	opacity:  { default: 0.3,  min: 0.1,  max: 0.7,  step: 0.05, unit: ''           },
	rotation: { default: 15,   min: 1,    max: 45,   step: 1,    unit: 'deg'        },
	blur:     { default: 2,    min: 0.1,  max: 8,    step: 0.1,  unit: 'px'         },
	size:     { default: 0.15, min: 0.02, max: 0.5,  step: 0.01, unit: 'em'         },
}

const ALL_EFFECTS: FloodEffect[] = ['wght', 'wdth', 'oblique', 'opacity', 'rotation', 'blur', 'size']

const DIRECTION_DESCRIPTION: Record<Direction, string> = {
	'diagonal-down': 'top-left to bottom-right',
	'diagonal-up':   'bottom-left to top-right',
	'right':         'left to right',
	'left':          'right to left',
}

export default function Demo() {
	const [activeEffects, setActiveEffects] = useState<Set<FloodEffect>>(new Set(['wght']))
	const [amplitude, setAmplitude] = useState(EFFECT_CONFIG.wght.default)
	const [period, setPeriod] = useState(4)
	const [density, setDensity] = useState(2)
	const [direction, setDirection] = useState<Direction>('diagonal-down')
	const [waveShape, setWaveShape] = useState<'sine' | 'sawtooth' | 'triangle'>('sine')
	const [beforeAfter, setComparing] = useState(false)

	const dAmplitude = useDeferredValue(amplitude)
	const dPeriod = useDeferredValue(period)
	const dDensity = useDeferredValue(density)

	const sampleStyle: React.CSSProperties = {
		fontFamily: "var(--font-merriweather), serif",
		fontSize: "1.125rem",
		lineHeight: "1.8",
	}

	const singleEffect = activeEffects.size === 1 ? [...activeEffects][0] : null

	function handleEffectToggle(v: FloodEffect) {
		setActiveEffects(prev => {
			const next = new Set(prev)
			if (next.has(v)) {
				// Always keep at least one effect active
				if (next.size > 1) next.delete(v)
			} else {
				next.add(v)
			}
			// If switching to single effect, reset amplitude to that effect's default
			if (next.size === 1) setAmplitude(EFFECT_CONFIG[[...next][0]].default)
			return next
		})
	}

	const cfg = singleEffect ? EFFECT_CONFIG[singleEffect] : null

	// Compute the effect prop: single string or array
	const effectProp: FloodEffect | FloodEffect[] =
		singleEffect ?? [...activeEffects]

	return (
		<div className="w-full">
			<div className="grid grid-cols-3 gap-6 mb-6">
				{cfg ? (
					<Slider label={`Amplitude${cfg.unit ? ` (${cfg.unit})` : ''}`} value={amplitude} min={cfg.min} max={cfg.max} step={cfg.step} fmt={cfg.step < 1 ? v => v.toFixed(2) : undefined} onChange={setAmplitude} />
				) : (
					<div className="flex flex-col gap-1 justify-end">
						<span className="text-xs opacity-40 italic">Default amplitudes per effect</span>
					</div>
				)}
				<Slider label="Period (s)" value={period} min={1} max={12} step={0.5} onChange={setPeriod} />
				<Slider label="Density" value={density} min={0.5} max={5} step={0.5} onChange={setDensity} />
			</div>
			<div className="flex flex-wrap items-center gap-3 mb-8">
				<span className="text-xs uppercase tracking-widest opacity-50">Effect</span>
				{ALL_EFFECTS.map(v => (
					<button key={v} onClick={() => handleEffectToggle(v)} aria-pressed={activeEffects.has(v)} className="text-xs px-3 py-1 rounded-full border transition-opacity" style={{ borderColor: 'currentColor', opacity: activeEffects.has(v) ? 1 : 0.5, background: activeEffects.has(v) ? 'var(--btn-bg)' : 'transparent' }}>{v}</button>
				))}
				<span className="text-xs uppercase tracking-widest opacity-50 ml-4">Wave</span>
				{(['sine', 'sawtooth', 'triangle'] as const).map(v => (
					<button key={v} onClick={() => setWaveShape(v)} aria-pressed={waveShape === v} className="text-xs px-3 py-1 rounded-full border transition-opacity" style={{ borderColor: 'currentColor', opacity: waveShape === v ? 1 : 0.5, background: waveShape === v ? 'var(--btn-bg)' : 'transparent' }}>{v}</button>
				))}
				<span className="text-xs uppercase tracking-widest opacity-50 ml-4">Dir</span>
				{(['diagonal-down', 'diagonal-up', 'right', 'left'] as const).map(v => (
					<button key={v} onClick={() => setDirection(v)} aria-pressed={direction === v} aria-label={DIRECTION_DESCRIPTION[v]} title={DIRECTION_DESCRIPTION[v]} className="text-xs px-3 py-1 rounded-full border transition-opacity" style={{ borderColor: 'currentColor', opacity: direction === v ? 1 : 0.5, background: direction === v ? 'var(--btn-bg)' : 'transparent' }}>{DIRECTION_LABELS[v]}</button>
				))}
			</div>
			<div className="relative pb-8">
				<FloodText
					effect={effectProp}
					amplitude={singleEffect ? dAmplitude : undefined}
					period={dPeriod}
					density={dDensity}
					direction={direction}
					waveShape={waveShape}
					as="p"
					style={sampleStyle}
				>
					{SAMPLE}
				</FloodText>
				{beforeAfter && (
					<p aria-hidden style={{ ...sampleStyle, position: 'absolute', top: 0, left: 0, width: '100%', margin: 0, opacity: 0.25, pointerEvents: 'none' }}>{SAMPLE}</p>
				)}
				<BeforeAfterToggle active={beforeAfter} onClick={() => setComparing(v => !v)} />
			</div>
			<p className="text-xs opacity-50 italic mt-8" style={{ lineHeight: "1.8" }}>
				A {waveShape} wave traveling {DIRECTION_DESCRIPTION[direction]} through {SAMPLE.replace(/\s/g, '').length} characters
				{singleEffect
					? ` — ±${amplitude}${cfg?.unit ? ' ' + cfg.unit : ''} on ${singleEffect}`
					: ` — layering ${[...activeEffects].join(' + ')}`
				}, density {density}, period {period}s.
			</p>
		</div>
	)
}
