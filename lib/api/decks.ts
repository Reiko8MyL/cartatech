import { SavedDeck, DeckCard } from "@/lib/deck-builder/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Obtiene los mazos del usuario desde la API
 */
export async function getUserDecks(userId: string): Promise<SavedDeck[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/decks?userId=${userId}`);
    
    if (!response.ok) {
      throw new Error("Error al obtener mazos");
    }

    const data = await response.json();
    return data.decks || [];
  } catch (error) {
    console.error("Error al obtener mazos del usuario:", error);
    return [];
  }
}

/**
 * Obtiene los mazos públicos desde la API
 */
export async function getPublicDecks(): Promise<SavedDeck[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/decks?publicOnly=true`);
    
    if (!response.ok) {
      throw new Error("Error al obtener mazos públicos");
    }

    const data = await response.json();
    return data.decks || [];
  } catch (error) {
    console.error("Error al obtener mazos públicos:", error);
    return [];
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
    // Verificar si el ID es un UUID válido (formato de Prisma)
    // Los UUIDs tienen el formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 caracteres)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUpdate = deck.id && uuidRegex.test(deck.id);
    
    const url = isUpdate && deck.id
      ? `${API_BASE_URL}/api/decks/${deck.id}`
      : `${API_BASE_URL}/api/decks`;
    
    const method = isUpdate ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, deck }),
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
      const errorMessage = data?.error || data?.message || "Error al guardar mazo";
      console.error("Error en respuesta:", {
        status: response.status,
        statusText: response.statusText,
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

