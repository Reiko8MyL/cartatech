/**
 * Utilidades para optimizar el uso de créditos de Cloudinary
 * usando transformaciones con nombres fijos en lugar de tamaños dinámicos
 */

/**
 * Obtiene el tamaño de transformación optimizado según el breakpoint
 * Usa tamaños predefinidos para evitar transformaciones dinámicas que consumen créditos
 */
export function getOptimizedImageSize(deviceType: 'mobile' | 'tablet' | 'desktop'): string {
  // Tamaños predefinidos en píxeles para cada dispositivo
  // Estos se convierten en transformaciones fijas de Cloudinary
  const sizes = {
    mobile: 'w_200',      // ~200px para móvil (4 columnas)
    tablet: 'w_250',      // ~250px para tablet (4 columnas)
    desktop: 'w_300',     // ~300px para desktop (6 columnas)
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
    
    // Solo aplicar q_auto y f_auto sin reducir tamaño
    const versionMatch = afterUpload.match(/^(v\d+\/)/)
    if (versionMatch) {
      return `${beforeUpload}q_auto,f_auto/${afterUpload}`
    }
    
    return `${beforeUpload}q_auto,f_auto/${afterUpload}`
  }
  
  // Para cartas, usar tamaños reducidos
  const size = getOptimizedImageSize(deviceType)
  
  // Insertar la transformación antes del nombre del archivo
  // Formato: https://res.cloudinary.com/cloud_name/image/upload/TRANSFORMATIONS/v123456/file.webp
  const uploadIndex = imageUrl.indexOf('/upload/')
  if (uploadIndex === -1) {
    return imageUrl
  }
  
  const beforeUpload = imageUrl.substring(0, uploadIndex + 8) // '/upload/'
  const afterUpload = imageUrl.substring(uploadIndex + 8)
  
  // Si ya tiene una versión (v123456), insertar antes de ella
  const versionMatch = afterUpload.match(/^(v\d+\/)/)
  if (versionMatch) {
    return `${beforeUpload}${size},q_auto,f_auto/${afterUpload}`
  }
  
  // Si no tiene versión, agregar al inicio
  return `${beforeUpload}${size},q_auto,f_auto/${afterUpload}`
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
  return imageUrl.includes('/w_') || 
         imageUrl.includes('/c_') || 
         imageUrl.includes('/f_') ||
         imageUrl.includes('/h_') ||
         imageUrl.includes('/q_')
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

