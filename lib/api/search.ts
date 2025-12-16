/**
 * Funciones de API para búsqueda y autocompletado
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface AutocompleteCardResult {
  id: string;
  name: string;
  type: string;
  edition: string;
  image: string;
}

export interface AutocompleteDeckResult {
  id: string;
  name: string;
  description: string | null;
  format: string;
  author: {
    id: string;
    username: string;
  };
  viewCount: number;
}

export interface AutocompleteResponse {
  results: AutocompleteCardResult[] | AutocompleteDeckResult[];
  total: number;
}

/**
 * Obtiene sugerencias de autocompletado para cartas o mazos
 */
export async function getAutocompleteSuggestions(
  query: string,
  type: "carta" | "mazo",
  limit: number = 8
): Promise<AutocompleteResponse | null> {
  if (!query || query.length < 2) {
    return null;
  }

  try {
    const url = API_BASE_URL
      ? `${API_BASE_URL}/api/search/autocomplete`
      : `/api/search/autocomplete`;

    const params = new URLSearchParams({
      query: query.trim(),
      type,
      limit: limit.toString(),
    });

    const response = await fetch(`${url}?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al obtener sugerencias de autocompletado:", error);
    return null;
  }
}

