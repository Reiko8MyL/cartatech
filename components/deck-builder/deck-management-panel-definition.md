# Definición del Componente DeckManagementPanel

## Descripción General

El componente `DeckManagementPanel` es el panel de gestión principal del constructor de mazos. Proporciona todas las herramientas necesarias para gestionar, guardar, cargar y exportar mazos, además de mostrar las estadísticas y las cartas del mazo actual.

**Archivo**: `cartatech/components/deck-builder/deck-management-panel.tsx`  
**Tipo**: Componente cliente de React (`"use client"`)  
**Líneas de código**: ~1289

---

## Props del Componente

```typescript
interface DeckManagementPanelProps {
  deckName: string                    // Nombre actual del mazo
  onDeckNameChange: (name: string) => void  // Callback para cambiar el nombre
  deckCards: DeckCard[]               // Array de cartas en el mazo
  allCards: CardType[]                 // Todas las cartas disponibles del juego
  stats: DeckStats                     // Estadísticas calculadas del mazo
  onClearDeck: () => void              // Callback para limpiar el mazo
  onLoadDeck: (deck: SavedDeck) => void  // Callback para cargar un mazo guardado
  onAddCard: (cardId: string) => void  // Callback para agregar una carta
  onRemoveCard: (cardId: string) => void  // Callback para remover una carta
  deckFormat: DeckFormat               // Formato actual del mazo ("RE" | "RL" | "LI")
  onDeckFormatChange: (format: DeckFormat) => void  // Callback para cambiar formato
}
```

---

## Estados Locales

### Estados de UI
- `isEditingName: boolean` - Controla si el nombre del mazo está en modo edición
- `tempName: string` - Nombre temporal mientras se edita
- `showLoadDialog: boolean` - Controla la visibilidad del diálogo de cargar mazos
- `showSaveModal: boolean` - Controla la visibilidad del modal de guardar mazo
- `showLoginDialog: boolean` - Controla la visibilidad del diálogo de login
- `copied: boolean` - Indica si el código TTS fue copiado (para feedback visual)
- `deleteDialogOpen: boolean` - Controla la visibilidad del diálogo de confirmación de eliminación
- `deckToDelete: string | null` - ID del mazo a eliminar

### Estados de Tooltips
- `showAliadosTooltip: boolean` - Tooltip de validación de aliados
- `showOrosTooltip: boolean` - Tooltip de validación de oros
- `showTotalCartasTooltip: boolean` - Tooltip de validación de total de cartas

### Estados de Datos
- `savedDecks: SavedDeck[]` - Lista de mazos guardados del usuario
- `isLoadingDecks: boolean` - Estado de carga de mazos guardados

---

## Estructura del Componente

### Contenedor Principal
**Ubicación**: Línea 716  
**Clase CSS**: `flex flex-col h-full`  
**Descripción**: Contenedor flex vertical que ocupa toda la altura disponible

---

## 1. Encabezado con Nombre del Mazo

**Ubicación**: Líneas 718-777  
**Clase CSS contenedor**: `p-2 sm:p-3 lg:p-4 border-b space-y-3`

### 1.1. Editor de Nombre del Mazo

**Modo Visualización** (Líneas 736-750):
- **Título**: `h2` con nombre del mazo o "Mazo sin nombre"
- **Botón Editar**: Icono `Edit2` que activa el modo edición
- **Clase CSS título**: `text-xl font-semibold flex-1 truncate`
- **Estado actual**: ✅ Implementado

**Modo Edición** (Líneas 720-734):
- **Input**: Campo de texto con `autoFocus`
- **Botón Guardar**: Icono `Check` que confirma el cambio
- **Botón Cancelar**: Icono `X` que cancela la edición
- **Estado actual**: ✅ Implementado

### 1.2. Selector de Formato

**Ubicación**: Líneas 753-776  
**Componente**: `ToggleGroup` de Shadcn UI  
**Opciones**:
- **RE** (Racial Edición): `rounded-r-none`
- **RL** (Racial Libre): `rounded-none border-x`
- **LI** (Formato Libre): `rounded-l-none`

**Estado actual**: ✅ Implementado  
**Clase CSS contenedor**: `space-y-2`  
**Label**: `text-xs font-medium text-muted-foreground`

---

## 2. Sección de Estadísticas

