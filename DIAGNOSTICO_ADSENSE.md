# 🔍 Diagnóstico: Meta Tag de AdSense No Aparece

Si no ves el meta tag `<meta name="google-adsense-account" content="ca-pub-...">` en tu sitio, sigue estos pasos:

---

## ✅ Paso 1: Verificar Variable en Vercel

1. **Ve a Vercel:** https://vercel.com
2. **Selecciona tu proyecto** "cartatech"
3. **Ve a Settings** → **Environment Variables**
4. **Busca la variable:** `NEXT_PUBLIC_ADSENSE_ID`
5. **Verifica que:**
   - ✅ Existe la variable
   - ✅ El valor es: `ca-pub-6173100401369238` (sin espacios)
   - ✅ Tiene ✅ marcado en **Production**

**Si NO existe:**
- Agrégalo siguiendo los pasos de `GUIA_MONETIZACION.md`

**Si existe pero está mal:**
- Haz clic en los 3 puntos (⋯) → **Edit**
- Corrige el valor
- Guarda

---

## ✅ Paso 2: Forzar Redeploy

Después de agregar o modificar una variable de entorno, **Vercel necesita hacer un nuevo deploy**:

1. **Ve a Vercel** → Tu proyecto → **Deployments**
2. **Haz clic en los 3 puntos** (⋯) del último deploy
3. **Selecciona "Redeploy"**
4. **Espera 2-3 minutos** a que termine el deploy

**O simplemente:**
- Haz un cambio pequeño en cualquier archivo
- Haz commit y push a GitHub
- Vercel desplegará automáticamente

---

## ✅ Paso 3: Verificar en el Sitio

Después del deploy:

1. **Espera 1-2 minutos** adicionales (para que se propague)
2. **Visita:** https://www.cartatech.cl
3. **Haz un Hard Refresh:**
   - Windows/Linux: `Ctrl + Shift + R` o `Ctrl + F5`
   - Mac: `Cmd + Shift + R`
4. **Verifica el código fuente:**
   - Haz clic derecho → **"Ver origen de página"** (o `Ctrl+U`)
   - Busca: `google-adsense-account`
   - Deberías ver: `<meta name="google-adsense-account" content="ca-pub-6173100401369238">`

---

## ✅ Paso 4: Verificar con Herramientas de Desarrollador

Si aún no aparece:

1. **Abre las herramientas de desarrollador:** `F12`
2. **Ve a la pestaña "Console"**
3. **Busca errores** relacionados con AdSense o variables de entorno
4. **Ve a la pestaña "Network"**
5. **Recarga la página** (`Ctrl+R`)
6. **Busca peticiones a:** `googlesyndication.com`
   - Si aparecen, AdSense está intentando cargar (pero puede que el meta tag no esté visible)

---

## ✅ Paso 5: Verificar en el Código

El meta tag ahora se agrega de dos formas:

1. **En el objeto `metadata`** (recomendado para Next.js 13+)
2. **En el `<head>`** (fallback)

**Ubicación del código:**
- Archivo: `app/layout.tsx`
- Línea ~72: En el objeto `metadata.other`
- Línea ~88: En el `<head>` (si la primera no funciona)

---

## 🆘 Solución de Problemas Comunes

### Problema 1: Variable no se carga

**Síntoma:** El meta tag no aparece aunque la variable esté en Vercel

**Solución:**
1. Verifica que la variable tenga ✅ en **Production**
2. Haz un **Redeploy** en Vercel
3. Espera 3-5 minutos
4. Haz Hard Refresh (`Ctrl+Shift+R`)

### Problema 2: Variable tiene espacios extra

**Síntoma:** El valor tiene espacios al inicio o final

**Solución:**
- Edita la variable en Vercel
- Asegúrate de que el valor sea exactamente: `ca-pub-6173100401369238`
- Sin espacios antes o después

### Problema 3: Cache del navegador

**Síntoma:** Cambiaste la variable pero no ves cambios

**Solución:**
1. Haz **Hard Refresh:** `Ctrl+Shift+R`
2. O abre en **modo incógnito:** `Ctrl+Shift+N`
3. O limpia la caché del navegador

### Problema 4: Variable en entorno incorrecto

**Síntoma:** La variable está solo en Development, no en Production

**Solución:**
1. Edita la variable en Vercel
2. Asegúrate de que tenga ✅ en **Production**
3. Haz un Redeploy

---

## 📝 Verificación Final

Una vez que veas el meta tag:

1. **Copia la URL completa** de tu sitio: `https://www.cartatech.cl`
2. **Ve a AdSense:** https://www.google.com/adsense/
3. **Haz clic en "Verificar sitio"** o "Verify site"
4. **Espera 5-10 minutos**
5. **Recarga la página de AdSense**
6. **Deberías ver:** "Sitio verificado" o "Site verified"

---

## 🎯 Checklist Rápido

- [ ] Variable `NEXT_PUBLIC_ADSENSE_ID` existe en Vercel
- [ ] Valor correcto: `ca-pub-6173100401369238`
- [ ] Variable marcada para **Production**
- [ ] Redeploy realizado en Vercel
- [ ] Esperado 3-5 minutos después del deploy
- [ ] Hard Refresh realizado (`Ctrl+Shift+R`)
- [ ] Meta tag visible en "Ver origen de página"
- [ ] Verificación completada en AdSense

---

## 💡 Nota Importante

**El meta tag puede no aparecer inmediatamente** después de configurar la variable. Esto es normal porque:

1. Vercel necesita hacer un nuevo build
2. El deploy puede tardar 2-3 minutos
3. La propagación de cambios puede tardar 1-2 minutos adicionales
4. El navegador puede tener caché

**Tiempo total estimado:** 5-10 minutos desde que agregas la variable hasta que aparece el meta tag.

