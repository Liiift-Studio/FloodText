import type { Metadata } from "next"
import "./globals.css"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
	title: "Flood Text — Per-character style wave animation",
	icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/icon.svg" },
	description: "Flood Text sends a wave through body copy character by character — modulating weight, width, oblique angle, or opacity as it passes. Every letterform sits at its own moment in the curve.",
	keywords: ["flood text", "per-character animation", "variable font animation", "wave animation", "typography", "TypeScript", "npm"],
	openGraph: {
		title: "Flood Text — Per-character style wave animation",
		description: "A wave washes through body copy character by character — modulating weight, width, oblique, or opacity. Every letterform at its own moment in the curve.",
		url: "https://floodtext.com",
		siteName: "Flood Text",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Flood Text — Per-character style wave animation",
		description: "A wave washes through body copy character by character — modulating weight, width, oblique, or opacity. Every letterform at its own moment in the curve.",
	},
	metadataBase: new URL("https://floodtext.com"),
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" className={`h-full antialiased ${inter.variable}`}>
			<body className="min-h-full flex flex-col">{children}</body>
		</html>
	)
}
