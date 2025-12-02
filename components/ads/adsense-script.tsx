"use client"

import { useEffect } from "react"
import Script from "next/script"

interface AdSenseScriptProps {
  adsenseId: string
}

export function AdSenseScript({ adsenseId }: AdSenseScriptProps) {
  useEffect(() => {
    // Interceptar errores de red relacionados con AdSense
    // para evitar que aparezcan en la consola cuando hay bloqueadores
    const handleError = (event: ErrorEvent) => {
      // Filtrar errores de AdSense bloqueados por bloqueadores de anuncios
      if (
        event.message &&
        (event.message.includes("adsbygoogle") ||
          event.message.includes("googlesyndication") ||
          event.message.includes("ERR_BLOCKED_BY_CLIENT") ||
          event.filename?.includes("adsbygoogle") ||
          event.filename?.includes("googlesyndication"))
      ) {
        // Prevenir que el error aparezca en la consola
        event.preventDefault()
        // Solo loggear en desarrollo si es necesario
        if (process.env.NODE_ENV === "development") {
          console.debug("AdSense bloqueado por bloqueador de anuncios (normal)")
        }
        return false
      }
    }

    // Interceptar errores no capturados de recursos
    const handleResourceError = (event: Event) => {
      const target = event.target as HTMLElement
      if (
        target &&
        (target.tagName === "SCRIPT" || target.tagName === "LINK")
      ) {
        const src = (target as HTMLScriptElement).src || (target as HTMLLinkElement).href
        if (
          src &&
          (src.includes("adsbygoogle") || src.includes("googlesyndication"))
        ) {
          event.preventDefault()
          if (process.env.NODE_ENV === "development") {
            console.debug("Recurso de AdSense bloqueado (normal)")
          }
          return false
        }
      }
    }

    // Agregar listeners
    window.addEventListener("error", handleError, true)
    window.addEventListener("error", handleResourceError, true)

    return () => {
      // Limpiar listeners al desmontar
      window.removeEventListener("error", handleError, true)
      window.removeEventListener("error", handleResourceError, true)
    }
  }, [])

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
      strategy="afterInteractive"
      crossOrigin="anonymous"
    />
  )
}

