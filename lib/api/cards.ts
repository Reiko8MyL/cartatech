const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Obtiene los metadatos de una carta específica
 */
export async function getCardMetadata(cardId: string): Promise<{ backgroundPositionY: number | null } | null> {
  try {
    const url = API_BASE_URL 
      ? `${API_BASE_URL}/api/cards/${encodeURIComponent(cardId)}/metadata`
      : `/api/cards/${encodeURIComponent(cardId)}/metadata`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.metadata || null;
  } catch (error) {
    console.error("Error al obtener metadatos de carta:", error);
    return null;
  }
}

/**
 * Obtiene todos los metadatos de cartas (útil para precargar)
 */
export async function getAllCardsMetadata(): Promise<Record<string, number>> {
  try {
    const url = API_BASE_URL 
      ? `${API_BASE_URL}/api/cards/metadata`
      : `/api/cards/metadata`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    
    if (!response.ok) {
      return {};
    }
    
    const data = await response.json();
    return data.metadata || {};
  } catch (error) {
    console.error("Error al obtener metadatos de cartas:", error);
    return {};
  }
}

/**
 * Actualiza los metadatos de una carta
 */
export async function updateCardMetadata(
  cardId: string,
  backgroundPositionY: number | null
): Promise<{ backgroundPositionY: number | null } | null> {
  try {
    const url = API_BASE_URL 
      ? `${API_BASE_URL}/api/cards/${encodeURIComponent(cardId)}/metadata`
      : `/api/cards/${encodeURIComponent(cardId)}/metadata`;
    
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ backgroundPositionY }),
    });
    
    if (!response.ok) {
      // Intentar obtener el mensaje de error del servidor
      let errorMessage = "Error al actualizar metadatos";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        if (errorData.details) {
          errorMessage += `: ${errorData.details}`;
        }
      } catch {
        // Si no se puede parsear el JSON, usar el status text
        errorMessage = `Error ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data.metadata || null;
  } catch (error) {
    console.error("Error al actualizar metadatos de carta:", error);
    throw error;
  }
}

/**
 * Elimina los metadatos de una carta
 */
export async function deleteCardMetadata(cardId: string): Promise<boolean> {
  try {
    const url = API_BASE_URL 
      ? `${API_BASE_URL}/api/cards/${encodeURIComponent(cardId)}/metadata`
      : `/api/cards/${encodeURIComponent(cardId)}/metadata`;
    
    const response = await fetch(url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    
    if (!response.ok) {
      throw new Error("Error al eliminar metadatos");
    }
    
    return true;
  } catch (error) {
    console.error("Error al eliminar metadatos de carta:", error);
    throw error;
  }
}

