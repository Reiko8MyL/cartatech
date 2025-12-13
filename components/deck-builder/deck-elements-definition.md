# Definición de Elementos del Panel Derecho - Visualización de Cartas del Mazo

## Estructura General

El panel derecho muestra las cartas del mazo agrupadas por tipo. Consta de los siguientes elementos:

---

## 1. Badge de Total de Cartas
**Ubicación**: Parte superior del panel de cartas, centrado horizontalmente
**Elementos**:
- Contenedor: Badge redondeado con fondo de color
- Texto: "Total X cartas" (donde X es el número total)
- Estilo: Fondo con color primario/acento, texto en color primario

**Estado actual**: ✅ Implementado
**Nota**: El badge se muestra en la parte superior del panel de visualización de cartas (`DeckCardsList`), centrado horizontalmente. Cambia de color según el estado:
- Verde cuando el mazo tiene exactamente 50 cartas
- Rojo cuando tiene menos de 50 cartas
- Color primario cuando tiene más de 50 cartas

**Clase CSS**: `bg-primary/10 text-primary px-4 py-1.5 rounded-full` (con variantes según estado)

---

## 2. Encabezado de Sección por Tipo
**Ubicación**: Antes de cada grupo de cartas del mismo tipo
**Elementos**:
- Texto: "{Tipo} ({Cantidad})" (ej: "Aliado (12)")
- Estilo: Texto en negrita, alineado a la izquierda

**Tipos de cartas** (en orden de visualización):
1. Aliado
2. Talismán
3. Oro
4. Tótem
5. Arma

**Estado actual**: ✅ Implementado
**Clase CSS**: `text-sm font-bold text-foreground`
**Ubicación en código**: Líneas 1006-1008 de `deck-management-panel.tsx`

---

## 3. Entrada de Carta Individual
**Estructura**: Barra horizontal redondeada con dos secciones principales y borde

### 3.1. Selector de Cantidad (Sección Izquierda)
**Elementos**:
- **Botón Menos (-)**: 
  - Circular (6x6), fondo claro con hover
  - Reduce la cantidad en 1 al hacer clic
  - Deshabilitado cuando cantidad = 0
  - Icono: `Minus` de lucide-react (tamaño 3)
- **Indicador de Cantidad**: 
  - Número centrado entre los botones
  - Texto en negrita, tamaño pequeño
  - Ancho mínimo fijo (1.5rem) para mantener alineación
- **Botón Más (+)**: 
  - Circular (6x6), fondo claro con hover
  - Aumenta la cantidad en 1 al hacer clic
  - Deshabilitado cuando cantidad >= banList según formato (RE/RL/LI)
  - Icono: `Plus` de lucide-react (tamaño 3)

**Contenedor**: Fondo con color primario/acento suave, padding horizontal y vertical
**Estado actual**: ✅ Implementado completamente
**Clase CSS**: `flex items-center gap-1.5 bg-primary/10 px-3 py-2.5`
**Ubicación en código**: Líneas 1020-1046 de `deck-management-panel.tsx`

### 3.2. Información de la Carta (Sección Derecha)
**Elementos**:
- **Nombre de la Carta**: 
  - Texto en primer plano con z-index elevado
  - Fuente grande (text-lg), negrita
  - Color de texto: blanco con sombra para legibilidad
  - Sombra de texto: `drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`
- **Imagen de Fondo**: 
  - Imagen de la carta recortada (23% desde arriba, recorte del 5% superior e inferior)
  - Tamaño de fondo: 200% auto para mejor cobertura
  - Posición: center 23%
  - Clip path: `inset(5% 0% 5% 0%)` para recorte vertical
- **Overlay Oscuro**: 
  - Capa semitransparente negra (40% opacidad) sobre la imagen
  - Mejora la legibilidad del texto del nombre
  - Cubre toda el área de la sección
- **Icono de Coste** (PENDIENTE):
  - Circular, color dorado/acento
  - Muestra el coste de la carta
  - Ubicado en el extremo derecho
  - Solo visible si la carta tiene coste

**Contenedor**: Fondo transparente, posición relativa, altura fija (h-12), overflow hidden
**Estado actual**: ⚠️ Parcialmente implementado (falta icono de coste)
**Clase CSS**: `flex-1 relative h-12 flex items-center px-3 overflow-hidden`
**Ubicación en código**: Líneas 1048-1071 de `deck-management-panel.tsx`

**Detalles de implementación**:
- La imagen de fondo usa `backgroundImage` con `url(${card.image})`
- El overlay oscuro usa `bg-black/40` con z-index 0
- El nombre usa z-index 10 para estar sobre el overlay

---

## 4. Estado Vacío
**Ubicación**: Centro del panel cuando no hay cartas en el mazo
**Elementos**:
- Mensaje: "No hay cartas en el mazo"
- Estilo: Texto pequeño, centrado, color muted
- Padding vertical: py-8 para espaciado adecuado

**Estado actual**: ✅ Implementado
**Clase CSS**: `text-sm text-muted-foreground text-center py-8`
**Ubicación en código**: Líneas 993-996 de `deck-management-panel.tsx`

---

## 5. Contenedor Principal
**Estructura**: Panel scrollable con espaciado consistente
**Elementos**:
- Contenedor flexible con scroll vertical cuando es necesario
- Padding responsive: `p-2 sm:p-3 lg:p-4`
- Espaciado entre grupos de tipos: `space-y-4`
- Espaciado entre cartas del mismo tipo: `space-y-1.5`

**Estado actual**: ✅ Implementado
**Clase CSS**: `flex-1 overflow-y-auto p-2 sm:p-3 lg:p-4`
**Ubicación en código**: Línea 992 de `deck-management-panel.tsx`

---

## Mejoras Pendientes

1. **Badge de Total de Cartas**: Agregar badge en la parte superior del panel de cartas mostrando el total de cartas
2. **Icono de Coste**: Agregar icono circular con el coste de la carta en el extremo derecho de la sección de información
3. **Hover states**: Agregar efectos hover en las entradas de cartas para mejor feedback visual
4. **Responsive**: Verificar y ajustar tamaños para pantallas más pequeñas (actualmente usa clases responsive de Tailwind)
5. **Accesibilidad**: Agregar aria-labels y mejor soporte de teclado para los controles de cantidad
6. **Animaciones**: Considerar animaciones suaves al agregar/remover cartas

