/**
 * Script de migración de datos de localStorage a base de datos
 * 
 * IMPORTANTE: Este script debe ejecutarse manualmente y requiere:
 * 1. Acceso a la base de datos configurada
 * 2. Datos existentes en localStorage del navegador
 * 
 * Uso:
 * 1. Abre la consola del navegador en el sitio
 * 2. Copia y pega este script
 * 3. O ejecuta: node scripts/migrate-localStorage-to-db.ts (requiere adaptación)
 */

import { prisma } from "../lib/db/prisma";
import bcrypt from "bcryptjs";

interface LocalStorageUser {
  id: string;
  username: string;
  email: string;
  password: string;
  createdAt: number;
}

interface LocalStorageDeck {
  id: string;
  name: string;
  description?: string;
  cards: Array<{ cardId: string; quantity: number }>;
  createdAt: number;
  userId?: string;
  author?: string;
  isPublic?: boolean;
  publishedAt?: number;
  techCardId?: string;
  viewCount?: number;
  tags?: string[];
  format?: string;
}

/**
 * Migra usuarios de localStorage a la base de datos
 */
async function migrateUsers() {
  if (typeof window === "undefined") {
    console.log("Este script debe ejecutarse en el navegador");
    return;
  }

  try {
    const usersData = localStorage.getItem("cartatech_users");
    if (!usersData) {
      console.log("No hay usuarios en localStorage");
      return;
    }

    const users: LocalStorageUser[] = JSON.parse(usersData);
    console.log(`Encontrados ${users.length} usuarios para migrar`);

    for (const user of users) {
      try {
        // Verificar si el usuario ya existe
        const existing = await prisma.user.findFirst({
          where: {
            OR: [
              { username: { equals: user.username, mode: "insensitive" } },
              { email: { equals: user.email, mode: "insensitive" } },
            ],
          },
        });

        if (existing) {
          console.log(`Usuario ${user.username} ya existe, omitiendo...`);
          continue;
        }

        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(user.password, 12);

        // Crear usuario
        await prisma.user.create({
          data: {
            username: user.username,
            email: user.email.toLowerCase(),
            password: hashedPassword,
            createdAt: new Date(user.createdAt),
          },
        });

        console.log(`Usuario ${user.username} migrado exitosamente`);
      } catch (error) {
        console.error(`Error al migrar usuario ${user.username}:`, error);
      }
    }

    console.log("Migración de usuarios completada");
  } catch (error) {
    console.error("Error en migración de usuarios:", error);
  }
}

/**
 * Migra mazos de localStorage a la base de datos
 */
async function migrateDecks() {
  if (typeof window === "undefined") {
    console.log("Este script debe ejecutarse en el navegador");
    return;
  }

  try {
    const decksData = localStorage.getItem("myl_saved_decks");
    if (!decksData) {
      console.log("No hay mazos en localStorage");
      return;
    }

    const decks: LocalStorageDeck[] = JSON.parse(decksData);
    console.log(`Encontrados ${decks.length} mazos para migrar`);

    for (const deck of decks) {
      try {
        // Si el mazo no tiene userId, no podemos migrarlo
        if (!deck.userId) {
          console.log(`Mazo ${deck.name} no tiene userId, omitiendo...`);
          continue;
        }

        // Verificar que el usuario existe
        const user = await prisma.user.findUnique({
          where: { id: deck.userId },
        });

        if (!user) {
          console.log(`Usuario ${deck.userId} no existe para el mazo ${deck.name}, omitiendo...`);
          continue;
        }

        // Verificar si el mazo ya existe
        const existing = await prisma.deck.findUnique({
          where: { id: deck.id },
        });

        if (existing) {
          console.log(`Mazo ${deck.name} ya existe, omitiendo...`);
          continue;
        }

        // Crear mazo
        const newDeck = await prisma.deck.create({
          data: {
            id: deck.id,
            name: deck.name,
            description: deck.description,
            cards: deck.cards,
            format: (deck.format || "RE") as string,
            userId: deck.userId,
            isPublic: deck.isPublic || false,
            publishedAt: deck.publishedAt ? new Date(deck.publishedAt) : null,
            techCardId: deck.techCardId,
            viewCount: deck.viewCount || 0,
            tags: deck.tags || [],
            createdAt: new Date(deck.createdAt),
          },
        });

        // Crear versión inicial
        await prisma.deckVersion.create({
          data: {
            deckId: newDeck.id,
            userId: deck.userId,
            name: deck.name,
            description: deck.description,
            cards: deck.cards,
            format: deck.format || "RE",
            tags: deck.tags || [],
            createdAt: new Date(deck.createdAt),
          },
        });

        console.log(`Mazo ${deck.name} migrado exitosamente`);
      } catch (error) {
        console.error(`Error al migrar mazo ${deck.name}:`, error);
      }
    }

    console.log("Migración de mazos completada");
  } catch (error) {
    console.error("Error en migración de mazos:", error);
  }
}

/**
 * Migra favoritos de localStorage a la base de datos
 */
async function migrateFavorites() {
  if (typeof window === "undefined") {
    console.log("Este script debe ejecutarse en el navegador");
    return;
  }

  try {
    // Buscar todas las claves de favoritos
    const favoriteKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("myl_favorite_decks_")) {
        favoriteKeys.push(key);
      }
    }

    console.log(`Encontradas ${favoriteKeys.length} claves de favoritos`);

    for (const key of favoriteKeys) {
      try {
        const userId = key.replace("myl_favorite_decks_", "");
        const favoriteDeckIds: string[] = JSON.parse(
          localStorage.getItem(key) || "[]"
        );

        for (const deckId of favoriteDeckIds) {
          try {
            // Verificar que el mazo existe
            const deck = await prisma.deck.findUnique({
              where: { id: deckId },
            });

            if (!deck) {
              console.log(`Mazo ${deckId} no existe, omitiendo favorito...`);
              continue;
            }

            // Crear favorito (upsert para evitar duplicados)
            await prisma.favoriteDeck.upsert({
              where: {
                userId_deckId: {
                  userId,
                  deckId,
                },
              },
              create: {
                userId,
                deckId,
              },
              update: {},
            });

            console.log(`Favorito ${deckId} para usuario ${userId} migrado`);
          } catch (error) {
            console.error(`Error al migrar favorito ${deckId}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error al procesar clave ${key}:`, error);
      }
    }

    console.log("Migración de favoritos completada");
  } catch (error) {
    console.error("Error en migración de favoritos:", error);
  }
}

/**
 * Función principal de migración
 */
export async function migrateAll() {
  console.log("Iniciando migración de datos...");
  await migrateUsers();
  await migrateDecks();
  await migrateFavorites();
  console.log("Migración completada");
}

// Para ejecutar en el navegador, descomenta:
// migrateAll();




















