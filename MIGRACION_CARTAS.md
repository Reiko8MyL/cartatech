# Migración de Cartas a Prisma - Estado y Verificación

## ✅ Estado de la Migración

### Datos Migrados
- **Cartas principales**: 1,781 cartas
- **Cartas alternativas**: 865 cartas  
- **Total**: 2,646 cartas en la base de datos

### Archivos Creados
1. `scripts/migrate-cards-to-db.ts` - Script de migración
2. `lib/deck-builder/cards-db.ts` - Funciones para leer/escribir desde Prisma

### Archivos Modificados
1. `app/api/admin/ban-list/route.ts` - Actualizado para usar Prisma
2. `lib/deck-builder/utils.ts` - Mantiene compatibilidad con fallback a archivos JS
3. `prisma/schema.prisma` - Modelo Card ya existía (verificado)

## 🔍 Cómo Verificar los Cambios

### 1. En Prisma Studio
```bash
npx prisma studio
```
- Abre `http://localhost:5555`
- Ve a la tabla `Card`
- Deberías ver 2,646 cartas
- Las cartas principales tienen `baseCardId: null`
- Las cartas alternativas tienen `baseCardId` con el ID de la carta principal

### 2. En la Página de Admin Ban List
- Ve a `/admin/ban-list`
- Deberías ver todas las cartas con sus imágenes
- Al cambiar un valor de ban list y guardar, debería actualizarse en la BD
- Verifica en Prisma Studio que el cambio se aplicó

### 3. Verificar en la Base de Datos Directamente
```sql
-- Ver cartas principales
SELECT COUNT(*) FROM cards WHERE "baseCardId" IS NULL;
-- Debería retornar: 1781

-- Ver cartas alternativas
SELECT COUNT(*) FROM cards WHERE "baseCardId" IS NOT NULL;
-- Debería retornar: 865

-- Ver una carta específica
SELECT id, name, "banListRE", "banListRL", "banListLI" FROM cards WHERE id = 'MYL-0001';
```

## 🔄 Cómo Funciona el Sistema

### En el Cliente (Navegador)
- Usa archivos JS directamente (`cards.js`, `AAcards.js`) - más rápido
- No necesita conexión a BD

### En el Servidor (API Routes)
- Intenta usar BD primero (con cache de 5 minutos)
- Si falla, usa archivos JS como fallback
- Las actualizaciones de ban list se guardan en BD

### Cache
- Cache de 5 minutos para mejorar performance
- Se limpia automáticamente después de actualizaciones
- Se puede limpiar manualmente llamando `clearCardsCache()`

## 🐛 Solución de Problemas

### Si no ves los cambios en la página:
1. Verifica que la migración se ejecutó: `npx tsx scripts/migrate-cards-to-db.ts`
2. Verifica en Prisma Studio que las cartas están ahí
3. Limpia el cache del navegador
4. Verifica que Vercel desplegó los cambios (revisa los logs de deploy)

### Si Vercel no despliega:
1. Verifica que el push a GitHub fue exitoso
2. Revisa el dashboard de Vercel para ver si hay errores de build
3. Verifica que las variables de entorno están configuradas (especialmente `DATABASE_URL`)

### Si el git commit se queda pegado:
- Esto puede pasar si el mensaje del commit es muy largo o tiene caracteres especiales
- Usa mensajes más cortos o escapa los caracteres especiales
- Puedes cancelar con Ctrl+C y hacer commit con mensaje más simple

## 📝 Próximos Pasos

1. **Probar la edición de ban list** desde `/admin/ban-list`
2. **Verificar que los cambios se reflejan** en Prisma Studio
3. **Confirmar que funciona en producción** después del deploy de Vercel

## ⚠️ Notas Importantes

- Los archivos `cards.js` y `AAcards.js` siguen existiendo como fallback
- El sistema funciona híbrido: BD para edición, archivos JS para lectura rápida
- Las actualizaciones de ban list solo se guardan en BD, no en los archivos JS
- Si necesitas sincronizar cambios de BD a archivos JS, necesitarías un script adicional

