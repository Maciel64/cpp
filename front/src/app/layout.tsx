import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClientOnly } from "@/components/client-only";
import { Providers } from "@/components/providers";
import { SwRegister } from "@/components/sw-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Receipt Capture — Expense Tracker",
  description:
    "Capture de recibos com OCR simulado, revisão e confirmação de despesas.",
  manifest: "/manifest.webmanifest",
  icons: {
    apple: "/icons/icon-192.png",
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "ReceiptCapture",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#2D779E",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <ClientOnly>
            <div className="flex flex-1 flex-col">{children}</div>
          </ClientOnly>
          <SwRegister />
        </Providers>
      </body>
    </html>
  );
}
