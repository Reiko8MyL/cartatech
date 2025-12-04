/**
 * Script para asignar roles a usuarios
 * 
 * Uso:
 *   npx tsx scripts/set-user-role.ts <username> <role>
 * 
 * Roles válidos: USER, MODERATOR, ADMIN
 * 
 * Ejemplos:
 *   npx tsx scripts/set-user-role.ts miUsuario ADMIN
 *   npx tsx scripts/set-user-role.ts otroUsuario MODERATOR
 */

// Cargar variables de entorno ANTES de cualquier otro import
import { config } from "dotenv";
import { resolve } from "path";

// Cargar .env desde la raíz del proyecto
const envPath = resolve(process.cwd(), ".env");
config({ path: envPath });

// Verificar que DATABASE_URL esté disponible
if (!process.env.DATABASE_URL) {
  console.error("❌ Error: DATABASE_URL no está definida en el archivo .env");
  console.error(`   Buscando .env en: ${envPath}`);
  console.error("   Asegúrate de tener un archivo .env con DATABASE_URL configurada");
  process.exit(1);
}

// Ahora sí importar Prisma después de cargar las variables de entorno
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Crear Prisma Client con adapter para el script
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"],
});

type UserRole = "USER" | "MODERATOR" | "ADMIN";

async function setUserRole() {
  const username = process.argv[2];
  const role = process.argv[3] as UserRole;

  if (!username || !role) {
    console.error("❌ Uso: npx tsx scripts/set-user-role.ts <username> <role>");
    console.error("   Roles válidos: USER, MODERATOR, ADMIN");
    process.exit(1);
  }

  const validRoles: UserRole[] = ["USER", "MODERATOR", "ADMIN"];
  if (!validRoles.includes(role)) {
    console.error(`❌ Rol inválido: ${role}`);
    console.error("   Roles válidos: USER, MODERATOR, ADMIN");
    process.exit(1);
  }

  try {
    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, role: true },
    });

    if (!user) {
      console.error(`❌ Usuario "${username}" no encontrado`);
      process.exit(1);
    }

    // Actualizar rol
    await prisma.user.update({
      where: { username },
      data: { role },
    });

    console.log(`✅ Usuario "${username}" ahora tiene rol: ${role}`);
    console.log(`   Rol anterior: ${user.role || "USER"}`);
    console.log(`   Rol nuevo: ${role}`);
    
    // Cerrar conexiones
    await prisma.$disconnect();
    await pool.end();
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error al actualizar rol:", error);
    if (error instanceof Error) {
      console.error("   Mensaje:", error.message);
    }
    
    // Cerrar conexiones en caso de error
    await prisma.$disconnect().catch(() => {});
    await pool.end().catch(() => {});
    
    process.exit(1);
  }
}

setUserRole();

