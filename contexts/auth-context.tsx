"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { login as apiLogin, register as apiRegister } from "@/lib/api/auth"
import { trackUserLoggedIn, trackUserRegistered, trackUserLoggedOut } from "@/lib/analytics/events"

export interface User {
  id: string
  username: string
  email: string
  role?: string // "USER" | "MODERATOR" | "ADMIN" (opcional para compatibilidad con usuarios existentes)
  createdAt: number
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (username: string, email: string, password: string, dateOfBirth: { month: string; day: string; year: string }) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Cargar usuario desde localStorage al iniciar (solo para mantener sesión)
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("cartatech_user")
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser)
        } catch {
          localStorage.removeItem("cartatech_user")
        }
      }
      setIsLoading(false)
    }
  }, [])

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (typeof window === "undefined") return { success: false, error: "No disponible en servidor" }

    const result = await apiLogin(username, password)

    if (result.success && result.user) {
      setUser(result.user)
      // Guardar en localStorage solo para mantener la sesión
      localStorage.setItem("cartatech_user", JSON.stringify(result.user))
      
      // Trackear evento de login
      trackUserLoggedIn(result.user.username, result.user.id)
      
      return { success: true }
    }

    return { success: false, error: result.error }
  }

  const register = async (
    username: string,
    email: string,
    password: string,
    dateOfBirth: { month: string; day: string; year: string }
  ): Promise<{ success: boolean; error?: string }> => {
    if (typeof window === "undefined") return { success: false, error: "No disponible en servidor" }

    const result = await apiRegister(username, email, password, dateOfBirth)

    if (result.success && result.user) {
      setUser(result.user)
      // Guardar en localStorage solo para mantener la sesión
      localStorage.setItem("cartatech_user", JSON.stringify(result.user))
      
      // Trackear evento de registro
      trackUserRegistered(result.user.username, result.user.id)
      
      return { success: true }
    }

    return { success: false, error: result.error }
  }

  const logout = () => {
    // Trackear evento de logout antes de limpiar
    trackUserLoggedOut()
    
    setUser(null)
    if (typeof window !== "undefined") {
      localStorage.removeItem("cartatech_user")
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}



