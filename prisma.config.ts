import { defineConfig } from 'prisma/config';
import { config } from 'dotenv';
import { resolve } from 'path';

// Cargar el archivo .env desde la raíz del proyecto
config({ path: resolve(process.cwd(), '.env') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL no está definida. Verifica que el archivo .env existe y contiene DATABASE_URL');
}

export default defineConfig({
  datasource: {
    url: databaseUrl,
  },
});

