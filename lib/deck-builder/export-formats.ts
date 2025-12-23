import type { DeckCard, DeckStats, SavedDeck, Card, DeckFormat } from "./types"

/**
 * Opciones de exportación
 */
export interface ExportOptions {
  includeDescription?: boolean
  includeStats?: boolean
  includeBackgroundImage?: boolean
  imageQuality?: "low" | "medium" | "high" | "ultra"
}

/**
 * Exporta un mazo a formato JSON estructurado
 * Este formato puede ser importado después para restaurar el mazo
 */
export function exportDeckToJSON(
  deckName: string,
  deckCards: DeckCard[],
  deckFormat: DeckFormat,
  description?: string,
  tags?: string[],
  techCardId?: string,
  backgroundImage?: string
): string {
  const deckData: SavedDeck = {
    name: deckName,
    description: description || undefined,
    cards: deckCards.filter(dc => dc.quantity > 0),
    format: deckFormat,
    tags: tags || [],
    techCardId: techCardId || undefined,
    backgroundImage: backgroundImage || undefined,
    createdAt: Date.now(),
  }

  return JSON.stringify(deckData, null, 2)
}

/**
 * Exporta un mazo a formato de texto mejorado
 * Incluye información adicional como formato, estadísticas, etc.
 */
export function exportDeckToText(
  deckName: string,
  deckCards: DeckCard[],
  deckFormat: DeckFormat,
  stats: DeckStats,
  allCards: Card[],
  description?: string,
  options: ExportOptions = {}
): string {
  const cardMap = new Map(allCards.map((card) => [card.id, card]))
  const typeOrder = ["Aliado", "Arma", "Talismán", "Tótem", "Oro"]
  
  const lines: string[] = []
  
  // Encabezado
  lines.push("=".repeat(60))
  lines.push(`MAZO: ${deckName}`)
  lines.push(`FORMATO: ${deckFormat}`)
  if (options.includeDescription && description) {
    lines.push(`DESCRIPCIÓN: ${description}`)
  }
  lines.push("=".repeat(60))
  lines.push("")

  // Estadísticas (si se incluyen)
  if (options.includeStats) {
    lines.push("ESTADÍSTICAS:")
    lines.push(`  Total de cartas: ${stats.totalCards}/50`)
    lines.push(`  Coste promedio: ${stats.averageCost.toFixed(2)}`)
    lines.push("")
  }

  // Cartas por tipo
  const cardsByType = new Map<string, DeckCard[]>()
  
  for (const deckCard of deckCards) {
    if (deckCard.quantity === 0) continue
    const card = cardMap.get(deckCard.cardId)
    if (!card) continue
    
    if (!cardsByType.has(card.type)) {
      cardsByType.set(card.type, [])
    }
    cardsByType.get(card.type)!.push(deckCard)
  }

  for (const type of typeOrder) {
    const typeCards = cardsByType.get(type)
    if (!typeCards || typeCards.length === 0) continue

    lines.push(`${type.toUpperCase()}:`)
    
    // Ordenar por coste dentro de cada tipo
    const sorted = typeCards.sort((a, b) => {
      const cardA = cardMap.get(a.cardId)
      const cardB = cardMap.get(b.cardId)
      if (!cardA || !cardB) return 0
      return (cardA.cost ?? 0) - (cardB.cost ?? 0)
    })

    for (const deckCard of sorted) {
      const card = cardMap.get(deckCard.cardId)
      if (!card) continue
      
      const costStr = card.cost !== null ? ` (Coste: ${card.cost})` : ""
      lines.push(`  ${deckCard.quantity}x ${card.name}${costStr}`)
    }
    
    lines.push("")
  }

  // Pie
  lines.push("=".repeat(60))
  lines.push(`Exportado desde CartaTech - ${new Date().toLocaleDateString()}`)
  lines.push("=".repeat(60))

  return lines.join("\n")
}

/**
 * Exporta un mazo a formato compatible con otras plataformas
 * Formato: código de carta repetido según cantidad, separado por espacios
 */
export function exportDeckToCode(
  deckCards: DeckCard[]
): string {
  const codes: string[] = []
  
  for (const deckCard of deckCards) {
    for (let i = 0; i < deckCard.quantity; i++) {
      codes.push(deckCard.cardId)
    }
  }
  
  return codes.join(" ")
}

/**
 * Exporta un mazo a formato simple (solo nombres de cartas)
 * Similar al formato actual pero mejorado
 */
export function exportDeckToSimpleText(
  deckCards: DeckCard[],
  allCards: Card[]
): string {
  const cardMap = new Map(allCards.map((card) => [card.id, card]))
  const typeOrder = ["Aliado", "Arma", "Talismán", "Tótem", "Oro"]
  
  const ordered = deckCards
    .filter((d) => d.quantity > 0)
    .sort((a, b) => {
      const ca = cardMap.get(a.cardId)
      const cb = cardMap.get(b.cardId)
      if (!ca || !cb) return 0
      const ta = typeOrder.indexOf(ca.type)
      const tb = typeOrder.indexOf(cb.type)
      if (ta !== tb) return ta - tb
      const costA = ca.cost ?? 0
      const costB = cb.cost ?? 0
      return costA - costB
    })

  const lines: string[] = []
  for (const d of ordered) {
    const c = cardMap.get(d.cardId)
    if (c) lines.push(`${d.quantity}x ${c.name}`)
  }
  
  return lines.join("\n")
}

/**
 * Descarga un archivo con el contenido proporcionado
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = "text/plain"
): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

