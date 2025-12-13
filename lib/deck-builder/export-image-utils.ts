import type { Card, DeckCard, DeckStats } from "./types"
import { getDeckEditionLogo, getAllyIconUrl } from "./utils"

/**
 * Función auxiliar para cargar imágenes
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Función auxiliar para dibujar badges redondeados
 */
export function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.min(r, h / 2, w / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  ctx.lineTo(x + radius, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

interface TypeBadge {
  key: string
  label: string
}

/**
 * Función auxiliar para dibujar título y badges
 */
export async function drawTitleAndBadges(
  ctx: CanvasRenderingContext2D,
  width: number,
  deckName: string,
  stats: DeckStats,
  deckCards: DeckCard[],
  allCards: Card[],
  cropFromRight: boolean = false
): Promise<number> {
  const backgroundUrl =
    "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435880/EXPORTADO_WEBPPP_jxcgox.webp"
  const bg = await loadImage(backgroundUrl)
  
  if (cropFromRight) {
    // Cortar desde la derecha: la imagen de fondo es 1920x1080, queremos cortar una sección cuadrada 1080x1080 desde la izquierda
    // Calcular qué parte de la imagen fuente usar (mantener altura completa, cortar ancho)
    const sourceAspectRatio = bg.width / bg.height // 1920/1080 = 1.777...
    const targetAspectRatio = width / ctx.canvas.height // 1080/1080 = 1.0
    
    if (sourceAspectRatio > targetAspectRatio) {
      // La imagen fuente es más ancha, cortar desde la derecha
      const sourceWidth = bg.height * targetAspectRatio // altura * 1.0 = altura
      ctx.drawImage(
        bg,
        0, 0, // origen en la imagen fuente (esquina superior izquierda)
        sourceWidth, bg.height, // tamaño del área a copiar (cuadrado desde la izquierda)
        0, 0, // destino en el canvas
        width, ctx.canvas.height // tamaño en el canvas (1080x1080)
      )
    } else {
      // Si la imagen fuente no es lo suficientemente ancha, escalar normalmente
      ctx.drawImage(bg, 0, 0, width, ctx.canvas.height)
    }
  } else {
    // Escalar normalmente
    ctx.drawImage(bg, 0, 0, width, ctx.canvas.height)
  }

  // Título del mazo
  ctx.fillStyle = "white"
  ctx.textBaseline = "top"
  ctx.font = "bold 28px system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
  ctx.fillText(deckName || "Mazo sin nombre", 40, 20)

  // Contadores por tipo en óvalos con iconos
  const typeOrder = ["Aliado", "Arma", "Talismán", "Tótem", "Oro"]
  const typeBadges: TypeBadge[] = [
    { key: "Aliado", label: "Aliados" },
    { key: "Arma", label: "Armas" },
    { key: "Talismán", label: "Talismanes" },
    { key: "Tótem", label: "Tótems" },
    { key: "Oro", label: "Oros" },
  ]

  const badgeTop = 52
  let badgeX = 40
  const badgeGapX = 14
  const labelFont = "bold 18px system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
  const countFont = "16px system-ui, -apple-system, BlinkMacSystemFont, sans-serif"

  // Mapa de URLs de iconos por tipo (icono de Aliado es dinámico)
  const iconUrls: Record<string, string> = {
    Aliado: getAllyIconUrl(deckCards, allCards),
    Arma: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764396472/arma_icono_dgmgej.webp",
    Talismán: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764396473/talisman_icono_kco7k9.webp",
    Tótem: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764396473/totem_icono_fk5p2k.webp",
    Oro: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764396472/Oro_icono_godhwp.webp",
  }

  // Cargar todos los iconos
  const iconImages = new Map<string, HTMLImageElement>()
  for (const [key, url] of Object.entries(iconUrls)) {
    try {
      const img = await loadImage(url)
      iconImages.set(key, img)
    } catch {
      // Si falla la carga, continuamos sin ese icono
    }
  }

  for (const badge of typeBadges) {
    const count = stats.cardsByType[badge.key] || 0

    // Medir texto
    ctx.font = labelFont
    const labelText = `${badge.label}:`
    const labelWidth = ctx.measureText(labelText).width

    ctx.font = countFont
    const countText = String(count)
    const countWidth = ctx.measureText(countText).width

    const textBlockWidth = Math.max(labelWidth, countWidth)
    const iconBoxSize = 40
    const horizontalPadding = 18
    const innerGap = 14

    const badgeWidth =
      horizontalPadding + textBlockWidth + innerGap + iconBoxSize + horizontalPadding
    const badgeHeight = 48
    const radius = badgeHeight / 2

    // Dibuja óvalo de fondo
    drawRoundedRectPath(ctx, badgeX, badgeTop, badgeWidth, badgeHeight, radius)
    ctx.fillStyle = "#302146"
    ctx.fill()

    // Texto (tipo y cantidad) centrado
    const textCenterX = badgeX + horizontalPadding + textBlockWidth / 2
    const labelY = badgeTop + badgeHeight * 0.42
    const countY = badgeTop + badgeHeight * 0.78

    ctx.fillStyle = "white"
    ctx.textAlign = "center"
    ctx.textBaseline = "alphabetic"
    ctx.font = labelFont
    ctx.fillText(labelText, textCenterX, labelY)

    ctx.font = countFont
    ctx.fillText(countText, textCenterX, countY)

    // Icono de imagen a la derecha del óvalo
    const iconCenterX = badgeX + badgeWidth - horizontalPadding - iconBoxSize / 2
    const iconCenterY = badgeTop + badgeHeight / 2
    const iconSize = iconBoxSize * 0.7
    const iconImg = iconImages.get(badge.key)
    if (iconImg) {
      const iconX = iconCenterX - iconSize / 2
      const iconY = iconCenterY - iconSize / 2
      ctx.drawImage(iconImg, iconX, iconY, iconSize, iconSize)
    }

    // Restaurar alineación por defecto
    ctx.textAlign = "left"
    ctx.textBaseline = "top"

    badgeX += badgeWidth + badgeGapX
  }

  return badgeTop + 48 + 20 // Retornar la posición Y donde empiezan las cartas
}

interface CardToDraw {
  card: Card
  quantity: number
}

/**
 * Genera imagen horizontal (1920x1080)
 */
export async function generateHorizontalImage(
  deckName: string,
  deckCards: DeckCard[],
  stats: DeckStats,
  allCards: Card[],
  cardMap: Map<string, Card>
): Promise<string | null> {
  if (typeof document === "undefined") return null

  const canvas = document.createElement("canvas")
  const width = 1920
  const height = 1080
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext("2d")
  if (!ctx) return null

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"

  try {
    const layoutTop = await drawTitleAndBadges(ctx, width, deckName, stats, deckCards, allCards)

    // Dibujar logo de edición en la esquina superior derecha
    const editionLogoUrl = getDeckEditionLogo(deckCards, allCards)
    if (editionLogoUrl) {
      try {
        const editionLogo = await loadImage(editionLogoUrl)
        const logoSize = 80 // Tamaño del logo
        const logoMargin = 20 // Margen desde los bordes
        const logoX = width - logoSize - logoMargin
        const logoY = logoMargin
        ctx.drawImage(editionLogo, logoX, logoY, logoSize, logoSize)
      } catch {
        // Si falla la carga del logo, continuar sin él
      }
    }

    // Preparar cartas a dibujar, agrupadas por tipo
    const typeOrder = ["Aliado", "Arma", "Talismán", "Tótem", "Oro"]
    const cardsByTypeForImage = new Map<string, CardToDraw[]>()
    
    // Orden por tipo y costo ascendente (excepto para Oros que se ordenan por cantidad)
    const deckCardsOrdered = [...deckCards].sort((a, b) => {
      const ca = cardMap.get(a.cardId)
      const cb = cardMap.get(b.cardId)
      if (!ca || !cb) return 0
      const ta = typeOrder.indexOf(ca.type)
      const tb = typeOrder.indexOf(cb.type)
      if (ta !== tb) return ta - tb
      
      // Para Oros, ordenar por cantidad (mayor a menor) y luego oro inicial al final
      if (ca.type === "Oro" && cb.type === "Oro") {
        // Si uno es oro inicial y el otro no, el inicial va al final
        if (ca.isOroIni && !cb.isOroIni) return 1
        if (!ca.isOroIni && cb.isOroIni) return -1
        // Si ambos son del mismo tipo (inicial o normal), ordenar por cantidad
        return b.quantity - a.quantity
      }
      
      // Para otros tipos, ordenar por costo
      const costA = ca.cost ?? 0
      const costB = cb.cost ?? 0
      return costA - costB
    })
    
    for (const deckCard of deckCardsOrdered) {
      if (deckCard.quantity <= 0) continue
      const card = cardMap.get(deckCard.cardId)
      if (!card) continue
      const list = cardsByTypeForImage.get(card.type) || []
      list.push({ card, quantity: deckCard.quantity })
      cardsByTypeForImage.set(card.type, list)
    }
    
    // Asegurar que los Oros estén ordenados correctamente dentro de su grupo
    const oroGroup = cardsByTypeForImage.get("Oro")
    if (oroGroup) {
      const orosIniciales: CardToDraw[] = []
      const orosNormales: CardToDraw[] = []
      
      // Separar oros iniciales de oros normales
      for (const oroCard of oroGroup) {
        if (oroCard.card.isOroIni) {
          orosIniciales.push(oroCard)
        } else {
          orosNormales.push(oroCard)
        }
      }
      
      // Ordenar cada grupo por cantidad (mayor a menor)
      orosNormales.sort((a, b) => b.quantity - a.quantity)
      orosIniciales.sort((a, b) => b.quantity - a.quantity)
      
      // Reemplazar el grupo de oros con el orden correcto
      cardsByTypeForImage.set("Oro", [...orosNormales, ...orosIniciales])
    }

    // Parámetros base de layout de cartas
    const baseCardWidth = 100
    const baseCardHeight = 150
    const gapX = 18
    const baseGapY = 12
    const baseStackOffset = 10

    const marginLeft = 80
    const marginRight = 80
    const usableRight = width - marginRight

    // Simular layout para calcular escala
    let simulatedCurrentY = layoutTop
    for (const type of typeOrder) {
      const group = cardsByTypeForImage.get(type)
      if (!group || group.length === 0) continue

      simulatedCurrentY += 4
      let rowY = simulatedCurrentY
      let currentX = marginLeft

      const groupOrdered = [...group].sort((a, b) => {
        const costA = a.card.cost ?? 0
        const costB = b.card.cost ?? 0
        return costA - costB
      })

      for (const { quantity } of groupOrdered) {
        const stackWidth = baseCardWidth + (quantity - 1) * baseStackOffset
        if (currentX + stackWidth > usableRight) {
          currentX = marginLeft
          rowY += baseCardHeight + baseGapY
        }
        currentX += stackWidth + gapX
      }

      simulatedCurrentY = rowY + baseCardHeight + baseGapY
    }

    // Calcular factor de escala
    const availableHeight = height - layoutTop - 40
    const usedHeight = simulatedCurrentY - layoutTop
    let scale = 1
    if (usedHeight > 0 && availableHeight > 0) {
      const factor = availableHeight / usedHeight
      if (factor > 1) {
        scale = Math.min(factor, 1.4)
      }
    }

    const cardWidth = baseCardWidth * scale
    const cardHeight = baseCardHeight * scale
    const gapY = baseGapY * scale
    const stackOffset = baseStackOffset * scale

    // Dibujar cartas
    let currentY = layoutTop
    for (const type of typeOrder) {
      const group = cardsByTypeForImage.get(type)
      if (!group || group.length === 0) continue

      currentY += 4
      let rowY = currentY
      let currentX = marginLeft
      
      const groupOrdered = [...group].sort((a, b) => {
        const costA = a.card.cost ?? 0
        const costB = b.card.cost ?? 0
        return costA - costB
      })
      
      for (const { card, quantity } of groupOrdered) {
        const stackWidth = cardWidth + (quantity - 1) * stackOffset
        if (currentX + stackWidth > usableRight) {
          currentX = marginLeft
          rowY += cardHeight + gapY
        }

        const baseX = currentX
        const baseY = rowY
        for (let i = 0; i < quantity; i++) {
          const x = baseX + i * stackOffset
          const y = baseY
          try {
            const img = await loadImage(card.image)
            ctx.drawImage(img, x, y, cardWidth, cardHeight)
          } catch {
            // ignore
          }
        }

        currentX += stackWidth + gapX
      }

      currentY = rowY + cardHeight + gapY
    }

    return canvas.toDataURL("image/png", 1.0)
  } catch {
    return null
  }
}

/**
 * Genera imagen vertical (1080x1080) para Instagram
 */
export async function generateVerticalImage(
  deckName: string,
  deckCards: DeckCard[],
  stats: DeckStats,
  allCards: Card[],
  cardMap: Map<string, Card>
): Promise<string | null> {
  if (typeof document === "undefined") return null

  const canvas = document.createElement("canvas")
  const width = 1080
  const height = 1080
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext("2d")
  if (!ctx) return null

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"

  try {
    // Dibujar fondo cortado desde la derecha
    const layoutTop = await drawTitleAndBadges(ctx, width, deckName, stats, deckCards, allCards, true)

    // Dibujar logo de edición en la esquina superior derecha
    const editionLogoUrl = getDeckEditionLogo(deckCards, allCards)
    if (editionLogoUrl) {
      try {
        const editionLogo = await loadImage(editionLogoUrl)
        const logoSize = 80 // Tamaño del logo
        const logoMargin = 20 // Margen desde los bordes
        const logoX = width - logoSize - logoMargin
        const logoY = logoMargin
        ctx.drawImage(editionLogo, logoX, logoY, logoSize, logoSize)
      } catch {
        // Si falla la carga del logo, continuar sin él
      }
    }

    // Crear mapa de cantidad por carta
    const cardQuantityMap = new Map<string, number>()
    for (const deckCard of deckCards) {
      if (deckCard.quantity <= 0) continue
      const card = cardMap.get(deckCard.cardId)
      if (!card) continue
      cardQuantityMap.set(card.id, deckCard.quantity)
    }

    // Obtener todas las cartas únicas agrupadas por tipo
    const cardsByType = new Map<string, Array<{ card: Card; quantity: number }>>()
    const seenCardIds = new Set<string>()
    
    // Orden de tipos (oros al final)
    const typeOrder = ["Aliado", "Arma", "Talismán", "Tótem", "Oro"]
    
    // Agrupar cartas por tipo
    for (const deckCard of deckCards) {
      if (deckCard.quantity <= 0) continue
      const card = cardMap.get(deckCard.cardId)
      if (!card) continue
      
      // Solo agregar una vez cada carta, pero guardar la cantidad
      if (!seenCardIds.has(card.id)) {
        const quantity = cardQuantityMap.get(card.id) || 1
        const type = card.type
        
        if (!cardsByType.has(type)) {
          cardsByType.set(type, [])
        }
        cardsByType.get(type)!.push({ card, quantity })
        seenCardIds.add(card.id)
      }
    }
    
    // Ordenar cartas dentro de cada tipo por costo, y luego ordenar por tipo (oros al final)
    const uniqueCards: Array<{ card: Card; quantity: number }> = []
    
    // Primero agregar todos los tipos excepto Oro
    for (const type of typeOrder) {
      if (type === "Oro") continue
      
      const typeCards = cardsByType.get(type) || []
      // Ordenar por costo dentro del tipo
      typeCards.sort((a, b) => {
        const costA = a.card.cost ?? 0
        const costB = b.card.cost ?? 0
        return costA - costB
      })
      uniqueCards.push(...typeCards)
    }
    
    // Finalmente agregar los Oros ordenados por cantidad (mayor a menor), con oro inicial al final
    const oroCards = cardsByType.get("Oro") || []
    const orosIniciales: Array<{ card: Card; quantity: number }> = []
    const orosNormales: Array<{ card: Card; quantity: number }> = []
    
    // Separar oros iniciales de oros normales
    for (const oroCard of oroCards) {
      if (oroCard.card.isOroIni) {
        orosIniciales.push(oroCard)
      } else {
        orosNormales.push(oroCard)
      }
    }
    
    // Ordenar oros normales por cantidad (mayor a menor)
    orosNormales.sort((a, b) => b.quantity - a.quantity)
    
    // Ordenar oros iniciales por cantidad (mayor a menor)
    orosIniciales.sort((a, b) => b.quantity - a.quantity)
    
    // Agregar primero los oros normales, luego los oros iniciales
    uniqueCards.push(...orosNormales, ...orosIniciales)

    // Calcular grid cuadrado
    const cardCount = uniqueCards.length
    const cols = Math.ceil(Math.sqrt(cardCount))
    const rows = Math.ceil(cardCount / cols)

    // Márgenes más generosos
    const marginLeft = 40
    const marginRight = 40
    const marginBottom = 40
    
    // Calcular tamaño de carta para que quepa en el espacio disponible
    const availableHeight = height - layoutTop - marginBottom
    const availableWidth = width - marginLeft - marginRight
    const gap = 8
    
    const maxCardWidth = (availableWidth - (cols - 1) * gap) / cols
    const maxCardHeight = (availableHeight - (rows - 1) * gap) / rows
    
    // Calcular tamaño manteniendo proporción de carta (ancho:alto = 1:1.5)
    // Ajustar para que quepa tanto en ancho como en alto
    let actualCardWidth = Math.min(maxCardWidth, maxCardHeight / 1.5)
    let actualCardHeight = actualCardWidth * 1.5
    
    // Si el alto calculado excede el disponible, ajustar
    if (actualCardHeight > maxCardHeight) {
      actualCardHeight = maxCardHeight
      actualCardWidth = actualCardHeight / 1.5
    }

    // Centrar el grid horizontalmente
    const totalGridWidth = cols * actualCardWidth + (cols - 1) * gap
    const startX = (width - totalGridWidth) / 2
    const startY = layoutTop

    // Dibujar cartas en grid con contadores
    for (let i = 0; i < uniqueCards.length; i++) {
      const { card, quantity } = uniqueCards[i]
      const col = i % cols
      const row = Math.floor(i / cols)

      const x = startX + col * (actualCardWidth + gap)
      const y = startY + row * (actualCardHeight + gap)

      try {
        const img = await loadImage(card.image)
        ctx.drawImage(img, x, y, actualCardWidth, actualCardHeight)
        
        // Dibujar contador si hay más de una copia
        if (quantity > 1) {
          // Fondo del contador (círculo más pequeño y más transparente, sin borde)
          const counterRadius = 15
          const counterX = x + actualCardWidth / 2
          const counterY = y + counterRadius
          
          ctx.beginPath()
          ctx.arc(counterX, counterY, counterRadius, 0, Math.PI * 2)
          ctx.fillStyle = "rgba(0, 0, 0, 0.4)"
          ctx.fill()
          
          // Texto del contador
          ctx.fillStyle = "white"
          ctx.font = "bold 16px system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(String(quantity), counterX, counterY)
          
          // Restaurar alineación por defecto
          ctx.textAlign = "left"
          ctx.textBaseline = "top"
        }
      } catch {
        // ignore
      }
    }

    return canvas.toDataURL("image/png", 1.0)
  } catch {
    return null
  }
}

