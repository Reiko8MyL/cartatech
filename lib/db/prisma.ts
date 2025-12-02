import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// En Prisma 7, necesitamos usar un adapter para la conexión
const databaseUrl = process.env.DATABASE_URL;

// Crear Prisma Client con adapter solo si DATABASE_URL está disponible
// Durante el build, puede no estar disponible, pero en runtime siempre debe estar
let pool: Pool | undefined;
let adapter: PrismaPg | undefined;

if (databaseUrl) {
  try {
    pool = new Pool({ connectionString: databaseUrl });
    adapter = new PrismaPg(pool);
  } catch (error) {
    console.error("Error al crear pool de conexiones:", error);
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(adapter && { adapter }),
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

