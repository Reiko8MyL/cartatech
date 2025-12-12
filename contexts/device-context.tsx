"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

type DeviceType = 'mobile' | 'tablet' | 'desktop'

interface DeviceContextValue {
  deviceType: DeviceType
}

const DeviceContext = createContext<DeviceContextValue | undefined>(undefined)

/**
 * Provider de contexto para tipo de dispositivo
 * Evita recalcular el tipo de dispositivo en cada componente
 */
export function DeviceProvider({ children }: { children: ReactNode }) {
  const [deviceType, setDeviceType] = useState<DeviceType>(() => {
    if (typeof window === "undefined") return "desktop"
    return detectDeviceType(window.innerWidth)
  })

  useEffect(() => {
    function updateDeviceType() {
      setDeviceType(detectDeviceType(window.innerWidth))
    }

    // Solo actualizar en resize, no en cada render
    window.addEventListener("resize", updateDeviceType)
    return () => window.removeEventListener("resize", updateDeviceType)
  }, [])

  return (
    <DeviceContext.Provider value={{ deviceType }}>
      {children}
    </DeviceContext.Provider>
  )
}

/**
 * Hook para obtener el tipo de dispositivo desde el contexto
 */
export function useDeviceType(): DeviceType {
  const context = useContext(DeviceContext)
  if (!context) {
    // Fallback si no hay provider (no debería pasar)
    if (typeof window === "undefined") return "desktop"
    return detectDeviceType(window.innerWidth)
  }
  return context.deviceType
}

function detectDeviceType(width: number): DeviceType {
  if (width < 768) return "mobile"
  if (width < 1024) return "tablet"
  return "desktop"
}
