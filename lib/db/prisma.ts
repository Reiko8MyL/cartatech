import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// En Prisma 7, necesitamos usar un adapter para la conexión
// Durante el build, DATABASE_URL puede no estar disponible, así que usamos una URL dummy
// Solo validaremos en runtime cuando realmente se use la conexión
const databaseUrl = process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/dummy";

// Crear el pool de conexiones PostgreSQL
const pool = new Pool({ connectionString: databaseUrl });
// Crear el adapter de Prisma para PostgreSQL
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

