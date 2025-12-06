# Definición Completa del Deck Builder

## Descripción General

El **Deck Builder** es la página principal del constructor de mazos de CartaTech. Permite a los usuarios buscar, filtrar y agregar cartas a un mazo, gestionar sus mazos guardados, calcular estadísticas, y exportar mazos en diferentes formatos.

**Archivo Principal**: `cartatech/app/deck-builder/page.tsx`  
**Tipo**: Página cliente de Next.js (`"use client"`)  
**Layout**: `cartatech/app/deck-builder/layout.tsx`  
**Líneas de código**: ~589 (página principal)

---

## Estructura de la Página

### Layout Principal

**Ubicación**: `app/deck-builder/page.tsx` (Líneas 474-559)

```typescript
<main className="w-full h-[calc(100vh-4rem)] flex flex-col px-2 sm:px-4 lg:px-6 py-4">
  {/* Panel de filtros */}
  <FiltersPanel />
  
  {/* Contenedor principal con dos paneles */}
  <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_450px] gap-3 min-h-0">
    {/* Panel izquierdo: Cartas disponibles */}
    <CardsPanel />
    
    {/* Panel derecho: Gestión del mazo */}
    <DeckManagementPanel />
  </div>
</main>
```

**Clase CSS contenedor principal**: `w-full h-[calc(100vh-4rem)] flex flex-col`  
**Layout responsive**: 
- Móvil/Tablet: 1 columna (stack vertical)
- Desktop: 2 columnas (1fr para cartas, 420px/450px para gestión)

---

## Componentes Principales

### 1. FiltersPanel

**Archivo**: `cartatech/components/deck-builder/filters-panel.tsx`  
**Líneas**: ~320  
**Tipo**: Componente cliente de React

#### Props

```typescript
interface FiltersPanelProps {
  filters: DeckFilters
  onFiltersChange: (filters: DeckFilters) => void
  availableEditions: string[]
  availableTypes: string[]
  availableRaces: string[]
  availableCosts: number[]
}
```

#### Funcionalidades

**1.1. Búsqueda por Nombre** (Líneas 146-154)
- Input de texto con placeholder "Buscar por nombre..."
- Debounce de 500ms para tracking de analytics
- Limpieza automática con botón X cuando hay filtros activos

**1.2. Filtros por Dropdown** (Líneas 165-315)
- **Edición**: Dropdown con todas las ediciones disponibles
- **Tipo**: Dropdown con tipos (Aliado, Arma, Talismán, Tótem, Oro)
- **Raza**: Dropdown deshabilitado si el tipo no es "Aliado"
- **Coste**: Dropdown con costes numéricos disponibles

**1.3. Lógica de Filtros**
- **Raza → Tipo**: Al seleccionar raza, automáticamente establece tipo a "Aliado"
- **Tipo → Raza**: Si el tipo cambia a algo distinto de "Aliado", resetea la raza
- **Mapeo de Razas a Ediciones**: `RACE_TO_EDITION` (Líneas 27-40)
  - Caballero, Dragón, Faerie → Espada Sagrada
  - Héroe, Olímpico, Titán → Helénica
  - Defensor, Desafiante, Sombra → Hijos de Daana
  - Eterno, Faraón, Sacerdote → Dominios de Ra

**1.4. Botón Limpiar Filtros** (Líneas 156-161)
- Visible solo cuando hay filtros activos
- Resetea todos los filtros a valores vacíos

**1.5. Tracking de Analytics**
- Búsqueda: Tracking después de 500ms de inactividad
- Filtros: Tracking cuando cambian los filtros

**Estado actual**: ✅ Implementado  

---

### 2. CardsPanel

**Archivo**: `cartatech/components/deck-builder/cards-panel.tsx`  
**Líneas**: ~305  
**Tipo**: Componente cliente de React

#### Props

```typescript
interface CardsPanelProps {
  cards: Card[]                    // Cartas filtradas (solo originales)
  deckCards: DeckCard[]            // Cartas en el mazo actual
  onAddCard: (cardId: string) => void
  onRemoveCard: (cardId: string) => void
  onReplaceCard: (oldCardId: string, newCardId: string) => void
  deckFormat: DeckFormat           // "RE" | "RL" | "LI"
  cardReplacements: Map<string, string>  // Mapa de baseId -> alternativeCardId
}
```

#### Funcionalidades

**2.1. Agrupación por Edición** (Líneas 200-210)
- Agrupa cartas por edición usando `useMemo`
- Orden de ediciones: Espada Sagrada, Helénica, Hijos de Daana, Dominios de Ra, Drácula
- Encabezados sticky con `sticky top-0 bg-background/95 backdrop-blur-sm`

