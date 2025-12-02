# 📊 Cómo Configurar Web Analytics en Vercel - CartaTech

Esta guía te enseñará cómo configurar y ver las métricas de tu sitio web usando Vercel Analytics y Speed Insights.

---

## 🎯 ¿Qué es Vercel Analytics?

Vercel Analytics es un servicio de analytics **privacy-first** que te permite ver:
- **Visitas**: Cuántas personas visitan tu sitio
- **Páginas más visitadas**: Qué páginas son más populares
- **Referrers**: De dónde vienen tus visitantes
- **Dispositivos**: Desktop, móvil, tablet
- **Países**: De dónde son tus visitantes
- **Eventos personalizados**: Acciones específicas de los usuarios

**Ventajas:**
- ✅ No requiere cookies
- ✅ Cumple con GDPR y privacidad
- ✅ No afecta el rendimiento
- ✅ Integrado directamente con Vercel

---

## 🚀 Paso 1: Habilitar Analytics en el Dashboard de Vercel

### Opción A: Habilitar desde el Dashboard (Recomendado)

1. **Ve a tu proyecto en Vercel:**
   - Abre https://vercel.com/dashboard
   - Selecciona tu proyecto **"cartatech"**

2. **Ve a la pestaña "Analytics":**
   - En el menú lateral, busca y haz clic en **"Analytics"**
   - Si no lo ves, puede estar en **"Settings"** → **"Analytics"**

3. **Habilita Analytics:**
   - Verás un botón o toggle para **"Enable Analytics"**
   - Haz clic en **"Enable"** o activa el toggle
   - Vercel puede pedirte confirmar (es gratis para proyectos personales)

4. **Espera la activación:**
   - Puede tardar unos minutos en activarse
   - Una vez activado, verás un mensaje de confirmación

### Opción B: Habilitar desde Settings

1. **Ve a Settings:**
   - En el dashboard de tu proyecto
   - Haz clic en **"Settings"** en el menú superior

2. **Busca "Analytics":**
   - En el menú lateral de Settings
   - Haz clic en **"Analytics"**

3. **Habilita:**
   - Activa el toggle de **"Web Analytics"**
   - Guarda los cambios

---

## ⚡ Paso 2: Verificar que Analytics está en tu Código

Ya tienes Analytics configurado en tu código. Verifica que esté así:

### En `app/layout.tsx`:

```typescript
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

// ... en el componente:
<Analytics />
<SpeedInsights />
```

**✅ Ya está configurado en tu proyecto**, así que solo necesitas habilitarlo en el dashboard.

---

## 📈 Paso 3: Ver los Datos de Analytics

### Acceder a Analytics:

1. **En el dashboard de Vercel:**
   - Ve a tu proyecto "cartatech"
   - Haz clic en **"Analytics"** en el menú lateral

2. **Verás varias secciones:**

#### **Overview (Resumen):**
- **Total Visits**: Total de visitas
- **Unique Visitors**: Visitantes únicos
- **Top Pages**: Páginas más visitadas
- **Top Referrers**: De dónde vienen los visitantes
- **Top Countries**: Países de origen
- **Top Devices**: Dispositivos usados

#### **Pages (Páginas):**
- Lista de todas las páginas visitadas
- Número de visitas por página
- Tiempo promedio en cada página

#### **Referrers (Referencias):**
- Google, Bing, enlaces directos, etc.
- De dónde vienen tus visitantes

#### **Countries (Países):**
- Distribución geográfica de visitantes
- Gráfico por país

#### **Devices (Dispositivos):**
- Desktop, Mobile, Tablet
- Porcentaje de cada uno

---

## 🔍 Paso 4: Speed Insights (Métricas de Rendimiento)

### ¿Qué es Speed Insights?

Speed Insights te muestra métricas de rendimiento reales de tus usuarios:
- **LCP (Largest Contentful Paint)**: Tiempo de carga del contenido principal
- **FID (First Input Delay)**: Tiempo de respuesta a la primera interacción
- **CLS (Cumulative Layout Shift)**: Estabilidad visual
- **FCP (First Contentful Paint)**: Tiempo hasta el primer contenido
- **TTFB (Time to First Byte)**: Tiempo de respuesta del servidor

### Habilitar Speed Insights:

1. **En el dashboard de Vercel:**
   - Ve a **"Analytics"** → **"Speed Insights"**
   - O en **"Settings"** → **"Speed Insights"**

2. **Habilita:**
   - Activa el toggle de **"Speed Insights"**
   - Guarda los cambios

