// README Studio capture harness for FloodText.
// Boots the Next.js demo site (site/) on PORT, opens the live demo in headless
// Chromium, and captures README visuals into assets/:
//   - flood-hero.png   : a single representative frame of the wave mid-paragraph
//   - flood-wave.gif    : the wave traveling through the text (assembled from frames)
//
// Reproducible: run `node scripts/capture.mjs` from the repo root. Requires the
// site deps installed (site/node_modules) and Playwright + ffmpeg available
// (both ship with the global ms-playwright cache used here).
//
// Env: PORT (default 3104), HOST (default 127.0.0.1).

import { spawn } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";

const ROOT = process.cwd();
const SITE = join(ROOT, "site");
const PORT = process.env.PORT ? Number(process.env.PORT) : 3104;
const HOST = process.env.HOST ?? "127.0.0.1";
const BASE = `http://${HOST}:${PORT}`;
const ASSETS = join(ROOT, "assets");
const FRAMES = join(ASSETS, ".frames");

// Waits until the dev server answers a 200 (or times out).
async function waitForServer(url, timeoutMs = 90000) {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		try {
			const res = await fetch(url);
			if (res.ok) return true;
		} catch {
			// not up yet
		}
		await new Promise((r) => setTimeout(r, 800));
	}
	throw new Error(`Dev server did not start at ${url} within ${timeoutMs}ms`);
}

await mkdir(ASSETS, { recursive: true });
await rm(FRAMES, { recursive: true, force: true });
await mkdir(FRAMES, { recursive: true });

// 1. Boot the Next dev server bound to PORT.
console.log("Starting dev server on %s ...", BASE);
const server = spawn("npm", ["run", "dev", "--", "--port", String(PORT), "--hostname", HOST], {
	cwd: SITE,
	stdio: "inherit",
	env: { ...process.env },
});

let browser;
try {
	await waitForServer(BASE);

	browser = await chromium.launch();
	const page = await browser.newPage({
		viewport: { width: 1280, height: 900 },
		deviceScaleFactor: 2,
	});
	await page.goto(BASE, { waitUntil: "networkidle" });
	await page.evaluate(() => document.fonts.ready);

	// Dismiss the cookie banner so it never appears in any capture.
	const decline = page.getByRole("button", { name: /decline/i });
	if (await decline.count()) await decline.first().click().catch(() => {});

	// The live FloodText paragraphs sit in the inner flex column of the demo card.
	// Targeting that container excludes the slider/toggle controls above it.
	const demoCard = page.locator("section:has(h2:has-text('Live demo')) > div").first();
	await demoCard.waitFor({ state: "visible" });
	const flood = demoCard.locator("div.flex.flex-col.gap-8").first();
	await flood.waitFor({ state: "visible" });
	await page.waitForTimeout(1200); // let variable-font glyphs settle into the wave

	// 2. Static hero — one representative mid-wave frame of the flooded text.
	await flood.screenshot({ path: join(ASSETS, "flood-hero.png") });
	console.log("captured assets/flood-hero.png");

	// 3. Animated wave — capture a sequence of frames, then stitch to GIF.
	const FRAME_COUNT = 30; // ~3s at 10fps
	const FRAME_MS = 1000 / 10;
	for (let i = 0; i < FRAME_COUNT; i++) {
		await flood.screenshot({
			path: join(FRAMES, `frame-${String(i).padStart(3, "0")}.png`),
		});
		await page.waitForTimeout(FRAME_MS);
	}
	console.log("captured %d frames for GIF", FRAME_COUNT);

	await browser.close();
	browser = null;

	// 4. Stitch frames into a looping GIF. Use a system ffmpeg on PATH (the
	// static binary bundled in the Playwright cache rejects the dither syntax).
	const ffmpeg = "ffmpeg";
	await new Promise((resolve, reject) => {
		const args = [
			"-y",
			"-framerate", "10",
			"-i", join(FRAMES, "frame-%03d.png"),
			"-vf", "fps=10,scale=680:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=96[p];[s1][p]paletteuse=dither=bayer:bayer_scale=2",
			"-loop", "0",
			join(ASSETS, "flood-wave.gif"),
		];
		const proc = spawn(ffmpeg, args, { stdio: "inherit" });
		proc.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`))));
		proc.on("error", reject);
	});
	console.log("captured assets/flood-wave.gif");

	await rm(FRAMES, { recursive: true, force: true });
} finally {
	if (browser) await browser.close();
	server.kill("SIGTERM");
	// give the dev server a moment to release the port
	await new Promise((r) => setTimeout(r, 500));
}

console.log("Done.");
