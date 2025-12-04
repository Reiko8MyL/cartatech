import { SavedDeck, DeckCard } from "@/lib/deck-builder/types";

// En desarrollo, usar ruta relativa. En producción, usar la URL completa si está configurada
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? "" : "");

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

/**
 * Obtiene los mazos del usuario desde la API con paginación
 */
export async function getUserDecks(
  userId: string,
  page: number = 1,
  limit: number = 12
): Promise<PaginatedResponse<SavedDeck>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/decks?userId=${userId}&page=${page}&limit=${limit}`
    );
    
    if (!response.ok) {
      throw new Error("Error al obtener mazos");
    }

    const data = await response.json();
    return {
      data: data.decks || [],
      pagination: data.pagination || {
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 0,
      },
    };
  } catch (error) {
    console.error("Error al obtener mazos del usuario:", error);
    return {
      data: [],
      pagination: {
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 0,
      },
    };
  }
}

/**
 * Obtiene los mazos públicos desde la API con paginación
 */
export async function getPublicDecks(
  page: number = 1,
  limit: number = 12
): Promise<PaginatedResponse<SavedDeck>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/decks?publicOnly=true&page=${page}&limit=${limit}`
    );
    
    if (!response.ok) {
      throw new Error("Error al obtener mazos públicos");
    }

    const data = await response.json();
    return {
      data: data.decks || [],
      pagination: data.pagination || {
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 0,
      },
    };
  } catch (error) {
    console.error("Error al obtener mazos públicos:", error);
    return {
      data: [],
      pagination: {
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 0,
      },
    };
  }
}

/**
 * Obtiene un mazo específico por ID
 */
export async function getDeckById(deckId: string): Promise<SavedDeck | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/decks/${deckId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error("Error al obtener mazo");
    }

    const data = await response.json();
    return data.deck || null;
  } catch (error) {
    console.error("Error al obtener mazo:", error);
    return null;
  }
}

/**
 * Guarda un mazo en la base de datos
 */
export async function saveDeck(userId: string, deck: SavedDeck): Promise<SavedDeck | null> {
  try {
    console.log("[saveDeck] Iniciando guardado de mazo:", {
      deckId: deck.id,
      deckName: deck.name,
      userId: userId,
      hasId: !!deck.id,
      idType: typeof deck.id,
    });

    // Si el mazo tiene un ID, SIEMPRE intentar actualizarlo primero (PUT)
    // Esto evita crear duplicados cuando se edita un mazo existente
    // Solo si la actualización falla con 404 (mazo no existe), entonces crear uno nuevo
    if (deck.id) {
      console.log(`[saveDeck] Intentando actualizar mazo con ID: ${deck.id}`);
      
      const updateResponse = await fetch(`${API_BASE_URL}/api/decks/${deck.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, deck }),
      });

      const updateResponseText = await updateResponse.text();
      let updateData: any;
      
      try {
        updateData = updateResponseText ? JSON.parse(updateResponseText) : {};
      } catch (parseError) {
        console.error("Error al parsear respuesta JSON de actualización:", parseError);
        console.error("Respuesta recibida:", updateResponseText);
        throw new Error("Error del servidor. La respuesta no es válida.");
      }

      if (updateResponse.ok) {
        console.log(`[saveDeck] Mazo actualizado exitosamente. Respuesta:`, updateData);
        if (updateData.deck) {
          return updateData.deck;
        } else {
          console.error("[saveDeck] La respuesta no contiene el objeto deck:", updateData);
          throw new Error("La respuesta del servidor no contiene el mazo actualizado");
        }
      }

      // Si el mazo no existe (404), crear uno nuevo
      if (updateResponse.status === 404) {
        console.warn(`[saveDeck] Mazo con ID ${deck.id} no encontrado, creando uno nuevo`);
        // Continuar con la creación más abajo
      } else {
        // Otro error, lanzar excepción - NO crear duplicado
        const errorMessage = updateData?.error || updateData?.message || "Error al actualizar mazo";
        console.error("[saveDeck] Error en respuesta de actualización:", {
          status: updateResponse.status,
          statusText: updateResponse.statusText,
          error: errorMessage,
          data: updateData,
        });
        throw new Error(errorMessage);
      }
    }
    
    // Crear nuevo mazo (solo si no tiene ID o si la actualización falló con 404)
    console.log("[saveDeck] Creando nuevo mazo (no tiene ID o actualización falló con 404)");
    const createResponse = await fetch(`${API_BASE_URL}/api/decks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, deck }),
    });

    // Leer el texto de la respuesta primero para poder reutilizarlo
    const responseText = await createResponse.text();
    
    // Intentar parsear como JSON
    let data: any;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error("Error al parsear respuesta JSON:", parseError);
      console.error("Respuesta recibida:", responseText);
      throw new Error("Error del servidor. La respuesta no es válida.");
    }

    if (!createResponse.ok) {
      const errorMessage = data?.error || data?.message || "Error al guardar mazo";
      console.error("Error en respuesta:", {
        status: createResponse.status,
        statusText: createResponse.statusText,
        error: errorMessage,
        data: data,
      });
      throw new Error(errorMessage);
    }

    return data.deck || null;
  } catch (error) {
    console.error("Error al guardar mazo:", error);
    throw error; // Re-lanzar el error para que el componente pueda manejarlo
  }
}

/**
 * Elimina un mazo de la base de datos
 */
export async function deleteDeck(userId: string, deckId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/decks/${deckId}?userId=${userId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Error al eliminar mazo");
    }

    return true;
  } catch (error) {
    console.error("Error al eliminar mazo:", error);
    return false;
  }
}

/**
 * Obtiene el historial de versiones de un mazo
 */
export async function getDeckVersions(
  userId: string,
  deckId: string
): Promise<Array<{
  id: string;
  deckId: string;
  name: string;
  description?: string;
  cards: DeckCard[];
  format: string;
  tags: string[];
  createdAt: number;
}>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/decks/${deckId}/versions?userId=${userId}`
    );

    if (!response.ok) {
      throw new Error("Error al obtener versiones");
    }

    const data = await response.json();
    return data.versions || [];
  } catch (error) {
    console.error("Error al obtener versiones:", error);
    return [];
  }
}

