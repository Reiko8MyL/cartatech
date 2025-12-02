const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  link: string | null
  read: boolean
  createdAt: number
}

// Obtener notificaciones del usuario
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  try {
    const url = API_BASE_URL 
      ? `${API_BASE_URL}/api/notifications?userId=${userId}`
      : `/api/notifications?userId=${userId}`
    
    // Usar fetch con manejo silencioso de errores
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }).catch(() => {
      // Capturar errores de red silenciosamente
      return null
    })

    if (!response || !response.ok) {
      // Retornar array vacío para cualquier error (no crítico)
      // Las notificaciones son opcionales y no deben afectar la UX
      return []
    }

    const data = await response.json().catch(() => ({ notifications: [] }))
    return data.notifications || []
  } catch (error) {
    // Completamente silencioso - no loggear nada
    // Las notificaciones son una característica opcional
    return []
  }
}

// Marcar notificaciones como leídas
export async function markNotificationsAsRead(
  userId: string,
  notificationIds: string[]
): Promise<boolean> {
  try {
    const url = API_BASE_URL 
      ? `${API_BASE_URL}/api/notifications`
      : `/api/notifications`
    
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, notificationIds }),
    })

    if (!response.ok) {
      // Si falla, no es crítico, solo retornar false
      return false
    }

    return true
  } catch (error) {
    // Silenciar errores para no afectar la experiencia del usuario
    if (process.env.NODE_ENV === "development") {
      console.error("Error al marcar notificaciones como leídas:", error)
    }
    return false
  }
}

