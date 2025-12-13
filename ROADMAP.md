# 🚀 Roadmap y Plan de Mejoras - CartaTech

**Última actualización**: Diciembre 2024  
**Estado del proyecto**: ✅ En producción (https://www.cartatech.cl/)  
**Code Splitting completado**: Diciembre 2024 (deck-management-panel refactorizado)

Este documento consolida el plan completo de mejoras, optimizaciones y funcionalidades futuras para CartaTech, organizado por prioridad y estado de implementación.

---

## 📊 Resumen Ejecutivo

### ✅ Implementado y Funcionando
- ✅ React Query para caché de datos (cartas, mazos públicos, mazos de usuario)
- ✅ Virtualización de listas (VirtualizedCardGrid, VirtualizedEditionGrid en galería)
- ✅ Lazy loading de componentes pesados (WelcomeTour, Analytics, CardsPanel, etc.)
- ✅ Memoización de cálculos costosos (totalCards, decksWithComputedValues)
- ✅ Sistema de rate limiting en APIs críticas
- ✅ Sistema de logging estructurado
- ✅ Sistema de compartir con códigos cortos
- ✅ Open Graph Images dinámicas
- ✅ Sistema de banners personalizados
- ✅ Optimizaciones de Next.js (compresión, imágenes, bundle analyzer)
- ✅ Code splitting de componentes grandes (deck-management-panel reducido de 1826 a 691 líneas, ~62% de reducción)
- ✅ Code splitting de componentes grandes (deck-management-panel reducido de 1826 a 691 líneas)

### 🔄 En Progreso / Pendiente Alta Prioridad
- ⏳ Metadatos dinámicos por página (SEO)
- ⏳ Paginación en listas grandes
- ⏳ Eventos de Analytics faltantes

### 📋 Pendiente Media/Baja Prioridad
- ⏳ Sistema de seguimiento (Follow)
- ⏳ Testing completo
- ⏳ Mejoras de accesibilidad avanzadas

---

## 🎯 FASE 1: Optimizaciones Críticas (Alta Prioridad)

### 1.1 SEO y Metadatos Mejorados 🔴

**Estado Actual:** ✅ Sitemap y robots.txt implementados, ✅ Metadatos dinámicos implementados en páginas principales

**Mejoras Necesarias:**

- [x] **Metadatos dinámicos por página**
  - ✅ Agregado `metadata` export en páginas principales (`app/**/page.tsx` y `app/**/layout.tsx`)
  - ✅ Título descriptivo único por página
  - ✅ Descripción meta (150-160 caracteres)
  - ✅ Open Graph tags para redes sociales
  - ✅ Twitter Cards
  - ✅ Canonical URLs
  - ✅ Logo actualizado en previews de redes sociales
  
- [x] **Schema.org estructurado (JSON-LD)**
  - ✅ Implementado para mazos (Article con DeckJsonLd)
  - ✅ Implementado para usuarios (Person con PersonJsonLd)
  - ✅ Implementado para listas de mazos (ItemList con DeckListJsonLd)
  - ✅ Implementado Breadcrumbs (BreadcrumbList con BreadcrumbJsonLd)
  - ✅ WebsiteJsonLd mejorado con logo y SearchAction
  
- [x] **Corregir URL base en sitemap.ts**
  - ✅ Verificado: Ya usa `cartatech.cl` correctamente

**Archivos a modificar:**
- `app/sitemap.ts` (línea 3)
- Cada página en `app/**/page.tsx` (agregar `metadata` export)
- Crear `components/seo/json-ld.tsx` para componentes de Schema.org

**Impacto esperado:** Mejora significativa en SEO y previews en redes sociales

---

### 1.2 Paginación en Listas Grandes ✅

**Estado Actual:** ✅ Paginación implementada en todas las listas grandes

**Mejoras Implementadas:**

- [x] **Paginación en mazos públicos** (`/mazos-comunidad`)
  - ✅ Paginación implementada en API `/api/decks` (query params: `page`, `limit`)
  - ✅ Controles de paginación agregados en UI
  - ✅ Filtros funcionan con paginación del servidor (aplicados a la página actual)
  
- [x] **Paginación en comentarios**
  - ✅ Paginación implementada en API `/api/decks/[id]/comments` (query params: `page`, `limit`)
  - ✅ Controles de paginación en componente de comentarios
  
- [x] **Paginación en panel de administración**
  - ✅ Paginación en lista de usuarios (`/api/admin/users`)
  - ✅ Paginación en comentarios moderados (`/api/admin/comments`)

**Archivos a modificar:**
- `app/api/decks/route.ts` (agregar paginación)
- `app/mazos-comunidad/page.tsx` (agregar controles de paginación)
- `app/api/decks/[id]/comments/route.ts` (agregar paginación)
- `app/admin/users/page.tsx` (agregar paginación)

**Impacto esperado:** Mejor rendimiento y UX en listas largas

---

### 1.3 Analytics - Eventos Faltantes ✅

**Estado Actual:** ✅ Todos los eventos críticos implementados y funcionando

**Eventos Implementados:**

- [x] **Eventos de Mazos:**
  - ✅ `trackDeckCreated` - Implementado en `deck-management-panel.tsx` (al crear mazo)
  - ✅ `trackDeckPublished` - Implementado en `deck-management-panel.tsx` (al publicar mazo)
  - ✅ `trackDeckSaved` - Implementado en `deck-management-panel.tsx` (al guardar mazo)
  - ✅ `trackDeckDeleted` - Implementado en `deck-management-panel.tsx` (al eliminar mazo)
  - ✅ `trackDeckFavorited` - Implementado en `lib/deck-builder/utils.ts` (al agregar a favoritos)
  - ✅ `trackDeckCommented` - Implementado en `components/deck/comments-section.tsx` (al comentar mazo)
  - ⚠️ `trackDeckVoted` - No aplica (el sistema de votación actual es para cartas por raza, no mazos)
  - ✅ `trackDeckExported` - Implementado en `deck-management-panel.tsx` (al exportar como lista o imagen)
  
- [x] **Eventos de Cartas:**
  - ✅ `trackCardSearched` - Implementado en `components/deck-builder/filters-panel.tsx` (con debounce de 500ms)
  - ✅ `trackCardFiltered` - Implementado en `components/deck-builder/filters-panel.tsx` (al aplicar filtros)
  - ✅ `trackCardAddedToDeck` - Implementado en `app/deck-builder/page.tsx` (al agregar carta al mazo)

**Archivos modificados:**
- ✅ `lib/analytics/events.ts` - Todas las funciones implementadas
- ✅ Componentes actualizados con tracking en todas las acciones críticas

**Impacto esperado:** ✅ Tracking completo de comportamiento y conversiones implementado

---

### 1.4 Code Splitting y Optimización de Componentes ✅

**Estado Actual:** ✅ `deck-management-panel.tsx` refactorizado (reducido de ~1826 a 691 líneas, ~62% de reducción)

**Mejoras Implementadas:**

- [x] **Dividir `deck-management-panel.tsx`**
  - ✅ Extraídas funciones de exportación de imágenes a `lib/deck-builder/export-image-utils.ts`
  - ✅ Creado componente `ExportImageModal` (lazy loaded)
  - ✅ Creado componente `LoadDeckDialog` (lazy loaded)
  - ✅ Creado componente `DeckCardsList` para lista de cartas
  - ✅ Creado hook `useMobilePanelDrag` para lógica de arrastre móvil
  - ✅ Movida función `getCardBackgroundPositionY` a `utils.ts`
  - ✅ Mejorada mantenibilidad significativamente
  
- [x] **Optimizar bundle size**
  - ✅ Componentes pesados con lazy loading implementado
  - ✅ Funciones de exportación separadas en módulo independiente
  - ⏳ Analizar con `ANALYZE=true npm run build` (opcional para verificar mejoras)

**Archivos creados/modificados:**
- ✅ `lib/deck-builder/export-image-utils.ts` (nuevo)
- ✅ `components/deck-builder/export-image-modal.tsx` (nuevo)
- ✅ `components/deck-builder/load-deck-dialog.tsx` (nuevo)
- ✅ `components/deck-builder/deck-cards-list.tsx` (nuevo)
- ✅ `hooks/use-mobile-panel-drag.ts` (nuevo)
- ✅ `components/deck-builder/deck-management-panel.tsx` (refactorizado)
- ✅ `lib/deck-builder/utils.ts` (actualizado con `getCardBackgroundPositionY`)

**Impacto esperado:** ✅ Mejor rendimiento inicial y mantenibilidad - COMPLETADO

---

## 🔧 FASE 2: Mejoras de UX/UI (Media Prioridad)


### 2.2 Sistema de Compartir Mejorado ✅

**Estado Actual:** ✅ Sistema mejorado con más opciones y mejor UX

**Mejoras Implementadas:**

- [x] **Preview de compartir mejorado**
  - ✅ Imágenes OG dinámicas mejoradas con más estadísticas
  - ✅ Incluye likes, favoritos, vistas y tipos de cartas en preview
  - ✅ Diseño más informativo y atractivo
  
- [x] **Botones de compartir en redes sociales**
  - ✅ Soporte para Web Share API nativo (cuando está disponible)
  - ✅ Compartir en Facebook, Twitter, WhatsApp, LinkedIn, Telegram, Reddit
  - ✅ Mejor UX con feedback visual y tracking de analytics
  - ✅ Generación automática de códigos cortos para compartir

**Archivos modificados:**
- ✅ `components/sharing/social-share.tsx` (mejorado con más opciones y Web Share API)
- ✅ `app/api/og/deck/[id]/route.ts` (mejorado con likes, favoritos y más estadísticas)
- ✅ `lib/analytics/events.ts` (agregada función `trackShare`)

**Impacto esperado:** ✅ Mejor experiencia de compartir y más opciones para usuarios - COMPLETADO

---

### 2.3 Filtros Avanzados 🟡

**Estado Actual:** ⚠️ Filtros básicos implementados

**Mejoras Necesarias:**

- [ ] **Filtros avanzados en mazos públicos**
  - Por formato (RE, RL, LI)
  - Por raza
  - Por fecha de creación
  - Por popularidad (likes, vistas)
  - Combinación de múltiples filtros

**Archivos a modificar:**
- `app/mazos-comunidad/page.tsx`
- `app/api/decks/route.ts` (agregar filtros)

---

## 🎨 FASE 3: Funcionalidades Avanzadas (Baja Prioridad)


### 3.2 Sistema de Seguimiento (Follow) 🟢

**Estado Actual:** ❌ No implementado

**Mejoras Necesarias:**

- [ ] **Seguir usuarios**
  - Botón "Seguir" en perfiles
  - Feed de actividad de usuarios seguidos
  - Notificaciones de nuevos mazos de seguidos
  
- [ ] **Modelo de base de datos**
  - Crear tabla `Follow` en Prisma
  - Relaciones User → Follow → User

**Archivos a crear/modificar:**
- `prisma/schema.prisma` (agregar modelo Follow)
- `app/api/users/[username]/follow/route.ts`
- `components/user/follow-button.tsx`

---

### 3.3 Sistema de Búsqueda Global 🟢

**Estado Actual:** ⚠️ Búsqueda limitada a componentes específicos

**Mejoras Necesarias:**

- [ ] **Autocompletado inteligente**
  - Sugerencias mientras el usuario escribe
  - Búsqueda en tiempo real de cartas y mazos
  - Historial de búsquedas recientes

**Archivos a crear:**
- `components/search/autocomplete.tsx`
- `app/api/search/autocomplete/route.ts`

---

### 3.4 Sistema de Notificaciones Push 🟢

**Estado Actual:** ✅ Notificaciones en-app implementadas

**Mejoras Necesarias:**

- [ ] **Notificaciones push del navegador**
  - Configurar Web Push API
  - Notificaciones cuando alguien comenta tu mazo
  - Notificaciones cuando alguien da like a tu mazo
  - Notificaciones de mazos destacados

**Archivos a crear/modificar:**
- `app/api/notifications/push/route.ts`
- `lib/notifications/push.ts`

---

## 🔒 FASE 4: Seguridad y Robustez

### 4.1 Rate Limiting Mejorado 🟡

**Estado Actual:** ✅ Sistema básico implementado en memoria

**Mejoras Necesarias:**

- [ ] **Migrar a solución escalable**
  - Considerar `@upstash/ratelimit` o Redis
  - Mejor para producción a escala
  - Persistencia entre reinicios

**Archivos a modificar:**
- `lib/rate-limit/rate-limit.ts` (migrar a Redis/Upstash)

---

### 4.2 Validación de Inputs Mejorada 🟡

**Estado Actual:** ✅ Validaciones básicas implementadas

**Mejoras Necesarias:**

- [ ] **Sanitización de inputs**
  - Usar `DOMPurify` para contenido HTML
  - Validar y sanitizar todos los inputs de usuario
  - Prevenir XSS
  
- [ ] **Validación de archivos**
  - Si se permite subir imágenes, validar tipo y tamaño
  - Escanear malware (opcional)

**Archivos a crear/modificar:**
- `lib/validation/sanitize.ts` (mejorar)
- APIs que reciben inputs de usuario

---

### 4.3 Logging y Monitoreo 🟡

**Estado Actual:** ✅ Sistema básico implementado (`lib/logging/logger`)

**Mejoras Necesarias:**

- [ ] **Integración con servicio externo**
  - Sentry o LogRocket para error tracking
  - Logs de errores a servicio externo
  - Alertas automáticas para errores críticos

**Archivos a modificar:**
- `lib/logging/logger.ts` (integrar Sentry)

---

## ♿ FASE 5: Accesibilidad

### 5.1 Mejoras de Accesibilidad 🟡

**Estado Actual:** ⚠️ Básico implementado

**Mejoras Necesarias:**

- [ ] **ARIA labels completos**
  - Agregar labels a todos los botones sin texto
  - Describir acciones complejas
  - Estados de carga y errores
  
- [ ] **Navegación por teclado**
  - Asegurar que todo sea navegable con teclado
  - Atajos de teclado para acciones comunes
  - Focus visible en todos los elementos
  
- [ ] **Contraste de colores**
  - Verificar ratios WCAG AA mínimo
  - Modo de alto contraste
  
- [ ] **Screen readers**
  - Probar con NVDA/JAWS
  - Agregar anuncios de cambios dinámicos
  - Landmarks semánticos

**Archivos a revisar:**
- Todos los componentes UI
- Especialmente componentes interactivos

---

## 📱 FASE 6: Mobile Experience

### 6.1 Optimización Mobile 🟡

**Estado Actual:** ✅ Responsive básico implementado

**Mejoras Necesarias:**

- [ ] **Touch gestures**
  - Swipe para acciones rápidas
  - Pull to refresh
  - Gestos para navegar entre mazos
  
- [ ] **Mobile-first improvements**
  - Bottom navigation en mobile
  - Menús optimizados para touch
  - Tamaños de botones adecuados (min 44x44px)

**Archivos a modificar:**
- `components/navigation/navbar.tsx`
- Componentes principales

---

## 🧪 FASE 7: Testing y Calidad

### 7.1 Testing 🟢

**Estado Actual:** ❌ No implementado

**Mejoras Necesarias:**

- [ ] **Unit tests**
  - Tests para funciones utilitarias
  - Tests para componentes críticos
  
- [ ] **Integration tests**
  - Tests para APIs
  - Tests para flujos completos
  
- [ ] **E2E tests**
  - Playwright o Cypress
  - Tests de flujos críticos (crear mazo, publicar, etc.)

**Archivos a crear:**
- `__tests__/` directory
- Configuración de Jest/Vitest
- Configuración de Playwright

---

## 📈 Métricas de Éxito

### Performance
- Lighthouse Score > 90
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1
- FCP < 1.8s
- TTI < 3.8s

### SEO
- Mejora en rankings de búsqueda
- Aumento en tráfico orgánico
- Mejor CTR en resultados de búsqueda

### UX
- Tasa de rebote < 50%
- Tiempo en sitio > 2 minutos
- Eventos de conversión (crear mazo, publicar)

### Analytics
- Todos los eventos críticos trackeados
- Funnels de conversión configurados

---

## 🎯 Priorización Recomendada

### Sprint 1 (2 semanas) - Alta Prioridad
1. ✅ Corregir URL en sitemap.ts
2. ⏳ Agregar metadatos dinámicos a páginas principales
3. ⏳ Implementar eventos de Analytics faltantes
4. ⏳ Optimizar imágenes críticas

### Sprint 2 (2 semanas) - Alta Prioridad
5. ✅ Implementar paginación en listas principales
6. ✅ Dividir deck-management-panel en componentes más pequeños
7. ⏳ Agregar badge de total de cartas
8. ⏳ Mejorar sistema de compartir

### Sprint 3 (2 semanas) - Media Prioridad
9. ⏳ Autocompletado inteligente en búsqueda
10. ⏳ Mejoras de accesibilidad
11. ⏳ Filtros avanzados

### Sprint 4+ (Ongoing) - Baja Prioridad
13. ⏳ Sistema de seguimiento
14. ⏳ Notificaciones push
15. ⏳ Testing completo
16. ⏳ Otras mejoras según feedback de usuarios

---

## 📝 Notas Importantes

- **Nunca romper funcionalidades existentes** - Todas las mejoras deben ser incrementales
- **Probar localmente antes de deploy** - Usar `npm run build` para verificar
- **Monitorear métricas después de cada cambio** - Usar Vercel Analytics y Google Analytics
- **Obtener feedback de usuarios** - Las mejoras deben resolver problemas reales
- **Documentar cambios importantes** - Mantener documentación actualizada

---

## 🔗 Referencias

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [React Virtual Documentation](https://tanstack.com/virtual/latest)

---

## ✅ Estado de Optimizaciones Implementadas

### Lazy Loading de Componentes Pesados ✅
- ✅ WelcomeTour, Analytics, SpeedInsights en layout
- ✅ CardsPanel y DeckManagementPanel en deck-builder
- ✅ CardInfoModal en galería
- ✅ AdInline y AdSidebar en mazos-comunidad
- ✅ SaveDeckModal en deck-management-panel

### Optimización de Next.js Config ✅
- ✅ Compresión habilitada (`compress: true`)
- ✅ Optimización de package imports (`optimizePackageImports`)
- ✅ Configuración avanzada de imágenes (WebP, AVIF, caché)

### Prefetching y Preload ✅
- ✅ Prefetch explícito en NavLink
- ✅ Preload de recursos críticos (logo, imágenes LCP)
- ✅ DNS prefetch para dominios externos

### Optimización de Cálculos ✅
- ✅ `totalCards` memoizado en CardsPanel
- ✅ `handleCardClick` optimizado
- ✅ Funciones wrapper memoizadas en CardsPanel
- ✅ Pre-cálculo de valores en mazos-comunidad (`decksWithComputedValues`)

### React Query para Cache de Datos ✅
- ✅ QueryProvider configurado en layout
- ✅ `useCardsQuery` - Para cartas con caché
- ✅ `usePublicDecksQuery` - Para mazos públicos con caché
- ✅ `useUserDecksQuery` - Para mazos del usuario con caché
- ✅ `useDeckQuery` - Para mazo individual con caché
- ✅ `useInvalidateDecks` - Para invalidar caché manualmente
- ✅ `mazos-comunidad` migrado a usar React Query

### Virtualización de Listas ✅
- ✅ `VirtualizedCardGrid` - Grid virtualizado para cartas
- ✅ `VirtualizedEditionGrid` - Grid virtualizado por ediciones
- ✅ Implementado en galería (`app/galeria/page.tsx`)

### Seguridad ✅
- ✅ Rate limiting implementado en APIs críticas
- ✅ Sistema de logging estructurado (`lib/logging/logger`)
- ✅ Validaciones en cliente y servidor
- ✅ Headers de seguridad (X-Content-Type-Options, X-Frame-Options)

### Code Splitting y Optimización de Componentes ✅
- ✅ `deck-management-panel.tsx` refactorizado (reducido de ~1826 a 691 líneas, ~62% de reducción)
- ✅ Funciones de exportación de imágenes extraídas a `lib/deck-builder/export-image-utils.ts`
- ✅ Componente `ExportImageModal` creado con lazy loading
- ✅ Componente `LoadDeckDialog` creado con lazy loading
- ✅ Componente `DeckCardsList` creado para lista de cartas
- ✅ Hook `useMobilePanelDrag` creado para lógica de arrastre móvil
- ✅ Función `getCardBackgroundPositionY` movida a `utils.ts`
- ✅ Mejora significativa en mantenibilidad y organización del código

---

**Última actualización**: Diciembre 2024  
**Versión del documento**: 2.1 (Code Splitting completado)
