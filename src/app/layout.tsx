import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aarogya Voice — 24/7 AI Receptionist for Clinics",
  description:
    "Aarogya Voice answers every patient call, tells live queue status, and books appointments for your clinic — 24/7, in Hindi and English.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="min-h-dvh bg-clay-50 text-ink-900 antialiased">
        {children}
      </body>
    </html>
  );
}