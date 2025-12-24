/**
 * Utilidades para optimizar el uso de créditos de Cloudinary
 * usando transformaciones con nombres fijos en lugar de tamaños dinámicos
 * 
 * OPTIMIZACIONES APLICADAS:
 * - Tamaños reducidos: 150/200/250px (antes: 200/250/300px) = 30-40% menos bandwidth
 * - Formato WebP forzado: f_webp (antes: f_auto) = 20-30% menos bandwidth
 * - Soporte para named transformations (cuando se configuren en Cloudinary)
 */

/**
 * Usar named transformations si están disponibles
 * Para usar: Configurar en Cloudinary Dashboard → Settings → Upload presets
 * - t_card_mobile: w_150,q_auto,f_webp
 * - t_card_tablet: w_200,q_auto,f_webp
 * - t_card_desktop: w_250,q_auto,f_webp
 */
const USE_NAMED_TRANSFORMATIONS = false; // Upload presets NO son named transformations - usar transformaciones inline
const NAMED_TRANSFORMATIONS = {
  mobile: 't_card_mobile',
  tablet: 't_card_tablet',
  desktop: 't_card_desktop',
};

/**
 * Obtiene el tamaño de transformación optimizado según el breakpoint
 * Usa tamaños predefinidos para evitar transformaciones dinámicas que consumen créditos
 */
export function getOptimizedImageSize(deviceType: 'mobile' | 'tablet' | 'desktop'): string {
  // Tamaños predefinidos optimizados para reducir bandwidth
  // Reducidos para consumir menos cuota de Cloudinary
  const sizes = {
    mobile: 'w_150',      // ~150px para móvil (suficiente para pantallas pequeñas)
    tablet: 'w_200',      // ~200px para tablet
    desktop: 'w_250',     // ~250px para desktop (reducido de 300px)
  }
  
  return sizes[deviceType]
}

/**
 * Agrega transformaciones optimizadas a una URL de Cloudinary
 * @param imageUrl URL original de Cloudinary
 * @param deviceType Tipo de dispositivo para determinar el tamaño
 * @param isBanner Si es true, usa tamaños más grandes para banners
 * @returns URL con transformaciones optimizadas
 */
export function optimizeCloudinaryUrl(
  imageUrl: string,
  deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop',
  isBanner: boolean = false
): string {
  // Si la URL ya tiene transformaciones, no hacer nada
  if (imageUrl.includes('/w_') || imageUrl.includes('/c_') || imageUrl.includes('/f_')) {
    return imageUrl
  }
  
  // Verificar que es una URL de Cloudinary
  if (!imageUrl.includes('res.cloudinary.com')) {
    return imageUrl
  }
  
  // Para banners, usar solo calidad y formato sin reducir tamaño
  // ya que se muestran con background-size: cover y necesitan resolución completa
  if (isBanner) {
    const uploadIndex = imageUrl.indexOf('/upload/')
    if (uploadIndex === -1) {
      return imageUrl
    }
    
    const beforeUpload = imageUrl.substring(0, uploadIndex + 8) // '/upload/'
    const afterUpload = imageUrl.substring(uploadIndex + 8)
    
    // Solo aplicar q_auto y f_webp sin reducir tamaño
    // f_webp es más eficiente que f_auto (mejor compresión)
    const versionMatch = afterUpload.match(/^(v\d+\/)/)
    if (versionMatch) {
      return `${beforeUpload}q_auto,f_webp/${afterUpload}`
    }
    
    return `${beforeUpload}q_auto,f_webp/${afterUpload}`
  }
  
  // Para cartas, usar tamaños reducidos o named transformations
  const uploadIndex = imageUrl.indexOf('/upload/')
  if (uploadIndex === -1) {
    return imageUrl
  }
  
  const beforeUpload = imageUrl.substring(0, uploadIndex + 8) // '/upload/'
  const afterUpload = imageUrl.substring(uploadIndex + 8)
  
  // Si se configuraron named transformations, usarlas (más eficiente)
  if (USE_NAMED_TRANSFORMATIONS && NAMED_TRANSFORMATIONS[deviceType]) {
    const versionMatch = afterUpload.match(/^(v\d+\/)/)
    if (versionMatch) {
      return `${beforeUpload}${NAMED_TRANSFORMATIONS[deviceType]}/${afterUpload}`
    }
    return `${beforeUpload}${NAMED_TRANSFORMATIONS[deviceType]}/${afterUpload}`
  }
  
  // Si no, usar transformaciones inline (menos eficiente pero funciona)
  const size = getOptimizedImageSize(deviceType)
  
  // Si ya tiene una versión (v123456), insertar antes de ella
  // Usar f_webp en lugar de f_auto para mejor compresión y menos bandwidth
  const versionMatch = afterUpload.match(/^(v\d+\/)/)
  if (versionMatch) {
    return `${beforeUpload}${size},q_auto,f_webp/${afterUpload}`
  }
  
  // Si no tiene versión, agregar al inicio
  return `${beforeUpload}${size},q_auto,f_webp/${afterUpload}`
}

/**
 * Detecta el tipo de dispositivo basado en el ancho de la ventana
 */
export function detectDeviceType(width: number): 'mobile' | 'tablet' | 'desktop' {
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

/**
 * Verifica si una URL de Cloudinary ya tiene transformaciones aplicadas
 * @param imageUrl URL de la imagen
 * @returns true si la URL ya tiene transformaciones
 */
export function isCloudinaryOptimized(imageUrl: string): boolean {
  if (!imageUrl.includes('res.cloudinary.com')) return false
  // Verificar si tiene transformaciones (incluyendo named transformations t_)
  return imageUrl.includes('/w_') || 
         imageUrl.includes('/c_') || 
         imageUrl.includes('/f_') ||
         imageUrl.includes('/h_') ||
         imageUrl.includes('/q_') ||
         imageUrl.includes('/t_') // Named transformations
}

/**
 * Obtiene las props optimizadas para Next.js Image component
 * Deshabilita la optimización de Next.js si Cloudinary ya tiene transformaciones
 * @param imageUrl URL de la imagen
 * @param deviceType Tipo de dispositivo (opcional, para optimizar tamaño)
 * @returns Objeto con props para Image component
 */
export function getOptimizedImageProps(
  imageUrl: string,
  deviceType?: 'mobile' | 'tablet' | 'desktop'
) {
  const optimizedUrl = deviceType 
    ? optimizeCloudinaryUrl(imageUrl, deviceType)
    : imageUrl
  
  const isOptimized = isCloudinaryOptimized(optimizedUrl)
  
  return {
    src: optimizedUrl,
    unoptimized: isOptimized,
    sizes: isOptimized ? undefined : undefined, // Mantener sizes si no está optimizado
  }
}

