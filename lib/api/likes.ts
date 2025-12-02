const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Obtiene los likes de un mazo específico
 */
export async function getDeckLikes(deckId: string): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/likes?deckId=${deckId}`);
    
    if (!response.ok) {
      throw new Error("Error al obtener likes");
    }

    const data = await response.json();
    return data.userIds || [];
  } catch (error) {
    console.error("Error al obtener likes:", error);
    return [];
  }
}

/**
 * Obtiene todos los likes de todos los mazos (para uso en componentes)
 */
export async function getAllDeckLikes(): Promise<Record<string, string[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/likes`);
    
    if (!response.ok) {
      // Leer el texto de la respuesta para ver el error
      const errorText = await response.text();
      let errorData: any = {};
      try {
        errorData = errorText ? JSON.parse(errorText) : {};
      } catch {
        // Si no se puede parsear, usar el texto como mensaje
      }
      
      console.error("Error al obtener likes:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      
      throw new Error(errorData.error || errorData.details || "Error al obtener likes");
    }

    const data = await response.json();
    return data.likes || {};
  } catch (error) {
    console.error("Error al obtener likes:", error);
    throw error; // Re-lanzar el error para que el componente pueda hacer fallback
  }
}

/**
 * Alterna el like de un usuario en un mazo
 * @param userId ID del usuario
 * @param deckId ID del mazo
 * @returns true si se agregó el like, false si se quitó
 */
export async function toggleDeckLike(userId: string, deckId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/likes/toggle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, deckId }),
    });

    // Leer el texto de la respuesta primero para poder reutilizarlo
    const responseText = await response.text();
    
    // Intentar parsear como JSON
    let data: any;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error("Error al parsear respuesta JSON:", parseError);
      console.error("Respuesta recibida:", responseText);
      throw new Error("Error del servidor. La respuesta no es válida.");
    }

    if (!response.ok) {
      const errorMessage = data?.error || data?.message || "Error al alternar like";
      console.error("Error en respuesta:", {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        data: data,
      });
      throw new Error(errorMessage);
    }

    return data.isLiked || false;
  } catch (error) {
    console.error("Error al alternar like:", error);
    throw error; // Re-lanzar el error para que el componente pueda manejarlo
  }
}

/**
 * Verifica si un usuario ha dado like a un mazo
 */
export async function hasUserLikedDeck(userId: string, deckId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/likes?userId=${userId}&deckId=${deckId}`);
    
    if (!response.ok) {
      throw new Error("Error al verificar like");
    }

    const data = await response.json();
    return data.isLiked || false;
  } catch (error) {
    console.error("Error al verificar like:", error);
    return false;
  }
}

/**
 * Obtiene el número de likes de un mazo
 */
export async function getDeckLikeCount(deckId: string): Promise<number> {
  try {
    const likes = await getDeckLikes(deckId);
    return likes.length;
  } catch (error) {
    console.error("Error al obtener conteo de likes:", error);
    return 0;
  }
}

