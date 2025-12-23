# 🚀 Roadmap y Plan de Mejoras - CartaTech

**Última actualización**: Diciembre 2024  
**Estado del proyecto**: ✅ En producción (https://www.cartatech.cl/)  
**Versión del documento**: 3.3 (Fase 1 completada: Deck Builder y Exportación)

Este documento consolida el plan completo de mejoras, optimizaciones y funcionalidades futuras para CartaTech, organizado por prioridad y estado de implementación.

---

## 📊 Resumen Ejecutivo

### ✅ Implementado y Funcionando (2024)
- ✅ **React Query** para caché de datos (cartas, mazos públicos, mazos de usuario)
- ✅ **Virtualización de listas** (VirtualizedCardGrid, VirtualizedEditionGrid en galería)
- ✅ **Lazy loading** de componentes pesados (WelcomeTour, Analytics, CardsPanel, etc.)
- ✅ **Memoización** de cálculos costosos (totalCards, decksWithComputedValues)
- ✅ **Sistema de rate limiting** en APIs críticas
- ✅ **Sistema de logging** estructurado
- ✅ **Sistema de compartir** con códigos cortos y Web Share API
- ✅ **Open Graph Images** dinámicas para redes sociales
- ✅ **Sistema de banners** personalizados por contexto y dispositivo
- ✅ **Optimizaciones de Next.js** (compresión, imágenes, bundle analyzer)
- ✅ **Code splitting** de componentes grandes (deck-management-panel reducido 62%)
- ✅ **Sistema de búsqueda global** con autocompletado e historial
- ✅ **SEO completo** con metadatos dinámicos y Schema.org JSON-LD
- ✅ **Paginación** en todas las listas grandes
- ✅ **Analytics** completo con todos los eventos críticos trackeados
- ✅ **Sistema de seguimiento** (Follow/Unfollow) con notificaciones automáticas
- ✅ **Deck Builder Pro**: Badge de total, Drag & Drop (reordenar y agregar), filtros rápidos
- ✅ **Exportación Universal**: Imagen 2x (super-sampling), Lista de texto y TTS Code

### 🔄 En Progreso / Pendiente Alta Prioridad
- ⏳ **Filtros avanzados** en comunidad (combinación múltiple del servidor)
- ⏳ **Exportación avanzada** (PDF, formatos especializados)

### 📋 Pendiente Media Prioridad
- ⏳ **Feed de actividad** de usuarios seguidos en el Dashboard
- ⏳ **Mejoras de accesibilidad** avanzadas (ARIA completo, navegación por teclado)
- ⏳ **PWA** (Progressive Web App) con service worker y manifest

### 🔮 Pendiente Baja Prioridad / Ideas Futuras
- ⏳ **Testing completo** (Unit, Integration, E2E)
- ⏳ **Notificaciones push** del navegador
- ⏳ **Sistema de torneos** y eventos
- ⏳ **API pública** para desarrolladores
- ⏳ **Sistema de badges** y logros
- ⏳ **Modo oscuro mejorado** con más opciones de personalización

---

## 🎯 FASE 1: Mejoras de UX/UI (Alta Prioridad) ✅

### 1.1 Filtros Avanzados en Mazos Públicos ✅

**Estado Actual:** ✅ Implementado y funcionando

**Mejoras Implementadas:**

- [x] **Filtros del servidor en API**
  - Por formato (RE, RL, LI) - con query params ✅
  - Por fecha de publicación (rango de fechas) ✅
  - Por popularidad (mínimo de likes y favoritos) ✅
  - Por autor (username) ✅
  - Combinación de múltiples filtros ✅
  - Ordenamiento avanzado (más recientes, más populares, más vistos, más likes, más favoritos) ✅
  - Ordenamiento por likes y favoritos con filtrado en memoria ✅

- [x] **UI de filtros mejorada**
  - Panel de filtros colapsable/expandible ✅
  - Filtros activos visibles con badges ✅
  - Botón "Limpiar filtros" ✅
  - Contador de resultados filtrados ✅
  - Persistencia de filtros en URL (query params) ✅
  - Layout compacto y organizado ✅
  - Ordenamiento discreto en fila separada ✅

### 1.2 Mejoras en Deck Builder ✅

**Estado Actual:** ✅ Completado - Mejoras implementadas

**Mejoras Implementadas:**

- [x] **Badge de total de cartas visible**
  - Contador siempre visible en el header del mazo (ej: "45/50") ✅
  - Estilo dinámico según validez del mazo ✅

- [x] **Drag & Drop para reordenar cartas**
  - Arrastrar cartas dentro del mazo para cambiar orden ✅
  - Implementado con `@dnd-kit/core` y `@dnd-kit/sortable` ✅

- [x] **Drag & Drop desde panel de cartas al mazo**
  - Arrastrar cartas desde el panel izquierdo al panel del mazo ✅
  - Feedback visual con overlay y borde en el panel de destino ✅
  - Optimizado para respuesta rápida y auto-scroll ✅

- [x] **Mejoras en búsqueda de cartas**
  - Filtro rápido "Solo Disponibles" (filtra por ban list según formato) ✅
  - Organización mejorada de filtros rápidos ✅

### 1.3 Exportación de Mazos Mejorada ✅

**Estado Actual:** ✅ Implementado y funcionando

**Mejoras Implementadas:**

- [x] **Formatos de exportación adicionales**
  - Exportar a Lista (Texto) formateada ✅
  - Exportar a TTS Code (compatible con Tabletop Simulator) ✅
  - Exportar a Imagen de alta resolución ✅

- [x] **Calidad de Imagen Superior**
  - Sistema de super-sampling 2x para nitidez extrema ✅
  - Optimización de URLs de Cloudinary para resolución completa ✅
  - Soporte para formatos Horizontal y Vertical (Instagram) ✅

- [x] **Modal Unificado**
  - Interfaz intuitiva para elegir formato y previsualizar imagen ✅

---

## 🔧 FASE 2: Funcionalidades Sociales (Media Prioridad)

### 2.1 Sistema de Seguimiento (Follow) ✅

**Estado Actual:** ✅ Implementado y funcionando

**Mejoras Implementadas:**
  
- [x] **Modelo de base de datos**
  - Tabla `Follow` creada en Prisma ✅
  - Relaciones User → Follow → User (self-referential) ✅
  - Índices para consultas eficientes ✅

- [x] **APIs de seguimiento**
  - `POST /api/users/[username]/follow` - Seguir usuario ✅
  - `DELETE /api/users/[username]/follow` - Dejar de seguir ✅
  - `GET /api/users/[username]/followers` - Lista de seguidores ✅
  - `GET /api/users/[username]/following` - Lista de usuarios seguidos ✅
  - `GET /api/users/[username]/follow-status` - Estado de seguimiento ✅

- [x] **UI de seguimiento**
  - Botón "Seguir/Dejar de seguir" en perfiles ✅
  - Contador de seguidores/seguidos en estadísticas ✅
  - Actualización optimista del estado ✅
  - Notificaciones cuando alguien te sigue ✅

- [ ] **Feed de actividad** (Próximo paso)
  - Página `/feed` con actividad de usuarios seguidos
  - Nuevos mazos publicados por seguidos
  - Actividad reciente (likes, comentarios)

---

## 🎨 FASE 3: Optimizaciones y Mejoras Técnicas

### 3.1 PWA (Progressive Web App) 🟡
- [ ] **Manifest.json** e iconos
- [ ] **Service Worker** con caché offline para cartas
- [ ] **Indicador offline** y persistencia local

### 3.2 Mejoras de Accesibilidad Avanzadas 🟡
- [ ] **ARIA labels** completos en toda la app
- [ ] **Navegación por teclado** optimizada (Focus visible, Skip links)
- [ ] **Verificación de contraste** WCAG AA

---

## 🚀 FASE 6: Funcionalidades Avanzadas

### 6.1 Sistema de Torneos y Eventos 🟢
- [ ] **Modelo de torneos** y brackets
- [ ] **Gestión de inscripciones** y mazos permitidos

### 6.2 API Pública para Desarrolladores 🟢
- [ ] **Documentación OpenAPI**
- [ ] **Sistema de API Keys** y límites

---

## 🎯 Priorización Recomendada (Q1 2025)

### Sprint 1 & 2 (Completados) ✅
- ✅ Filtros avanzados en comunidad
- ✅ Mejoras Deck Builder (Badge, Dnd, Filtros)
- ✅ Exportación Pro (Imagen 2x, Texto, TTS)

### Sprint 3 (En curso) 🔄
- ✅ Sistema de seguimiento (Follow) - COMPLETADO
- ⏳ Feed de actividad (en progreso)
- ⏳ Mejoras de accesibilidad base

### Sprint 4+ (Ongoing) 🔮
- ⏳ PWA básico
- ⏳ Sistema de badges y logros
- ⏳ Testing y API Pública

---

## ✅ Estado de Optimizaciones Implementadas

### Deck Builder Pro ✅
- ✅ `totalCards` memoizado y badge dinámico
- ✅ Drag & Drop con `@dnd-kit` (reordenar y agregar cartas)
- ✅ Filtro "Solo Disponibles" basado en ban list del formato
- ✅ Remoción de paneles redundantes para mejor foco

### Exportación de Alta Calidad ✅
- ✅ Super-sampling 2x en generación de canvas
- ✅ `optimizeCloudinaryUrlForExport` para máxima resolución
- ✅ Modal unificado `ExportDeckModal`

### Sistema de Seguimiento ✅
- ✅ Modelo `Follow` en Prisma y APIs REST
- ✅ `FollowButton` con actualización optimista
- ✅ Notificaciones automáticas de tipo `follow`

---

**Última actualización**: Diciembre 2024  
**Versión del documento**: 3.3 (Fase 1 completada: Deck Builder y Exportación)
