# ⚡ Instrucciones Rápidas: Encontrar Connection String

## 🎯 Método Más Rápido (2 minutos)

### Paso 1: Ir a Environment Variables en Vercel
1. Abre https://vercel.com
2. Entra a tu proyecto **cartatech**
3. Ve a **Settings** → **Environment Variables**

### Paso 2: Buscar POSTGRES_PRISMA_URL
1. Busca en la lista una variable llamada **`POSTGRES_PRISMA_URL`**
2. Vercel la crea **automáticamente** cuando creas una base de datos Postgres
3. Haz clic en el **ícono del ojo** 👁️ para ver el valor
4. **Copia el valor completo**

### Paso 3: Configurar Localmente
1. Crea un archivo `.env` en la carpeta `cartatech/`
2. Agrega esta línea (pega el valor que copiaste):
   ```env
   POSTGRES_PRISMA_URL="postgres://default:xxxxx@xxxxx.vercel-storage.com:5432/verceldb?pgbouncer=true&connect_timeout=15"
   ```
3. Guarda el archivo

### Paso 4: ¡Listo!
Ya puedes ejecutar:
```bash
npx prisma generate
npx prisma db push
```

---

## 🔍 Si No Encuentras POSTGRES_PRISMA_URL

### Opción 1: Buscar Otras Variables
En Environment Variables, busca:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `DATABASE_URL`

Cualquiera de estas puede funcionar.

### Opción 2: Ir a Storage
1. Ve a la pestaña **Storage** en tu proyecto
2. Haz clic en tu base de datos Postgres
3. Busca una sección que diga **"Connection String"** o **"Connection URL"**
4. Copia esa URL

### Opción 3: Verificar que la BD esté Vinculada
1. Ve a Storage → Databases
2. Verifica que tu base de datos Postgres esté vinculada a tu proyecto
3. Si no está vinculada, haz clic en **"Link"** o **"Connect"**

---

## 📝 Nota Importante

**Ya actualicé tu `schema.prisma`** para usar `POSTGRES_PRISMA_URL` directamente.

Esto significa que:
- ✅ **En Vercel**: Ya está configurada automáticamente (no necesitas hacer nada)
- ✅ **Localmente**: Solo necesitas crear `.env` con `POSTGRES_PRISMA_URL`

**No necesitas crear `DATABASE_URL` manualmente** - Vercel ya lo hizo por ti.

---

## ✅ Verificación

Para verificar que todo está bien:

1. **En Vercel**: Deberías ver `POSTGRES_PRISMA_URL` en Environment Variables
2. **Localmente**: Deberías tener `.env` con `POSTGRES_PRISMA_URL`
3. **Prueba**: Ejecuta `npx prisma db push` - debería conectarse sin errores

---

## 🚀 Siguiente Paso

Una vez que tengas la URL en `.env`:

```bash
# Generar cliente Prisma
npx prisma generate

# Crear las tablas
npx prisma db push

# Verificar (opcional)
npx prisma studio
```


