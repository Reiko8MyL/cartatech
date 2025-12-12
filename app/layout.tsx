import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { Navbar } from "@/components/navigation/navbar";
import { AuthProviderWrapper } from "@/components/providers/auth-provider-wrapper";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { AdBanner } from "@/components/ads/ad-banner";
import { AdSenseScript } from "@/components/ads/adsense-script";
import { WebsiteJsonLd } from "@/components/seo/json-ld";
import { QueryProvider } from "@/components/providers/query-provider";

// Lazy load componentes pesados que no son críticos para el render inicial
// WelcomeTour: Solo se muestra después de interacción del usuario
const WelcomeTour = dynamic(
  () => import("@/components/onboarding/welcome-tour").then((mod) => ({ default: mod.WelcomeTour })),
  { 
    loading: () => null // No mostrar loading, es silencioso
  }
);

// Analytics: No crítico para el render inicial, puede cargar después
const Analytics = dynamic(
  () => import("@vercel/analytics/react").then((mod) => ({ default: mod.Analytics })),
  { loading: () => null }
);

// SpeedInsights: Similar a Analytics, no crítico
const SpeedInsights = dynamic(
  () => import("@vercel/speed-insights/next").then((mod) => ({ default: mod.SpeedInsights })),
  { loading: () => null }
);

// GoogleAnalyticsProvider: Carga diferida, no crítico para render inicial
const GoogleAnalyticsProvider = dynamic(
  () => import("@/components/analytics/google-analytics-provider").then((mod) => ({ default: mod.GoogleAnalyticsProvider })),
  { 
    loading: () => null
  }
);

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Evitar FOIT (Flash of Invisible Text)
  preload: true, // Precargar solo la fuente principal
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  // No usar preload para evitar warnings - Next.js lo manejará automáticamente cuando sea necesario
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://cartatech.cl"),
  title: {
    default: "CartaTech",
    template: "%s | CartaTech",
  },
  description: "Deck Builder para el TCG chileno Mitos y Leyendas en formato Primer Bloque. Construye, comparte y explora mazos de la comunidad. La base de datos más completa de cartas del formato Primer Bloque Extendido.",
  keywords: ["Mitos y Leyendas", "MyL", "Deck Builder", "TCG", "Primer Bloque", "Chile", "cartas", "mazos"],
  authors: [{ name: "Carta Tech" }],
  creator: "Carta Tech",
  publisher: "Carta Tech",
  icons: {
    icon: [
      {
        url: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764480944/noseaun_jll4ef.webp",
        type: "image/webp",
      },
      {
        url: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764480944/noseaun_jll4ef.webp",
        type: "image/png",
        sizes: "32x32",
      },
      {
        url: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764480944/noseaun_jll4ef.webp",
        type: "image/png",
        sizes: "16x16",
      },
    ],
    apple: [
      {
        url: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764480944/noseaun_jll4ef.webp",
        sizes: "180x180",
        type: "image/webp",
      },
    ],
    shortcut: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764480944/noseaun_jll4ef.webp",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "/",
    siteName: "CartaTech",
    title: "CartaTech",
    description: "Deck Builder para el TCG chileno Mitos y Leyendas en formato Primer Bloque. Construye, comparte y explora mazos de la comunidad.",
    images: [
      {
        url: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764381679/logo_CT_2_txcqch.webp",
        width: 1200,
        height: 630,
        alt: "CartaTech",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CartaTech",
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
        {/* Preload de recursos críticos para mejorar LCP */}
        <link
          rel="preload"
          href="https://res.cloudinary.com/dpbmbrekj/image/upload/v1764381679/logo_CT_2_txcqch.webp"
          as="image"
          type="image/webp"
        />
        {/* DNS prefetch para dominios externos */}
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        )}
        {/* Favicon explícito - Consolidado para evitar múltiples preloads */}
        <link
          rel="icon"
          type="image/webp"
          href="https://res.cloudinary.com/dpbmbrekj/image/upload/v1764480944/noseaun_jll4ef.webp"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="https://res.cloudinary.com/dpbmbrekj/image/upload/v1764480944/noseaun_jll4ef.webp"
        />
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
          <QueryProvider>
            <ErrorBoundary>
              <AuthProviderWrapper>
                <Navbar />
              {/* Banner superior de anuncios - Solo visible en desktop */}
              {/* DESACTIVADO TEMPORALMENTE - Para reactivar, descomentar la sección siguiente */}
              {/* {adsenseId && (
                <div className="hidden lg:block w-full border-b border-border/40 bg-muted/30 py-2">
                  <div className="container mx-auto px-4">
                    <AdBanner position="top" />
                  </div>
                </div>
              )} */}
              {children}
              <Toaster 
                position="top-right"
                richColors
                closeButton
              />
              {/* WelcomeTour: Carga diferida, no bloquea render inicial */}
              <Suspense fallback={null}>
                <WelcomeTour />
              </Suspense>
            </AuthProviderWrapper>
          </ErrorBoundary>
          </QueryProvider>
        </ThemeProvider>
        <WebsiteJsonLd />
        {/* Analytics y SpeedInsights: Carga diferida, no críticos para render inicial */}
        <Suspense fallback={null}>
          <Analytics />
          <SpeedInsights />
        </Suspense>
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
