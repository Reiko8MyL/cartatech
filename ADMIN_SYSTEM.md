# Sistema de Administración y Moderación - CartaTech

Este documento explica cómo usar el sistema de administración y moderación implementado en CartaTech.

## 📋 Índice

1. [Roles de Usuario](#roles-de-usuario)
2. [Configuración Inicial](#configuración-inicial)
3. [Asignar Roles a Usuarios](#asignar-roles-a-usuarios)
4. [Panel de Administración](#panel-de-administración)
5. [APIs de Administración](#apis-de-administración)
6. [Seguridad](#seguridad)

## 👥 Roles de Usuario

El sistema tiene tres roles:

- **USER**: Usuario normal (por defecto)
- **MODERATOR**: Puede moderar contenido (eliminar comentarios, etc.)
- **ADMIN**: Acceso completo (moderación + gestión de ban list + gestión de usuarios)

## 🚀 Configuración Inicial

### 1. Actualizar la Base de Datos

Después de agregar el campo `role` al schema de Prisma, ejecuta:

```bash
# Generar el cliente de Prisma
npx prisma generate

# Aplicar cambios a la base de datos
npx prisma db push
```

O si prefieres crear una migración:

```bash
npx prisma migrate dev --name add_user_role
```

### 2. Asignar Rol de Admin a tu Usuario

Usa el script proporcionado:

```bash
npx tsx scripts/set-user-role.ts tuUsuario ADMIN
```

**Nota**: Reemplaza `tuUsuario` con tu nombre de usuario real.

## 🔧 Asignar Roles a Usuarios

### Usando el Script

```bash
# Asignar rol de ADMIN
npx tsx scripts/set-user-role.ts nombreUsuario ADMIN

# Asignar rol de MODERATOR
npx tsx scripts/set-user-role.ts nombreUsuario MODERATOR

# Asignar rol de USER (quitar privilegios)
npx tsx scripts/set-user-role.ts nombreUsuario USER
```

### Usando Prisma Studio

```bash
npx prisma studio
```

1. Abre la tabla `users`
2. Busca el usuario
3. Edita el campo `role` a `"ADMIN"`, `"MODERATOR"` o `"USER"`
4. Guarda

### Usando SQL Directo

```sql
-- Conectarte a tu base de datos PostgreSQL
UPDATE users SET role = 'ADMIN' WHERE username = 'nombreUsuario';
```

## 🎛️ Panel de Administración

### Acceso

Una vez que tengas rol de `MODERATOR` o `ADMIN`, puedes acceder a:

- **Dashboard Principal**: `/admin/dashboard`
- **Moderación de Comentarios**: `/admin/comments`
- **Ajustar Cartas**: `/admin/ajustar-cartas` (ya existía)

### Funcionalidades por Rol

#### Moderador (MODERATOR)
- ✅ Ver dashboard de administración
- ✅ Moderar comentarios (eliminar comentarios inapropiados)
- ✅ Acceder a ajustes de cartas

#### Administrador (ADMIN)
- ✅ Todas las funcionalidades de moderador
- ✅ Gestionar ban list (próximamente)
- ✅ Gestionar usuarios y roles (próximamente)

## 🔌 APIs de Administración

### Eliminar Comentario (Moderador/Admin)

```typescript
DELETE /api/admin/comments/[commentId]?userId=[userId]
```

**Permisos**: Requiere rol `MODERATOR` o `ADMIN`

**Ejemplo**:
```typescript
const response = await fetch(
  `/api/admin/comments/${commentId}?userId=${userId}`,
  { method: "DELETE" }
);
```

### Eliminar Comentario (Usuario Normal)

Los usuarios normales pueden eliminar sus propios comentarios usando:

```typescript
DELETE /api/decks/[id]/comments/[commentId]?userId=[userId]
```

**Permisos**: 
- El usuario es dueño del comentario, O
- El usuario tiene rol `MODERATOR` o `ADMIN`

## 🔒 Seguridad

### Verificación de Permisos

El sistema verifica permisos en **múltiples capas**:

1. **Cliente (UI)**: El componente `AdminGuard` verifica el rol para mostrar/ocultar contenido
2. **Servidor (APIs)**: Cada API verifica el rol desde la base de datos antes de permitir acciones

### ⚠️ Importante

- **Nunca confíes solo en el cliente**: El rol en `localStorage` solo se usa para UI
- **Siempre verifica en el servidor**: Todas las APIs consultan el rol desde la base de datos
- **El middleware** protege las rutas, pero la verificación real se hace en las APIs

### Flujo de Verificación

```
1. Usuario hace login → API retorna usuario con role
2. Cliente guarda usuario en localStorage (incluyendo role)
3. Usuario intenta acción administrativa
4. API verifica role desde base de datos (NO desde localStorage)
5. Si tiene permisos → permite acción
6. Si no tiene permisos → retorna 403
```

## 📝 Notas Importantes

1. **Después de asignar un rol**, el usuario debe hacer **logout y login** para que el cliente cargue el nuevo rol
2. **Los usuarios existentes** sin campo `role` se tratarán como `USER` (compatibilidad hacia atrás)
3. **El campo `role` es opcional** en la interfaz `User` del cliente para mantener compatibilidad

## 🛠️ Desarrollo Futuro

Funcionalidades planeadas:

- [ ] API para gestionar ban list
- [ ] API para gestionar usuarios y roles
- [ ] Panel de gestión de usuarios
- [ ] Panel de gestión de ban list
- [ ] Logs de acciones administrativas
- [ ] Notificaciones cuando un moderador elimina contenido

## 📚 Archivos Creados/Modificados

### Nuevos Archivos
- `lib/auth/authorization.ts` - Utilidades de autorización
- `app/api/admin/comments/[commentId]/route.ts` - API de administración de comentarios
- `components/admin/admin-guard.tsx` - Componente de protección
- `app/admin/dashboard/page.tsx` - Panel principal de administración
- `app/admin/comments/page.tsx` - Panel de moderación de comentarios
- `scripts/set-user-role.ts` - Script para asignar roles
- `middleware.ts` - Middleware de protección de rutas

### Archivos Modificados
- `prisma/schema.prisma` - Agregado campo `role` al modelo User
- `app/api/auth/register/route.ts` - Incluye `role` en respuesta
- `contexts/auth-context.tsx` - Agregado `role` a interfaz User
- `app/api/decks/[id]/comments/[commentId]/route.ts` - Permite moderación

## ❓ Preguntas Frecuentes

**P: ¿Cómo sé si soy admin?**
R: Después de asignar el rol y hacer login, verás un badge en el dashboard de administración.

**P: ¿Puedo tener múltiples admins?**
R: Sí, puedes asignar el rol `ADMIN` a tantos usuarios como necesites.

**P: ¿Qué pasa si elimino un comentario como moderador?**
R: El comentario se elimina permanentemente, incluyendo todas sus respuestas (cascada).

**P: ¿Los usuarios pueden ver quién eliminó su comentario?**
R: Actualmente no, pero esto se puede implementar en el futuro con un sistema de logs.

