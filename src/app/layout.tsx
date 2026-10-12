import type { Metadata, Viewport } from "next";
import { WatercolorDefs } from "@/components/decor";
import { themeScript } from "@/components/layout/theme-toggle";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Family Memory AI — цифровой архив личности", template: "%s · Family Memory AI" },
  description: "Сохраните историю человека, его голос, воспоминания и жизненную мудрость для будущих поколений.",
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
