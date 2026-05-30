import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { AppLayout } from "@/components/AppLayout";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Miso Hungry",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Miso Hungry",
  },
  description: "A personal recipe tracker for favorite meals, pantry notes, and grocery planning.",
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  title: {
    default: "Miso Hungry",
    template: "%s | Miso Hungry",
  },
};

export const viewport: Viewport = {
  initialScale: 1,
  themeColor: "#bc5a43",
  viewportFit: "cover",
  width: "device-width",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppLayout>{children}</AppLayout>
        <Analytics />
      </body>
    </html>
  );
}
