import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});
import { AppProvider } from "@/context/AppContext";
import OfflineToast from "@/components/shared/OfflineToast";
import HelpChatbot from "@/components/help/HelpChatbot";

// ── Versión e institución — importadas, nunca quemadas ──────────────────────
import pkg from "../../package.json";
const APP_NAME_STATIC = "EduManager";
const INSTITUTION_STATIC = "IETABA";

export const metadata: Metadata = {
  title: `${APP_NAME_STATIC} v${pkg.version} | ${INSTITUTION_STATIC}`,
  description: `Sistema de gestión escolar institucional — ${INSTITUTION_STATIC}`,
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" }
    ],
    shortcut: "/favicon.ico",
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
    <html lang="es" className={`h-full antialiased ${jakarta.variable} ${outfit.variable}`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-on-background font-sans overflow-x-hidden w-full max-w-full">
        <AppProvider>
          {children}
          <OfflineToast />
          <HelpChatbot />
        </AppProvider>
      </body>
    </html>
  );
}