3. **Verificar en código:**
   - Ya está agregado en tu `layout.tsx`:
   ```typescript
   <SpeedInsights />
   ```

### Ver Métricas de Speed Insights:

1. **En el dashboard:**
   - Ve a **"Analytics"** → **"Speed Insights"**
   - Verás gráficos con las métricas
   - Puedes filtrar por período (últimos 7 días, 30 días, etc.)

2. **Métricas importantes:**
   - **LCP < 2.5s**: Bueno ✅
   - **FID < 100ms**: Bueno ✅
   - **CLS < 0.1**: Bueno ✅

---

## 🎨 Paso 5: Eventos Personalizados (Opcional)

Ya tienes eventos personalizados configurados en `lib/analytics/events.ts`:

- `trackDeckCreated`: Cuando se crea un mazo
- `trackDeckPublished`: Cuando se publica un mazo
- `trackDeckViewed`: Cuando se ve un mazo
- `trackDeckLiked`: Cuando se da like a un mazo
- `trackCardSearched`: Cuando se busca una carta
- `trackUserRegistered`: Cuando se registra un usuario
- `trackUserLoggedIn`: Cuando un usuario inicia sesión

### Ver Eventos en Vercel Analytics:

1. **En el dashboard:**
   - Ve a **"Analytics"** → **"Events"**
   - Verás todos los eventos personalizados
   - Puedes filtrar por tipo de evento

2. **Usar eventos en tu código:**
   ```typescript
   import { trackDeckCreated } from "@/lib/analytics/events";
   
   // En tu componente:
   trackDeckCreated("Mi Mazo");
   ```

---

## 🔄 Paso 6: Desplegar los Cambios

Si acabas de agregar Speed Insights, necesitas desplegar:

1. **Commit los cambios:**
   ```bash
   git add .
   git commit -m "feat: agregar Speed Insights para métricas de rendimiento"
   git push origin main
   ```

2. **Espera el deployment:**
   - Vercel desplegará automáticamente
   - Espera 1-3 minutos

3. **Verifica:**
   - Ve al dashboard de Vercel
   - Verifica que el deployment esté "Ready"
   - Espera unos minutos para que los datos empiecen a aparecer

---

## ⏱️ Paso 7: Esperar los Datos

### Tiempo de Espera:

- **Analytics básicos**: Empiezan a aparecer inmediatamente después de habilitar
- **Speed Insights**: Puede tardar 24-48 horas en tener datos suficientes
- **Eventos personalizados**: Aparecen cuando los usuarios realizan acciones

### Primera Visita:

1. **Habilita Analytics en el dashboard**
2. **Despliega los cambios** (si agregaste Speed Insights)
3. **Visita tu sitio**: https://www.cartatech.cl/
4. **Navega por algunas páginas**
5. **Espera 5-10 minutos**
6. **Vuelve al dashboard de Vercel** → **"Analytics"**
7. **Deberías ver tus primeras visitas**

---

## 📊 Diferencia: Vercel Analytics vs Google Analytics

### Vercel Analytics:
- ✅ **Privacy-first**: No usa cookies
- ✅ **Rápido**: No afecta el rendimiento
- ✅ **Integrado**: Funciona automáticamente con Vercel
- ✅ **Gratis**: Para proyectos personales
- ⚠️ **Limitado**: Menos opciones que Google Analytics

### Google Analytics:
- ✅ **Completo**: Muchas opciones y reportes
- ✅ **Establecido**: Estándar de la industria
- ⚠️ **Cookies**: Requiere consentimiento GDPR
- ⚠️ **Rendimiento**: Puede afectar la velocidad
- ⚠️ **Complejo**: Más difícil de configurar

### Recomendación:

**Usa ambos:**
- **Vercel Analytics**: Para métricas rápidas y privacidad
- **Google Analytics**: Para análisis detallados (si lo necesitas)

Ya tienes ambos configurados en tu proyecto.

---

## 🎯 Checklist de Configuración

Sigue estos pasos para asegurarte de que todo está configurado:

- [ ] **Habilitar Analytics en Vercel Dashboard:**
  - [ ] Ir a proyecto → "Analytics"
  - [ ] Activar "Web Analytics"
  
- [ ] **Habilitar Speed Insights:**
  - [ ] Ir a "Analytics" → "Speed Insights"
  - [ ] Activar "Speed Insights"

- [ ] **Verificar código:**
  - [ ] `<Analytics />` está en `layout.tsx` ✅ (ya está)
  - [ ] `<SpeedInsights />` está en `layout.tsx` ✅ (ya está)

