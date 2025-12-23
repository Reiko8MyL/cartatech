/**
 * Utilidades para generar blur placeholders para imágenes
 * Mejora la percepción de velocidad y reduce CLS
 */

/**
 * Genera un blur placeholder base64 para imágenes
 * Usa una imagen SVG pequeña (1x1px) con el color promedio de la imagen
 * @param color Color promedio en formato hex (ej: "#3b82f6")
 * @returns Data URL base64 del blur placeholder
 */
export function generateBlurPlaceholder(color: string = "#1f2937"): string {
  // Crear un SVG de 10x10px con el color especificado
  // Next.js requiere un mínimo de 10x10px para blur placeholders
  const svg = `
    <svg width="10" height="10" xmlns="http://www.w3.org/2000/svg">
      <rect width="10" height="10" fill="${color}"/>
    </svg>
  `.trim()

  // Convertir a base64
  const base64 = Buffer.from(svg).toString("base64")
  return `data:image/svg+xml;base64,${base64}`
}

/**
 * Genera un blur placeholder para imágenes de Cloudinary
 * Usa un color gris neutro que funciona bien con el tema
 * @param isDark Si es true, usa un color más oscuro
 * @returns Data URL base64 del blur placeholder
 */
export function getCloudinaryBlurPlaceholder(isDark: boolean = false): string {
  const color = isDark ? "#1f2937" : "#e5e7eb"
  return generateBlurPlaceholder(color)
}

/**
 * Blur placeholder predefinido para el logo
 * Color oscuro que funciona con ambos temas
 */
export const LOGO_BLUR_PLACEHOLDER = generateBlurPlaceholder("#1f2937")

/**
 * Blur placeholder predefinido para cartas
 * Color neutro que funciona con el fondo de las cartas
 */
export const CARD_BLUR_PLACEHOLDER = generateBlurPlaceholder("#374151")

/**
 * Blur placeholder predefinido para avatares
 * Color gris medio
 */
export const AVATAR_BLUR_PLACEHOLDER = generateBlurPlaceholder("#4b5563")

