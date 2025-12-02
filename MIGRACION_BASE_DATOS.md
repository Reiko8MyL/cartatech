# Guía de Migración a Base de Datos Real

Esta guía explica cómo migrar CartaTech de localStorage a una base de datos PostgreSQL usando Prisma.

## Requisitos Previos

1. **Base de datos PostgreSQL**: Necesitas una base de datos PostgreSQL. Opciones recomendadas:
   - [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) (recomendado para Vercel)
   - [Supabase](https://supabase.com/)
   - [Neon](https://neon.tech/)
   - [Railway](https://railway.app/)
   - Cualquier instancia PostgreSQL

2. **Node.js y npm** instalados

## Paso 1: Configurar Variables de Entorno

1. Crea un archivo `.env` en la raíz del proyecto `cartatech/`:

```env
DATABASE_URL="postgresql://usuario:contraseña@host:puerto/nombre_base_datos?schema=public"
NEXT_PUBLIC_API_URL=""
NODE_ENV="development"
```

2. Para producción en Vercel:
   - Ve a tu proyecto en Vercel
   - Settings → Environment Variables
   - Agrega `DATABASE_URL` con la URL de tu base de datos PostgreSQL

## Paso 2: Instalar y Configurar Prisma

Las dependencias ya están instaladas. Solo necesitas:

1. **Generar el cliente de Prisma**:
```bash
cd cartatech
npx prisma generate
```

2. **Crear las tablas en la base de datos**:
```bash
npx prisma db push
```

O si prefieres usar migraciones:
```bash
npx prisma migrate dev --name init
```

## Paso 3: Verificar la Conexión

Puedes verificar que la conexión funciona:

```bash
npx prisma studio
```

Esto abrirá Prisma Studio, una interfaz visual para ver y editar los datos.

## Paso 4: Migrar Datos Existentes (Opcional)

Si tienes usuarios y mazos guardados en localStorage, puedes migrarlos usando el script de migración (ver sección siguiente).

## Estructura de la Base de Datos

La base de datos incluye las siguientes tablas:

- **users**: Usuarios del sistema
- **decks**: Mazos guardados por los usuarios
- **deck_versions**: Historial de versiones de cada mazo
- **favorite_decks**: Relación de mazos favoritos por usuario

## Funcionalidades Implementadas

### ✅ Autenticación
- Registro de usuarios con validación de edad (mayor de 13 años)
- Login con contraseñas hasheadas (bcrypt)
- Sesión persistente en localStorage (solo para mantener sesión)

### ✅ Mazos
- Guardar mazos en la nube
- Sincronización entre dispositivos
- Historial de versiones automático
- Mazos públicos y privados

### ✅ Favoritos
- Sistema de favoritos sincronizado
- Favoritos por usuario

### ✅ Fallback a localStorage
- Los usuarios no autenticados pueden seguir usando localStorage
- Los mazos temporales se guardan localmente
- Migración automática cuando el usuario se autentica

## Notas Importantes

1. **Contraseñas**: Las contraseñas se hashean con bcrypt antes de guardarse
2. **Sesión**: El usuario se guarda en localStorage solo para mantener la sesión, pero todos los datos se guardan en la base de datos
3. **Versiones**: Cada vez que se actualiza un mazo, se crea automáticamente una nueva versión en el historial
4. **Eliminación en cascada**: Si se elimina un usuario o un mazo, se eliminan automáticamente sus relaciones (versiones, favoritos)

## Próximos Pasos

1. Configurar NextAuth para autenticación más robusta
2. Implementar sincronización en tiempo real
3. Agregar más funcionalidades de historial de versiones (restaurar versiones anteriores)


