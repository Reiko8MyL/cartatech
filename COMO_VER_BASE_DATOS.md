# Cómo Ver la Base de Datos de Prisma - CartaTech

Esta guía explica las diferentes formas de visualizar e inspeccionar tu base de datos PostgreSQL con Prisma.

## 🎯 Opción 1: Prisma Studio (Recomendado)

**Prisma Studio** es la herramienta visual oficial de Prisma. Te permite ver y editar datos directamente desde una interfaz web.

### Pasos para usar Prisma Studio:

1. **Asegúrate de tener la variable de entorno configurada:**
   - Tu archivo `.env.local` debe tener `DATABASE_URL` configurada
   - Para producción, usa la connection string de Vercel Postgres

2. **Ejecuta Prisma Studio:**
   ```bash
   npm run db:studio
   ```
   
   O directamente:
   ```bash
   npx prisma studio
   ```

3. **Abre tu navegador:**
   - Prisma Studio se abrirá automáticamente en `http://localhost:5555`
   - Si no se abre automáticamente, ve manualmente a esa URL

4. **Navega por tus tablas:**
   - Verás todas tus tablas: `users`, `decks`, `deck_versions`, `favorite_decks`, `deck_likes`, `votes`, `user_collections`, `comments`, `notifications`
   - Puedes ver, editar, crear y eliminar registros
   - Puedes filtrar y ordenar datos

### Características de Prisma Studio:
- ✅ Interfaz visual intuitiva
- ✅ Edición de datos en tiempo real
- ✅ Filtros y búsqueda
- ✅ Relaciones entre tablas visibles
- ✅ No requiere instalación adicional

---

## 🌐 Opción 2: Vercel Postgres Dashboard

Si estás usando **Vercel Postgres** (recomendado para producción):

1. **Ve a tu dashboard de Vercel:**
   - https://vercel.com/dashboard
   - Selecciona tu proyecto `cartatech`

2. **Accede a la base de datos:**
   - En el menú lateral, busca "Storage" o "Postgres"
   - Haz clic en tu base de datos

3. **Usa el editor SQL:**
   - Vercel proporciona un editor SQL integrado
   - Puedes ejecutar queries directamente

4. **Ver tablas:**
   - Puedes ver la estructura de las tablas
   - Ejecutar consultas SQL personalizadas

---

## 🗄️ Opción 3: Cliente de Base de Datos (pgAdmin, DBeaver, etc.)

Para una experiencia más avanzada, puedes usar un cliente de PostgreSQL:

### pgAdmin (Recomendado para PostgreSQL)

1. **Instala pgAdmin:**
   - Descarga desde: https://www.pgadmin.org/download/
   - Instala la versión para Windows

2. **Conecta a tu base de datos:**
   - Abre pgAdmin
   - Clic derecho en "Servers" → "Create" → "Server"
   - En la pestaña "Connection":
     - **Host**: De tu `DATABASE_URL` (ej: `ep-xxx.region.aws.neon.tech`)
     - **Port**: `5432` (o el puerto de tu connection string)
     - **Database**: El nombre de la base de datos
     - **Username**: Tu usuario de PostgreSQL
     - **Password**: Tu contraseña
   - Guarda la contraseña si quieres

3. **Navega por las tablas:**
   - Expande: Servers → Tu servidor → Databases → Tu base de datos → Schemas → public → Tables
   - Verás todas tus tablas de Prisma

### DBeaver (Alternativa multiplataforma)

1. **Instala DBeaver:**
   - Descarga desde: https://dbeaver.io/download/
   - Versión Community es gratuita

2. **Crea una nueva conexión:**
   - File → New → Database Connection
   - Selecciona "PostgreSQL"
   - Ingresa los datos de conexión de tu `DATABASE_URL`

---

## 🔧 Opción 4: Comandos de Prisma CLI

Puedes usar comandos de Prisma para inspeccionar la base de datos:

### Ver el estado de la base de datos:
```bash
npx prisma db pull
```
Este comando sincroniza tu schema con la base de datos actual.

### Generar el cliente Prisma:
```bash
npx prisma generate
```
Regenera el cliente de Prisma después de cambios.

### Ver el schema actual:
```bash
npx prisma format
```
Formatea tu archivo `schema.prisma`.

---

## 📋 Obtener tu Connection String

### Para Desarrollo Local:
Tu archivo `.env.local` debe tener:
```env
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/cartatech?schema=public"
```

### Para Producción (Vercel):
1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Busca `DATABASE_URL`
4. Copia el valor (formato: `postgresql://usuario:contraseña@host:puerto/database?sslmode=require`)

**⚠️ Importante:** Nunca compartas tu connection string públicamente. Contiene credenciales sensibles.

---

## 🎯 Recomendación

**Para desarrollo diario:** Usa **Prisma Studio** (`npm run db:studio`)
- Es la forma más rápida y fácil
- No requiere instalación adicional
- Perfecto para ver y editar datos

**Para análisis avanzado:** Usa **pgAdmin** o **DBeaver**
- Mejor para queries SQL complejas
- Más opciones de visualización
- Útil para optimización y debugging

**Para producción:** Usa **Vercel Dashboard**
- Acceso directo desde tu cuenta
- Seguro y controlado
- Integrado con tu deployment

---

## 🚨 Troubleshooting

### Prisma Studio no se conecta:
1. Verifica que `DATABASE_URL` esté configurada correctamente
2. Asegúrate de que la base de datos esté accesible
3. Para producción, verifica que tu IP esté permitida (si hay restricciones)

### Error de conexión:
- Verifica que la base de datos esté corriendo
- Revisa que el connection string sea correcto
- Para Vercel Postgres, asegúrate de usar el formato correcto con SSL

### No veo mis tablas:
- Ejecuta `npx prisma db push` para sincronizar el schema
- O ejecuta las migraciones: `npx prisma migrate dev`

---

## 📚 Recursos Adicionales

- [Documentación de Prisma Studio](https://www.prisma.io/studio)
- [Documentación de Prisma CLI](https://www.prisma.io/docs/reference/api-reference/command-reference)
- [Guía de Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)

