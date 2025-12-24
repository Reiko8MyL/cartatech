/**
 * Mapeo de atributos booleanos de cartas a sus nombres descriptivos en español
 * Usado para mostrar filtros avanzados en Deck Builder y Galería
 */
export const CARD_ATTRIBUTES = {
  errante: "Errante",
  soloAtacNoBloq: "No Bloquea",
  soloBloqNoAtac: "No Ataca",
  bloquarVarios: "Bloquea más de 1",
  pacej: "Puede atacar cuando entra en juego",
  imblo: "Imbloqueable",
  bloqImblo: "Bloquea Imbloqueable",
  noArmas: "No porta armas",
  mas1arma: "Porta más de un arma",
  indestructible: "Indestructible",
  indestrerrable: "Indesterrable",
  exhumar: "Habilidad desde Cementerio",
  controlCementerio: "Control de Cementerio",
  lookDeck: "Mirar tope del Mazo",
  desafio: "Desafío",
  sBuff: "Buff de Estadísticas",
  sNerf: "Nerf de Estadísticas",
  noJugar: "Impide jugar cartas",
  quitaHab: "Quita Habilidad",
  copiaHabil: "Copia Habilidad",
  anulación: "Anulación",
  nPSA: "No puede ser Anulado",
  cancelación: "Cancelación",
  prevencion: "Prevención",
  redDaño: "Reducción de Daño",
  ramp: "Rampeo",
  destierroDirec: "Destierro directo",
  dañoDirec: "Daño directo",
  buscador: "Buscador",
  invocador: "Invocador",
  transformador: "Transformador",
  limitador: "Limitador",
  taunt: "Taunt",
  movimiento: "Movimiento",
  evitAtacar: "Prohíbe Atacar",
  evitBloq: "Prohíbe Bloqueo",
  inmuni: "Inmunidad",
  baraje: "Baraje",
  Robo: "Robo",
  descartaMano: "Descarta Mano",
  ordenMazo: "Ordenar Cartas",
  genOro: "Genera Oros",
  redCoste: "Reducción de Coste",
  ganaControl: "Gana Control",
  redirec: "Redirección",
  rDestrucción: "Removal Destrucción",
  rDestierro: "Removal Destierro",
  rBaraje: "Removal Baraje",
  rTopBot: "Removal Topeo",
  rMano: "Removal Subir a la Mano",
} as const;

/**
 * Tipo para las claves de los atributos
 */
export type CardAttributeKey = keyof typeof CARD_ATTRIBUTES;

/**
 * Obtiene el nombre descriptivo de un atributo
 */
export function getAttributeLabel(key: CardAttributeKey): string {
  return CARD_ATTRIBUTES[key] || key;
}

/**
 * Agrupa los atributos por categorías para mejor organización en la UI
 */
export const ATTRIBUTE_CATEGORIES = {
  combate: [
    "errante",
    "soloAtacNoBloq",
    "soloBloqNoAtac",
    "bloquarVarios",
    "pacej",
    "imblo",
    "bloqImblo",
    "desafio",
    "taunt",
    "evitAtacar",
    "evitBloq",
  ] as CardAttributeKey[],
  armas: [
    "noArmas",
    "mas1arma",
  ] as CardAttributeKey[],
  defensa: [
    "indestructible",
    "indestrerrable",
    "inmuni",
  ] as CardAttributeKey[],
  cementerio: [
    "exhumar",
    "controlCementerio",
  ] as CardAttributeKey[],
  mazo: [
    "lookDeck",
    "buscador",
    "baraje",
    "Robo",
    "descartaMano",
    "ordenMazo",
  ] as CardAttributeKey[],
  estadisticas: [
    "sBuff",
    "sNerf",
  ] as CardAttributeKey[],
  habilidades: [
    "noJugar",
    "quitaHab",
    "copiaHabil",
  ] as CardAttributeKey[],
  anulacion: [
    "anulación",
    "nPSA",
    "cancelación",
    "prevencion",
  ] as CardAttributeKey[],
  recursos: [
    "redDaño",
    "ramp",
    "genOro",
    "redCoste",
  ] as CardAttributeKey[],
  efectos: [
    "destierroDirec",
    "dañoDirec",
    "invocador",
    "transformador",
    "limitador",
    "movimiento",
    "ganaControl",
    "redirec",
  ] as CardAttributeKey[],
  removal: [
    "rDestrucción",
    "rDestierro",
    "rBaraje",
    "rTopBot",
    "rMano",
  ] as CardAttributeKey[],
} as const;

/**
 * Obtiene el nombre de la categoría
 */
export function getCategoryLabel(category: keyof typeof ATTRIBUTE_CATEGORIES): string {
  const labels: Record<keyof typeof ATTRIBUTE_CATEGORIES, string> = {
    combate: "Combate",
    armas: "Armas",
    defensa: "Defensa",
    cementerio: "Cementerio",
    mazo: "Mazo",
    estadisticas: "Estadísticas",
    habilidades: "Habilidades",
    anulacion: "Anulación",
    recursos: "Recursos",
    efectos: "Efectos",
    removal: "Removal",
  };
  return labels[category] || category;
}

