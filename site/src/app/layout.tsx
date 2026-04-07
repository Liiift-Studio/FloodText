import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
	title: "Axis Tide — Ambient variable font wave animation",
	icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/icon.svg" },
	description: "Axis Tide sends a slow wave through a paragraph, modulating any variable font axis line by line. An ambient animation that gives text a breathing, living quality.",
	keywords: ["axis tide", "variable font animation", "wave animation", "typography", "TypeScript", "npm"],
	openGraph: {
		title: "Axis Tide — Ambient variable font wave animation",
		description: "A slow wave travels through a paragraph, modulating any variable font axis line by line.",
		url: "https://axis-tide.liiift.studio",
		siteName: "Axis Tide",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Axis Tide — Ambient variable font wave animation",
		description: "A slow wave travels through a paragraph, modulating any variable font axis line by line.",
	},
	metadataBase: new URL("https://axis-tide.liiift.studio"),
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" className="h-full antialiased">
			<body className="min-h-full flex flex-col">{children}</body>
		</html>
	)
}
