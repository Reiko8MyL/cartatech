const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""

export interface Comment {
  id: string
  content: string
  deckId: string
  userId: string
  parentId: string | null
  createdAt: number
  updatedAt: number
  user: {
    id: string
    username: string
  }
  replies?: Comment[]
}

// Obtener comentarios de un mazo
export async function getDeckComments(deckId: string): Promise<Comment[]> {
  try {
    const url = API_BASE_URL 
      ? `${API_BASE_URL}/api/decks/${deckId}/comments`
      : `/api/decks/${deckId}/comments`
    
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
      // Los comentarios son opcionales y no deben afectar la UX
      return []
    }

    const data = await response.json().catch(() => ({ comments: [] }))
    return data.comments || []
  } catch (error) {
    // Completamente silencioso - no loggear nada
    // Los comentarios son una característica opcional
    return []
  }
}

// Crear un comentario
export async function createComment(
  deckId: string,
  content: string,
  userId: string,
  parentId?: string
): Promise<Comment | null> {
  try {
    // Validar parámetros antes de enviar
    if (!deckId) {
      throw new Error("ID de mazo es requerido")
    }
    if (!content || !content.trim()) {
      throw new Error("El contenido del comentario es requerido")
    }
    if (!userId) {
      throw new Error("ID de usuario es requerido. Por favor, inicia sesión.")
    }
    
    const url = API_BASE_URL 
      ? `${API_BASE_URL}/api/decks/${deckId}/comments`
      : `/api/decks/${deckId}/comments`
    
    const bodyData = { content: content.trim(), userId, parentId }
    
    // Logging en desarrollo
    if (process.env.NODE_ENV === "development") {
      console.log("=== createComment ===")
      console.log("URL:", url)
      console.log("Body:", bodyData)
    }
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData),
    }).catch((fetchError) => {
      // Capturar errores de red
      console.error("Error de red al crear comentario:", fetchError)
      throw new Error("Error de conexión. Por favor, verifica tu conexión a internet.")
    })

    if (!response || !response.ok) {
      let errorMessage = "Error al crear comentario. Por favor, intenta nuevamente."
      
      if (response) {
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
          
          // Si es un error 503 (tabla no existe), mostrar mensaje más claro
          if (response.status === 503) {
            errorMessage = errorData.error || "La funcionalidad de comentarios no está disponible temporalmente. Por favor, contacta al administrador."
          }
        } catch (parseError) {
          // Si no se puede parsear el error, usar el mensaje por defecto
          console.warn("No se pudo parsear el error de la respuesta:", parseError)
        }
      }
      
      throw new Error(errorMessage)
    }

    const data = await response.json().catch(() => ({ comment: null }))
    return data.comment || null
  } catch (error) {
    // Re-lanzar el error para que el componente pueda manejarlo
    // pero solo loggear en desarrollo
    if (process.env.NODE_ENV === "development") {
      console.error("Error al crear comentario:", error)
    }
    throw error
  }
}

// Actualizar un comentario
export async function updateComment(
  deckId: string,
  commentId: string,
  content: string,
  userId: string
): Promise<Comment | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/decks/${deckId}/comments/${commentId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, userId }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Error al actualizar comentario")
    }

    const data = await response.json()
    return data.comment || null
  } catch (error) {
    console.error("Error al actualizar comentario:", error)
    throw error
  }
}

// Eliminar un comentario
export async function deleteComment(
  deckId: string,
  commentId: string,
  userId: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/decks/${deckId}/comments/${commentId}?userId=${userId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Error al eliminar comentario")
    }

    return true
  } catch (error) {
    console.error("Error al eliminar comentario:", error)
    throw error
  }
}