- [ ] **Desplegar cambios:**
  - [ ] `git add .`
  - [ ] `git commit -m "feat: configurar Analytics"`
  - [ ] `git push origin main`

- [ ] **Verificar en producción:**
  - [ ] Visitar https://www.cartatech.cl/
  - [ ] Navegar por algunas páginas
  - [ ] Esperar 5-10 minutos
  - [ ] Revisar Analytics en Vercel Dashboard

---

## 🔍 Verificar que Funciona

### Método 1: Revisar el Código Fuente

1. **Abre tu sitio**: https://www.cartatech.cl/
2. **Presiona F12** (abre DevTools)
3. **Ve a la pestaña "Network"**
4. **Recarga la página**
5. **Busca requests a:**
   - `vercel-insights.com` (Analytics)
   - `vercel.com/vitals` (Speed Insights)
6. **Si ves estos requests, está funcionando** ✅

### Método 2: Revisar el Dashboard

1. **Ve a Vercel Dashboard** → **"Analytics"**
2. **Si ves datos**, está funcionando ✅
3. **Si no ves datos:**
   - Espera unos minutos más
   - Verifica que Analytics esté habilitado
   - Verifica que hayas visitado el sitio

---

## 📈 Métricas Importantes a Monitorear

### Analytics:

1. **Total Visits**: ¿Cuántas personas visitan tu sitio?
2. **Top Pages**: ¿Qué páginas son más populares?
3. **Top Referrers**: ¿De dónde vienen tus visitantes?
4. **Top Countries**: ¿De qué países son tus usuarios?
5. **Top Devices**: ¿Móvil o desktop?

### Speed Insights:

1. **LCP (Largest Contentful Paint)**: 
   - Objetivo: < 2.5 segundos
   - Mide: Tiempo de carga del contenido principal

2. **FID (First Input Delay)**:
   - Objetivo: < 100 milisegundos
   - Mide: Tiempo de respuesta a clics

3. **CLS (Cumulative Layout Shift)**:
   - Objetivo: < 0.1
   - Mide: Estabilidad visual (evitar saltos)

---

## 🆘 Troubleshooting

### No veo datos en Analytics:

1. **Verifica que esté habilitado:**
   - Ve a Settings → Analytics
   - Asegúrate de que esté activado

2. **Espera unos minutos:**
   - Los datos pueden tardar en aparecer
   - Visita tu sitio varias veces

3. **Verifica el código:**
   - Asegúrate de que `<Analytics />` esté en `layout.tsx`
   - Verifica que el deployment esté "Ready"

4. **Revisa los logs:**
   - Ve a "Logs" en Vercel
   - Busca errores relacionados con Analytics

### Speed Insights no muestra datos:

1. **Espera 24-48 horas:**
   - Speed Insights necesita tiempo para recopilar datos
   - Necesita múltiples visitas para ser preciso

2. **Verifica que esté habilitado:**
   - Ve a Analytics → Speed Insights
   - Asegúrate de que esté activado

3. **Verifica el código:**
   - Asegúrate de que `<SpeedInsights />` esté en `layout.tsx`

### Los eventos personalizados no aparecen:

1. **Verifica que los estés llamando:**
   - Revisa que uses `trackDeckCreated()`, etc.
   - Verifica que no haya errores en la consola

2. **Espera unos minutos:**
   - Los eventos pueden tardar en aparecer

3. **Revisa la consola del navegador:**
   - Presiona F12 → Console
   - Busca errores relacionados con analytics

---

## 📚 Recursos Adicionales

- **Documentación de Vercel Analytics**: https://vercel.com/docs/analytics
- **Documentación de Speed Insights**: https://vercel.com/docs/speed-insights
- **Web Vitals**: https://web.dev/vitals/
- **Guía de Vercel**: Ver `COMO_USAR_VERCEL.md`

---

## ✅ Resumen Rápido

**Para habilitar Analytics:**

1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto "cartatech"
3. Ve a **"Analytics"** → Activa **"Web Analytics"**
4. Ve a **"Speed Insights"** → Activa **"Speed Insights"**
5. Despliega los cambios (si agregaste Speed Insights)
6. Visita tu sitio y espera unos minutos
7. Vuelve al dashboard para ver los datos

**Tu código ya está configurado** ✅, solo necesitas habilitarlo en el dashboard.

---

**¿Necesitas ayuda?** Si tienes problemas, revisa los logs en Vercel o comparte el error que ves. 🚀

