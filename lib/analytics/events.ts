// Eventos personalizados de Analytics
import { event } from "./gtag";

export const trackDeckCreated = (deckName: string) => {
  event({
    action: "deck_created",
    category: "Deck",
    label: deckName,
  });
};

export const trackDeckPublished = (deckId: string, deckName: string) => {
  event({
    action: "deck_published",
    category: "Deck",
    label: deckName,
  });
};

export const trackDeckViewed = (deckId: string, deckName: string) => {
  event({
    action: "deck_viewed",
    category: "Deck",
    label: deckName,
  });
};

export const trackDeckLiked = (deckId: string) => {
  event({
    action: "deck_liked",
    category: "Deck",
    label: deckId,
  });
};

export const trackDeckCopied = (deckId: string) => {
  event({
    action: "deck_copied",
    category: "Deck",
    label: deckId,
  });
};

export const trackCardSearched = (searchTerm: string) => {
  event({
    action: "card_searched",
    category: "Search",
    label: searchTerm,
  });
};

export const trackUserRegistered = (username: string) => {
  event({
    action: "user_registered",
    category: "User",
    label: username,
  });
};

export const trackUserLoggedIn = (username: string) => {
  event({
    action: "user_logged_in",
    category: "User",
    label: username,
  });
};

