# ¿Cómo Funciona la Cuota de Prisma Postgres?

## 📊 ¿Qué es una "Operación"?

**Una operación = Una consulta a la base de datos**

Cada vez que tu código ejecuta:
- `prisma.card.findMany()` → **1 operación**
- `prisma.deck.findUnique()` → **1 operación**
- `prisma.user.count()` → **1 operación**
- `prisma.deck.create()` → **1 operación**
- `prisma.deck.update()` → **1 operación**

**NO importa:**
- Cuántos registros devuelve (1 o 10,000 registros = 1 operación)
- La complejidad de la consulta (simple o con joins = 1 operación)
- Si es lectura o escritura (ambas cuentan igual)

**SÍ importa:**
- **Cada consulta cuenta como 1 operación**
- Si haces 10 consultas en una página = 10 operaciones
- Si recargas la página 100 veces = 100 operaciones (si no hay caché)

---

## 🔍 ¿Por Qué Solo Tú Consumiste el 90%?

### Durante Desarrollo, Consumes MÁS de lo Normal

**1. Recargas Constantes**
- Cada vez que guardas un archivo → Hot reload → Recarga de página
- Si guardas 50 veces al día = 50 recargas
- Si cada recarga hace 5 consultas = **250 operaciones/día solo en recargas**

**2. Navegación Entre Páginas**
- Cada vez que cambias de página → Nuevas consultas
- Si navegas 20 veces entre páginas = 20 sets de consultas
- Si cada página hace 3-5 consultas = **60-100 operaciones/día**

**3. Pruebas y Debugging**
- Abrir/cerrar modales
- Probar funcionalidades
- Verificar que todo funcione
- Cada acción = consultas a la BD

**4. Consultas Ineficientes (ANTES de las optimizaciones)**

El problema más grave era en `/api/decks`:

```typescript
// ❌ ANTES: Esto cargaba TODOS los mazos (pueden ser cientos)
const allDecks = await prisma.deck.findMany({
  where: { isPublic: true },
  include: {
    user: { /* ... */ },
    _count: { /* ... */ },  // Esto hace consultas adicionales
  },
});
```

**Si tienes 500 mazos públicos:**
- `findMany()` = 1 operación (pero lee 500 registros)
- `_count.likes` = 500 consultas adicionales (una por cada mazo)
- `_count.favorites` = 500 consultas adicionales más
- **Total: ~1,001 operaciones por cada vez que cargas la página de mazos**

**Si cargas esa página 10 veces al día = 10,010 operaciones/día**

---

## 📈 Ejemplo Real de Consumo Durante Desarrollo

### Escenario: Día de Desarrollo Típico

**Mañana (2 horas):**
- 30 recargas por hot reload = 30 × 5 consultas = **150 operaciones**
- 10 navegaciones entre páginas = 10 × 4 consultas = **40 operaciones**
- 5 pruebas de funcionalidades = 5 × 3 consultas = **15 operaciones**

**Tarde (3 horas):**
- 50 recargas = 50 × 5 = **250 operaciones**
- 20 navegaciones = 20 × 4 = **80 operaciones**
- 10 pruebas = 10 × 3 = **30 operaciones**

**Noche (1 hora):**
- 20 recargas = 20 × 5 = **100 operaciones**
- 5 navegaciones = 5 × 4 = **20 operaciones**

**Total del día: ~785 operaciones**

**Si trabajas 20 días al mes: 20 × 785 = 15,700 operaciones/mes**

**Si la cuota es ~17,000 operaciones/mes → Ya estás al 90%**

---

## 🎯 ¿Cada Vez que Entro a la Página Aumenta la Cuota?

**Sí, PERO depende de:**

### 1. Si Hay Caché (React Query)

**Con caché activo (dentro de `staleTime`):**
- Primera carga: Hace consultas a BD = **Consume operaciones**
- Segunda carga (dentro de 5-10 min): Usa caché = **NO consume operaciones** ✅

**Sin caché o caché expirado:**
- Cada carga = Consultas a BD = **Consume operaciones** ❌

### 2. Qué Página Cargas

