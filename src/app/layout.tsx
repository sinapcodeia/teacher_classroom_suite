import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import OfflineToast from "@/components/shared/OfflineToast";

// ── Versión e institución — importadas, nunca quemadas ──────────────────────
import pkg from "../../package.json";
const APP_NAME_STATIC = "EduManager";
const INSTITUTION_STATIC = "IETABA";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${APP_NAME_STATIC} v${pkg.version} | ${INSTITUTION_STATIC}`,
  description: `Sistema de gestión escolar institucional — ${INSTITUTION_STATIC}`,
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME_STATIC,
  },
};

export const viewport: Viewport = {
  themeColor: "#00288e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-on-background font-inter">
        <AppProvider>
          {children}
          <OfflineToast />
        </AppProvider>
      </body>
    </html>
  );
}