**Ubicación**: Líneas 779-930  
**Clase CSS contenedor**: `p-2 sm:p-3 lg:p-4 border-b space-y-2`  
**Título**: "Estadísticas" (`text-sm font-semibold`)

### 2.1. Estadísticas Principales

**Ubicación**: Líneas 783-830

#### Total de Cartas
- **Label**: "Total cartas: "
- **Valor**: Número con color condicional:
  - Verde si `totalCards === 50`
  - Rojo si `totalCards < 50`
  - Sin color especial si `totalCards > 50`
- **Tooltip**: Aparece si `totalCards < 50` con mensaje "El mazo necesita 50 cartas"
- **Estado actual**: ✅ Implementado

#### Coste Promedio
- **Label**: "Coste promedio: "
- **Valor**: Número calculado desde `stats.averageCost`
- **Estado actual**: ✅ Implementado

### 2.2. Estadísticas por Tipo

**Ubicación**: Líneas 831-928  
**Layout**: `flex flex-wrap justify-center gap-x-4 gap-y-1 pt-1 text-center`

#### Aliados
- **Validación**: Muestra en rojo si `totalCards === 50` y `aliados < 16`
- **Tooltip**: "El mínimo de Aliados por mazo es de 16"
- **Estado actual**: ✅ Implementado

#### Arma, Talismán, Tótem
- **Visualización**: Solo muestra la cantidad sin validación especial
- **Estado actual**: ✅ Implementado

#### Oros
- **Validación**: Muestra en rojo si `totalCards === 50` y no tiene `hasOroIni`
- **Tooltip**: "Agrega un Oro Inicial (Sin habilidad)"
- **Estado actual**: ✅ Implementado

**Nota**: Los tooltips usan posicionamiento absoluto con z-index 50 y tienen animaciones de entrada/salida con eventos de mouse.

---

## 3. Botones de Acción

**Ubicación**: Líneas 932-989  
**Clase CSS contenedor**: `p-2 sm:p-3 lg:p-4 border-b space-y-2`  
**Grid**: `grid grid-cols-2 gap-2`

### 3.1. Código TTS
- **Icono**: `Copy` / `Check` (cuando está copiado)
- **Función**: `handleCopyCode()` - Genera y copia código TTS al portapapeles
- **Feedback**: Muestra "Copiado" por 2 segundos después de copiar
- **Estado actual**: ✅ Implementado

### 3.2. Guardar
- **Icono**: `Save`
- **Función**: `handleSaveDeck()` - Abre modal de guardar o diálogo de login
- **Comportamiento**: Si no hay usuario, guarda temporalmente y muestra diálogo de login
- **Estado actual**: ✅ Implementado

### 3.3. Cargar
- **Icono**: `Loader2`
- **Función**: `openLoadDialog()` - Abre diálogo de mazos guardados
- **Deshabilitado**: Si no hay usuario autenticado
- **Tooltip**: "Debes iniciar sesión para cargar mazos"
- **Estado actual**: ✅ Implementado

### 3.4. Borrar
- **Icono**: `Trash2`
- **Función**: `onClearDeck()` - Limpia el mazo actual
- **Estilo**: `text-destructive`
- **Estado actual**: ✅ Implementado

### 3.5. Exportar Imagen
- **Icono**: `Download`
- **Función**: `handleExportImage()` - Genera imagen PNG del mazo (1920x1080px)
- **Características**:
  - Canvas de alta calidad
  - Fondo personalizado desde Cloudinary
  - Badges de tipos con iconos
  - Cartas apiladas con espaciado
  - Escalado automático para aprovechar espacio
- **Estado actual**: ✅ Implementado

### 3.6. Exportar Lista
- **Icono**: `FileText`
- **Función**: `handleExportList()` - Genera archivo TXT con lista de cartas
- **Formato**: `{cantidad}x {nombre}` ordenado por tipo y coste
- **Estado actual**: ✅ Implementado

---

## 4. Lista de Cartas del Mazo

**Ubicación**: Líneas 991-1081  
**Clase CSS contenedor**: `flex-1 overflow-y-auto p-2 sm:p-3 lg:p-4`

### 4.1. Estado Vacío
- **Mensaje**: "No hay cartas en el mazo"
- **Estilo**: `text-sm text-muted-foreground text-center py-8`
- **Estado actual**: ✅ Implementado

