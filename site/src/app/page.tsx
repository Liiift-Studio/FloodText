import Demo from "@/components/Demo"
import CopyInstall from "@/components/CopyInstall"
import CodeBlock from "@/components/CodeBlock"
import { version } from "../../../package.json"

export default function Home() {
	return (
		<main className="flex flex-col items-center px-6 py-20 gap-24">

			{/* Hero */}
			<section className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-6">
				<div className="flex flex-col gap-2">
					<p className="text-xs uppercase tracking-widest opacity-50">axis-tide</p>
					<h1 className="text-4xl lg:text-8xl xl:text-9xl" style={{ fontFamily: "var(--font-merriweather), serif", lineHeight: "1.05em" }}>
						A slow tide,<br />
						<span style={{ opacity: 0.5, fontStyle: "italic" }}>through type.</span>
					</h1>
				</div>
				<div className="flex items-center gap-4">
					<CopyInstall />
					<a href="https://github.com/quitequinn/axis-tide" target="_blank" rel="noopener noreferrer" className="text-sm opacity-50 hover:opacity-100 transition-opacity">GitHub ↗</a>
				</div>
				<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-50 tracking-wide">
					<span>TypeScript</span><span>·</span><span>Zero dependencies</span><span>·</span><span>React + Vanilla JS</span>
				</div>
				<p className="text-base opacity-60 leading-relaxed max-w-lg">
					A continuous wave — sine, sawtooth, or triangle — travels through a paragraph, modulating any variable font axis line by line. An ambient animation that gives text a breathing, living quality that print cannot have.
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
						<p className="font-semibold opacity-100 text-base">Per-line phase offset</p>
						<p>The algorithm detects visual lines, then assigns each a phase position based on its index. Each frame, the wave function is evaluated at each line&apos;s phase, producing a unique axis value per line.</p>
					</div>
					<div className="flex flex-col gap-3">
						<p className="font-semibold opacity-100 text-base">Continuous rAF loop</p>
						<p>A requestAnimationFrame loop advances the wave each frame using elapsed time, so the animation speed is consistent regardless of display refresh rate. The loop is cleaned up when the component unmounts.</p>
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
						<CodeBlock code={`import { AxisTideText } from 'axis-tide'

<AxisTideText axis="wdth" amplitude={8} period={4} waveShape="sine">
  Your paragraph text here...
</AxisTideText>`} />
					</div>
					<div className="flex flex-col gap-3">
						<p className="opacity-50">Options</p>
						<table className="w-full text-xs">
							<thead><tr className="opacity-50 text-left"><th className="pb-2 pr-6 font-normal">Option</th><th className="pb-2 pr-6 font-normal">Default</th><th className="pb-2 font-normal">Description</th></tr></thead>
							<tbody className="opacity-70">
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">axis</td><td className="py-2 pr-6">'wdth'</td><td className="py-2">Variable font axis tag.</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">baseValue</td><td className="py-2 pr-6">100</td><td className="py-2">Center value for the axis — the animation oscillates around this.</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">amplitude</td><td className="py-2 pr-6">5</td><td className="py-2">Max deviation from baseValue in axis units.</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">period</td><td className="py-2 pr-6">4</td><td className="py-2">Seconds per full wave cycle.</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">waveShape</td><td className="py-2 pr-6">'sine'</td><td className="py-2">'sine' | 'sawtooth' | 'triangle'</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">direction</td><td className="py-2 pr-6">'down'</td><td className="py-2">Wave travel direction through the paragraph.</td></tr>
							</tbody>
						</table>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="w-full max-w-2xl lg:max-w-5xl flex justify-between text-xs opacity-50 pt-8 border-t border-white/10">
				<span>axis-tide v{version}</span>
				<a href="https://liiift.studio" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">Liiift Studio</a>
			</footer>

		</main>
	)
}
