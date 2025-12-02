import { defineConfig } from 'prisma/config';
import { config } from 'dotenv';
import { resolve } from 'path';

// Cargar el archivo .env desde la raíz del proyecto
config({ path: resolve(process.cwd(), '.env') });

const databaseUrl = process.env.DATABASE_URL;

// Solo lanzar error si DATABASE_URL es requerida (no durante prisma generate)
// prisma generate no necesita DATABASE_URL, solo el schema
if (!databaseUrl && process.env.PRISMA_REQUIRE_DATABASE_URL === 'true') {
  throw new Error('DATABASE_URL no está definida. Verifica que el archivo .env existe y contiene DATABASE_URL');
}

// Si no hay DATABASE_URL, usar una URL dummy para prisma generate
// Esto es seguro porque prisma generate solo lee el schema, no se conecta a la BD
const url = databaseUrl || 'postgresql://user:password@localhost:5432/dummy';

export default defineConfig({
  datasource: {
    url: url,
  },
});