**2.2. Grid de Cartas** (Líneas 233-267)
- **Responsive**: 
  - Móvil: 4 columnas
  - Tablet: 4 columnas
  - Desktop: 6 columnas
- **Priorización de carga**: Solo las primeras 2 cartas de cada edición se cargan con prioridad
- **Optimización**: Reduce carga inicial y evita exceder cuota de Cloudinary

**2.3. Manejo de Cartas Alternativas**
- **Detección**: Carga todas las cartas alternativas con `useCards(true)`
- **Reemplazo visual**: Muestra carta alternativa si está reemplazada en el mazo
- **Agregado inteligente**: Agrega la carta alternativa si está seleccionada, sino la original
- **Cantidad total**: Calcula cantidad total considerando original + alternativas

**2.4. Interacciones con Cartas**

**Desktop**:
- **Click**: Agrega carta al mazo (con validaciones)
- **Hover**: Muestra tooltip con información de la carta
- **Right Click**: Abre modal de información de carta

**Móvil/Tablet**:
- **Click**: Agrega carta al mazo
- **Long Press (800ms)**: Abre modal de información de carta
- **Touch End**: Cancela long press si se suelta antes

**2.5. Validaciones al Agregar**
- **Límite total**: Máximo 50 cartas en el mazo
- **Límite por carta**: Según formato (banListRE/RL/LI)
- **Cartas únicas**: Máximo 1 si `isUnique === true`
- **Cantidad total**: Considera original + alternativas para el límite

**2.6. Modal de Información de Carta** (Líneas 274-300)
- Se abre con right click (desktop) o long press (móvil)
- Muestra información completa de la carta
- Permite ver y seleccionar artes alternativos
- Permite agregar/remover cartas directamente desde el modal

**Estado actual**: ✅ Implementado

---

### 3. DeckManagementPanel

**Archivo**: `cartatech/components/deck-builder/deck-management-panel.tsx`  
**Líneas**: ~1782  
**Tipo**: Componente cliente de React

#### Props

```typescript
interface DeckManagementPanelProps {
  deckName: string
  onDeckNameChange: (name: string) => void
  deckCards: DeckCard[]
  allCards: Card[]
  stats: DeckStats
  onClearDeck: () => void
  onLoadDeck: (deck: SavedDeck) => void
  onAddCard: (cardId: string) => void
  onRemoveCard: (cardId: string) => void
  deckFormat: DeckFormat
  onDeckFormatChange: (format: DeckFormat) => void
  currentDeck: SavedDeck | null
  onCurrentDeckChange: (deck: SavedDeck | null) => void
  cardReplacements: Map<string, string>
}
```

#### Secciones del Panel

**3.1. Encabezado con Nombre del Mazo** (Líneas 718-777)
- **Modo Visualización**: Muestra nombre con botón editar
- **Modo Edición**: Input con botones guardar/cancelar
- **Selector de Formato**: ToggleGroup con opciones RE/RL/LI

**3.2. Sección de Estadísticas** (Líneas 779-930)
- **Total de Cartas**: Con validación visual (verde si 50, rojo si <50)
- **Coste Promedio**: Calculado desde `stats.averageCost`
- **Estadísticas por Tipo**: Aliados, Armas, Talismanes, Tótems, Oros
- **Validaciones visuales**:
  - Aliados: Rojo si <16 cuando total = 50
  - Oros: Rojo si no tiene Oro Inicial cuando total = 50

**3.3. Botones de Acción** (Líneas 932-989)
- **Código TTS**: Genera y copia código para Tabletop Simulator
- **Guardar**: Abre modal de guardar o diálogo de login
- **Cargar**: Abre diálogo de mazos guardados (requiere autenticación)
- **Borrar**: Limpia el mazo actual (con confirmación)
- **Exportar Imagen**: Genera PNG de alta calidad (1920x1080px)
- **Exportar Lista**: Genera archivo TXT con lista de cartas

**3.4. Lista de Cartas del Mazo** (Líneas 991-1081)
- Agrupación por tipo: Aliado, Talismán, Oro, Tótem, Arma
- Selector de cantidad con botones +/-
- Validación según formato (banListRE/RL/LI)
- Imagen de fondo recortada con overlay oscuro

**3.5. Diálogos y Modales**
- **Diálogo de Cargar Mazos**: Lista de mazos guardados con metadata
- **Modal de Guardar**: Formulario completo con descripción, tags, visibilidad
- **Diálogo de Confirmación**: Para eliminar mazos
- **Diálogo de Login**: Invita a iniciar sesión cuando se intenta guardar sin autenticación