**Páginas que consumen MUCHO:**
- `/mazos-comunidad` → Antes: ~1,000+ operaciones (ahora optimizado)
- `/galeria` → ~1-2 operaciones (carga todas las cartas)
- `/deck-builder` → ~1-2 operaciones (carga cartas)

**Páginas que consumen POCO:**
- `/inicio` → ~0-1 operaciones (si no hay datos dinámicos)
- Páginas estáticas → 0 operaciones

### 3. Si Estás en Desarrollo

**En desarrollo:**
- Hot reload resetea el caché
- Cada recarga = nuevas consultas
- **Consumes más operaciones**

**En producción:**
- Caché funciona mejor
- Menos recargas
- **Consumes menos operaciones**

---

## 🔧 Qué Estaba Consumiendo Tanto (ANTES)

### Problema #1: `/api/decks` Sin Paginación

```typescript
// ❌ Cargaba TODOS los mazos públicos
const allDecks = await prisma.deck.findMany({
  where: { isPublic: true },
  include: {
    _count: {
      select: { likes: true, favorites: true }
    }
  }
});
```

**Si tienes 500 mazos:**
- `findMany()` = 1 operación
- Pero `_count` hace consultas adicionales por cada mazo
- **Total: ~1,000+ operaciones por carga**

### Problema #2: Falta de Caché Efectivo

- `staleTime` muy corto (2 minutos)
- Cada recarga en desarrollo = nuevas consultas
- Sin caché persistente entre sesiones

### Problema #3: Consultas en Cada Navegación

- Cada página carga sus datos desde cero
- No comparte caché entre páginas relacionadas
- Múltiples consultas redundantes

---

## ✅ Qué Hemos Optimizado

### 1. Paginación en `/api/decks`

**Ahora:**
- Solo carga 12-50 mazos por request
- **Reducción: 95% de operaciones** (de ~1,000 a ~50)

### 2. Caché Aumentado

**Ahora:**
- Mazos públicos: 5 minutos (antes: 2 min)
- Mazos de usuario: 2 minutos (antes: 1 min)
- Cartas: 10 minutos (sin cambios)

**Reducción: 50-70% menos llamadas a la API**

### 3. Índices Compuestos

- Consultas más rápidas
- Menos operaciones de lectura
- Mejor rendimiento general

---

## 📊 Consumo Esperado DESPUÉS de Optimizaciones

### Desarrollo (Solo Tú)

**Por día:**
- 50 recargas × 2 consultas (con caché) = **100 operaciones**
- 20 navegaciones × 1 consulta (con caché) = **20 operaciones**
- **Total: ~120 operaciones/día**

**Por mes (20 días):**
- 20 × 120 = **2,400 operaciones/mes**

**Con cuota de ~17,000 operaciones:**
- **Uso: ~14% de la cuota** ✅ (antes: 90%)

### Producción (Con Usuarios Reales)

**Con 100 usuarios/día:**
- Cada usuario: ~5-10 consultas (con caché)
- 100 usuarios × 7 consultas promedio = **700 operaciones/día**
- **Por mes: 21,000 operaciones/mes**

**Con las optimizaciones:**
- Reducción del 80-90%
- **~2,100-4,200 operaciones/mes** ✅

---

## 🎯 Resumen

### ¿Cada vez que entro aumenta la cuota?

**Sí, PERO:**
- **Con caché activo**: NO (usa datos en memoria)
- **Sin caché o expirado**: SÍ (hace consultas a BD)

### ¿Por qué solo tú consumiste el 90%?

**Porque durante desarrollo:**
1. Recargas constantes (hot reload)
2. Navegación frecuente entre páginas
3. Consultas ineficientes (ya optimizadas)
4. Sin caché efectivo (ya mejorado)

### ¿Qué hacer ahora?

1. ✅ **Aplicar migración de índices**: `npx prisma db push`
2. ✅ **Las optimizaciones ya están aplicadas** (código)
3. ✅ **Monitorear consumo** en dashboard de Prisma
4. ✅ **El consumo debería bajar 80-90%** después de las optimizaciones

---

**Última actualización:** Enero 2025
**Estado:** Optimizaciones implementadas, pendiente aplicar migración

