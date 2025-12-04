"use client";

import { useState, useEffect, useMemo } from "react";
import { getAllCardsFromAPI } from "@/lib/api/cards";
import { getAllCards, getAlternativeArtCards } from "@/lib/deck-builder/utils";
import type { Card } from "@/lib/deck-builder/types";

// Cache global para evitar múltiples llamadas
let globalCardsCache: Card[] | null = null;
let globalAltCardsCache: Card[] | null = null;
let isLoadingCache = false;
let cachePromise: Promise<Card[]> | null = null;
let cacheVersion = 0; // Versión del cache para forzar recarga

/**
 * Hook para obtener todas las cartas desde la API con cache
 * Incluye fallback automático a archivos JS si la API falla
 */
export function useCards(includeAlternatives: boolean = false) {
  const [cacheVersionState, setCacheVersionState] = useState(cacheVersion);
  
  const [cards, setCards] = useState<Card[]>(() => {
    // Inicializar con cache si está disponible
    if (includeAlternatives && globalAltCardsCache) {
      return globalAltCardsCache;
    }
    if (!includeAlternatives && globalCardsCache) {
      return globalCardsCache;
    }
    // Fallback inmediato a archivos JS mientras carga
    const mainCards = getAllCards();
    if (includeAlternatives) {
      const altCards = getAlternativeArtCards();
      return [...mainCards, ...altCards];
    }
    return mainCards;
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Escuchar cambios en la versión del cache
  useEffect(() => {
    const checkCacheVersion = () => {
      if (cacheVersion !== cacheVersionState) {
        setCacheVersionState(cacheVersion);
        // Forzar recarga limpiando el cache local
        if (includeAlternatives) {
          globalAltCardsCache = null;
        } else {
          globalCardsCache = null;
        }
      }
    };
    
    // Verificar cada segundo si el cache fue invalidado
    const interval = setInterval(checkCacheVersion, 1000);
    return () => clearInterval(interval);
  }, [includeAlternatives, cacheVersionState]);

  useEffect(() => {
    // Si ya tenemos cache y la versión es correcta, no recargar
    if (includeAlternatives && globalAltCardsCache && cacheVersionState === cacheVersion) {
      setIsLoading(false);
      return;
    }
    if (!includeAlternatives && globalCardsCache && cacheVersionState === cacheVersion) {
      setIsLoading(false);
      return;
    }

    // Si ya hay una carga en progreso, esperar a que termine
    if (isLoadingCache && cachePromise) {
      cachePromise.then((loadedCards) => {
        setCards(loadedCards);
        setIsLoading(false);
      }).catch((err) => {
        setError(err);
        setIsLoading(false);
      });
      return;
    }

    // Cargar desde API
    isLoadingCache = true;
    setIsLoading(true);
    setError(null);

    const loadPromise = getAllCardsFromAPI(includeAlternatives);
    cachePromise = loadPromise;

    loadPromise
      .then((loadedCards) => {
        // Actualizar cache global
        if (includeAlternatives) {
          globalAltCardsCache = loadedCards;
        } else {
          globalCardsCache = loadedCards;
        }
        
        setCards(loadedCards);
        setIsLoading(false);
        isLoadingCache = false;
        cachePromise = null;
      })
      .catch((err) => {
        console.error("Error al cargar cartas:", err);
        setError(err);
        setIsLoading(false);
        isLoadingCache = false;
        cachePromise = null;
        // Mantener fallback a archivos JS
      });
  }, [includeAlternatives, cacheVersionState]);

  return { cards, isLoading, error };
}

/**
 * Función para limpiar el cache (útil después de actualizaciones)
 * Incrementa la versión del cache para forzar recarga en todos los componentes
 */
export function clearCardsCache() {
  globalCardsCache = null;
  globalAltCardsCache = null;
  isLoadingCache = false;
  cachePromise = null;
  cacheVersion++; // Incrementar versión para forzar recarga
}

