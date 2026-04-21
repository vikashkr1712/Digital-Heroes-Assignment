import type { Metadata } from "next";
import { Playfair_Display, Space_Grotesk } from "next/font/google";

import { SiteHeader } from "@/components/site-header";

import "./globals.css";

const headingFont = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const bodyFont = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Digital Heroes Impact Draw",
  description:
    "Subscription-powered golf score tracking, charity contribution, and monthly reward draws.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${headingFont.variable} ${bodyFont.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-page text-slate-900">
        <div className="page-texture" />
        <SiteHeader />
        <div className="relative z-10 flex min-h-[calc(100vh-65px)] flex-col">{children}</div>
        <footer className="relative z-10 border-t border-slate-200/70 bg-white/70 px-4 py-4 text-xs text-slate-500 sm:px-6">
          Digital Heroes Selection Project • Built for the Full-Stack PRD Assignment
        </footer>
      </body>
    </html>
  );
}
