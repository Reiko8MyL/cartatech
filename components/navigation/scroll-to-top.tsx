"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

/**
 * Componente que hace scroll al top cuando cambia la ruta
 * Esto asegura que al navegar entre páginas, siempre se inicie desde arriba
 */
export function ScrollToTop() {
  const pathname = usePathname()

  useEffect(() => {
    // Hacer scroll al top cuando cambia la ruta
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant", // Usar "instant" para mejor rendimiento
    })
  }, [pathname])

  return null
}


















