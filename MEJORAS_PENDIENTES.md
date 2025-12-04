# 🚀 Plan de Mejoras - CartaTech

## 📊 Resumen Ejecutivo

Este documento detalla los siguientes pasos para mejorar CartaTech, organizados por prioridad y categoría. El sitio está en producción y funcionando, por lo que las mejoras deben implementarse cuidadosamente sin romper funcionalidades existentes.

---

## 🎯 FASE 1: Optimizaciones Críticas (Alta Prioridad)

### 1.1 SEO y Metadatos Mejorados

**Estado Actual:** ✅ Sitemap y robots.txt implementados  
**Mejoras Necesarias:**

- [ ] **Metadatos dinámicos por página**
  - Agregar `metadata` export en cada página con:
    - Título descriptivo único
    - Descripción meta (150-160 caracteres)
    - Open Graph tags para redes sociales
    - Twitter Cards
    - Canonical URLs
  
- [ ] **Schema.org estructurado**
  - Implementar JSON-LD para:
    - Mazos (Product/ItemList)
    - Usuarios (Person)
    - Comentarios (Comment)
    - Breadcrumbs (BreadcrumbList)
  
- [ ] **Corregir URL base en sitemap.ts**
  - Cambiar `cartatech.com` a `cartatech.cl` en línea 3

**Archivos a modificar:**
- `app/sitemap.ts` (línea 3)
- Cada página en `app/**/page.tsx` (agregar `metadata` export)

---

### 1.2 Performance y Rendimiento

**Estado Actual:** ⚠️ Componentes grandes sin optimización  
**Mejoras Necesarias:**

- [ ] **Lazy loading de componentes pesados**
  - `deck-management-panel.tsx` (2093 líneas) → Dividir en subcomponentes
  - Cargar componentes de admin solo cuando se necesiten
  - Usar `dynamic()` de Next.js para imports condicionales

- [ ] **Optimización de imágenes**
  - Verificar que todas las imágenes usen formato WebP
  - Agregar `priority` solo a imágenes críticas (above-the-fold)
  - Implementar `loading="lazy"` en imágenes fuera del viewport
  - Usar `sizes` attribute en imágenes responsive

- [ ] **Caché de consultas frecuentes**
  - Implementar React Query o SWR para:
    - Lista de cartas (caché de 5 minutos)
    - Mazos públicos (caché de 1 minuto)
    - Metadata de cartas (caché de 10 minutos)

- [ ] **Code splitting**
  - Analizar bundle con `npm run analyze`
  - Dividir componentes grandes en chunks más pequeños
  - Lazy load rutas de admin

**Archivos a modificar:**
- `components/deck-builder/deck-management-panel.tsx`
- `app/layout.tsx` (optimizar imports)
- `lib/deck-builder/cards-db.ts` (agregar caché)

---

### 1.3 Analytics - Eventos Faltantes

**Estado Actual:** ✅ Google Analytics configurado, pero faltan eventos  
**Mejoras Necesarias:**

- [ ] **Implementar eventos faltantes** (ver `GOOGLE_ANALYTICS.md`)
  - `trackDeckCreated` - Al crear mazo
  - `trackDeckPublished` - Al publicar mazo
  - `trackDeckSaved` - Al guardar mazo
  - `trackDeckDeleted` - Al eliminar mazo
  - `trackDeckFavorited` - Al agregar a favoritos
  - `trackDeckCommented` - Al comentar mazo
  - `trackDeckVoted` - Al votar mazo
  - `trackDeckExported` - Al exportar mazo
  - `trackCardSearched` - Al buscar cartas
  - `trackCardFiltered` - Al filtrar cartas
  - `trackCardAddedToDeck` - Al agregar carta al mazo

**Archivos a modificar:**
- `lib/analytics/events.ts` (agregar funciones)
- Componentes que realizan estas acciones (agregar tracking)

---

## 🔧 FASE 2: Mejoras de UX/UI (Media Prioridad)

### 2.1 Mejoras en Deck Builder

**Estado Actual:** ⚠️ Panel muy grande, algunas mejoras pendientes  
**Mejoras Necesarias:**

- [ ] **Badge de total de cartas**
  - Mostrar contador visual en la parte superior del panel
  - Actualizar en tiempo real al agregar/eliminar cartas

- [ ] **Icono de coste en lista de cartas**
  - Mostrar coste de cada carta en la lista
  - Usar colores para diferenciar costes (ej: verde=bajo, rojo=alto)

- [ ] **Búsqueda mejorada**
  - Búsqueda por nombre, tipo, raza, coste
  - Filtros avanzados con chips visuales
  - Historial de búsquedas recientes

- [ ] **Drag & Drop para ordenar cartas**
  - Permitir reordenar cartas en el mazo
  - Guardar orden personalizado

**Archivos a modificar:**
- `components/deck-builder/deck-management-panel.tsx`
- `components/deck-builder/cards-panel.tsx`
- `components/deck-builder/filters-panel.tsx`

---

### 2.2 Sistema de Compartir Mejorado

**Estado Actual:** ✅ Componente `social-share.tsx` existe  
**Mejoras Necesarias:**

- [ ] **Preview de compartir mejorado**
  - Generar imagen OG dinámica para cada mazo
  - Incluir estadísticas del mazo en preview
  - Usar Next.js Image Optimization API

- [ ] **Códigos de compartir**
  - Generar códigos cortos para compartir mazos
  - Redirección automática desde códigos cortos
  - Analytics de compartidos

