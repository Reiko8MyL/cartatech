# Guía de Auditoría de Contraste de Colores

## ¿Qué es la Auditoría de Contraste?

La auditoría de contraste verifica que el texto y los elementos interactivos tengan suficiente contraste con su fondo para ser legibles y accesibles. Esto es crítico para usuarios con discapacidad visual y cumple con los estándares WCAG 2.1.

## Estándares WCAG 2.1

### Niveles de Contraste Requeridos

- **WCAG AA (Mínimo recomendado)**:
  - Texto normal (menor a 18pt o 14pt bold): **4.5:1**
  - Texto grande (18pt+ o 14pt+ bold): **3:1**
  - Elementos no textuales (iconos, bordes): **3:1**

- **WCAG AAA (Recomendado)**:
  - Texto normal: **7:1**
  - Texto grande: **4.5:1**

### Cómo se Calcula el Ratio

El ratio de contraste se calcula usando la fórmula:
```
(L1 + 0.05) / (L2 + 0.05)
```
Donde:
- L1 = Luminancia relativa del color más claro
- L2 = Luminancia relativa del color más oscuro

## Herramientas para Auditoría

### 1. Lighthouse (Chrome DevTools) ⭐ RECOMENDADO

**Cómo usarlo:**
1. Abre Chrome DevTools (F12)
2. Ve a la pestaña "Lighthouse"
3. Selecciona "Accessibility"
4. Haz clic en "Generate report"
5. Revisa la sección "Contrast" en los resultados

**Ventajas:**
- Integrado en Chrome
- Detecta problemas automáticamente
- Muestra el ratio actual vs requerido
- Incluye sugerencias de corrección

### 2. WAVE (Web Accessibility Evaluation Tool)

**Cómo usarlo:**
- **Extensión de navegador**: Instala "WAVE" desde Chrome Web Store
- **Versión web**: https://wave.webaim.org/

**Ventajas:**
- Visualiza problemas directamente en la página
- Muestra contraste de cada elemento
- Gratis y fácil de usar

### 3. axe DevTools

**Cómo usarlo:**
1. Instala la extensión "axe DevTools" en Chrome
2. Abre DevTools → pestaña "axe DevTools"
3. Haz clic en "Scan ALL of my page"
4. Revisa la sección "Color Contrast"

**Ventajas:**
- Muy detallado
- Integrado en DevTools
- Muestra exactamente qué elementos fallan

### 4. Herramientas Online

- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
  - Permite verificar dos colores específicos
  - Muestra ratio y si cumple WCAG AA/AAA

- **Contrast Ratio**: https://contrast-ratio.com/
  - Interfaz visual simple
  - Muestra preview en tiempo real

### 5. Verificación Manual con DevTools

**Pasos:**
1. Inspecciona un elemento con texto
2. En DevTools, busca el color de `color` (texto) y `background-color`
3. Copia los valores (hex, rgb, oklch)
4. Usa una herramienta online para verificar el ratio

## Verificación Automática con Scripts

### Opción 1: Script de Node.js (PostCSS/PostCSS)

Podemos crear un script que verifique los colores del tema automáticamente:

```javascript
// scripts/check-contrast.js
// Este script verificaría las combinaciones de colores del tema
```

### Opción 2: Plugin de ESLint

Existe `eslint-plugin-jsx-a11y` que puede detectar algunos problemas de contraste en JSX.

### Opción 3: Test Automatizado con Playwright

Podemos crear tests E2E que verifiquen contraste usando la API de accesibilidad.

## Combinaciones de Colores a Verificar

Basado en tu `globals.css`, estas son las combinaciones críticas:

### Modo Claro (Light Mode)
1. **Texto principal**:
   - `--foreground` (oklch(0.145 0 0)) sobre `--background` (oklch(0.99 0 0))
   - Ratio esperado: ~15:1 ✅ (muy alto, excelente)

2. **Texto en cards**:
   - `--card-foreground` (oklch(0.145 0 0)) sobre `--card` (oklch(0.96 0 0))
   - Ratio esperado: ~14:1 ✅

3. **Texto muted**:
   - `--muted-foreground` (oklch(0.45 0 0)) sobre `--muted` (oklch(0.92 0 0))
   - Ratio esperado: ~2.5:1 ⚠️ (puede fallar WCAG AA)

4. **Botones primarios**:
   - `--primary-foreground` (oklch(0.985 0 0)) sobre `--primary` (oklch(0.205 0 0))
   - Ratio esperado: ~12:1 ✅

5. **Botones secundarios**:
   - `--secondary-foreground` (oklch(0.205 0 0)) sobre `--secondary` (oklch(0.94 0 0))
   - Ratio esperado: ~12:1 ✅

6. **Texto destructivo**:
   - `--destructive` (oklch(0.577 0.245 27.325)) sobre `--background`
   - Necesita verificación específica

### Modo Oscuro (Dark Mode)
1. **Texto principal**:
   - `--foreground` (oklch(0.98 0 0)) sobre `--background` (oklch(0.15 0 0))
   - Ratio esperado: ~15:1 ✅

2. **Texto muted**:
   - `--muted-foreground` (oklch(0.65 0 0)) sobre `--muted` (oklch(0.25 0 0))
   - Ratio esperado: ~3.5:1 ⚠️ (cerca del límite)

## Plan de Acción

### Paso 1: Auditoría Inicial con Lighthouse
1. Ejecutar Lighthouse en las páginas principales:
   - `/` (Home)
   - `/deck-builder`
   - `/mazos-comunidad`
   - `/galeria`
   - `/mi-perfil`

2. Documentar todos los problemas encontrados

### Paso 2: Verificar Combinaciones del Tema
1. Usar WebAIM Contrast Checker para verificar cada combinación
2. Crear una tabla con resultados
3. Identificar combinaciones que fallan

### Paso 3: Corregir Problemas
1. Ajustar colores que no cumplan WCAG AA
2. Priorizar:
   - Texto principal (más crítico)
   - Botones y elementos interactivos
   - Texto muted (menos crítico, pero importante)

### Paso 4: Verificación Final
1. Re-ejecutar Lighthouse
2. Verificar que todos los problemas estén resueltos
3. Documentar cambios realizados

## Ejemplo de Corrección

Si encontramos que `--muted-foreground` sobre `--muted` no cumple:

**Antes:**
```css
--muted-foreground: oklch(0.45 0 0);  /* Ratio: 2.5:1 ❌ */
--muted: oklch(0.92 0 0);
```

**Después:**
```css
--muted-foreground: oklch(0.35 0 0);  /* Ratio: 4.5:1 ✅ */
--muted: oklch(0.92 0 0);
```

## Herramientas Adicionales

### Para Desarrolladores
- **Chrome DevTools Color Picker**: Permite ver valores de contraste en tiempo real
- **Accessibility Insights**: Extensión de Microsoft con auditoría completa

### Para Diseñadores
- **Stark**: Plugin para Figma/Sketch que verifica contraste
- **Contrast**: App macOS para verificar contraste

## Recursos

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/?versions=2.1#contrast-minimum)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Contrast Ratio Calculator](https://contrast-ratio.com/)
- [MDN: Color Contrast](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Understanding_WCAG/Perceivable/Color_contrast)