### 4.2. Agrupación por Tipo

**Orden de tipos**: `["Aliado", "Talismán", "Oro", "Tótem", "Arma"]`

**Memoización**: `cardsByTypeGrouped` (líneas 682-713)
- Agrupa cartas por tipo
- Calcula total por tipo
- Filtra tipos vacíos
- Optimizado con `useMemo`

### 4.3. Encabezado de Tipo
- **Formato**: `{Tipo} ({Cantidad})`
- **Estilo**: `text-sm font-bold text-foreground`
- **Estado actual**: ✅ Implementado

### 4.4. Entrada de Carta Individual

**Estructura**: Barra horizontal con dos secciones

#### Selector de Cantidad (Izquierda)
- Botones +/- circulares (6x6)
- Indicador de cantidad centrado
- Validación según formato (banListRE/RL/LI)
- **Estado actual**: ✅ Implementado

#### Información de Carta (Derecha)
- Imagen de fondo recortada (23% desde arriba)
- Overlay oscuro (40% opacidad)
- Nombre en blanco con sombra
- **Estado actual**: ✅ Implementado

**Ver documentación detallada en**: `deck-elements-definition.md`

---

## 5. Diálogos y Modales

### 5.1. Diálogo de Cargar Mazos

**Ubicación**: Líneas 1083-1222  
**Componente**: `Dialog` de Shadcn UI  
**Tamaño**: `max-w-3xl max-h-[85vh]`

#### Estados de Carga
- **Cargando**: Spinner con texto "Cargando mazos..."
- **Vacío**: Mensaje "No hay mazos guardados"
- **Con mazos**: Lista de tarjetas de mazos

#### Tarjeta de Mazo Guardado
**Estructura** (Líneas 1103-1212):
- **Imagen de fondo**: Imagen de raza con overlay degradado
- **Logo de edición**: Icono en esquina superior derecha
- **Información superior**:
  - Nombre del mazo (blanco, con sombra)
  - Badge público/privado (Globe/Lock)
- **Contenido**:
  - Tags de raza y etiquetas
  - Descripción (truncada a 1 línea)
  - Fecha de creación con icono Calendar
- **Botones de acción**:
  - Cargar (botón principal)
  - Eliminar (botón destructivo con icono Trash2)

**Metadata calculada**: `decksWithMetadata` (líneas 644-668)
- Raza del mazo
- Edición del mazo
- Imagen de fondo
- Estadísticas
- Cantidad de cartas
- Fecha formateada

**Estado actual**: ✅ Implementado

### 5.2. Modal de Guardar Mazo

**Ubicación**: Líneas 1224-1232  
**Componente**: `SaveDeckModal` (componente separado)  
**Props**:
- `isOpen`: `showSaveModal`
- `onClose`: Cierra el modal
- `onSave`: `handleSaveDeckConfirm`
- `initialName`: `deckName`
- `deckCards`: `deckCards`
- `deckFormat`: `deckFormat`

**Función `handleSaveDeckConfirm`** (Líneas 159-233):
- Verifica duplicados de nombre
- Muestra prompt si existe duplicado
- Guarda en API con fallback a localStorage
- Actualiza lista de mazos guardados
- Muestra toast de éxito/error

**Estado actual**: ✅ Implementado

### 5.3. Diálogo de Confirmación de Eliminación

**Ubicación**: Líneas 1234-1244  
**Componente**: `ConfirmDialog`  
**Props**:
- `title`: "Eliminar Mazo"
- `description`: Mensaje de confirmación
- `variant`: "destructive"
- `onConfirm`: `confirmDeleteDeck`

**Función `confirmDeleteDeck`** (Líneas 245-267):
- Elimina de API con fallback a localStorage
- Recarga lista de mazos
- Muestra toast de éxito

**Estado actual**: ✅ Implementado

### 5.4. Diálogo de Login/Registro

**Ubicación**: Líneas 1246-1284  
**Componente**: `Dialog` de Shadcn UI

**Propósito**: Invitar al usuario a iniciar sesión cuando intenta guardar sin estar autenticado

**Botones**:
- **Iniciar Sesión**: Redirige a `/inicio-sesion`
- **Registrarse**: Redirige a `/registro`
- **Cancelar**: Cierra el diálogo

