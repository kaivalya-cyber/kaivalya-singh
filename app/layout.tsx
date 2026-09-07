import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Fragment_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

/** Fragment Mono stands in for Berkeley Mono per 03-TECHNICAL.md open items */
const fragmentMono = Fragment_Mono({
  variable: "--font-fragment-mono",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kaivalya-singh.vercel.app"),
  title: {
    default: "Kaivalya Singh — RL · Quantum · CV",
    template: "%s — Kaivalya Singh",
  },
  description:
    "Reinforcement learning research (Lyapunov Satisfaction Rate), a variational quantum error-correction decoder, multi-agent drone swarms, and shipped production work. San Jose, CA.",
  keywords: [
    "Kaivalya Singh",
    "reinforcement learning",
    "quantum computing",
    "computer vision",
    "multi-agent RL",
    "QEC decoder",
    "Lyapunov Satisfaction Rate",
  ],
  openGraph: {
    title: "Kaivalya Singh — RL · Quantum · CV",
    description:
      "Learning systems that survive contact with physics — variational quantum decoders, drone swarms, and control-stability research.",
    url: "https://kaivalya-singh.vercel.app",
    siteName: "Kaivalya Singh",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kaivalya Singh — RL · Quantum · CV",
    description:
      "Learning systems that survive contact with physics — variational quantum decoders, drone swarms, and control-stability research.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0E0D0B",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${fragmentMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-text-primary font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-bg-raised focus:px-4 focus:py-2 focus:text-sm focus:text-accent-link focus:outline-2 focus:outline-accent-link"
        >
          Skip to content
        </a>
        {children}
        <div className="grain-overlay" aria-hidden="true" />
      </body>
    </html>
  );
}
