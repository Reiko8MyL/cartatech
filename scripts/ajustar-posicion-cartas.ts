/**
 * Script de ejemplo para ajustar la posición Y de cartas específicas
 * 
 * Este script muestra cómo usar las funciones API para ajustar manualmente
 * la posición Y de las imágenes de fondo de cartas específicas.
 * 
 * USO:
 * 1. Ejecuta este script con: npx tsx scripts/ajustar-posicion-cartas.ts
 * 2. O copia las funciones y úsalas en la consola del navegador
 */

import { updateCardMetadata, getCardMetadata, getAllCardsMetadata } from "../lib/api/cards";

/**
 * Ejemplo 1: Ajustar la posición Y de una carta específica
 */
async function ejemploAjustarCarta() {
  const cardId = "MYL-0001"; // ID de la carta (ej: "Rey Arturo Pendragon")
  const nuevaPosicionY = 22; // Porcentaje (15-45)
  
  try {
    await updateCardMetadata(cardId, nuevaPosicionY);
    console.log(`✅ Posición Y de ${cardId} ajustada a ${nuevaPosicionY}%`);
  } catch (error) {
    console.error(`❌ Error al ajustar ${cardId}:`, error);
  }
}

/**
 * Ejemplo 2: Ver la posición actual de una carta
 */
async function ejemploVerPosicion() {
  const cardId = "MYL-0001";
  
  try {
    const metadata = await getCardMetadata(cardId);
    if (metadata && metadata.backgroundPositionY !== null) {
      console.log(`📊 ${cardId} tiene posición personalizada: ${metadata.backgroundPositionY}%`);
    } else {
      console.log(`📊 ${cardId} usa posición por defecto (según tipo)`);
    }
  } catch (error) {
    console.error(`❌ Error al obtener posición de ${cardId}:`, error);
  }
}

/**
 * Ejemplo 3: Eliminar ajuste personalizado (volver a valores por defecto)
 */
async function ejemploEliminarAjuste() {
  const cardId = "MYL-0001";
  
  try {
    await updateCardMetadata(cardId, null);
    console.log(`✅ Ajuste personalizado de ${cardId} eliminado (volverá a valores por defecto)`);
  } catch (error) {
    console.error(`❌ Error al eliminar ajuste de ${cardId}:`, error);
  }
}

/**
 * Ejemplo 4: Ver todas las cartas con ajustes personalizados
 */
async function ejemploVerTodosLosAjustes() {
  try {
    const metadataMap = await getAllCardsMetadata();
    const cardIds = Object.keys(metadataMap);
    
    if (cardIds.length === 0) {
      console.log("📊 No hay cartas con ajustes personalizados");
      return;
    }
    
    console.log(`📊 Cartas con ajustes personalizados (${cardIds.length}):`);
    for (const cardId of cardIds) {
      console.log(`  - ${cardId}: ${metadataMap[cardId]}%`);
    }
  } catch (error) {
    console.error("❌ Error al obtener ajustes:", error);
  }
}

/**
 * Ejemplo 5: Ajustar múltiples cartas a la vez
 */
async function ejemploAjustarMultiplesCartas() {
  // Mapa de cardId -> posición Y deseada
  const ajustes: Record<string, number> = {
    "MYL-0001": 22,  // Rey Arturo Pendragon
    "MYL-0002": 24,  // Reina Guinivere
    "MYL-0015": 18, // El Gran Wyrm (mostrar más arriba)
  };
  
  console.log(`🔄 Ajustando ${Object.keys(ajustes).length} cartas...`);
  
  for (const [cardId, posicionY] of Object.entries(ajustes)) {
    try {
      await updateCardMetadata(cardId, posicionY);
      console.log(`  ✅ ${cardId}: ${posicionY}%`);
    } catch (error) {
      console.error(`  ❌ ${cardId}: Error`, error);
    }
  }
  
  console.log("✅ Ajustes completados");
}

// Ejecutar ejemplos (descomenta el que quieras usar)
// ejemploAjustarCarta();
// ejemploVerPosicion();
// ejemploEliminarAjuste();
// ejemploVerTodosLosAjustes();
// ejemploAjustarMultiplesCartas();

console.log(`
📖 GUÍA DE USO:

1. Para ajustar una carta específica:
   await updateCardMetadata("MYL-0001", 25);

2. Para ver la posición actual:
   await getCardMetadata("MYL-0001");

3. Para eliminar ajuste (volver a por defecto):
   await updateCardMetadata("MYL-0001", null);

4. Para ver todas las cartas con ajustes:
   await getAllCardsMetadata();

VALORES RECOMENDADOS:
- 15-20%: Muestra más la parte superior de la carta
- 25-30%: Posición media (por defecto según tipo)
- 35-45%: Muestra más la parte inferior de la carta
`);


