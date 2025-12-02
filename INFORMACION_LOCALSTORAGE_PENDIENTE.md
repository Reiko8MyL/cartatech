# Información en localStorage que debería migrarse a la API

## 📊 Resumen de datos en localStorage

### ✅ Ya migrado (con fallback a localStorage)
1. **Mazos (Decks)** - `myl_saved_decks`
   - ✅ API implementada: `/api/decks`
   - ⚠️ Algunos componentes aún usan funciones de localStorage directamente
   - Estado: Parcialmente migrado

2. **Favoritos (Favorites)** - `myl_favorite_decks_{userId}`
   - ✅ API implementada: `/api/favorites`
   - ⚠️ Algunos componentes aún usan funciones de localStorage directamente
   - Estado: Parcialmente migrado

3. **Usuario (Sesión)** - `cartatech_user`
   - ✅ API implementada: `/api/auth/login`, `/api/auth/register`
   - ✅ Mantener en localStorage está bien (solo para sesión)
   - Estado: Completado

### ❌ Pendiente de migración

#### 1. **Likes de Mazos** - `cartatech_deck_likes` ✅ COMPLETADO
**Ubicación:** `lib/deck-builder/utils.ts`
- **Estructura actual:** `Record<string, string[]>` (deckId -> userId[])
- **Funciones:**
  - `getDeckLikesFromLocalStorage()` - Fallback
  - `saveDeckLikesToLocalStorage()` - Fallback
  - `getDeckLikeCount()` - Fallback
  - `hasUserLikedDeck()` - Fallback
  - `toggleDeckLike()` - Fallback
  - `getDeckLikesFromStorage()` - Nueva función con API
  - `getDeckLikeCountFromStorage()` - Nueva función con API
  - `hasUserLikedDeckFromStorage()` - Nueva función con API
  - `toggleDeckLikeFromStorage()` - Nueva función con API

**Estado:**
- ✅ Modelo `DeckLike` creado en Prisma
- ✅ API `/api/likes` y `/api/likes/toggle` implementadas
- ✅ Funciones en `lib/api/likes.ts` creadas
- ✅ Componentes actualizados para usar API con actualización optimista
- ✅ Fallback a localStorage para usuarios no autenticados

**Prioridad:** ✅ Completado

---

#### 2. **Vistas de Mazos** - `cartatech_deck_views` ✅ COMPLETADO
**Ubicación:** `lib/deck-builder/utils.ts`
- **Estructura actual:** `Record<string, number>` (deckId -> viewCount)
- **Funciones:**
  - `getDeckViewsFromLocalStorage()` - Fallback
  - `saveDeckViewsToLocalStorage()` - Fallback
  - `incrementDeckView()` - Solo para localStorage
  - `getDeckViewCount()` - Fallback
  - `getDeckViewCountFromStorage()` - Nueva función con API

**Estado:**
- ✅ `viewCount` existe en el modelo `Deck` de Prisma
- ✅ La API incrementa `viewCount` automáticamente al obtener un mazo público
- ✅ Componentes actualizados para usar `viewCount` de la API cuando está disponible
- ✅ Fallback a localStorage para mazos que no están en la base de datos

**Prioridad:** ✅ Completado

---

#### 3. **Votos de Comunidad** - `cartatech_votes` ✅ COMPLETADO
**Ubicación:** `lib/voting/utils.ts`
- **Estructura actual:** `Vote[]` con `{ race, cardId, userId, timestamp }`
- **Funciones:**
  - `getVotesFromStorage()` - Ahora async, usa API
  - `saveVoteToStorage()` - Ahora async, usa API
  - `getUserVoteForRace()` - Fallback
  - `getUserVoteForRaceFromStorage()` - Nueva función con API
  - `calculateVoteResults()` - Fallback
  - `calculateVoteResultsFromStorage()` - Nueva función con API
  - `getRaceVotingData()` - Fallback
  - `getRaceVotingDataFromStorage()` - Nueva función con API

**Estado:**
- ✅ Modelo `Vote` creado en Prisma
- ✅ API `/api/votes` implementada (GET, POST)
- ✅ Funciones en `lib/api/votes.ts` creadas
- ✅ Componente de votación actualizado para usar API
- ✅ Fallback a localStorage para usuarios no autenticados

