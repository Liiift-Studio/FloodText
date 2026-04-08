"use client"

import { useState, useDeferredValue } from "react"
import { FloodText } from "@liiift-studio/floodtext"
import type { FloodEffect } from "@liiift-studio/floodtext"

const SAMPLE = `A wave washes through the body copy — character by character. Weight surges and falls, oblique angles tilt and recover, opacity pulses through the sentence. Not line by line, not word by word: every individual letterform sits at its own moment in the curve. The effect ranges from barely-perceptible texture at low amplitude to full expressive transformation at high. Density controls how many cycles are visible across the paragraph at once. Period controls how fast the wave moves. The waveShape changes the character of the motion.`

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
				opacity: active ? 0.8 : 0.25,
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

/** Amplitude defaults and slider ranges per style type */
const STYLE_CONFIG: Record<FloodEffect, { default: number; min: number; max: number; step: number; unit: string }> = {
	wght:    { default: 200, min: 10,  max: 400, step: 10,   unit: 'wght units' },
	wdth:    { default: 20,  min: 1,   max: 50,  step: 1,    unit: 'wdth units' },
	oblique: { default: 15,  min: 1,   max: 30,  step: 1,    unit: 'deg'        },
	opacity: { default: 0.3, min: 0.1, max: 0.7, step: 0.05, unit: ''           },
}

export default function Demo() {
	const [effect, setEffect] = useState<FloodEffect>('wght')
	const [amplitude, setAmplitude] = useState(STYLE_CONFIG.wght.default)
	const [period, setPeriod] = useState(4)
	const [density, setDensity] = useState(1)
	const [direction, setDirection] = useState<'right' | 'left'>('right')
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

	function handleEffectChange(v: FloodEffect) {
		setEffect(v)
		setAmplitude(STYLE_CONFIG[v].default)
	}

	const cfg = STYLE_CONFIG[effect]

	return (
		<div className="w-full" style={{ overflow: 'hidden' }}>
			<div className="grid grid-cols-3 gap-6 mb-6">
				<Slider label={`Amplitude${cfg.unit ? ` (${cfg.unit})` : ''}`} value={amplitude} min={cfg.min} max={cfg.max} step={cfg.step} fmt={cfg.step < 1 ? v => v.toFixed(2) : undefined} onChange={setAmplitude} />
				<Slider label="Period (s)" value={period} min={1} max={12} step={0.5} onChange={setPeriod} />
				<Slider label="Density" value={density} min={0.5} max={4} step={0.5} onChange={setDensity} />
			</div>
			<div className="flex flex-wrap items-center gap-3 mb-8">
				<span className="text-xs uppercase tracking-widest opacity-50">Effect</span>
				{(['wght', 'wdth', 'oblique', 'opacity'] as const).map(v => (
					<button key={v} onClick={() => handleEffectChange(v)} className="text-xs px-3 py-1 rounded-full border transition-opacity" style={{ borderColor: 'currentColor', opacity: effect === v ? 1 : 0.5, background: effect === v ? 'var(--btn-bg)' : 'transparent' }}>{v}</button>
				))}
				<span className="text-xs uppercase tracking-widest opacity-50 ml-4">Wave</span>
				{(['sine', 'sawtooth', 'triangle'] as const).map(v => (
					<button key={v} onClick={() => setWaveShape(v)} className="text-xs px-3 py-1 rounded-full border transition-opacity" style={{ borderColor: 'currentColor', opacity: waveShape === v ? 1 : 0.5, background: waveShape === v ? 'var(--btn-bg)' : 'transparent' }}>{v}</button>
				))}
				<span className="text-xs uppercase tracking-widest opacity-50 ml-4">Dir</span>
				{(['right', 'left'] as const).map(v => (
					<button key={v} onClick={() => setDirection(v)} className="text-xs px-3 py-1 rounded-full border transition-opacity" style={{ borderColor: 'currentColor', opacity: direction === v ? 1 : 0.5, background: direction === v ? 'var(--btn-bg)' : 'transparent' }}>{v}</button>
				))}
			</div>
			<div className="relative pb-8">
				<FloodText effect={effect} amplitude={dAmplitude} period={dPeriod} density={dDensity} direction={direction} waveShape={waveShape} as="p" style={sampleStyle}>
					{SAMPLE}
				</FloodText>
				{beforeAfter && (
					<p aria-hidden style={{ ...sampleStyle, position: 'absolute', top: 0, left: 0, width: '100%', margin: 0, opacity: 0.25, pointerEvents: 'none' }}>{SAMPLE}</p>
				)}
				<BeforeAfterToggle active={beforeAfter} onClick={() => setComparing(v => !v)} />
			</div>
			<p className="text-xs opacity-50 italic mt-6">A {waveShape} wave traveling {direction === 'right' ? 'left to right' : 'right to left'} through {SAMPLE.replace(/\s/g, '').length} characters — ±{amplitude}{cfg.unit ? ' ' + cfg.unit : ''} on {effect}, density {density}, period {period}s.</p>
		</div>
	)
}
