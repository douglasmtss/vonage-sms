import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegistration from "./sw-register";
import InstallPrompt from "./install-prompt";

export const metadata: Metadata = {
  title: "Vonage SMS",
  description: "Envie e receba SMS via Vonage",
  manifest: "/manifest.webmanifest",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
