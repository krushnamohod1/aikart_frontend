import type { Metadata } from "next";
import { Red_Hat_Display, Poppins, Inter, Playfair_Display, DM_Sans, Jura, Roboto } from "next/font/google";
import "./globals.css";
import AgentAdvisor from "@/components/chat/AgentAdvisor";
import MobileDesktopNotice from "@/components/layout/MobileDesktopNotice";
import Script from 'next/script';
import { Suspense } from 'react';
import GAPageView from '@/components/analytics/GAPageView';
import { ScheduleMeetingModal } from "@/components/modals/ScheduleMeetingModal";
import { ContactModal } from "@/components/modals/ContactModal";
import { CustomSolutionModal } from "@/components/modals/CustomSolutionModal";
import { CustomMLModelModal } from "@/components/modals/CustomMLModelModal";
import { AppLoader } from "@/components/ui/AppLoader";

// 1. Red Hat Display — for all headings (h1, h2, h3, h4, h5, h6)
const redHat = Red_Hat_Display({
  subsets: ["latin"],
  variable: "--font-red-hat",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

// 2. Poppins — for all body text (p, spans, labels, buttons, general UI text)
const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// 3. Inter — for small utility text, notes, captions, helper text, fine print, and basic info labels
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", style: ['normal', 'italic'], weight: ['400', '600', '700'] });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const jura = Jura({ subsets: ["latin"], variable: "--font-jura", weight: ['400', '700'] });
const roboto = Roboto({ subsets: ["latin"], variable: "--font-roboto", weight: ['400'] });

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://aikart.co";
const SITE_TITLE = "aiKart a Marketplace for AI Agents";
const SITE_DESCRIPTION = "Discover, deploy and monetize AI agents built for every workflow";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: "aiKart",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
        {/* Preconnect to Google Fonts CDN — eliminates DNS + TCP round-trip before font requests */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        {/* Sansita One (brand logo) — not available via next/font/google */}
        <link href="https://fonts.googleapis.com/css2?family=Sansita+One&display=swap" rel="stylesheet" />

        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', { send_page_view: false });
          `}
        </Script>
      </head>
      <body suppressHydrationWarning className={`${inter.variable} ${playfair.variable} ${dmSans.variable} ${redHat.variable} ${poppins.variable} ${jura.variable} ${roboto.variable} antialiased bg-background text-on-background min-h-screen flex flex-col`}>
        <Suspense fallback={null}>
          <GAPageView />
        </Suspense>
        {children}
        <AgentAdvisor />
        <MobileDesktopNotice />
        <ScheduleMeetingModal />
        <ContactModal />
        <CustomSolutionModal />
        <CustomMLModelModal />
      </body>
    </html>
  );
}
