const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Convierte un array de cardIds (con duplicados) a un Map de cantidades
 */
export function cardIdsArrayToMap(cardIds: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const cardId of cardIds) {
    map.set(cardId, (map.get(cardId) || 0) + 1);
  }
  return map;
}

/**
 * Convierte un Map de cantidades a un array de cardIds (con duplicados)
 */
export function mapToCardIdsArray(collection: Map<string, number>): string[] {
  const array: string[] = [];
  for (const [cardId, quantity] of collection.entries()) {
    for (let i = 0; i < quantity; i++) {
      array.push(cardId);
    }
  }
  return array;
}

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
 * Actualiza la cantidad de una carta en la colección
 */
export async function updateCardQuantityInCollection(
  userId: string,
  cardId: string,
  quantity: number
): Promise<{ cardIds: string[] }> {
  try {
    // Obtener la colección actual
    const currentCardIds = await getUserCollection(userId);
    const collectionMap = cardIdsArrayToMap(currentCardIds);
    
    // Actualizar la cantidad
    if (quantity <= 0) {
      collectionMap.delete(cardId);
    } else {
      collectionMap.set(cardId, quantity);
    }
    
    // Convertir de vuelta a array y actualizar
    const updatedCardIds = mapToCardIdsArray(collectionMap);
    const finalCardIds = await updateUserCollection(userId, updatedCardIds);
    
    return { cardIds: finalCardIds };
  } catch (error) {
    console.error("Error al actualizar cantidad de carta en colección:", error);
    throw error;
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



















