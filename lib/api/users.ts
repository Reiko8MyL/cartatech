const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""

export interface UserProfile {
  user: {
    id: string
    username: string
    createdAt: number
  }
  stats: {
    totalDecks: number
    publicDecks: number
    totalLikes: number
    totalViews: number
  }
  publicDecks: Array<{
    id: string
    name: string
    description?: string
    format: string
    tags: string[]
    publishedAt?: number
    viewCount: number
    createdAt: number
    cards: any
  }>
}

// Obtener perfil de usuario por username
export async function getUserProfile(username: string): Promise<UserProfile | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${username}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error("Error al obtener perfil de usuario")
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error al obtener perfil de usuario:", error)
    return null
  }
}


