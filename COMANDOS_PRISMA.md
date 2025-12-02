# Comandos de Prisma - Guía Rápida

## 📍 Dónde ejecutar los comandos

Debes ejecutar los comandos en la **terminal** (PowerShell, CMD, o Terminal), navegando al directorio del proyecto.

### Paso 1: Abrir la terminal

1. **Opción A - Desde Cursor/VS Code:**
   - Presiona `` Ctrl + ` `` (backtick) para abrir la terminal integrada
   - O ve a: `Terminal` → `New Terminal`

2. **Opción B - Desde Windows:**
   - Abre PowerShell o CMD
   - Navega al directorio del proyecto

### Paso 2: Navegar al directorio del proyecto

Si no estás en el directorio del proyecto, ejecuta:

```powershell
cd "C:\Users\crist\OneDrive\Escritorio\CartaTech\cartatech"
```

O si ya estás en `CartaTech`:
```powershell
cd cartatech
```

### Paso 3: Verificar que estás en el lugar correcto

Deberías ver el archivo `package.json` y la carpeta `prisma`:
```powershell
dir
```

O con PowerShell:
```powershell
ls
```

## 🚀 Comandos a ejecutar

### 1. Crear la migración de la base de datos

Este comando crea la nueva tabla `DeckLike` en la base de datos:

```powershell
npx prisma migrate dev --name add_deck_likes
```

**¿Qué hace este comando?**
- Crea un archivo de migración en `prisma/migrations/`
- Aplica los cambios al schema de Prisma a tu base de datos PostgreSQL
- Te pedirá confirmación antes de aplicar los cambios

**Nota:** Si te pide crear una base de datos nueva, puedes cancelar (Ctrl+C) si ya tienes una configurada.

### 2. Generar el cliente de Prisma

Este comando genera el código TypeScript para interactuar con la base de datos:

```powershell
npx prisma generate
```

**¿Qué hace este comando?**
- Genera el cliente de Prisma basado en tu `schema.prisma`
- Actualiza los tipos TypeScript para incluir el nuevo modelo `DeckLike`
- Es necesario para que el código TypeScript reconozca el nuevo modelo

## 📋 Secuencia completa

Ejecuta estos comandos en orden:

```powershell
# 1. Navegar al directorio (si no estás ahí)
cd "C:\Users\crist\OneDrive\Escritorio\CartaTech\cartatech"

# 2. Crear la migración
npx prisma migrate dev --name add_deck_likes

# 3. Generar el cliente
npx prisma generate
```

## ⚠️ Importante

### Variables de entorno

Asegúrate de que tu archivo `.env` (o `.env.local`) tenga la variable `DATABASE_URL` configurada correctamente. Si no la tienes, Prisma te dará un error.

### Base de datos

- Si estás usando **Vercel Postgres**, la `DATABASE_URL` debe estar configurada en las variables de entorno de Vercel
- Si estás en **desarrollo local**, necesitas una base de datos PostgreSQL corriendo

## 🔍 Verificar que funcionó

Después de ejecutar los comandos, deberías ver:

1. **Nueva carpeta de migración:**
   - `prisma/migrations/[timestamp]_add_deck_likes/`

2. **Cliente generado:**
   - Los tipos TypeScript actualizados en `node_modules/.prisma/client/`

3. **Sin errores en la terminal:**
   - Si todo salió bien, verás mensajes de éxito

## 🆘 Si hay errores

### Error: "Environment variable not found: DATABASE_URL"
- Verifica que tengas un archivo `.env` con `DATABASE_URL`
- O configura la variable en Vercel si estás en producción

### Error: "Can't reach database server"
- Verifica que tu base de datos esté corriendo
- Verifica que la `DATABASE_URL` sea correcta

### Error: "Migration failed"
- Revisa los logs de error
- Puede que necesites ajustar el schema o la conexión a la base de datos

## 📚 Comandos útiles adicionales

### Ver el estado de las migraciones:
```powershell
npx prisma migrate status
```

### Ver el schema en el navegador (Prisma Studio):
```powershell
npx prisma studio
```

### Resetear la base de datos (⚠️ CUIDADO: borra todos los datos):
```powershell
npx prisma migrate reset
```

