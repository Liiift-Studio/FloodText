"use client"

import { useState, useDeferredValue } from "react"
import { FloodText } from "@liiift-studio/floodtext"

const SAMPLE = `Watch the paragraph breathe. A wave passes through it — slow, continuous, invisible unless you hold your eye still and wait. Each line of text sits on a different moment of the curve, its axis value rising and falling as the tide moves through. The effect is not meant to be noticed. It is meant to be felt: a text that is alive rather than set, that shifts like water rather than stone. Variable fonts make this possible. The wdth axis compresses and expands. The wght axis lightens and darkens. The opsz axis shifts optical weight. A tide running through any of them gives the paragraph a quality that print cannot have.`

function Slider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
	return (
		<div className="flex flex-col gap-1">
			<span className="text-xs uppercase tracking-widest opacity-50">{label}</span>
			<input type="range" min={min} max={max} step={step} value={value} aria-label={label} onChange={e => onChange(Number(e.target.value))} onTouchStart={e => e.stopPropagation()} style={{ touchAction: 'none' }} />
			<span className="tabular-nums text-xs opacity-50 text-right">{value}</span>
		</div>
	)
}

/** Before/after toggle — left half = without effect, right half filled = with effect */
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

export default function Demo() {
	const [amplitude, setAmplitude] = useState(8)
	const [period, setPeriod] = useState(4)
	const [axis, setAxis] = useState<'wdth' | 'wght'>('wdth')
	const [baseValue, setBaseValue] = useState(100)
	const [waveShape, setWaveShape] = useState<'sine' | 'sawtooth' | 'triangle'>('sine')
	const [direction, setDirection] = useState<'down' | 'up'>('down')
	const [beforeAfter, setComparing] = useState(false)

	const dAmplitude = useDeferredValue(amplitude)
	const dPeriod = useDeferredValue(period)
	const dBaseValue = useDeferredValue(baseValue)

	const sampleStyle: React.CSSProperties = {
		fontFamily: "var(--font-merriweather), serif",
		fontSize: "1.125rem",
		lineHeight: "1.8",
	}

	return (
		<div className="w-full" style={{ overflow: 'hidden' }}>
			<div className="grid grid-cols-2 gap-6 mb-6">
				<Slider label="Amplitude" value={amplitude} min={1} max={20} step={1} onChange={setAmplitude} />
				<Slider label="Period (s)" value={period} min={1} max={12} step={0.5} onChange={setPeriod} />
			</div>
			<div className="flex flex-wrap items-center gap-3 mb-8">
				<span className="text-xs uppercase tracking-widest opacity-50">Axis</span>
				{(['wdth', 'wght'] as const).map(v => (
					<button key={v} onClick={() => { setAxis(v); setBaseValue(v === 'wght' ? 400 : 100) }} className="text-xs px-3 py-1 rounded-full border transition-opacity" style={{ borderColor: 'currentColor', opacity: axis === v ? 1 : 0.5, background: axis === v ? 'var(--btn-bg)' : 'transparent' }}>{v}</button>
				))}
				<span className="text-xs uppercase tracking-widest opacity-50 ml-4">Wave</span>
				{(['sine', 'triangle', 'sawtooth'] as const).map(v => (
					<button key={v} onClick={() => setWaveShape(v)} className="text-xs px-3 py-1 rounded-full border transition-opacity" style={{ borderColor: 'currentColor', opacity: waveShape === v ? 1 : 0.5, background: waveShape === v ? 'var(--btn-bg)' : 'transparent' }}>{v}</button>
				))}
				<span className="text-xs uppercase tracking-widest opacity-50 ml-4">Dir</span>
				{(['down', 'up'] as const).map(v => (
					<button key={v} onClick={() => setDirection(v)} className="text-xs px-3 py-1 rounded-full border transition-opacity" style={{ borderColor: 'currentColor', opacity: direction === v ? 1 : 0.5, background: direction === v ? 'var(--btn-bg)' : 'transparent' }}>{v}</button>
				))}
			</div>
			<div className="relative pb-8">
				<FloodText axis={axis} amplitude={dAmplitude} period={dPeriod} waveShape={waveShape} direction={direction} baseValue={dBaseValue} style={sampleStyle}>
					{SAMPLE}
				</FloodText>
				{beforeAfter && (
					<p aria-hidden style={{ ...sampleStyle, position: 'absolute', top: 0, left: 0, width: '100%', margin: 0, opacity: 0.25, pointerEvents: 'none' }}>{SAMPLE}</p>
				)}
				<BeforeAfterToggle active={beforeAfter} onClick={() => setComparing(v => !v)} />
			</div>
			<p className="text-xs opacity-50 italic mt-6">A {waveShape} wave, {direction === 'down' ? 'traveling top to bottom' : 'traveling bottom to top'}, ±{amplitude} on the {axis} axis every {period}s.</p>
		</div>
	)
}
