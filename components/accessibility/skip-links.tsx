"use client"

import Link from "next/link"

/**
 * Skip Links para navegación por teclado
 * Permite a usuarios de teclado saltar directamente al contenido principal
 * Mejora significativamente la accesibilidad (WCAG 2.1 SC 2.4.1)
 */
export function SkipLinks() {
  return (
    <div className="absolute left-4 top-4 z-50 opacity-0 focus-within:opacity-100 focus-within:pointer-events-auto pointer-events-none transition-opacity">
      <nav aria-label="Enlaces de navegación rápida">
        <ul className="flex flex-col gap-2">
          <li>
            <Link
              href="#main-content"
              className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Saltar al contenido principal
            </Link>
          </li>
          <li>
            <Link
              href="#main-navigation"
              className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Saltar a navegación principal
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  )
}