**Estado actual**: ✅ Implementado

---

## Funciones Principales

### Gestión de Nombre
- `handleSaveName()`: Guarda el nombre editado
- `handleCancelEdit()`: Cancela la edición y restaura nombre original

### Exportación
- `handleCopyCode()`: Genera código TTS y lo copia al portapapeles
- `handleExportImage()`: Genera imagen PNG del mazo (líneas 302-619)
- `handleExportList()`: Genera archivo TXT con lista de cartas (líneas 269-300)

### Gestión de Mazos
- `handleSaveDeck()`: Inicia proceso de guardado
- `handleSaveDeckConfirm()`: Confirma y ejecuta guardado
- `handleLoadDeck()`: Carga un mazo guardado
- `handleDeleteDeck()`: Inicia proceso de eliminación
- `confirmDeleteDeck()`: Confirma y ejecuta eliminación
- `openLoadDialog()`: Abre diálogo y carga mazos guardados

---

## Optimizaciones y Memoización

### `decksWithMetadata` (Líneas 644-668)
- Calcula metadata para cada mazo guardado
- Dependencias: `savedDecks`, `allCards`
- Incluye: raza, edición, imagen, stats, cantidad, fecha

### `deckCardsGrouped` (Líneas 671-674)
- Filtra cartas con cantidad > 0
- Dependencias: `deckCards`

### `cardMap` (Líneas 676-679)
- Mapa de ID de carta → objeto Card
- Dependencias: `allCards`
- Optimiza búsquedas O(1)

### `cardsByTypeGrouped` (Líneas 682-713)
- Agrupa cartas por tipo con totales
- Ordena según orden de tipos definido
- Dependencias: `deckCardsGrouped`, `cardMap`

---

## Integraciones

### Autenticación
- **Hook**: `useAuth()` de `@/contexts/auth-context`
- **Uso**: Verifica usuario para guardar/cargar mazos

### Navegación
- **Hook**: `useRouter()` de `next/navigation`
- **Uso**: Redirige a páginas de login/registro

### Toast Notifications
- **Funciones**: `toastSuccess()`, `toastError()` de `@/lib/toast`
- **Uso**: Feedback de acciones (guardar, eliminar, copiar, exportar)

### APIs
- **Guardar**: `saveDeckToStorage()` con fallback a localStorage
- **Cargar**: `getSavedDecksFromStorage()` con fallback a localStorage
- **Eliminar**: `deleteDeckFromStorage()` con fallback a localStorage

---

## Consideraciones de Diseño

### Responsive
- Padding adaptativo: `p-2 sm:p-3 lg:p-4`
- Grid de botones: 2 columnas en todas las pantallas
- Diálogos: `max-w-3xl` con scroll interno

### Accesibilidad
- `aria-label` en botones de tooltip
- Navegación por teclado en diálogos
- Estados disabled apropiados
- Contraste de colores para validaciones

### Performance
- Memoización de cálculos costosos
- Lazy loading de imágenes en diálogo de mazos
- Optimización de renders con `useMemo`

---

## Mejoras Pendientes

1. **Badge de Total de Cartas**: Agregar badge visual en la parte superior del panel de cartas
2. **Icono de Coste**: Mostrar coste de cada carta en la lista (ver `deck-elements-definition.md`)
3. **Búsqueda de Mazos**: Agregar filtro/búsqueda en el diálogo de cargar mazos
4. **Ordenamiento**: Permitir ordenar mazos por fecha, nombre, etc.
5. **Paginación**: Implementar paginación para listas grandes de mazos
6. **Animaciones**: Agregar transiciones suaves en cambios de estado
7. **Validación Visual**: Mejorar feedback visual de validaciones del mazo
8. **Exportación Avanzada**: Opciones adicionales de exportación (PDF, JSON, etc.)
9. **Historial de Versiones**: Mostrar historial de versiones del mazo
10. **Compartir Mazo**: Funcionalidad para compartir mazos públicamente

---

## Referencias

- **Componente relacionado**: `SaveDeckModal` (`save-deck-modal.tsx`)
- **Documentación de elementos**: `deck-elements-definition.md`
- **Tipos**: `@/lib/deck-builder/types`
- **Utilidades**: `@/lib/deck-builder/utils`

