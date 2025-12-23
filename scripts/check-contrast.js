/**
 * Script para verificar el contraste de colores del tema
 * 
 * Este script lee los colores definidos en globals.css y verifica
 * las combinaciones de contraste según WCAG 2.1 AA/AAA.
 * 
 * Uso: node scripts/check-contrast.js
 */

const fs = require('fs');
const path = require('path');

// Función para convertir OKLCH a RGB
// OKLCH: oklch(lightness chroma hue)
function oklchToRgb(l, c, h) {
  // Conversión simplificada OKLCH -> RGB
  // Nota: Esta es una aproximación. Para precisión completa, usar una librería como 'culori'
  // Por ahora, usamos una conversión básica basada en la luminancia
  
  // Si chroma es 0, es escala de grises
  if (c === 0) {
    const gray = Math.round(l * 255);
    return { r: gray, g: gray, b: gray };
  }
  
  // Conversión aproximada (simplificada)
  // En producción, usar una librería como 'culori' para precisión
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  
  // Conversión aproximada LCH -> RGB
  // Esto es una simplificación - para precisión usar 'culori'
  const r = Math.max(0, Math.min(255, Math.round((l + a * 0.5) * 255)));
  const g = Math.max(0, Math.min(255, Math.round((l - a * 0.3 - b * 0.3) * 255)));
  const bVal = Math.max(0, Math.min(255, Math.round((l + b * 0.5) * 255)));
  
  return { r, g: g, b: bVal };
}

// Función para calcular luminancia relativa (0-1)
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(val => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Función para calcular ratio de contraste
function getContrastRatio(color1, color2) {
  const l1 = getLuminance(color1.r, color1.g, color1.b);
  const l2 = getLuminance(color2.r, color2.g, color2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Función para parsear OKLCH
function parseOklch(oklchString) {
  // Formato: oklch(0.99 0 0) o oklch(0.577 0.245 27.325)
  const match = oklchString.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
  if (!match) {
    // Intentar con formato con opacidad: oklch(1 0 0 / 12%)
    const matchWithAlpha = oklchString.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\/\s*([\d.]+)%\)/);
    if (matchWithAlpha) {
      return {
        l: parseFloat(matchWithAlpha[1]),
        c: parseFloat(matchWithAlpha[2]),
        h: parseFloat(matchWithAlpha[3]),
        alpha: parseFloat(matchWithAlpha[4]) / 100
      };
    }
    return null;
  }
  return {
    l: parseFloat(match[1]),
    c: parseFloat(match[2]),
    h: parseFloat(match[3]),
    alpha: 1
  };
}

// Función para verificar si cumple WCAG
function checkWCAG(ratio, isLargeText = false) {
  const aa = isLargeText ? 3 : 4.5;
  const aaa = isLargeText ? 4.5 : 7;
  
  return {
    aa: ratio >= aa,
    aaa: ratio >= aaa,
    ratio: ratio.toFixed(2)
  };
}

// Leer globals.css
const globalsPath = path.join(__dirname, '../app/globals.css');
const cssContent = fs.readFileSync(globalsPath, 'utf-8');

// Extraer colores de :root y .dark
const rootColors = {};
const darkColors = {};

// Parsear :root
const rootMatch = cssContent.match(/:root\s*\{([^}]+)\}/);
if (rootMatch) {
  rootMatch[1].split(';').forEach(line => {
    const match = line.match(/--([^:]+):\s*(.+)/);
    if (match) {
      const [, name, value] = match;
      rootColors[name.trim()] = value.trim();
    }
  });
}

// Parsear .dark
const darkMatch = cssContent.match(/\.dark\s*\{([^}]+)\}/);
if (darkMatch) {
  darkMatch[1].split(';').forEach(line => {
    const match = line.match(/--([^:]+):\s*(.+)/);
    if (match) {
      const [, name, value] = match;
      darkColors[name.trim()] = value.trim();
    }
  });
}

