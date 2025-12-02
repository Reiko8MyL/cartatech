# 🔍 Cómo Encontrar la Connection String en Vercel Postgres

## Método 1: Desde el Dashboard de Vercel (Más Fácil)

### Paso 1: Ir a tu Proyecto
1. Abre https://vercel.com
2. Inicia sesión
3. Haz clic en tu proyecto **cartatech**

### Paso 2: Ir a la Sección Storage
1. En el menú superior, busca la pestaña **"Storage"**
2. O busca en el menú lateral izquierdo: **Storage** → **Databases**

### Paso 3: Ver tu Base de Datos Postgres
1. Deberías ver tu base de datos Postgres listada
2. Haz clic en el nombre de tu base de datos

### Paso 4: Ver la Connection String
1. En la página de detalles de la base de datos, busca una sección que diga:
   - **"Connection String"** o
   - **"Connection URL"** o
   - **"Database URL"**
2. Deberías ver algo como:
   ```
   postgres://default:xxxxx@xxxxx.vercel-storage.com:5432/verceldb
   ```
3. **Copia esta URL completa**

---

## Método 2: Desde Environment Variables (Alternativo)

### Paso 1: Ir a Settings
1. En tu proyecto de Vercel
2. Ve a **Settings** (Configuración)
3. Haz clic en **Environment Variables** (Variables de Entorno)

### Paso 2: Buscar Variables de Postgres
Vercel **automáticamente** crea estas variables cuando creas una base de datos Postgres:

- `POSTGRES_URL` - URL de conexión estándar
- `POSTGRES_PRISMA_URL` - URL específica para Prisma (recomendada)
- `POSTGRES_URL_NON_POOLING` - URL sin pooling

### Paso 3: Usar la Variable Correcta
Para Prisma, usa **`POSTGRES_PRISMA_URL`** si está disponible, o **`POSTGRES_URL`** si no.

**⚠️ Importante:** 
- Vercel ya configuró estas variables automáticamente
- Pero Prisma busca `DATABASE_URL` por defecto
- Necesitas crear `DATABASE_URL` apuntando a una de estas

---

## Método 3: Usar la Variable que Vercel Creó Automáticamente

Vercel Postgres crea automáticamente `POSTGRES_PRISMA_URL` que es perfecta para Prisma.

### Opción A: Usar POSTGRES_PRISMA_URL directamente

Puedes modificar tu código para usar `POSTGRES_PRISMA_URL` en lugar de `DATABASE_URL`:

**En `prisma/schema.prisma`:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("POSTGRES_PRISMA_URL")  // Cambiar aquí
}
```

**Ventaja:** No necesitas crear `DATABASE_URL`, usa la que Vercel creó automáticamente.

### Opción B: Crear DATABASE_URL apuntando a POSTGRES_PRISMA_URL

**En Vercel (Environment Variables):**
1. Ve a Settings → Environment Variables
2. Haz clic en **"Add New"**
3. **Name**: `DATABASE_URL`
4. **Value**: Copia el valor de `POSTGRES_PRISMA_URL` (o `POSTGRES_URL`)
5. **Environments**: Production, Preview, Development
6. Guarda

**Localmente (`.env`):**
```env
DATABASE_URL="postgres://default:xxxxx@xxxxx.vercel-storage.com:5432/verceldb?pgbouncer=true&connect_timeout=15"
```

---

## 🎯 Recomendación: Método Más Simple

**La forma más fácil es usar `POSTGRES_PRISMA_URL` directamente:**

1. **Modificar `prisma/schema.prisma`** para usar `POSTGRES_PRISMA_URL`
2. **En Vercel**: Ya está configurada automáticamente ✅
3. **Localmente**: Crear `.env` con `POSTGRES_PRISMA_URL` (copiar el valor de Vercel)

---

## 📋 Pasos Rápidos

### 1. Obtener el Valor de POSTGRES_PRISMA_URL

**En Vercel:**
1. Proyecto → **Settings** → **Environment Variables**
2. Busca `POSTGRES_PRISMA_URL`
3. Haz clic en el **ojo** 👁️ para ver el valor
4. **Copia el valor completo**

### 2. Configurar Localmente

**Crear/editar `.env` en `cartatech/`:**
```env
POSTGRES_PRISMA_URL="postgres://default:xxxxx@xxxxx.vercel-storage.com:5432/verceldb?pgbouncer=true&connect_timeout=15"
```

### 3. Actualizar schema.prisma

Cambiar de:
```prisma
url = env("DATABASE_URL")
```

A:
```prisma
url = env("POSTGRES_PRISMA_URL")
```

---

## 🔍 ¿Cómo se Ve una Connection String?

Una connection string típica de Vercel Postgres se ve así:

```
postgres://default:abc123xyz@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=15
```

**Componentes:**
- `postgres://` - Protocolo
- `default` - Usuario
- `abc123xyz` - Contraseña (hasheada)
- `aws-0-us-east-1...` - Host del servidor
- `6543` - Puerto
- `postgres` - Nombre de la base de datos
- `?pgbouncer=true&connect_timeout=15` - Parámetros de conexión

---

## ⚠️ Si No Encuentras la Connection String

### Opción 1: Verificar que la BD esté Creada
1. Ve a Storage → Databases
2. Verifica que tu base de datos Postgres esté listada
3. Si no está, créala primero

### Opción 2: Revisar las Variables de Entorno
1. Settings → Environment Variables
2. Busca variables que empiecen con `POSTGRES`
3. Si no hay ninguna, la BD podría no estar vinculada al proyecto

### Opción 3: Recrear la Base de Datos
Si no encuentras nada:
1. Ve a Storage → Create Database
2. Selecciona Postgres
3. Asegúrate de vincularla a tu proyecto
4. Vercel creará las variables automáticamente

---

## ✅ Verificación

Para verificar que tienes la URL correcta:

1. **En Vercel**: Deberías ver `POSTGRES_PRISMA_URL` en Environment Variables
2. **Localmente**: Deberías tener `.env` con la URL
3. **Prueba**: Ejecuta `npx prisma db push` y debería conectarse

---

## 🚀 Siguiente Paso

Una vez que tengas la connection string:

1. ✅ Configurarla en `.env` localmente
2. ✅ Actualizar `schema.prisma` si es necesario
3. ✅ Ejecutar `npx prisma generate`
4. ✅ Ejecutar `npx prisma db push`


