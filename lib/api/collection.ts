const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Obtiene la colección de cartas de un usuario
 */
export async function getUserCollection(userId: string): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/collection?userId=${userId}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData: any = {};
      try {
        errorData = errorText ? JSON.parse(errorText) : {};
      } catch {
        // Si no se puede parsear, usar el texto como mensaje
      }
      
      console.error("Error al obtener colección:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      
      throw new Error(errorData.error || "Error al obtener colección");
    }

    const data = await response.json();
    return data.cardIds || [];
  } catch (error) {
    console.error("Error al obtener colección:", error);
    throw error; // Re-lanzar el error para que el componente pueda hacer fallback
  }
}

/**
 * Alterna una carta en la colección (agregar si no está, quitar si está)
 */
export async function toggleCardInCollection(
  userId: string,
  cardId: string
): Promise<{ cardIds: string[]; isInCollection: boolean }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/collection`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, cardId }),
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
      const errorMessage = data?.error || data?.message || "Error al actualizar colección";
      console.error("Error en respuesta:", {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        data: data,
      });
      throw new Error(errorMessage);
    }

    return {
      cardIds: data.cardIds || [],
      isInCollection: data.isInCollection || false,
    };
  } catch (error) {
    console.error("Error al alternar carta en colección:", error);
    throw error; // Re-lanzar el error para que el componente pueda manejarlo
  }
}

/**
 * Actualiza toda la colección de un usuario (reemplaza completamente)
 */
export async function updateUserCollection(
  userId: string,
  cardIds: string[]
): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/collection`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, cardIds }),
    });

    const responseText = await response.text();
    
    let data: any;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error("Error al parsear respuesta JSON:", parseError);
      console.error("Respuesta recibida:", responseText);
      throw new Error("Error del servidor. La respuesta no es válida.");
    }

    if (!response.ok) {
      const errorMessage = data?.error || data?.message || "Error al actualizar colección";
      console.error("Error en respuesta:", {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        data: data,
      });
      throw new Error(errorMessage);
    }

    return data.cardIds || [];
  } catch (error) {
    console.error("Error al actualizar colección completa:", error);
    throw error; // Re-lanzar el error para que el componente pueda manejarlo
  }
}


















