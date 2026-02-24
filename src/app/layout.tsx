// =============================================================================
// Root Layout
// Global HTML structure, font loading, and metadata
// =============================================================================

import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Sans, JetBrains_Mono } from "next/font/google";
import "@/app/globals.css";

// ---------------------------------------------------------------------------
// Font Configuration
// ---------------------------------------------------------------------------

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: {
    default: "AI Hub – KI-Community-Plattform",
    template: "%s | AI Hub",
  },
  description:
    "KI-Community-Plattform fuer Teams und Unternehmen – Best Practices, Lernpfade, AI Mentor und mehr.",
  keywords: [
    "KI",
    "AI",
    "Community",
    "Best Practices",
    "Kuenstliche Intelligenz",
  ],
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

// ---------------------------------------------------------------------------
// Layout Component
// ---------------------------------------------------------------------------

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="de"
      className={`${plusJakartaSans.variable} ${dmSans.variable} ${jetBrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-surface-50 font-sans text-surface-900 antialiased">
        {children}
      </body>
    </html>
  );
}
