import type { Metadata, Viewport } from "next";
import "./globals.css";
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
    <html lang="es" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-on-background font-inter">

        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for(let registration of registrations) {
                    registration.unregister();
                  }
                });
              }
            `
          }}
        />

        <AppProvider>
          {children}
          <OfflineToast />
          <HelpChatbot />
        </AppProvider>
      </body>
    </html>
  );
}
