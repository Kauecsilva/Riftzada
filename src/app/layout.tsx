import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import { DemoBanner } from "@/components/layout/DemoBanner";
import { isDemoMode, SITE_URL } from "@/lib/env";
import "./globals.css";

// Condensada e pesada como o logotipo de Riftbound; o texto corrido fica na Barlow normal
const display = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display-face", display: "swap" });
const sans = Barlow({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-body-face", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Riftzada", template: "%s · Riftzada" },
  description: "A comunidade local de Riftbound. Torneios, lojas, trocas e resenha.",
  applicationName: "Riftzada",
  appleWebApp: { capable: true, title: "Riftzada", statusBarStyle: "black-translucent" },
  icons: { icon: "/icons/icon.svg", apple: "/icons/apple-touch-icon.png" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#050b14",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable}`}>
      <body>
        <ToastProvider>
          {isDemoMode && <DemoBanner />}
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
