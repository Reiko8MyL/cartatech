"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

export interface User {
  id: string
  username: string
  email: string
  createdAt: number
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  register: (username: string, email: string, password: string, dateOfBirth: { month: string; day: string; year: string }) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Cargar usuario desde localStorage al iniciar
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("cartatech_user")
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser))
        } catch {
          localStorage.removeItem("cartatech_user")
        }
      }
      setIsLoading(false)
    }
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    if (typeof window === "undefined") return false

    // Simular autenticación (en producción esto sería una llamada a API)
    const users = JSON.parse(localStorage.getItem("cartatech_users") || "[]")
    const foundUser = users.find(
      (u: User & { password: string }) => 
        u.username.toLowerCase() === username.toLowerCase() && 
        u.password === password
    )

    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser
      setUser(userWithoutPassword)
      localStorage.setItem("cartatech_user", JSON.stringify(userWithoutPassword))
      return true
    }

    return false
  }

  const register = async (
    username: string,
    email: string,
    password: string,
    dateOfBirth: { month: string; day: string; year: string }
  ): Promise<boolean> => {
    if (typeof window === "undefined") return false

    // Validar fecha de nacimiento (debe ser mayor de 13 años)
    const birthDate = new Date(
      parseInt(dateOfBirth.year),
      parseInt(dateOfBirth.month) - 1,
      parseInt(dateOfBirth.day)
    )
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      // Aún no ha cumplido años este año
      if (age - 1 < 13) {
        return false
      }
    } else if (age < 13) {
      return false
    }

    // Verificar si el usuario ya existe
    const users = JSON.parse(localStorage.getItem("cartatech_users") || "[]")
    const userExists = users.some(
      (u: User & { password: string }) => 
        u.username.toLowerCase() === username.toLowerCase() || 
        u.email.toLowerCase() === email.toLowerCase()
    )

    if (userExists) {
      return false
    }

    // Crear nuevo usuario
    const newUser: User & { password: string } = {
      id: Date.now().toString(),
      username,
      email,
      password, // En producción esto debería estar hasheado
      createdAt: Date.now(),
    }

    users.push(newUser)
    localStorage.setItem("cartatech_users", JSON.stringify(users))

    // Auto-login después del registro
    const { password: _, ...userWithoutPassword } = newUser
    setUser(userWithoutPassword)
    localStorage.setItem("cartatech_user", JSON.stringify(userWithoutPassword))

    return true
  }

  const logout = () => {
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


