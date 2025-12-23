# Guía de Configuración de Google Analytics 4

Esta guía explica cómo configurar y usar Google Analytics 4 (GA4) en CartaTech.

## 📋 Tabla de Contenidos

1. [Configuración Inicial](#configuración-inicial)
2. [Variables de Entorno](#variables-de-entorno)
3. [Eventos Disponibles](#eventos-disponibles)
4. [Tracking Automático](#tracking-automático)
5. [Uso Manual de Eventos](#uso-manual-de-eventos)
6. [Verificación](#verificación)

## 🔧 Configuración Inicial

### Paso 1: Crear una Propiedad de Google Analytics 4

1. Ve a [Google Analytics](https://analytics.google.com/)
2. Inicia sesión con tu cuenta de Google
3. Crea una nueva propiedad o selecciona una existente
4. Selecciona **"Web"** como plataforma
5. Ingresa la URL de tu sitio: `https://www.cartatech.cl`
6. Completa la información de la propiedad

### Paso 2: Obtener el ID de Medición (Measurement ID)

1. En tu propiedad de GA4, ve a **Administración** (⚙️) → **Flujos de datos**
2. Haz clic en el flujo de datos web
3. Copia el **ID de medición** (formato: `G-XXXXXXXXXX`)

## 🔐 Variables de Entorno

Agrega el ID de medición a tus variables de entorno:

### En Vercel (Producción)

1. Ve a tu proyecto en [Vercel](https://vercel.com/)
2. Ve a **Settings** → **Environment Variables**
3. Agrega:
   - **Name**: `NEXT_PUBLIC_GA_ID`
   - **Value**: `G-XXXXXXXXXX` (tu ID de medición)
   - **Environment**: Production, Preview, Development
4. Guarda y redespliega

### En Local (.env.local)

Crea o actualiza el archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

**⚠️ Importante**: El prefijo `NEXT_PUBLIC_` es necesario para que la variable sea accesible en el cliente.

## 📊 Eventos Disponibles

### Eventos de Mazos

```typescript
import {
  trackDeckCreated,
  trackDeckPublished,
  trackDeckViewed,
  trackDeckLiked,
  trackDeckCopied,
  trackDeckSaved,
  trackDeckDeleted,
  trackDeckFavorited,
  trackDeckCommented,
  trackDeckVoted,
  trackDeckExported,
} from "@/lib/analytics/events";

// Ejemplo: Trackear cuando se crea un mazo
trackDeckCreated("Mi Mazo de PBX", "deck-id-123");

// Ejemplo: Trackear cuando se visualiza un mazo
trackDeckViewed("deck-id-123", "Mi Mazo de PBX");
```

### Eventos de Usuario

```typescript
import {
  trackUserRegistered,
  trackUserLoggedIn,
  trackUserLoggedOut,
} from "@/lib/analytics/events";

// Estos eventos se trackean automáticamente en el AuthContext
// No necesitas llamarlos manualmente
```

### Eventos de Búsqueda

```typescript
import {
  trackCardSearched,
  trackCardFiltered,
  trackCardAddedToDeck,
} from "@/lib/analytics/events";

// Ejemplo: Trackear búsqueda de cartas
trackCardSearched("Dragón", 15); // término y cantidad de resultados
```

## 🤖 Tracking Automático

### Pageviews

Los pageviews se trackean **automáticamente** cuando:
- El usuario navega entre páginas
- Se cambia la ruta en Next.js App Router
- Se incluyen parámetros de búsqueda en la URL

No necesitas hacer nada adicional, el componente `GoogleAnalyticsProvider` se encarga de esto.

### Eventos de Autenticación

Los eventos de login, registro y logout se trackean automáticamente en el `AuthContext`.

## 📝 Uso Manual de Eventos

### Evento Personalizado Simple

```typescript
import { event } from "@/lib/analytics/gtag";

event("custom_event_name", {
  parameter1: "value1",
  parameter2: 123,
  event_category: "Custom",
});
```

### Evento con Parámetros Avanzados

```typescript
import { event } from "@/lib/analytics/gtag";

event("deck_shared", {
  deck_id: "deck-123",
  deck_name: "Mi Mazo",
  share_method: "twitter", // o "facebook", "copy_link", etc.
  event_category: "Deck",
});
```

### Configurar Propiedades del Usuario

```typescript
import { setUserProperties, clearUserProperties } from "@/lib/analytics/gtag";

// Cuando el usuario inicia sesión
setUserProperties("user-id-123", {
  username: "johndoe",
  subscription_type: "premium",
});

// Cuando el usuario cierra sesión
clearUserProperties();
```

## ✅ Verificación

### Verificar que GA4 está Funcionando

1. **En Tiempo Real (Google Analytics)**:
   - Ve a tu propiedad de GA4
   - Ve a **Informes** → **Tiempo real**
   - Navega por tu sitio web
   - Deberías ver las visitas aparecer en tiempo real

2. **Usando Google Tag Assistant**:
   - Instala la extensión [Google Tag Assistant](https://tagassistant.google.com/)
   - Visita tu sitio web
   - La extensión mostrará si GA4 está configurado correctamente

3. **En la Consola del Navegador**:
   - Abre las herramientas de desarrollador (F12)
   - Ve a la pestaña **Network**
   - Filtra por "collect" o "google-analytics"
   - Deberías ver requests a `google-analytics.com/g/collect`

### Verificar Eventos Personalizados

1. En GA4, ve a **Informes** → **Eventos**
2. Busca tus eventos personalizados (ej: `deck_created`, `deck_viewed`)
3. Haz clic en un evento para ver detalles y parámetros

## 🎯 Mejores Prácticas

1. **No trackees información sensible**: Nunca envíes contraseñas, emails completos, o datos personales sensibles
2. **Usa nombres descriptivos**: Los nombres de eventos deben ser claros (ej: `deck_created` en lugar de `dc`)
3. **Agrupa eventos por categoría**: Usa `event_category` para organizar eventos relacionados
4. **Incluye contexto**: Agrega parámetros relevantes para análisis posterior
5. **Prueba en desarrollo**: Verifica que los eventos se envían correctamente antes de desplegar

## 🔍 Eventos Implementados Actualmente

### Automáticos
- ✅ Pageviews (todas las páginas)
- ✅ Login de usuario
- ✅ Registro de usuario
- ✅ Logout de usuario

### Manuales (ya implementados)
- ✅ Visualización de mazo (`trackDeckViewed`)
- ✅ Like a mazo (`trackDeckLiked`)
- ✅ Copiar mazo (`trackDeckCopied`)

### Disponibles para Implementar
- ⚠️ Crear mazo (`trackDeckCreated`)
- ⚠️ Publicar mazo (`trackDeckPublished`)
- ⚠️ Guardar mazo (`trackDeckSaved`)
- ⚠️ Eliminar mazo (`trackDeckDeleted`)
- ⚠️ Agregar a favoritos (`trackDeckFavorited`)
- ⚠️ Comentar mazo (`trackDeckCommented`)
- ⚠️ Votar mazo (`trackDeckVoted`)
- ⚠️ Exportar mazo (`trackDeckExported`)
- ⚠️ Buscar cartas (`trackCardSearched`)
- ⚠️ Filtrar cartas (`trackCardFiltered`)
- ⚠️ Agregar carta al mazo (`trackCardAddedToDeck`)

## 📚 Recursos Adicionales

- [Documentación de Google Analytics 4](https://developers.google.com/analytics/devguides/collection/ga4)
- [Guía de Eventos de GA4](https://developers.google.com/analytics/devguides/collection/ga4/events)
- [Next.js Third-Party Scripts](https://nextjs.org/docs/app/building-your-application/optimizing/third-party-libraries)

## 🐛 Solución de Problemas

### Los eventos no aparecen en GA4

1. Verifica que `NEXT_PUBLIC_GA_ID` esté configurado correctamente
2. Verifica que el ID tenga el formato correcto (`G-XXXXXXXXXX`)
3. Espera 24-48 horas para que los datos aparezcan en informes estándar (tiempo real funciona inmediatamente)
4. Verifica que no haya bloqueadores de anuncios activos

### Los pageviews no se trackean

1. Verifica que `GoogleAnalyticsProvider` esté en el `layout.tsx`
2. Verifica que `GoogleAnalytics` de `@next/third-parties/google` esté configurado
3. Verifica la consola del navegador por errores

### Los eventos personalizados no funcionan

1. Verifica que `isGAEnabled()` retorne `true`
2. Verifica que `window.gtag` esté disponible
3. Revisa la consola del navegador por errores de JavaScript



