**Estado actual**: ✅ Implementado

**Ver documentación detallada del panel en**: `deck-management-panel-definition.md` (versión anterior con detalles completos)

---

## Estados y Lógica de la Página Principal

### Estados Principales

**Ubicación**: `app/deck-builder/page.tsx` (Líneas 38-74)

```typescript
// Estado del mazo
const [deckName, setDeckName] = useState("Mi Mazo")
const [deckCards, setDeckCards] = useState<DeckCard[]>([])
const [deckFormat, setDeckFormat] = useState<DeckFormat>("RE")
const [currentDeck, setCurrentDeck] = useState<SavedDeck | null>(null)
const [hasLoadedFromUrl, setHasLoadedFromUrl] = useState(false)
const [clearDeckDialogOpen, setClearDeckDialogOpen] = useState(false)
const [hasLoadedTemporaryDeck, setHasLoadedTemporaryDeck] = useState(false)
const [isLoadingCards, setIsLoadingCards] = useState(true)

// Estado de filtros
const [filters, setFilters] = useState<DeckFilters>({
  search: "",
  edition: "",
  type: "",
  race: "",
  cost: "",
})

// Estado para cartas alternativas
const [cardReplacements, setCardReplacements] = useState<Map<string, string>>(new Map())
```

### Carga de Datos

**1. Carga de Cartas** (Líneas 42-54)
- Hook `useCards(true)` carga todas las cartas incluyendo alternativas
- Ordenamiento automático por edición e ID
- Estado de carga controlado con `isLoadingCards`

**2. Carga desde URL** (Líneas 263-386)
- Parámetro `?load=deckId` en la URL
- Intenta cargar desde API primero, luego localStorage como fallback
- **Lógica de copia**: Si el usuario NO es el creador, crea una copia sin ID
- **Lógica de edición**: Si el usuario ES el creador, carga el mazo para edición
- Detecta y establece reemplazos de cartas alternativas automáticamente

**3. Carga de Mazo Temporal** (Líneas 388-416, 418-453)
- Carga mazo temporal al iniciar (si existe y no se cargó desde URL)
- Restaura mazo temporal cuando el usuario se autentica después de login/registro
- Guarda mazo temporal automáticamente cuando no hay usuario autenticado

### Funciones Principales

**1. Agregar Carta al Mazo** (Líneas 114-153)
```typescript
const addCardToDeck = useCallback((cardId: string) => {
  // Validaciones:
  // - Límite total de 50 cartas
  // - Límite por carta según formato (banListRE/RL/LI)
  // - Cartas únicas (máximo 1)
  // - Tracking de analytics para nuevas cartas
})
```

**2. Remover Carta del Mazo** (Líneas 155-165)
```typescript
const removeCardFromDeck = useCallback((cardId: string) => {
  // Reduce cantidad en 1
  // Elimina entrada si cantidad llega a 0
})
```

**3. Reemplazar Carta** (Líneas 171-219)
```typescript
const replaceCardInDeck = useCallback((oldCardId: string, newCardId: string) => {
  // Reemplaza carta original por alternativa (o viceversa)
  // Mantiene la cantidad total
  // Actualiza mapa de reemplazos
})
```

**4. Limpiar Mazo** (Líneas 228-237)
```typescript
function clearDeck() {
  // Abre diálogo de confirmación
}

function confirmClearDeck() {
  // Resetea todos los estados del mazo
  // Limpia reemplazos de cartas alternativas
}
```

**5. Cargar Mazo** (Líneas 239-261)
```typescript
function loadDeck(deck: SavedDeck) {
  // Establece nombre, cartas y formato
  // Guarda mazo completo en currentDeck
  // Detecta y establece reemplazos de cartas alternativas
}
```

### Cálculos Memoizados

**1. Cartas Filtradas** (Líneas 77-81)
```typescript
const filteredCards = useMemo(() => {
  const originalCardsOnly = allCards.filter((card) => !card.isCosmetic)
  return filterCards(originalCardsOnly, filters)
}, [allCards, filters])
```

**2. Estadísticas del Mazo** (Líneas 84-96)
```typescript
const deckStats = useMemo(() => {
  if (deckCards.length === 0) return defaultStats
  return calculateDeckStats(deckCards, allCards)
}, [deckCards, allCards])
```

