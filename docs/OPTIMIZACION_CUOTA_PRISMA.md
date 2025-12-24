# Optimización de Cuota de Prisma Postgres

## 📧 Respuestas a tus Preguntas

### 1. ¿Cuándo se reinicia la cuota?

**La cuota se reinicia mensualmente**, no anualmente. Específicamente:
- **Ciclo mensual**: El primer día de cada mes calendario (1 de enero, 1 de febrero, 1 de marzo, etc.)
- **No solo el 1 de enero**: Se reinicia cada mes, no solo una vez al año
- **Verificar en dashboard**: La fecha exacta puede variar según tu plan, verifica en el dashboard de Prisma

### 2. ¿Cada vez que entro a la página aumento la cuota?

**Sí, PERO depende:**

- **Con caché activo (dentro de `staleTime`)**: NO consume operaciones ✅
- **Sin caché o caché expirado**: SÍ consume operaciones ❌

**Ejemplo:**
- Primera carga de `/galeria`: Hace consulta a BD = **1 operación**
- Segunda carga (dentro de 10 min): Usa caché = **0 operaciones** ✅
- Tercera carga (después de 10 min): Caché expirado = **1 operación** ❌

### 3. ¿Por qué solo yo consumí el 90% durante desarrollo?

**Durante desarrollo consumes MÁS de lo normal porque:**

1. **Recargas constantes**: Cada hot reload = nuevas consultas
   - Si guardas 50 veces/día = 50 recargas
   - Si cada recarga hace 5 consultas = **250 operaciones/día**

2. **Navegación frecuente**: Cambiar entre páginas = nuevas consultas
   - 20 navegaciones/día × 4 consultas = **80 operaciones/día**

3. **Consultas ineficientes (ANTES)**: `/api/decks` cargaba TODOS los mazos
   - Si tienes 500 mazos = **~1,000 operaciones por carga**
   - 10 cargas/día = **10,000 operaciones/día** 😱

4. **Sin caché efectivo**: Caché muy corto (2 min) = más consultas

**Total estimado durante desarrollo:**
- **Antes de optimizaciones**: ~15,000-20,000 operaciones/mes
- **Después de optimizaciones**: ~2,000-3,000 operaciones/mes (reducción del 80-90%)

### 4. ¿Más tráfico = alcanzar el límite más rápido?

**Sí, definitivamente.** La relación es directa:

```
Más usuarios → Más requests → Más operaciones de BD → Consumo más rápido de cuota
```

**Ejemplo práctico:**
- Si con 100 usuarios/día alcanzas el 90% en un mes
- Con 1,000 usuarios/día podrías agotar la cuota en ~3 días
- Con 10,000 usuarios/día podrías agotarla en horas

**Por eso es crítico optimizar ahora**, antes de que crezca el tráfico.

**📖 Ver explicación detallada:** `docs/COMO_FUNCIONA_CUOTA_PRISMA.md`

---

## 🚨 Problema Crítico Encontrado

### Consulta Masiva en `/api/decks`

El código estaba cargando **TODOS los mazos públicos** sin paginación, luego filtrando en memoria:

```typescript
// ❌ ANTES: Cargaba TODOS los mazos (pueden ser miles)
const allDecks = await prisma.deck.findMany({
  where,
  include: { /* ... */ },
  // Sin skip/take = carga TODO
});

// Luego filtraba en memoria
let filteredDecks = allDecks.filter(/* ... */);
```

**Impacto:**
- Si hay 1,000 mazos públicos, cada request carga 1,000 registros
- Con 100 usuarios/día = 100,000 operaciones solo en esta consulta
- Multiplicado por las relaciones (user, _count) = aún más operaciones

---

## ✅ Optimizaciones Implementadas

### 1. Paginación Directa en Base de Datos

