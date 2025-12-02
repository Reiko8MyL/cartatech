# Solución para "Drift detected" en Prisma

## ¿Qué significa "Drift detected"?

Prisma detectó que tu base de datos tiene tablas que no están en el historial de migraciones. Esto es **normal** si:
- Las tablas ya existían en la base de datos
- Es la primera vez que usas Prisma Migrate
- Las tablas se crearon con otro método (manual, otro ORM, etc.)

## ⚠️ NO ejecutes `prisma migrate reset`

Eso borraría **TODOS tus datos**. No lo hagas.

## ✅ Solución: Crear una migración baseline

Necesitas crear una migración "baseline" que marque el estado actual de la base de datos como aplicado, sin hacer cambios.

### Opción 1: Usar `prisma migrate resolve` (Recomendado)

1. **Primero, crea la migración baseline manualmente:**

```powershell
# Crear la carpeta de migración baseline
mkdir prisma\migrations\0_init

# Crear un archivo SQL vacío (solo para marcar como aplicado)
echo "-- Baseline migration: existing tables" > prisma\migrations\0_init\migration.sql
```

2. **Marcar la migración como aplicada (sin ejecutarla):**

```powershell
npx prisma migrate resolve --applied 0_init
```

3. **Ahora crear la migración para DeckLike:**

```powershell
npx prisma migrate dev --name add_deck_likes
```

### Opción 2: Usar `prisma db pull` + `prisma migrate dev` (Alternativa)

Si la opción 1 no funciona, puedes sincronizar el schema primero:

```powershell
# Sincronizar el schema con la base de datos existente
npx prisma db pull

# Luego crear la migración
npx prisma migrate dev --name add_deck_likes
```

### Opción 3: Usar `--create-only` (Más seguro)

Crear la migración sin aplicarla, revisarla, y luego aplicarla:

```powershell
# Crear la migración sin aplicarla
npx prisma migrate dev --name add_deck_likes --create-only

# Revisar el archivo SQL generado en prisma/migrations/[timestamp]_add_deck_likes/migration.sql

# Si está bien, aplicar la migración
npx prisma migrate deploy
```

## 🎯 Recomendación

Usa la **Opción 1** si quieres mantener el historial limpio, o la **Opción 3** si quieres revisar los cambios antes de aplicarlos.

