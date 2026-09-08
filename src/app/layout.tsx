import type { Metadata } from "next";
import { Fraunces, Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
});

const grotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "PulsePilot — AI Marketing Crew (Copilot + Autopilot)",
  description: "Six AI agents plan, write, design, schedule and analyse your socials across Instagram, TikTok, Facebook and LinkedIn. By Pulse Social Media.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-AU"
      className={`${display.variable} ${grotesk.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="grain min-h-full flex flex-col bg-paper text-ink font-sans">{children}</body>
    </html>
  );
}