**3. Opciones de Filtros** (Líneas 99-105)
```typescript
const availableEditions = useMemo(() => getUniqueEditions(allCards), [allCards])
const availableTypes = useMemo(() => getUniqueTypes(allCards), [allCards])
const availableRaces = useMemo(() => getUniqueRaces(allCards), [allCards])
const availableCosts = useMemo(() => getUniqueCosts(allCards), [allCards])
```

**4. Mapa de Cartas** (Líneas 109-111)
```typescript
const cardLookupMap = useMemo(() => {
  return new Map(allCards.map((c) => [c.id, c]))
}, [allCards])
```

---

## Funcionalidades Principales

### 1. Construcción de Mazos

- **Agregar cartas**: Click en carta o desde modal de información
- **Remover cartas**: Botones +/- en panel de gestión o desde modal
- **Reemplazar cartas**: Seleccionar arte alternativo desde modal
- **Validaciones automáticas**: 
  - Límite total de 50 cartas
  - Límite por carta según formato
  - Cartas únicas (máximo 1)
  - Mínimo de 16 Aliados
  - Requiere Oro Inicial

### 2. Gestión de Mazos

- **Guardar**: Con descripción, tags, visibilidad (público/privado)
- **Cargar**: Desde lista de mazos guardados
- **Eliminar**: Con confirmación
- **Editar**: Cargar mazo existente para modificar
- **Copiar**: Cargar mazo de otro usuario como copia

### 3. Exportación

- **Código TTS**: Para Tabletop Simulator
- **Imagen PNG**: Alta calidad (1920x1080px) con fondo personalizado
- **Lista TXT**: Formato `{cantidad}x {nombre}` ordenado por tipo y coste

### 4. Filtrado y Búsqueda

- **Búsqueda por nombre**: Input de texto con debounce
- **Filtros múltiples**: Edición, tipo, raza, coste
- **Lógica inteligente**: Raza solo disponible para Aliados
- **Limpieza rápida**: Botón para resetear todos los filtros

### 5. Cartas Alternativas

- **Visualización**: Muestra arte alternativo si está seleccionado
- **Selección**: Desde modal de información de carta
- **Reemplazo**: Mantiene cantidad al cambiar entre original y alternativa
- **Cantidad total**: Considera original + alternativas para límites

---

## Integraciones

### Autenticación

- **Hook**: `useAuth()` de `@/contexts/auth-context`
- **Uso**: 
  - Verificar usuario para guardar/cargar mazos
  - Detectar cuando el usuario se autentica para restaurar mazo temporal
  - Redirigir a login/registro cuando es necesario

### Navegación

- **Hook**: `useSearchParams()` de `next/navigation`
- **Uso**: Cargar mazo desde URL con parámetro `?load=deckId`
- **Hook**: `useRouter()` para redirecciones a login/registro

### APIs

- **Cartas**: `useCards()` hook personalizado con cache
- **Mazos**: 
  - `getDeckById()` - Obtener mazo por ID
  - `saveDeckToStorage()` - Guardar mazo (con fallback a localStorage)
  - `getSavedDecksFromStorage()` - Listar mazos (con fallback a localStorage)
  - `deleteDeckFromStorage()` - Eliminar mazo (con fallback a localStorage)

### Almacenamiento Temporal

- **Funciones**: `saveTemporaryDeck()`, `getTemporaryDeck()`, `clearTemporaryDeck()`
- **Uso**: Guardar mazo temporalmente cuando el usuario no está autenticado
- **Restauración**: Automática al iniciar sesión

### Toast Notifications

- **Funciones**: `toastSuccess()`, `toastError()` de `@/lib/toast`
- **Uso**: Feedback de todas las acciones (guardar, eliminar, copiar, exportar, etc.)

### Analytics

- **Tracking**: 
  - `trackCardAddedToDeck()` - Cuando se agrega una carta nueva
  - `trackCardSearched()` - Cuando se busca una carta (debounce 500ms)
  - `trackCardFiltered()` - Cuando se aplican filtros

---

## Consideraciones de Diseño

### Responsive

- **Layout principal**: 
  - Móvil/Tablet: Stack vertical (1 columna)
  - Desktop: 2 columnas (cartas + gestión)
- **Padding adaptativo**: `p-2 sm:p-3 lg:p-4`
- **Grid de cartas**: 
  - Móvil: 4 columnas
  - Desktop: 6 columnas
- **Diálogos**: `max-w-3xl` con scroll interno

### Accesibilidad

- **Navegación por teclado**: En todos los diálogos y modales
- **Estados disabled**: Apropiados en botones según contexto
- **Contraste de colores**: Para validaciones visuales
- **Screen reader**: Título oculto con `sr-only` para SEO
- **ARIA labels**: En botones y controles interactivos

