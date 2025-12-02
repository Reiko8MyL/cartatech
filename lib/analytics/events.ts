// Eventos personalizados de Analytics para Google Analytics 4
import { event, setUserProperties, clearUserProperties } from "./gtag";

/**
 * Trackea cuando se crea un nuevo mazo
 */
export const trackDeckCreated = (deckName: string, deckId?: string) => {
  event("deck_created", {
    deck_name: deckName,
    deck_id: deckId,
    event_category: "Deck",
  });
};

/**
 * Trackea cuando se publica un mazo
 */
export const trackDeckPublished = (deckId: string, deckName: string) => {
  event("deck_published", {
    deck_id: deckId,
    deck_name: deckName,
    event_category: "Deck",
  });
};

/**
 * Trackea cuando se visualiza un mazo
 */
export const trackDeckViewed = (deckId: string, deckName: string) => {
  event("deck_viewed", {
    deck_id: deckId,
    deck_name: deckName,
    event_category: "Deck",
  });
};

/**
 * Trackea cuando se da like a un mazo
 */
export const trackDeckLiked = (deckId: string, deckName?: string) => {
  event("deck_liked", {
    deck_id: deckId,
    deck_name: deckName,
    event_category: "Deck",
  });
};

/**
 * Trackea cuando se copia un mazo
 */
export const trackDeckCopied = (deckId: string, deckName?: string) => {
  event("deck_copied", {
    deck_id: deckId,
    deck_name: deckName,
    event_category: "Deck",
  });
};

/**
 * Trackea cuando se busca una carta
 */
export const trackCardSearched = (searchTerm: string, resultCount?: number) => {
  event("card_searched", {
    search_term: searchTerm,
    result_count: resultCount,
    event_category: "Search",
  });
};

/**
 * Trackea cuando un usuario se registra
 */
export const trackUserRegistered = (username: string, userId?: string) => {
  event("user_registered", {
    username: username,
    user_id: userId,
    event_category: "User",
  });

  // Configurar propiedades del usuario
  if (userId) {
    setUserProperties(userId, {
      username: username,
    });
  }
};

/**
 * Trackea cuando un usuario inicia sesión
 */
export const trackUserLoggedIn = (username: string, userId?: string) => {
  event("user_logged_in", {
    username: username,
    user_id: userId,
    event_category: "User",
  });

  // Configurar propiedades del usuario
  if (userId) {
    setUserProperties(userId, {
      username: username,
    });
  }
};

/**
 * Trackea cuando un usuario cierra sesión
 */
export const trackUserLoggedOut = () => {
  event("user_logged_out", {
    event_category: "User",
  });

  // Limpiar propiedades del usuario
  clearUserProperties();
};

/**
 * Trackea cuando se guarda un mazo
 */
export const trackDeckSaved = (deckId: string, deckName: string, isPublic: boolean) => {
  event("deck_saved", {
    deck_id: deckId,
    deck_name: deckName,
    is_public: isPublic,
    event_category: "Deck",
  });
};

/**
 * Trackea cuando se elimina un mazo
 */
export const trackDeckDeleted = (deckId: string, deckName: string) => {
  event("deck_deleted", {
    deck_id: deckId,
    deck_name: deckName,
    event_category: "Deck",
  });
};

/**
 * Trackea cuando se agrega un mazo a favoritos
 */
export const trackDeckFavorited = (deckId: string, deckName?: string) => {
  event("deck_favorited", {
    deck_id: deckId,
    deck_name: deckName,
    event_category: "Deck",
  });
};

/**
 * Trackea cuando se comenta en un mazo
 */
export const trackDeckCommented = (deckId: string, commentLength: number) => {
  event("deck_commented", {
    deck_id: deckId,
    comment_length: commentLength,
    event_category: "Deck",
  });
};

/**
 * Trackea cuando se vota en un mazo
 */
export const trackDeckVoted = (deckId: string, vote: "up" | "down") => {
  event("deck_voted", {
    deck_id: deckId,
    vote_type: vote,
    event_category: "Deck",
  });
};

/**
 * Trackea cuando se exporta un mazo (imagen, lista, código TTS)
 */
export const trackDeckExported = (deckId: string, exportType: "image" | "list" | "tts") => {
  event("deck_exported", {
    deck_id: deckId,
    export_type: exportType,
    event_category: "Deck",
  });
};

/**
 * Trackea cuando se filtra en la galería de cartas
 */
export const trackCardFiltered = (filters: {
  edition?: string;
  type?: string;
  race?: string;
  cost?: string;
}) => {
  event("card_filtered", {
    ...filters,
    event_category: "Search",
  });
};

/**
 * Trackea cuando se agrega una carta al mazo
 */
export const trackCardAddedToDeck = (cardId: string, cardName: string) => {
  event("card_added_to_deck", {
    card_id: cardId,
    card_name: cardName,
    event_category: "Deck",
  });
};

