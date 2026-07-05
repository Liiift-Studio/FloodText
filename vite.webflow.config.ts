// vite.webflow.config.ts — standalone minified IIFE bundle for Webflow Custom Code Embed.
// Produces a single self-contained browser global (window.FloodText) with no module loader,
// no React, and no external dependencies — droppable into a Webflow embed via one <script> tag.
import { defineConfig } from 'vite'

export default defineConfig({
	build: {
		// Do not wipe dist/ — the library build (vite.config.ts) writes index.js/.cjs there too.
		emptyOutDir: false,
		lib: {
			entry: 'src/webflow/embed.ts',
			formats: ['iife'],
			// Exposes the module's exports (init, destroy) as window.FloodText.
			name: 'FloodText',
			fileName: () => 'floodtext.webflow.min.js',
		},
		rollupOptions: {
			// The core's optional `import('sentiment')` must not be inlined — the embed never
			// enables sentiment mode, and bundling the AFINN lexicon adds ~40 kB of dead weight.
			// Kept external: the runtime import() is never reached, and the core catches its absence.
			external: ['sentiment'],
		},
		minify: true,
	},
})