**Archivos a crear/modificar:**
- `app/api/decks/[id]/share/route.ts` (nuevo)
- `components/sharing/social-share.tsx` (mejorar)

---

### 2.3 Paginación y Filtros

**Estado Actual:** ⚠️ Listas pueden ser muy largas  
**Mejoras Necesarias:**

- [ ] **Paginación en listas**
  - Mazos públicos (página de comunidad)
  - Mazos guardados (mis mazos)
  - Comentarios (si hay muchos)
  - Usuarios (panel admin)

- [ ] **Filtros avanzados**
  - Por formato (RE, RL, LI)
  - Por raza
  - Por fecha de creación
  - Por popularidad (likes, vistas)

**Archivos a modificar:**
- `app/mazos-comunidad/page.tsx`
- `app/mis-mazos/page.tsx`
- `app/api/decks/route.ts` (agregar paginación)

---

## 🎨 FASE 3: Funcionalidades Avanzadas (Baja Prioridad)

### 3.1 PWA (Progressive Web App)

**Estado Actual:** ❌ No implementado  
**Mejoras Necesarias:**

- [ ] **Manifest.json**
  - Crear `public/manifest.json`
  - Configurar iconos para diferentes tamaños
  - Colores de tema

- [ ] **Service Worker**
  - Implementar caché offline
  - Estrategia de caché para cartas
  - Notificaciones push (opcional)

- [ ] **Instalación**
  - Botón "Instalar app" en navbar
  - Prompt de instalación mejorado

**Archivos a crear:**
- `public/manifest.json`
- `public/sw.js` o usar `next-pwa`
- `app/manifest.ts` (Next.js 13+)

---

### 3.2 Sistema de Búsqueda Global

**Estado Actual:** ⚠️ Búsqueda limitada a componentes específicos  
**Mejoras Necesarias:**

- [ ] **Búsqueda unificada**
  - Buscar en mazos, cartas, usuarios
  - Resultados agrupados por tipo
  - Autocompletado inteligente

- [ ] **Búsqueda por voz** (opcional)
  - Usar Web Speech API
  - Búsqueda por nombre de carta hablado

**Archivos a crear:**
- `components/search/global-search.tsx`
- `app/api/search/route.ts`

---

### 3.3 Sistema de Notificaciones Push

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

### 3.4 Sistema de Seguimiento (Follow)

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

## 🔒 FASE 4: Seguridad y Robustez

### 4.1 Rate Limiting

**Estado Actual:** ⚠️ No implementado  
**Mejoras Necesarias:**

- [ ] **Rate limiting en APIs**
  - Usar `@upstash/ratelimit` o similar
  - Limitar requests por IP/usuario
  - Diferentes límites por endpoint

**Archivos a crear/modificar:**
- `lib/rate-limit.ts`
- Middleware para APIs críticas

---

### 4.2 Validación de Inputs Mejorada

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
- `lib/validation/sanitize.ts`
- APIs que reciben inputs de usuario

---

### 4.3 Logging y Monitoreo

**Estado Actual:** ⚠️ Solo console.log  
**Mejoras Necesarias:**

- [ ] **Sistema de logging estructurado**
  - Usar `pino` o `winston`
  - Logs de errores a servicio externo (Sentry, LogRocket)
  - Logs de acciones administrativas

**Archivos a crear/modificar:**
- `lib/logging/logger.ts`
- Integrar en APIs críticas

---

## ♿ FASE 5: Accesibilidad

### 5.1 Mejoras de Accesibilidad

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

### 6.1 Optimización Mobile

**Estado Actual:** ✅ Responsive básico  
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

### 7.1 Testing

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

Para medir el impacto de las mejoras:

- **Performance:**
  - Lighthouse Score > 90
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1

- **SEO:**
  - Mejora en rankings de búsqueda
  - Aumento en tráfico orgánico
  - Mejor CTR en resultados de búsqueda

- **UX:**
  - Tasa de rebote < 50%
  - Tiempo en sitio > 2 minutos
  - Eventos de conversión (crear mazo, publicar)

- **Analytics:**
  - Todos los eventos críticos trackeados
  - Funnels de conversión configurados

---

## 🎯 Priorización Recomendada

### Sprint 1 (2 semanas)
1. Corregir URL en sitemap.ts
2. Agregar metadatos dinámicos a páginas principales
3. Implementar eventos de Analytics faltantes
4. Optimizar imágenes críticas

### Sprint 2 (2 semanas)
5. Dividir deck-management-panel en componentes más pequeños
6. Implementar paginación en listas principales
7. Agregar badge de total de cartas
8. Mejorar sistema de compartir

### Sprint 3 (2 semanas)
9. Implementar PWA básico
10. Sistema de búsqueda global
11. Rate limiting en APIs críticas
12. Mejoras de accesibilidad

### Sprint 4+ (Ongoing)
13. Sistema de seguimiento
14. Notificaciones push
15. Testing completo
16. Otras mejoras según feedback de usuarios

---

## 📝 Notas Importantes

- **Nunca romper funcionalidades existentes** - Todas las mejoras deben ser incrementales
- **Probar localmente antes de deploy** - Usar `npm run build` para verificar
- **Monitorear métricas después de cada cambio** - Usar Vercel Analytics y Google Analytics
- **Obtener feedback de usuarios** - Las mejoras deben resolver problemas reales

---

## 🔗 Referencias

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [PWA Checklist](https://web.dev/pwa-checklist/)