// Combinaciones críticas a verificar
const criticalCombinations = [
  // Modo claro
  { foreground: 'foreground', background: 'background', mode: 'light', description: 'Texto principal sobre fondo' },
  { foreground: 'card-foreground', background: 'card', mode: 'light', description: 'Texto en cards' },
  { foreground: 'muted-foreground', background: 'muted', mode: 'light', description: 'Texto muted' },
  { foreground: 'primary-foreground', background: 'primary', mode: 'light', description: 'Botón primario' },
  { foreground: 'secondary-foreground', background: 'secondary', mode: 'light', description: 'Botón secundario' },
  { foreground: 'accent-foreground', background: 'accent', mode: 'light', description: 'Botón accent' },
  { foreground: 'popover-foreground', background: 'popover', mode: 'light', description: 'Texto en popover' },
  
  // Modo oscuro
  { foreground: 'foreground', background: 'background', mode: 'dark', description: 'Texto principal sobre fondo' },
  { foreground: 'card-foreground', background: 'card', mode: 'dark', description: 'Texto en cards' },
  { foreground: 'muted-foreground', background: 'muted', mode: 'dark', description: 'Texto muted' },
  { foreground: 'primary-foreground', background: 'primary', mode: 'dark', description: 'Botón primario' },
  { foreground: 'secondary-foreground', background: 'secondary', mode: 'dark', description: 'Botón secundario' },
  { foreground: 'accent-foreground', background: 'accent', mode: 'dark', description: 'Botón accent' },
  { foreground: 'popover-foreground', background: 'popover', mode: 'dark', description: 'Texto en popover' },
];

console.log('🎨 Auditoría de Contraste de Colores - CartaTech\n');
console.log('='.repeat(60));

let totalIssues = 0;
let totalWarnings = 0;

criticalCombinations.forEach(({ foreground, background, mode, description }) => {
  const colors = mode === 'light' ? rootColors : darkColors;
  const fgValue = colors[foreground];
  const bgValue = colors[background];
  
  if (!fgValue || !bgValue) {
    console.log(`\n⚠️  ${mode.toUpperCase()}: ${description}`);
    console.log(`   No se encontraron colores para ${foreground} o ${background}`);
    return;
  }
  
  const fgOklch = parseOklch(fgValue);
  const bgOklch = parseOklch(bgValue);
  
  if (!fgOklch || !bgOklch) {
    console.log(`\n⚠️  ${mode.toUpperCase()}: ${description}`);
    console.log(`   Error al parsear colores: ${fgValue} / ${bgValue}`);
    return;
  }
  
  // Convertir a RGB (aproximación)
  const fgRgb = oklchToRgb(fgOklch.l, fgOklch.c, fgOklch.h);
  const bgRgb = oklchToRgb(bgOklch.l, bgOklch.c, bgOklch.h);
  
  const ratio = getContrastRatio(fgRgb, bgRgb);
  const wcag = checkWCAG(ratio);
  
  const status = wcag.aa ? '✅' : '❌';
  const warning = !wcag.aaa && wcag.aa ? '⚠️' : '';
  
  if (!wcag.aa) totalIssues++;
  if (!wcag.aaa && wcag.aa) totalWarnings++;
  
  console.log(`\n${status} ${warning} ${mode.toUpperCase()}: ${description}`);
  console.log(`   Ratio: ${wcag.ratio}:1`);
  console.log(`   WCAG AA: ${wcag.aa ? '✅ Cumple' : '❌ No cumple'}`);
  console.log(`   WCAG AAA: ${wcag.aaa ? '✅ Cumple' : '⚠️  No cumple'}`);
  console.log(`   Colores: ${fgValue} / ${bgValue}`);
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Resumen:`);
console.log(`   ❌ Problemas críticos (no cumple AA): ${totalIssues}`);
console.log(`   ⚠️  Advertencias (no cumple AAA): ${totalWarnings}`);

if (totalIssues === 0 && totalWarnings === 0) {
  console.log(`\n🎉 ¡Excelente! Todos los colores cumplen WCAG AAA.`);
} else if (totalIssues === 0) {
  console.log(`\n✅ Todos los colores cumplen WCAG AA (mínimo requerido).`);
  console.log(`   Considera mejorar el contraste para cumplir AAA.`);
} else {
  console.log(`\n⚠️  Hay problemas que deben corregirse para cumplir WCAG AA.`);
  console.log(`   Revisa las combinaciones marcadas con ❌ arriba.`);
}

console.log('\n💡 Nota: Este script usa una conversión aproximada de OKLCH a RGB.');
console.log('   Para verificación precisa, usa herramientas como Lighthouse o WebAIM Contrast Checker.\n');

