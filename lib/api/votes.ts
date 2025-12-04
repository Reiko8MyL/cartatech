import { Vote } from "@/lib/voting/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Obtiene todas las votaciones
 */
export async function getAllVotes(): Promise<Vote[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/votes`);
    
    if (!response.ok) {
      throw new Error("Error al obtener votos");
    }

    const data = await response.json();
    return data.votes || [];
  } catch (error) {
    console.error("Error al obtener votos:", error);
    return [];
  }
}

/**
 * Obtiene la votación de un usuario para una raza específica
 */
export async function getUserVoteForRace(userId: string, race: string): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/votes?userId=${userId}&race=${race}`);
    
    if (!response.ok) {
      throw new Error("Error al obtener voto del usuario");
    }

    const data = await response.json();
    return data.cardId || null;
  } catch (error) {
    console.error("Error al obtener voto del usuario:", error);
    return null;
  }
}

/**
 * Guarda o actualiza una votación
 */
export async function saveVote(userId: string, race: string, cardId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/votes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, race, cardId }),
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
      const errorMessage = data?.error || data?.message || "Error al guardar voto";
      console.error("Error en respuesta:", {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        data: data,
      });
      throw new Error(errorMessage);
    }

    return true;
  } catch (error) {
    console.error("Error al guardar voto:", error);
    throw error; // Re-lanzar el error para que el componente pueda manejarlo
  }
}

/**
 * Obtiene todas las votaciones de una raza específica
 */
export async function getVotesByRace(race: string): Promise<Vote[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/votes?race=${race}`);
    
    if (!response.ok) {
      throw new Error("Error al obtener votos de la raza");
    }

    const data = await response.json();
    return data.votes || [];
  } catch (error) {
    console.error("Error al obtener votos de la raza:", error);
    return [];
  }
}




