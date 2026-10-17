import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import { DemoBanner } from "@/components/layout/DemoBanner";
import { isDemoMode, SITE_URL } from "@/lib/env";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-bricolage", display: "swap" });
const sans = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

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
  themeColor: "#0a0b14",
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
