# Flood Text

**[floodtext.com](https://floodtext.com)** · [npm](https://www.npmjs.com/package/@liiift-studio/floodtext) · [GitHub](https://github.com/Liiift-Studio/FloodText)

---

## Install

```bash
npm install @liiift-studio/floodtext
```

See [floodtext.com](https://floodtext.com) for full API docs and a live demo.

---

## Dev notes

### `next` in root devDependencies

`package.json` at the repo root lists `next` as a devDependency. This is a **Vercel detection workaround** — not a real dependency of the npm package. Vercel's build system inspects the root `package.json` to detect the framework; without `next` present it falls back to a static build and skips the Next.js pipeline, breaking the `/site` subdirectory deploy.

The package itself has zero runtime dependencies. Do not remove this entry.

---

Current version: v0.0.13
