# Guía Paso a Paso: Configurar Named Transformations en Cloudinary

## 📋 Resumen

Vas a crear 3 "Upload Presets" que funcionan como transformaciones con nombre. Estos presets permitirán reutilizar las mismas transformaciones sin generar nuevas cada vez, reduciendo el consumo de cuota.

## 🎯 Los 3 Presets que Necesitas Crear

1. **`t_card_mobile`**: `w_150,q_auto,f_webp`
2. **`t_card_tablet`**: `w_200,q_auto,f_webp`
3. **`t_card_desktop`**: `w_250,q_auto,f_webp`

---

## 📝 Paso 1: Configurar `t_card_mobile`

### 1.1. General (Ya estás aquí)

En la sección **"General"** que estás viendo:

1. **Upload preset name**: Ya tienes `t_card_mobile` ✅
2. **Signing mode**: Déjalo en `Signed` (está bien así)
3. **Asset folder**: Puedes dejarlo vacío o poner `card-images` (opcional)
4. **Overwrite assets**: Déjalo en ON (está bien)
5. **Generated public ID**: Déjalo en "Auto-generate" (está bien)
6. **Generated display name**: Déjalo en "Use the filename" (está bien)

**NO hagas clic en "Save" todavía.** Primero necesitas configurar las transformaciones.

### 1.2. Ir a la Sección "Transform"

1. En el **menú lateral izquierdo**, busca y haz clic en **"Transform"**
2. Verás una sección con opciones de transformación

### 1.3. Configurar Transformaciones

En la sección **"Transform"**, busca estas opciones:

#### A. Width (Ancho)
- Busca el campo **"Width"** o **"Resize"** → **"Width"**
- Ingresa: **`150`**
- Esto aplicará `w_150` (ancho de 150 píxeles)

#### B. Quality (Calidad)
- Busca el campo **"Quality"** o **"Quality mode"**
- Selecciona: **`Auto`** o **`q_auto`**
- Esto aplicará `q_auto` (calidad automática optimizada)

#### C. Format (Formato)
- Busca el campo **"Format"** o **"Format conversion"**
- Selecciona: **`WebP`** o **`f_webp`**
- Esto aplicará `f_webp` (formato WebP)

**Nota:** Si no encuentras estos campos exactos, busca:
- **"Incoming transformation"** o **"Eager transformation"**
- O un campo de texto donde puedas escribir: `w_150,q_auto,f_webp`

### 1.4. Guardar el Preset

1. Haz clic en el botón **"Save"** (arriba a la derecha)
2. Verás un mensaje de confirmación
3. El preset `t_card_mobile` quedará creado ✅

---

## 📝 Paso 2: Configurar `t_card_tablet`

### 2.1. Crear Nuevo Preset

1. En el menú lateral, vuelve a **"General"** (o busca "Upload presets" en el menú)
2. Haz clic en el botón **"Add upload preset"** o **"+"** (si aparece)
3. O busca un botón que diga **"New preset"** o **"Create preset"**

### 2.2. Configurar General

1. **Upload preset name**: Ingresa `t_card_tablet`
2. **Signing mode**: Déjalo en `Signed`
3. Los demás campos déjalos como en el anterior

### 2.3. Configurar Transform

1. Ve a la sección **"Transform"** (menú lateral)
2. Configura:
   - **Width**: `200` (en lugar de 150)
   - **Quality**: `Auto` o `q_auto`
   - **Format**: `WebP` o `f_webp`

### 2.4. Guardar

1. Haz clic en **"Save"**
2. El preset `t_card_tablet` quedará creado ✅

---

## 📝 Paso 3: Configurar `t_card_desktop`

### 3.1. Crear Nuevo Preset

1. Crea otro preset nuevo (botón "Add upload preset" o "+")

### 3.2. Configurar General

1. **Upload preset name**: Ingresa `t_card_desktop`
2. **Signing mode**: `Signed`
3. Los demás campos como antes

### 3.3. Configurar Transform

1. Ve a **"Transform"**
2. Configura:
   - **Width**: `250` (en lugar de 200)
   - **Quality**: `Auto` o `q_auto`
   - **Format**: `WebP` o `f_webp`

### 3.4. Guardar

