import type { Metadata, Viewport } from "next";
import { WatercolorDefs } from "@/components/decor";
import { themeScript } from "@/components/layout/theme-toggle";
import "./globals.css";

const SITE_URL = process.env.APP_URL?.trim().replace(/\/+$/, "") || "https://family-memory-ai.altyn-click.workers.dev";
const TITLE = "Семейная память — цифровой архив личности";
const DESCRIPTION = "Сохраните историю близкого человека: голос, воспоминания, характер и жизненную мудрость — для детей и внуков.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s · Семейная память" },
  description: DESCRIPTION,
  applicationName: "Семейная память",
  // Link previews in messengers and social networks; the image is public/og.png (1200×630).
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "/",
    siteName: "Семейная память",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Семейная память — голос, воспоминания и характер близкого человека" }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: ["/og.png"] },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F4EB" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1A2B" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&display=swap&subset=cyrillic"
        />
      </head>
      <body className="min-h-dvh">
        <WatercolorDefs />
        <div className="relative z-[1]">{children}</div>
      </body>
    </html>
  );
}
