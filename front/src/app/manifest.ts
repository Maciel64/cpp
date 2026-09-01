import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Receipt Capture — Expense Tracker",
    short_name: "ReceiptCapture",
    description:
      "Capture de recibos com OCR simulado, revisão e confirmação de despesas.",
    start_url: "/",
    display: "standalone",
    background_color: "#F1FFDB",
    theme_color: "#50F0C5",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-192.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
