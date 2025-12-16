/**
 * Utilidades para manejar el historial de búsquedas en localStorage
 */

const SEARCH_HISTORY_KEY = "cartatech_search_history";
const MAX_HISTORY_ITEMS = 10;

export interface SearchHistoryItem {
  query: string;
  type: "carta" | "mazo";
  timestamp: number;
}

/**
 * Obtiene el historial de búsquedas desde localStorage
 */
export function getSearchHistory(): SearchHistoryItem[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!stored) return [];
    
    const history = JSON.parse(stored) as SearchHistoryItem[];
    // Ordenar por timestamp descendente (más recientes primero)
    return history.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Error al leer historial de búsquedas:", error);
    return [];
  }
}

/**
 * Agrega una búsqueda al historial
 */
export function addToSearchHistory(query: string, type: "carta" | "mazo"): void {
  if (typeof window === "undefined") return;
  if (!query.trim()) return;
  
  try {
    const history = getSearchHistory();
    
    // Eliminar duplicados (misma query y tipo)
    const filtered = history.filter(
      (item) => !(item.query.toLowerCase() === query.toLowerCase().trim() && item.type === type)
    );
    
    // Agregar nueva búsqueda al inicio
    const newItem: SearchHistoryItem = {
      query: query.trim(),
      type,
      timestamp: Date.now(),
    };
    
    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Error al guardar historial de búsquedas:", error);
  }
}

/**
 * Obtiene el historial filtrado por tipo
 */
export function getSearchHistoryByType(type: "carta" | "mazo"): SearchHistoryItem[] {
  return getSearchHistory().filter((item) => item.type === type);
}

/**
 * Limpia el historial de búsquedas
 */
export function clearSearchHistory(): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.error("Error al limpiar historial de búsquedas:", error);
  }
}

/**
 * Elimina un elemento específico del historial
 */
export function removeFromSearchHistory(query: string, type: "carta" | "mazo"): void {
  if (typeof window === "undefined") return;
  
  try {
    const history = getSearchHistory();
    const filtered = history.filter(
      (item) => !(item.query.toLowerCase() === query.toLowerCase() && item.type === type)
    );
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error al eliminar del historial:", error);
  }
}

