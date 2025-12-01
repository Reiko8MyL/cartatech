# Definición de Elementos del Panel Derecho - Visualización de Cartas del Mazo

## Estructura General

El panel derecho muestra las cartas del mazo agrupadas por tipo. Consta de los siguientes elementos:

---

## 1. Badge de Total de Cartas
**Ubicación**: Parte superior, centrado horizontalmente
**Elementos**:
- Contenedor: Badge redondeado con fondo de color
- Texto: "Total X cartas" (donde X es el número total)
- Estilo: Fondo con color primario/acento, texto en color primario

**Estado actual**: ✅ Implementado
**Clase CSS**: `bg-primary/10 text-primary px-4 py-1.5 rounded-full`

---

## 2. Encabezado de Sección por Tipo
**Ubicación**: Antes de cada grupo de cartas del mismo tipo
**Elementos**:
- Texto: "{Tipo} ({Cantidad})" (ej: "Aliado (12)")
- Estilo: Texto en negrita, alineado a la izquierda

**Tipos de cartas** (en orden):
1. Aliado
2. Talismán
3. Oro
4. Tótem
5. Arma

**Estado actual**: ✅ Implementado
**Clase CSS**: `text-sm font-bold text-foreground`

---

## 3. Entrada de Carta Individual
**Estructura**: Barra horizontal redondeada con dos secciones principales

### 3.1. Selector de Cantidad (Sección Izquierda)
**Elementos**:
- **Botón Menos (-)**: 
  - Circular, fondo claro
  - Reduce la cantidad en 1
  - Deshabilitado cuando cantidad = 0
- **Indicador de Cantidad**: 
  - Número centrado entre los botones
  - Texto en negrita
  - Ancho mínimo fijo para mantener alineación
- **Botón Más (+)**: 
  - Circular, fondo claro
  - Aumenta la cantidad en 1
  - Deshabilitado cuando cantidad >= banListRE

**Contenedor**: Fondo con color primario/acento suave
**Estado actual**: ✅ Implementado
**Clase CSS**: `flex items-center gap-1.5 bg-primary/10 px-3 py-2.5`

### 3.2. Información de la Carta (Sección Derecha)
**Elementos**:
- **Nombre de la Carta**: 
  - Texto en primer plano
  - Fuente mediana, negrita
  - Color de texto: foreground
- **Imagen de Fondo**: 
  - Imagen de la carta recortada (30-50% desde arriba)
  - Opacidad reducida (20%)
  - Cubre toda el área de la sección
  - Posición: center top
- **Icono de Coste** (PENDIENTE):
  - Circular, color dorado/acento
  - Muestra el coste de la carta
  - Ubicado en el extremo derecho
  - Solo visible si la carta tiene coste

**Contenedor**: Fondo oscuro/claro según tema, posición relativa
**Estado actual**: ⚠️ Parcialmente implementado (falta icono de coste)
**Clase CSS**: `flex-1 relative min-h-[3rem] flex items-center px-3 py-2.5 bg-foreground/5`

---

## 4. Estado Vacío
**Ubicación**: Centro del panel cuando no hay cartas
**Elementos**:
- Mensaje: "No hay cartas en el mazo"
- Estilo: Texto centrado, color muted

**Estado actual**: ✅ Implementado

---

## Mejoras Pendientes

1. **Icono de Coste**: Agregar icono circular con el coste de la carta en el extremo derecho
2. **Mejora visual del selector**: Ajustar colores y estilos para mejor contraste
3. **Hover states**: Agregar efectos hover en las entradas de cartas
4. **Responsive**: Ajustar tamaños para pantallas más pequeñas

