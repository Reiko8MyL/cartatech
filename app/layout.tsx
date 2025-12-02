import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { Navbar } from "@/components/navigation/navbar";
import { AuthProviderWrapper } from "@/components/providers/auth-provider-wrapper";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { AdBanner } from "@/components/ads/ad-banner";
import { AdSenseScript } from "@/components/ads/adsense-script";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { WebsiteJsonLd } from "@/components/seo/json-ld";
import { WelcomeTour } from "@/components/onboarding/welcome-tour";
import { GoogleAnalyticsProvider } from "@/components/analytics/google-analytics-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://cartatech.com"),
  title: {
    default: "Carta Tech - MyL Deck Builder",
    template: "%s | Carta Tech - MyL Deck Builder",
  },
  description: "Deck Builder para el TCG chileno Mitos y Leyendas en formato Primer Bloque. Construye, comparte y explora mazos de la comunidad. La base de datos más completa de cartas del formato Primer Bloque Extendido.",
  keywords: ["Mitos y Leyendas", "MyL", "Deck Builder", "TCG", "Primer Bloque", "Chile", "cartas", "mazos"],
  authors: [{ name: "Carta Tech" }],
  creator: "Carta Tech",
  publisher: "Carta Tech",
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "/",
    siteName: "Carta Tech",
    title: "Carta Tech - MyL Deck Builder",
    description: "Deck Builder para el TCG chileno Mitos y Leyendas en formato Primer Bloque. Construye, comparte y explora mazos de la comunidad.",
    images: [
      {
        url: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764381679/logo_CT_2_txcqch.webp",
        width: 1200,
        height: 630,
        alt: "Carta Tech - MyL Deck Builder",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Carta Tech - MyL Deck Builder",
    description: "Deck Builder para el TCG chileno Mitos y Leyendas en formato Primer Bloque.",
    images: ["https://res.cloudinary.com/dpbmbrekj/image/upload/v1764381679/logo_CT_2_txcqch.webp"],
    creator: "@cartatech",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Agregar códigos de verificación cuando estén disponibles
    // google: "verification-code",
    // yandex: "verification-code",
  },
  other: {
    // Google AdSense verification meta tag
    ...(process.env.NEXT_PUBLIC_ADSENSE_ID && {
      "google-adsense-account": process.env.NEXT_PUBLIC_ADSENSE_ID,
    }),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID;

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Google AdSense - Script de anuncios */}
        {adsenseId && <AdSenseScript adsenseId={adsenseId} />}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="cartatech-theme"
        >
          <ErrorBoundary>
            <AuthProviderWrapper>
              <Navbar />
              {/* Banner superior de anuncios - Solo visible en desktop */}
              {adsenseId && (
                <div className="hidden lg:block w-full border-b border-border/40 bg-muted/30 py-2">
                  <div className="container mx-auto px-4">
                    <AdBanner position="top" />
                  </div>
                </div>
              )}
              {children}
              <Toaster 
                position="top-right"
                richColors
                closeButton
              />
              <WelcomeTour />
            </AuthProviderWrapper>
          </ErrorBoundary>
        </ThemeProvider>
        <WebsiteJsonLd />
        <Analytics />
        <SpeedInsights />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
            <Suspense fallback={null}>
              <GoogleAnalyticsProvider />
            </Suspense>
          </>
        )}
      </body>
    </html>
  );
}
