export interface Card {
  id: string;
  name: string;
  type: string;
  cost: number | null;
  power: number | null;
  race: string | null;
  isCosmetic: boolean;
  isRework: boolean;
  isUnique: boolean;
  edition: string;
  banListRE: number;
  banListRL: number;
  banListLI: number;
  isOroIni: boolean;
  image: string;
  description: string;
}

export interface DeckCard {
  cardId: string;
  quantity: number;
}

export type DeckFormat = "RE" | "RL" | "LI";

export interface SavedDeck {
  id?: string; // Opcional para mazos nuevos (será generado por la base de datos)
  name: string;
  description?: string;
  cards: DeckCard[];
  createdAt: number;
  userId?: string;
  author?: string;
  isPublic?: boolean;
  publishedAt?: number;
  techCardId?: string;
  viewCount?: number;
  tags?: string[];
  format?: DeckFormat;
  backgroundImage?: string; // URL de la imagen de fondo personalizada del banner
}

export const DECK_TAGS = [
  "Agro",
  "MidRange",
  "Control",
  "Combo",
  "Armas",
  "Tótem",
  "Talismanes",
  "Descarta Manos",
  "Destierro",
  "Daño directo",
  "Plaga",
  "Bonificadores",
  "Tech Rara",
  "Tenpo",
  "Rampeo",
  "Arquetipo",
  "Casual",
  "Competitivo",
  "For Fun",
] as const;

export interface DeckFilters {
  search: string;
  descriptionSearch?: string;
  edition: string[];
  type: string[];
  race: string[];
  cost: string[];
  showOnlyUnique?: boolean;
  showOnlyBanned?: boolean;
  showOnlyRework?: boolean;
  showOnlyAvailable?: boolean; // Solo cartas disponibles según ban list del formato actual
}

export interface DeckStats {
  totalCards: number;
  totalCost: number;
  averageCost: number;
  cardsByType: Record<string, number>;
  cardsByEdition: Record<string, number>;
  hasOroIni: boolean;
}

export const EDITION_ORDER = [
  "Espada Sagrada",
  "Helénica",
  "Hijos de Daana",
  "Dominios de Ra",
  "Drácula",
] as const;

export const CARD_TYPES = ["Aliado", "Arma", "Talismán", "Tótem", "Oro"] as const;

export const RACES = [
  "Caballero",
  "Dragón",
  "Faerie",
  "Héroe",
  "Olímpico",
  "Titán",
  "Defensor",
  "Desafiante",
  "Sombra",
  "Eterno",
  "Faraón",
  "Sacerdote",
] as const;