**Prioridad:** ✅ Completado

---

#### 4. **Colección de Cartas (Galería)** - `cartatech_collection` ✅ COMPLETADO
**Ubicación:** `app/galeria/page.tsx`
- **Estructura actual:** `Set<string>` (cardIds)
- **Funciones:**
  - `loadCollectionFromLocalStorage()` - Fallback
  - `saveCollectionToLocalStorage()` - Fallback
  - `loadCollectionFromStorage()` - Nueva función con API
  - `toggleCardInCollectionStorage()` - Nueva función con API

**Estado:**
- ✅ Modelo `UserCollection` creado en Prisma
- ✅ API `/api/collection` implementada (GET, POST, PUT)
- ✅ Funciones en `lib/api/collection.ts` creadas
- ✅ Componente de galería actualizado para usar API con actualización optimista
- ✅ Fallback a localStorage para usuarios no autenticados

**Prioridad:** ✅ Completado

---

#### 5. **Mazo Temporal** - `cartatech_temporary_deck`
**Ubicación:** `lib/deck-builder/utils.ts`
- **Estructura actual:** Objeto temporal con `name`, `cards`, `format`, `savedAt`
- **Funciones:**
  - `saveTemporaryDeck()`
  - `getTemporaryDeck()`
  - `clearTemporaryDeck()`

**Estado:** ✅ Puede quedarse en localStorage (es temporal, solo para usuarios no autenticados)

---

## 📋 Plan de Migración Recomendado

### Fase 1: Alta Prioridad ✅ COMPLETADO
1. **Likes de Mazos** ✅
   - ✅ Modelo `DeckLike` creado en Prisma
   - ✅ API `/api/likes` y `/api/likes/toggle` implementadas
   - ✅ Funciones migradas a `lib/api/likes.ts`
   - ✅ Componentes actualizados con actualización optimista

### Fase 2: Media Prioridad ✅ COMPLETADO
2. **Vistas de Mazos** ✅
   - ✅ Endpoint `/api/decks/[id]` ya incrementa `viewCount` automáticamente
   - ✅ Componentes actualizados para usar `viewCount` de la API
   - ✅ Fallback a localStorage para mazos no en base de datos

3. **Votos de Comunidad** ✅
   - ✅ Modelo `Vote` creado en Prisma
   - ✅ API `/api/votes` implementada (GET, POST)
   - ✅ Funciones migradas a `lib/api/votes.ts`
   - ✅ Componente de votación actualizado para usar API
   - ✅ Fallback a localStorage para usuarios no autenticados

### Fase 3: Baja Prioridad ✅ COMPLETADO
4. **Colección de Cartas** ✅
   - ✅ Modelo `UserCollection` creado en Prisma
   - ✅ API `/api/collection` implementada (GET, POST, PUT)
   - ✅ Funciones migradas a `lib/api/collection.ts`
   - ✅ Componente de galería actualizado para usar API
   - ✅ Fallback a localStorage para usuarios no autenticados

---

## 🔍 Componentes que necesitan actualización

### Likes
- `app/mazos-comunidad/page.tsx`
- `app/mis-favoritos/page.tsx`
- `app/mazo/[id]/page.tsx`

### Vistas
- `app/api/decks/[id]/route.ts` (GET) - Ya incrementa, pero verificar que funcione
- `app/mazos-comunidad/page.tsx`
- `app/mis-favoritos/page.tsx`
- `app/mazo/[id]/page.tsx`

### Votos
- `app/utilidad/comunidad-vota/page.tsx`
- `components/voting/vote-panel.tsx`

### Colección
- `app/galeria/page.tsx`

---

## 📝 Notas Importantes

1. **Mantener fallback a localStorage:** Todas las nuevas funciones deben tener fallback a localStorage para usuarios no autenticados
2. **Migración gradual:** No es necesario migrar todo de una vez, se puede hacer gradualmente
3. **Compatibilidad:** Asegurarse de que los usuarios existentes no pierdan datos durante la migración
4. **Performance:** Considerar caché y optimizaciones para datos que se leen frecuentemente (como likes y vistas)