### Performance

- **Memoización**: Cálculos costosos con `useMemo`
- **Lazy loading**: Imágenes de cartas con priorización
- **Debounce**: Búsqueda y tracking de analytics
- **Optimización de renders**: Callbacks con `useCallback`
- **Suspense**: Página envuelta en Suspense con fallback de skeleton

### SEO

- **Metadata**: Configurado en `layout.tsx`
- **Título**: "Deck Builder"
- **Descripción**: Incluye keywords relevantes
- **H1 oculto**: Para accesibilidad y SEO

---

## Estados de Carga

### Skeleton Loading

**Página principal** (Líneas 564-588):
- Skeleton para panel de filtros
- `CardGridSkeleton` para panel de cartas
- Skeletons múltiples para panel de gestión

**Componentes individuales**:
- `CardsPanel`: Muestra `CardGridSkeleton` mientras carga
- `DeckManagementPanel`: Muestra múltiples skeletons mientras carga

### Error Boundaries

- **ErrorBoundary**: Envuelve `CardsPanel` y `DeckManagementPanel`
- **Manejo de errores**: Evita que errores en un panel afecten al otro

---

## Mejoras Pendientes

1. **Búsqueda de Mazos**: Agregar filtro/búsqueda en el diálogo de cargar mazos
2. **Ordenamiento**: Permitir ordenar mazos por fecha, nombre, etc.
3. **Paginación**: Implementar paginación para listas grandes de mazos
4. **Animaciones**: Agregar transiciones suaves en cambios de estado
5. **Validación Visual**: Mejorar feedback visual de validaciones del mazo
6. **Exportación Avanzada**: Opciones adicionales (PDF, JSON, etc.)
7. **Historial de Versiones**: Mostrar historial de versiones del mazo
8. **Compartir Mazo**: Funcionalidad para compartir mazos públicamente (ya implementado en otras páginas)
9. **Drag & Drop**: Permitir reordenar cartas en el mazo
10. **Undo/Redo**: Sistema de deshacer/rehacer cambios

---

## Referencias

### Componentes Relacionados

- **FiltersPanel**: `components/deck-builder/filters-panel.tsx`
- **CardsPanel**: `components/deck-builder/cards-panel.tsx`
- **DeckManagementPanel**: `components/deck-builder/deck-management-panel.tsx`
- **CardItem**: `components/deck-builder/card-item.tsx`
- **CardInfoModal**: `components/deck-builder/card-info-modal.tsx`
- **SaveDeckModal**: `components/deck-builder/save-deck-modal.tsx`

### Documentación Relacionada

- **Elementos del Deck**: `deck-elements-definition.md`
- **Tipos**: `@/lib/deck-builder/types`
- **Utilidades**: `@/lib/deck-builder/utils`
- **Cloudinary**: `@/lib/deck-builder/cloudinary-utils`

### Hooks y Utilidades

- **useCards**: `@/hooks/use-cards` - Hook para cargar cartas con cache
- **useAuth**: `@/contexts/auth-context` - Hook de autenticación
- **Toast**: `@/lib/toast` - Sistema de notificaciones
- **Analytics**: `@/lib/analytics/events` - Tracking de eventos

---

## Notas Técnicas

### Manejo de Cartas Alternativas

El sistema de cartas alternativas funciona mediante:
1. **Carga**: Todas las cartas (originales + alternativas) se cargan con `useCards(true)`
2. **Identificación**: Las alternativas tienen `isCosmetic: true` y `baseCardId` apuntando a la original
3. **Reemplazo**: Se mantiene un `Map<baseId, alternativeCardId>` para rastrear qué cartas están reemplazadas
4. **Visualización**: Se muestra la alternativa si está en el mapa de reemplazos
5. **Cantidad**: Se calcula la cantidad total considerando original + alternativas

### Persistencia de Datos

- **Autenticado**: Datos en base de datos PostgreSQL vía APIs REST
- **No autenticado**: Datos en localStorage como fallback
- **Temporal**: Mazo temporal se guarda automáticamente cuando no hay usuario
- **Restauración**: Mazo temporal se restaura al iniciar sesión

### Optimizaciones de Rendimiento

- **Memoización**: Todos los cálculos costosos están memoizados
- **Lazy loading**: Solo las primeras 2 cartas de cada edición se cargan con prioridad
- **Debounce**: Búsqueda y tracking tienen debounce para evitar llamadas excesivas
- **Callbacks**: Funciones pasadas como props están envueltas en `useCallback`
- **Suspense**: Página principal envuelta en Suspense para mejor UX de carga
