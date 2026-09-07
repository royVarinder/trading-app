import type { Metadata } from "next";
import { Geist, Geist_Mono, Hanken_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fincept theme fonts — used by the marketing landing page and the auth
// screens (login/signup/forgot/reset). Scoped via the `--font-hanken` /
// `--font-inter-fincept` vars in globals.css rather than replacing
// `--font-sans`, so the existing dashboard/admin UI keeps using Geist.
const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const interFincept = Inter({
  variable: "--font-inter-raw",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PRIMEFX",
  description: "PRIMEFX member dashboard",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${hankenGrotesk.variable} ${interFincept.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
