import type { Metadata } from "next";
import { IBM_Plex_Sans, Inter, Newsreader } from "next/font/google";
import "./globals.css";
import localFont from "next/font/local";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
});

const inter = Inter({
  variable: "--font-inter-sans",
  subsets: ["latin", "latin-ext"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader-serif",
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
});

const logoFace = localFont({
  src: "./fonts/DigitalNumbers-Regular.ttf",
  variable: "--font-logo-face",
});

export const metadata: Metadata = {
  title: "PRI 2.0",
  description: "System obsługi Projektu Inżynierskiego",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pl"
      className={`${plexSans.variable} ${inter.variable} ${newsreader.variable} ${logoFace.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}