1. Haz clic en **"Save"**
2. El preset `t_card_desktop` quedará creado ✅

---

## 🔍 Si No Encuentras los Campos de Transformación

### Opción A: Campo de Texto "Incoming Transformation"

Si ves un campo llamado **"Incoming transformation"** o **"Eager transformation"**:

1. Escribe directamente: `w_150,q_auto,f_webp` (para mobile)
2. O: `w_200,q_auto,f_webp` (para tablet)
3. O: `w_250,q_auto,f_webp` (para desktop)

### Opción B: Usar "Eager Transformations"

1. Busca la sección **"Eager transformations"** o **"Eager"**
2. Haz clic en **"Add eager transformation"**
3. Escribe: `w_150,q_auto,f_webp` (para mobile)
4. Repite para los otros tamaños

### Opción C: Usar la API Directamente

Si no encuentras las opciones en la UI, puedes crear los presets usando la API de Cloudinary (más avanzado, pero funciona).

---

## ✅ Paso 4: Verificar que los Presets Están Creados

1. Ve a **Settings** → **Upload presets** (o busca "Upload presets" en el menú)
2. Deberías ver tus 3 presets:
   - `t_card_mobile`
   - `t_card_tablet`
   - `t_card_desktop`

---

## 🔧 Paso 5: Activar en el Código

Una vez que tengas los 3 presets creados:

1. Abre el archivo: `cartatech/lib/deck-builder/cloudinary-utils.ts`
2. Busca la línea:
   ```typescript
   const USE_NAMED_TRANSFORMATIONS = false;
   ```
3. Cámbiala a:
   ```typescript
   const USE_NAMED_TRANSFORMATIONS = true;
   ```
4. Guarda el archivo

---

## 🧪 Paso 6: Probar que Funciona

1. Recarga tu aplicación
2. Abre la consola del navegador (F12)
3. Ve a la pestaña **Network** (Red)
4. Filtra por "cloudinary"
5. Carga una página con cartas
6. Verifica que las URLs de las imágenes incluyan:
   - `/t_card_mobile/` (en móvil)
   - `/t_card_tablet/` (en tablet)
   - `/t_card_desktop/` (en desktop)

**Ejemplo de URL esperada:**
```
https://res.cloudinary.com/dpbmbrekj/image/upload/t_card_mobile/v123456/card.webp
```

---

## ❓ Solución de Problemas

### Problema: No encuentro la sección "Transform"

**Solución:**
- Busca en el menú lateral: **"Optimize and Deliver"** → **"Transform"**
- O busca: **"Incoming transformation"** en la sección General
- O usa el campo de texto si aparece

### Problema: Los presets no aparecen después de guardar

**Solución:**
- Refresca la página
- Ve a Settings → Upload presets
- Verifica que estén listados

### Problema: Las transformaciones no se aplican

**Solución:**
- Verifica que `USE_NAMED_TRANSFORMATIONS = true` en el código
- Verifica que los nombres de los presets sean exactos: `t_card_mobile`, `t_card_tablet`, `t_card_desktop`
- Limpia el caché del navegador (Ctrl+Shift+R)

### Problema: No puedo crear más de un preset

**Solución:**
- Asegúrate de guardar el primero antes de crear el segundo
- Verifica que no haya un límite en tu plan gratuito (debería permitir múltiples presets)

---

## 📸 Capturas de Pantalla de Referencia

**Sección Transform debería verse así:**
- Width: 150 (o campo de texto con `w_150`)
- Quality: Auto (o `q_auto`)
- Format: WebP (o `f_webp`)

**O en formato texto:**
- Incoming transformation: `w_150,q_auto,f_webp`

---

## 🎯 Resumen Rápido

1. ✅ **General**: Nombre = `t_card_mobile`
2. ✅ **Transform**: `w_150,q_auto,f_webp` (o campos individuales)
3. ✅ **Save**
4. ✅ Repetir para `t_card_tablet` (w_200) y `t_card_desktop` (w_250)
5. ✅ Activar en código: `USE_NAMED_TRANSFORMATIONS = true`

---

**¿Necesitas ayuda con algún paso específico?** Dime en qué parte estás atascado y te ayudo más detalladamente.

