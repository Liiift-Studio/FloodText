import Demo from "@/components/Demo"
import CopyInstall from "@/components/CopyInstall"
import CodeBlock from "@/components/CodeBlock"
import ToolDirectory from "@/components/ToolDirectory"
import { version } from "../../../package.json"

export default function Home() {
	return (
		<main className="flex flex-col items-center px-6 py-20 gap-24">

			{/* Hero */}
			<section className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-6">
				<div className="flex flex-col gap-2">
					<p className="text-xs uppercase tracking-widest opacity-50">floodtext</p>
					<h1 className="text-4xl lg:text-8xl xl:text-9xl" style={{ fontFamily: "var(--font-merriweather), serif", lineHeight: "1.05em" }}>
						Character<br />
						<span style={{ opacity: 0.5, fontStyle: "italic" }}>by character.</span>
					</h1>
				</div>
				<div className="flex items-center gap-4">
					<CopyInstall />
					<a href="https://github.com/Liiift-Studio/FloodText" className="text-sm opacity-50 hover:opacity-100 transition-opacity">GitHub</a>
				</div>
				<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-50 tracking-wide">
					<span>TypeScript</span><span>·</span><span>Zero dependencies</span><span>·</span><span>React + Vanilla JS</span>
				</div>
				<p className="text-base opacity-60 leading-relaxed max-w-lg">
					A wave washes through the body copy character by character — modulating weight, width, oblique angle, or opacity as it passes. Not line by line, not word by word: every letterform sits at its own moment in the curve. At low amplitude it reads as texture; at high amplitude, as transformation.
				</p>
			</section>

			{/* Demo */}
			<section className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-4">
				<p className="text-xs uppercase tracking-widest opacity-50">Live demo — watch the paragraph</p>
				<div className="rounded-xl -mx-8 px-8 py-8" style={{ background: "rgba(0,0,0,0.25)" }}>
					<Demo />
				</div>
			</section>

			{/* Explanation */}
			<section className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-6">
				<p className="text-xs uppercase tracking-widest opacity-50">How it works</p>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-12 text-sm leading-relaxed opacity-70">
					<div className="flex flex-col gap-3">
						<p className="font-semibold opacity-100 text-base">Per-character phase</p>
						<p>Every visible character is wrapped in an inline span. Each frame, the wave function is evaluated at that character&apos;s position in the text — normalised across the whole paragraph. The density option controls how many wave cycles are visible at once.</p>
					</div>
					<div className="flex flex-col gap-3">
						<p className="font-semibold opacity-100 text-base">Traveling wave</p>
						<p>The wave advances through the characters over time using a requestAnimationFrame loop. Speed is consistent regardless of display refresh rate. The loop cleans up on unmount. Whitespace is left as bare text nodes — no layout impact, no reflow.</p>
					</div>
				</div>
			</section>

			{/* Usage */}
			<section className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-6">
				<div className="flex items-baseline gap-4">
					<p className="text-xs uppercase tracking-widest opacity-50">Usage</p>
				</div>
				<div className="flex flex-col gap-8 text-sm">
					<div className="flex flex-col gap-3">
						<p className="opacity-50">Drop-in component</p>
						<CodeBlock code={`import { FloodText } from '@liiift-studio/floodtext'

<FloodText effect="wght" amplitude={200} period={4} density={2} direction="diagonal-down">
  Your paragraph text here...
</FloodText>`} />
					</div>
					<div className="flex flex-col gap-3">
						<p className="opacity-50">Hook</p>
						<CodeBlock code={`import { useFloodText } from '@liiift-studio/floodtext'

const ref = useFloodText({ effect: 'wght', amplitude: 200, period: 4, density: 2, direction: 'diagonal-down' })
<p ref={ref}>{children}</p>`} />
					</div>
					<div className="flex flex-col gap-3">
						<p className="opacity-50">Vanilla JS</p>
						<CodeBlock code={`import { applyFloodText, startFloodText, removeFloodText, getCleanHTML } from '@liiift-studio/floodtext'

const el = document.querySelector('p')
const original = getCleanHTML(el)
const chars = applyFloodText(el, original, { effect: 'wght', amplitude: 200, period: 4, density: 2, direction: 'diagonal-down' })
const stop = startFloodText(chars, { effect: 'wght', amplitude: 200, period: 4, density: 2, direction: 'diagonal-down' })

// Later — stop animation and restore:
stop()
removeFloodText(el, original)`} />
					</div>
					<div className="flex flex-col gap-3">
						<p className="opacity-50">Options</p>
						<table className="w-full text-xs">
							<thead><tr className="opacity-50 text-left"><th className="pb-2 pr-6 font-normal">Option</th><th className="pb-2 pr-6 font-normal">Default</th><th className="pb-2 font-normal">Description</th></tr></thead>
							<tbody className="opacity-70">
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">effect</td><td className="py-2 pr-6">&apos;wght&apos;</td><td className="py-2">&apos;wght&apos; | &apos;wdth&apos; | &apos;oblique&apos; | &apos;opacity&apos; | &apos;rotation&apos; | &apos;blur&apos; | &apos;size&apos;. Pass an array to layer multiple effects simultaneously. Note: oblique requires Chrome 87+, Firefox 88+, Safari 14.1+. size causes layout recalculation per frame — use low amplitude.</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">amplitude</td><td className="py-2 pr-6">auto</td><td className="py-2">Peak deviation from neutral. Used for single-effect mode. Defaults: wght 200, wdth 20, oblique 15deg, opacity 0.3, rotation 15deg, blur 2px, size 0.15em.</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">amplitudes</td><td className="py-2 pr-6">—</td><td className="py-2">Per-effect amplitude overrides when layering multiple effects. E.g. <span className="font-mono">{`{ wght: 300, blur: 3 }`}</span>.</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">properties</td><td className="py-2 pr-6">—</td><td className="py-2">Animate any CSS property or CSS custom property on each character, driven by the same wave. Each entry: <span className="font-mono">{`{ property, base, amplitude, unit?, clamp? }`}</span>. Works with CSS variables. E.g. <span className="font-mono">{`[{ property: 'letter-spacing', base: 0, amplitude: 0.05, unit: 'em' }]`}</span> or <span className="font-mono">{`[{ property: '--my-axis', base: 100, amplitude: 20 }]`}</span>.</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">period</td><td className="py-2 pr-6">4</td><td className="py-2">Seconds per full wave cycle.</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">density</td><td className="py-2 pr-6">2</td><td className="py-2">Wave cycles visible across the paragraph at once. Higher = more bands.</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">direction</td><td className="py-2 pr-6">&apos;diagonal-down&apos;</td><td className="py-2">&apos;diagonal-down&apos; ↘ | &apos;diagonal-up&apos; ↗ | &apos;right&apos; → | &apos;left&apos; ←. Diagonal directions use 2D character positions.</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">waveShape</td><td className="py-2 pr-6">&apos;sine&apos;</td><td className="py-2">&apos;sine&apos; | &apos;sawtooth&apos; | &apos;triangle&apos;</td></tr>
							</tbody>
						</table>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-6 pt-8 border-t border-white/10 text-xs">
				<ToolDirectory current="floodText" />
				<div className="flex justify-between opacity-50">
				<span>floodText v{version}</span>
				<a href="https://liiift.studio" className="hover:opacity-100 transition-opacity">Liiift Studio</a>
				</div>
			</footer>

		</main>
	)
}
