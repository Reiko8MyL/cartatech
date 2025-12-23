"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { pageview } from "@/lib/analytics/gtag";

/**
 * Componente que trackea automáticamente los pageviews en Google Analytics
 * cuando cambia la ruta en Next.js App Router
 */
export function GoogleAnalyticsProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Construir la URL completa con query params
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");

    // Trackear el pageview
    pageview(url);
  }, [pathname, searchParams]);

  return null;
}



