**Ahora:**
- Si NO se ordena por likes/favoritos → **Paginación directa en BD** (mucho más eficiente)
- Si SÍ se ordena por popularidad → Limita a máximo 500 mazos (antes: ilimitado)

```typescript
// ✅ DESPUÉS: Paginación directa en BD
if (!needsPopularityFilter && !needsPopularitySort) {
  const [total, decks] = await Promise.all([
    prisma.deck.count({ where }),
    prisma.deck.findMany({
      where,
      include: { /* ... */ },
      orderBy,
      skip,  // ✅ Paginación en BD
      take: limit,  // ✅ Solo carga lo necesario
    }),
  ]);
}
```

**Reducción estimada:** 80-95% de operaciones en consultas normales

### 2. Índices Compuestos en Prisma Schema

Agregados índices compuestos para acelerar consultas frecuentes:

```prisma
model Deck {
  // ... campos existentes
  @@index([isPublic, publishedAt]) // Para mazos públicos ordenados
  @@index([format, isPublic, publishedAt]) // Para filtros por formato
  @@index([userId, updatedAt]) // Para mazos del usuario
}
```

**Beneficio:** Consultas 10-100x más rápidas, menos operaciones de BD

### 3. Aumento de Caché en React Query

Aumentados los tiempos de caché para reducir llamadas a la API:

```typescript
// Mazos públicos: 2min → 5min
staleTime: 5 * 60 * 1000,
gcTime: 10 * 60 * 1000,

// Mazos de usuario: 1min → 2min
staleTime: 2 * 60 * 1000,
gcTime: 10 * 60 * 1000,
```

**Reducción estimada:** 50-70% menos llamadas a la API

---

## 📊 Impacto Esperado

### Antes de Optimizaciones
- **Consulta `/api/decks`**: Carga todos los mazos (1,000+ registros)
- **Operaciones por request**: ~1,000-5,000
- **Con 100 usuarios/día**: 100,000-500,000 operaciones/día
- **Alcanzar 90% de cuota**: ~1-2 semanas

### Después de Optimizaciones
- **Consulta `/api/decks`**: Solo carga 12-50 mazos necesarios
- **Operaciones por request**: ~50-200
- **Con 100 usuarios/día**: 5,000-20,000 operaciones/día
- **Alcanzar 90% de cuota**: ~1-2 meses (estimado)

**Reducción total estimada: 80-90% de operaciones**

---

## 🔄 Próximos Pasos

### 1. Aplicar Migración de Índices

```bash
cd cartatech
npx prisma db push
# o
npx prisma migrate dev --name add_compound_indexes
```

### 2. Monitorear Uso

- Revisar dashboard de Prisma regularmente
- Verificar que el consumo haya bajado
- Identificar otros endpoints que consuman mucho

### 3. Optimizaciones Adicionales (si es necesario)

- **Caché de respuesta en Next.js**: Usar `revalidate` en rutas API
- **Optimizar `/api/feed`**: Reducir número de consultas
- **Agregar más índices**: Según patrones de uso observados

---

## 📝 Notas Importantes

1. **La cuota se reinicia mensualmente**, no anualmente
2. **Más tráfico = más consumo**, por eso optimizar ahora es crítico
3. **Las optimizaciones aplicadas deberían reducir el consumo en 80-90%**
4. **Monitorear el dashboard de Prisma** para verificar el impacto
5. **Si el tráfico crece mucho**, considerar plan Enterprise de Prisma

---

## 🆘 Si Alcanzas el Límite

Si llegas al 100% antes del fin de mes:

1. **Contactar soporte de Prisma**: `support@prisma.io`
2. **Solicitar aumento temporal** o plan Enterprise
3. **Implementar más optimizaciones** (caché adicional, CDN, etc.)
4. **Considerar migrar a PostgreSQL directo** (sin Prisma Postgres) si el costo es muy alto

---

**Última actualización:** Enero 2025
**Estado:** Optimizaciones implementadas, pendiente aplicar migración de índices

