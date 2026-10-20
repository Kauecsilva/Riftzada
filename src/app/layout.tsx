import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import { ToastProvider } from "@/components/ui/Toast";
import { DemoBanner } from "@/components/layout/DemoBanner";
import { isDemoMode, SITE_URL } from "@/lib/env";
import "./globals.css";

// Arquivos OFL locais: a interface e o build funcionam mesmo sem acesso ao Google Fonts.
const display = localFont({
  src: [
    { path: "../fonts/BarlowCondensed-SemiBold.ttf", weight: "600" },
    { path: "../fonts/BarlowCondensed-Bold.ttf", weight: "700" },
    { path: "../fonts/BarlowCondensed-ExtraBold.ttf", weight: "800" },
  ],
  variable: "--font-display-face",
  display: "swap",
});
const sans = localFont({
  src: [
    { path: "../fonts/Barlow-Regular.ttf", weight: "400" },
    { path: "../fonts/Barlow-Medium.ttf", weight: "500" },
    { path: "../fonts/Barlow-SemiBold.ttf", weight: "600" },
    { path: "../fonts/Barlow-Bold.ttf", weight: "700" },
  ],
  variable: "--font-body-face",
  display: "swap",
});
const ceremony = localFont({
  src: "../fonts/Cinzel-Variable.ttf",
  weight: "400 900",
  variable: "--font-ceremony-face",
  display: "swap",
});

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
  themeColor: "#211a32",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable} ${ceremony.variable}`} suppressHydrationWarning>
      <body>
        <Script id="riftzada-theme" strategy="beforeInteractive">
          {`try { const theme = localStorage.getItem("riftzada-theme"); if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme; } catch {}`}
        </Script>
        <ToastProvider>
          {isDemoMode && <DemoBanner />}
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
