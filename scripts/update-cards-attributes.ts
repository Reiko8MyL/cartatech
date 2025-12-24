import { config } from 'dotenv';
import { resolve } from 'path';

// Cargar variables de entorno desde la raíz del proyecto
config({ path: resolve(process.cwd(), '.env') });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Importar los datos de las cartas
// @ts-ignore - Los archivos JS no tienen tipos
import { CARDS } from "../lib/data/cards.js";
// @ts-ignore
import { AAcards } from "../lib/data/AAcards.js";

function getBaseCardId(cardId: string): string {
  return cardId.split("-").slice(0, 2).join("-");
}

async function updateCardsAttributes() {
  let prisma: PrismaClient | undefined;
  let pool: Pool | undefined;

  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL no está definida en .env");
    }

    pool = new Pool({ connectionString: databaseUrl });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });

    console.log("🔄 Actualizando atributos de cartas en la base de datos...");

    // Crear un mapa de todas las cartas (principales + alternativas)
    const allCards = [...CARDS, ...AAcards];
    const cardsMap = new Map(allCards.map((card: any) => [card.id, card]));

    console.log(`📦 Actualizando ${allCards.length} cartas...`);

    let updated = 0;
    let notFound = 0;

    // Actualizar cada carta
    for (const [cardId, cardData] of cardsMap.entries()) {
      try {
        await prisma.card.update({
          where: { id: cardId },
          data: {
            // Atributos booleanos para filtros avanzados
            errante: cardData.errante ?? false,
            soloAtacNoBloq: cardData.soloAtacNoBloq ?? false,
            soloBloqNoAtac: cardData.soloBloqNoAtac ?? false,
            bloquarVarios: cardData.bloquarVarios ?? false,
            pacej: cardData.pacej ?? false,
            imblo: cardData.imblo ?? false,
            bloqImblo: cardData.bloqImblo ?? false,
            noArmas: cardData.noArmas ?? false,
            mas1arma: cardData.mas1arma ?? false,
            indestructible: cardData.indestructible ?? false,
            indestrerrable: cardData.indestrerrable ?? false,
            exhumar: cardData.exhumar ?? false,
            controlCementerio: cardData.controlCementerio ?? false,
            lookDeck: cardData.lookDeck ?? false,
            desafio: cardData.desafio ?? false,
            sBuff: cardData.sBuff ?? false,
            sNerf: cardData.sNerf ?? false,
            noJugar: cardData.noJugar ?? false,
            quitaHab: cardData.quitaHab ?? false,
            copiaHabil: cardData.copiaHabil ?? false,
            anulación: cardData.anulación ?? false,
            nPSA: cardData.nPSA ?? false,
            cancelación: cardData.cancelación ?? false,
            prevencion: cardData.prevencion ?? false,
            redDaño: cardData.redDaño ?? false,
            ramp: cardData.ramp ?? false,
            destierroDirec: cardData.destierroDirec ?? false,
            dañoDirec: cardData.dañoDirec ?? false,
            buscador: cardData.buscador ?? false,
            invocador: cardData.invocador ?? false,
            transformador: cardData.transformador ?? false,
            limitador: cardData.limitador ?? false,
            taunt: cardData.taunt ?? false,
            movimiento: cardData.movimiento ?? false,
            evitAtacar: cardData.evitAtacar ?? false,
            evitBloq: cardData.evitBloq ?? false,
            inmuni: cardData.inmuni ?? false,
            baraje: cardData.baraje ?? false,
            Robo: cardData.Robo ?? false,
            descartaMano: cardData.descartaMano ?? false,
            ordenMazo: cardData.ordenMazo ?? false,
            genOro: cardData.genOro ?? false,
            redCoste: cardData.redCoste ?? false,
            ganaControl: cardData.ganaControl ?? false,
            redirec: cardData.redirec ?? false,
            rDestrucción: cardData.rDestrucción ?? false,
            rDestierro: cardData.rDestierro ?? false,
            rBaraje: cardData.rBaraje ?? false,
            rTopBot: cardData.rTopBot ?? false,
            rMano: cardData.rMano ?? false,
          },
        });
        updated++;
        if (updated % 100 === 0) {
          console.log(`  ✅ Actualizadas ${updated}/${allCards.length} cartas...`);
        }
      } catch (error: any) {
        if (error.code === 'P2025') {
          // Record not found
          notFound++;
          console.log(`  ⚠️  Carta ${cardId} no encontrada en la base de datos`);
        } else {
          throw error;
        }
      }
    }

    console.log("\n✅ Actualización completada!");
    console.log(`📊 Estadísticas:`);
    console.log(`   - Cartas actualizadas: ${updated}`);
    console.log(`   - Cartas no encontradas: ${notFound}`);
    console.log(`   - Total procesadas: ${allCards.length}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error al actualizar cartas:", error);
    if (error instanceof Error) {
      console.error("   Mensaje:", error.message);
      console.error("   Stack:", error.stack);
    }
    process.exit(1);
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
    if (pool) {
      await pool.end();
    }
  }
}

updateCardsAttributes();

