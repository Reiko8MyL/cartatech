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

async function migrateCards() {
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

    console.log("🔄 Iniciando migración de cartas a la base de datos...");

    // Contar cartas existentes
    const existingCount = await prisma.card.count();
    if (existingCount > 0) {
      console.log(`⚠️  Ya existen ${existingCount} cartas en la base de datos.`);
      console.log("¿Deseas continuar y sobrescribir? (Ctrl+C para cancelar)");
      // Esperar 5 segundos para que el usuario pueda cancelar
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Eliminar todas las cartas existentes (si las hay)
    console.log("🗑️  Eliminando cartas existentes...");
    await prisma.card.deleteMany({});
    console.log("✅ Cartas existentes eliminadas");

    // Primero, insertar todas las cartas principales
    console.log(`📦 Insertando ${CARDS.length} cartas principales...`);
    const mainCards = CARDS.map((card: any) => ({
      id: card.id,
      name: card.name,
      type: card.type,
      cost: card.cost ?? null,
      power: card.power ?? null,
      race: card.race ?? null,
      isCosmetic: card.isCosmetic ?? false,
      isRework: card.isRework ?? false,
      isUnique: card.isUnique ?? false,
      edition: card.edition,
      banListRE: card.banListRE ?? 3,
      banListRL: card.banListRL ?? 3,
      banListLI: card.banListLI ?? 3,
      isOroIni: card.isOroIni ?? false,
      image: card.image,
      description: card.description ?? "",
      baseCardId: null, // Las cartas principales no tienen baseCardId
      // Atributos booleanos para filtros avanzados
      errante: card.errante ?? false,
      soloAtacNoBloq: card.soloAtacNoBloq ?? false,
      soloBloqNoAtac: card.soloBloqNoAtac ?? false,
      bloquarVarios: card.bloquarVarios ?? false,
      pacej: card.pacej ?? false,
      imblo: card.imblo ?? false,
      bloqImblo: card.bloqImblo ?? false,
      noArmas: card.noArmas ?? false,
      mas1arma: card.mas1arma ?? false,
      indestructible: card.indestructible ?? false,
      indestrerrable: card.indestrerrable ?? false,
      exhumar: card.exhumar ?? false,
      controlCementerio: card.controlCementerio ?? false,
      lookDeck: card.lookDeck ?? false,
      desafio: card.desafio ?? false,
      sBuff: card.sBuff ?? false,
      sNerf: card.sNerf ?? false,
      noJugar: card.noJugar ?? false,
      quitaHab: card.quitaHab ?? false,
      copiaHabil: card.copiaHabil ?? false,
      anulación: card.anulación ?? false,
      nPSA: card.nPSA ?? false,
      cancelación: card.cancelación ?? false,
      prevencion: card.prevencion ?? false,
      redDaño: card.redDaño ?? false,
      ramp: card.ramp ?? false,
      destierroDirec: card.destierroDirec ?? false,
      dañoDirec: card.dañoDirec ?? false,
      buscador: card.buscador ?? false,
      invocador: card.invocador ?? false,
      transformador: card.transformador ?? false,
      limitador: card.limitador ?? false,
      taunt: card.taunt ?? false,
      movimiento: card.movimiento ?? false,
      evitAtacar: card.evitAtacar ?? false,
      evitBloq: card.evitBloq ?? false,
      inmuni: card.inmuni ?? false,
      baraje: card.baraje ?? false,
      Robo: card.Robo ?? false,
      descartaMano: card.descartaMano ?? false,
      ordenMazo: card.ordenMazo ?? false,
      genOro: card.genOro ?? false,
      redCoste: card.redCoste ?? false,
      ganaControl: card.ganaControl ?? false,
      redirec: card.redirec ?? false,
      rDestrucción: card.rDestrucción ?? false,
      rDestierro: card.rDestierro ?? false,
      rBaraje: card.rBaraje ?? false,
      rTopBot: card.rTopBot ?? false,
      rMano: card.rMano ?? false,
    }));

    // Insertar en lotes de 100 para mejor performance
    const batchSize = 100;
    for (let i = 0; i < mainCards.length; i += batchSize) {
      const batch = mainCards.slice(i, i + batchSize);
      await prisma.card.createMany({
        data: batch,
        skipDuplicates: true,
      });
      console.log(`  ✅ Insertadas ${Math.min(i + batchSize, mainCards.length)}/${mainCards.length} cartas principales`);
    }

    // Luego, insertar cartas alternativas con referencia a la carta base
    console.log(`📦 Insertando ${AAcards.length} cartas alternativas...`);
    const altCards = AAcards.map((card: any) => {
      const baseId = getBaseCardId(card.id);
      return {
        id: card.id,
        name: card.name,
        type: card.type,
        cost: card.cost ?? null,
        power: card.power ?? null,
        race: card.race ?? null,
        isCosmetic: card.isCosmetic ?? true, // Las alternativas siempre son cosmetic
        isRework: card.isRework ?? false,
        isUnique: card.isUnique ?? false,
        edition: card.edition,
        banListRE: card.banListRE ?? 3,
        banListRL: card.banListRL ?? 3,
        banListLI: card.banListLI ?? 3,
        isOroIni: card.isOroIni ?? false,
        image: card.image,
        description: card.description ?? "",
        baseCardId: baseId, // Referencia a la carta principal
        // Atributos booleanos para filtros avanzados
        errante: card.errante ?? false,
        soloAtacNoBloq: card.soloAtacNoBloq ?? false,
        soloBloqNoAtac: card.soloBloqNoAtac ?? false,
        bloquarVarios: card.bloquarVarios ?? false,
        pacej: card.pacej ?? false,
        imblo: card.imblo ?? false,
        bloqImblo: card.bloqImblo ?? false,
        noArmas: card.noArmas ?? false,
        mas1arma: card.mas1arma ?? false,
        indestructible: card.indestructible ?? false,
        indestrerrable: card.indestrerrable ?? false,
        exhumar: card.exhumar ?? false,
        controlCementerio: card.controlCementerio ?? false,
        lookDeck: card.lookDeck ?? false,
        desafio: card.desafio ?? false,
        sBuff: card.sBuff ?? false,
        sNerf: card.sNerf ?? false,
        noJugar: card.noJugar ?? false,
        quitaHab: card.quitaHab ?? false,
        copiaHabil: card.copiaHabil ?? false,
        anulación: card.anulación ?? false,
        nPSA: card.nPSA ?? false,
        cancelación: card.cancelación ?? false,
        prevencion: card.prevencion ?? false,
        redDaño: card.redDaño ?? false,
        ramp: card.ramp ?? false,
        destierroDirec: card.destierroDirec ?? false,
        dañoDirec: card.dañoDirec ?? false,
        buscador: card.buscador ?? false,
        invocador: card.invocador ?? false,
        transformador: card.transformador ?? false,
        limitador: card.limitador ?? false,
        taunt: card.taunt ?? false,
        movimiento: card.movimiento ?? false,
        evitAtacar: card.evitAtacar ?? false,
        evitBloq: card.evitBloq ?? false,
        inmuni: card.inmuni ?? false,
        baraje: card.baraje ?? false,
        Robo: card.Robo ?? false,
        descartaMano: card.descartaMano ?? false,
        ordenMazo: card.ordenMazo ?? false,
        genOro: card.genOro ?? false,
        redCoste: card.redCoste ?? false,
        ganaControl: card.ganaControl ?? false,
        redirec: card.redirec ?? false,
        rDestrucción: card.rDestrucción ?? false,
        rDestierro: card.rDestierro ?? false,
        rBaraje: card.rBaraje ?? false,
        rTopBot: card.rTopBot ?? false,
        rMano: card.rMano ?? false,
      };
    });

    // Insertar en lotes
    for (let i = 0; i < altCards.length; i += batchSize) {
      const batch = altCards.slice(i, i + batchSize);
      await prisma.card.createMany({
        data: batch,
        skipDuplicates: true,
      });
      console.log(`  ✅ Insertadas ${Math.min(i + batchSize, altCards.length)}/${altCards.length} cartas alternativas`);
    }

    // Verificar que todo se insertó correctamente
    const totalCount = await prisma.card.count();
    const mainCount = await prisma.card.count({ where: { baseCardId: null } });
    const altCount = await prisma.card.count({ where: { baseCardId: { not: null } } });

    console.log("\n✅ Migración completada exitosamente!");
    console.log(`📊 Estadísticas:`);
    console.log(`   - Total de cartas: ${totalCount}`);
    console.log(`   - Cartas principales: ${mainCount}`);
    console.log(`   - Cartas alternativas: ${altCount}`);
    console.log(`   - Esperado: ${CARDS.length} principales + ${AAcards.length} alternativas = ${CARDS.length + AAcards.length}`);

    if (totalCount === CARDS.length + AAcards.length) {
      console.log("✅ Todas las cartas se migraron correctamente");
    } else {
      console.log("⚠️  Advertencia: El número de cartas no coincide con lo esperado");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error al migrar cartas:", error);
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

migrateCards();
