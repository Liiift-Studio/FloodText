// OG image for FloodText — uses tool theme colour and handles font load errors gracefully
import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const alt = 'Flood Text — Per-character wave animation for text'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** Tool background: oklch(0.12 0.0400 53) */
const BG    = '#fbd7f9'
/** Foreground — main headline */
const FG    = '#321a31'
/** Muted — secondary text, eyebrow, footer chips */
const MUTED = '#564755'
/** Subtle — domain */
const SUBTLE = '#726471'
/** Bar dim — shorter preview bars */
const BAR_DIM = '#8e828d'

export default async function Image() {
	/** Load local Inter 300 — fall back gracefully if the font file is missing */
	let interLight: Buffer | null = null
	try {
		interLight = await readFile(join(process.cwd(), 'public/fonts/inter-300.woff'))
	} catch {
		// Font unavailable — Satori will use its built-in fallback
	}

	const fonts = interLight
		? [{ name: 'Inter', data: interLight, style: 'normal' as const, weight: 300 as const }]
		: []

	return new ImageResponse(
		(
			<div style={{ background: BG, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '72px 80px', fontFamily: 'Inter, sans-serif' }}>
				{/* Eyebrow */}
				<span style={{ fontSize: 13, letterSpacing: '0.18em', color: MUTED, textTransform: 'uppercase' }}>floodtext</span>

				{/* Wave preview bars + headline */}
				<div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
					<div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 48 }}>
						{[0.85, 0.9, 1.0, 0.95, 0.88].map((scale, i) => (
							<div key={i} style={{ width: `${scale * 550}px`, height: 3, background: i === 2 ? MUTED : BAR_DIM, borderRadius: 2 }} />
						))}
					</div>
					<div style={{ fontSize: 76, color: FG, lineHeight: 1.06, fontWeight: 300 }}>Character</div>
					<div style={{ fontSize: 76, color: MUTED, lineHeight: 1.06, fontWeight: 300, fontStyle: 'italic' }}>by character.</div>
				</div>

				{/* Footer */}
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
					<div style={{ fontSize: 14, color: MUTED, letterSpacing: '0.04em', display: 'flex', gap: 20 }}>
						<span>TypeScript</span><span style={{ opacity: 0.4 }}>·</span>
						<span>rAF animation</span><span style={{ opacity: 0.4 }}>·</span>
						<span>React + Vanilla JS</span>
					</div>
					<div style={{ fontSize: 13, color: SUBTLE, letterSpacing: '0.04em' }}>floodtext.com</div>
				</div>
			</div>
		),
		{ ...size, fonts },
	)
}
