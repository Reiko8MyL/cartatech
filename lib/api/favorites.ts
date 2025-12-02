import { SavedDeck } from "@/lib/deck-builder/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Obtiene los mazos favoritos del usuario
 */
export async function getUserFavoriteDecks(userId: string): Promise<{
  favoriteDeckIds: string[];
  decks: SavedDeck[];
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/favorites?userId=${userId}`);
    
    if (!response.ok) {
      throw new Error("Error al obtener favoritos");
    }

    const data = await response.json();
    return {
      favoriteDeckIds: data.favoriteDeckIds || [],
      decks: data.decks || [],
    };
  } catch (error) {
    console.error("Error al obtener favoritos:", error);
    return {
      favoriteDeckIds: [],
      decks: [],
    };
  }
}

/**
 * Alterna el estado de favorito de un mazo
 */
export async function toggleFavoriteDeck(
  userId: string,
  deckId: string
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/favorites/toggle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, deckId }),
    });

    // Verificar que la respuesta sea JSON antes de parsear
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Respuesta no es JSON:", text);
      throw new Error("Error del servidor. Por favor intenta de nuevo.");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
      console.error("Error en respuesta:", errorData);
      throw new Error(errorData.error || "Error al alternar favorito");
    }

    const data = await response.json();
    return data.isFavorite;
  } catch (error) {
    console.error("Error al alternar favorito:", error);
    throw error; // Re-lanzar el error para que el componente pueda manejarlo
  }
}

/**
 * Agrega un mazo a favoritos
 */
export async function addFavoriteDeck(
  userId: string,
  deckId: string
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/favorites`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, deckId }),
    });

    if (!response.ok) {
      throw new Error("Error al agregar favorito");
    }

    return true;
  } catch (error) {
    console.error("Error al agregar favorito:", error);
    return false;
  }
}

/**
 * Elimina un mazo de favoritos
 */
export async function removeFavoriteDeck(
  userId: string,
  deckId: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/favorites?userId=${userId}&deckId=${deckId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error("Error al eliminar favorito");
    }

    return true;
  } catch (error) {
    console.error("Error al eliminar favorito:", error);
    return false;
  }
}

