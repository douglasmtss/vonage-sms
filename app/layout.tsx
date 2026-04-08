import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegistration from "./sw-register";
import InstallPrompt from "./install-prompt";

export const metadata: Metadata = {
  title: "Vonage SMS",
  description: "Envie e receba SMS via Vonage",
  // Static file in public/ — works reliably via ngrok and Vercel
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vonage SMS",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-100 min-h-screen" suppressHydrationWarning>
        {children}
        <ServiceWorkerRegistration />
        <InstallPrompt />
      </body>
    </html>
  );
}
