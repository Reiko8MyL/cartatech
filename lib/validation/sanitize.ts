/**
 * Utilidades de sanitización y validación de inputs
 * Previene XSS y valida datos de entrada
 * 
 * NOTA: Para una sanitización más robusta, instalar 'isomorphic-dompurify':
 * npm install isomorphic-dompurify
 */

/**
 * Sanitiza contenido HTML para prevenir XSS
 * Versión básica que escapa HTML - para producción, usar DOMPurify
 * @param html - Contenido HTML a sanitizar
 * @returns HTML sanitizado seguro
 */
export function sanitizeHtml(html: string): string {
  // Por ahora, escapar HTML básico
  // TODO: Instalar isomorphic-dompurify para sanitización más robusta
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitiza texto plano (elimina HTML)
 * @param text - Texto a sanitizar
 * @returns Texto sin HTML
 */
export function sanitizeText(text: string): string {
  // Escapar todos los caracteres HTML
  return sanitizeHtml(text);
}

/**
 * Valida y sanitiza el contenido de un comentario
 * @param content - Contenido del comentario
 * @returns Contenido sanitizado o null si es inválido
 */
export function sanitizeCommentContent(content: string): string | null {
  if (!content || typeof content !== 'string') {
    return null;
  }
  
  const trimmed = content.trim();
  
  // Validar longitud mínima y máxima
  if (trimmed.length < 1) {
    return null;
  }
  
  if (trimmed.length > 5000) {
    return null; // Límite de 5000 caracteres
  }
  
  // Sanitizar HTML pero permitir formato básico
  return sanitizeHtml(trimmed);
}

/**
 * Valida y sanitiza el nombre de un mazo
 * @param name - Nombre del mazo
 * @returns Nombre sanitizado o null si es inválido
 */
export function sanitizeDeckName(name: string): string | null {
  if (!name || typeof name !== 'string') {
    return null;
  }
  
  const trimmed = name.trim();
  
  // Validar longitud
  if (trimmed.length < 1 || trimmed.length > 100) {
    return null;
  }
  
  // Sanitizar (solo texto, sin HTML)
  return sanitizeText(trimmed);
}

/**
 * Valida y sanitiza la descripción de un mazo
 * @param description - Descripción del mazo
 * @returns Descripción sanitizada o null si es inválido
 */
export function sanitizeDeckDescription(description: string | null | undefined): string | null {
  if (!description || typeof description !== 'string') {
    return null; // Descripción es opcional
  }
  
  const trimmed = description.trim();
  
  // Si está vacío después de trim, retornar null
  if (trimmed.length === 0) {
    return null;
  }
  
  // Validar longitud máxima
  if (trimmed.length > 2000) {
    return null; // Límite de 2000 caracteres
  }
  
  // Sanitizar HTML pero permitir formato básico
  return sanitizeHtml(trimmed);
}

/**
 * Valida un username
 * @param username - Username a validar
 * @returns true si es válido, false si no
 */
export function validateUsername(username: string): boolean {
  if (!username || typeof username !== 'string') {
    return false;
  }
  
  const trimmed = username.trim();
  
  // Longitud
  if (trimmed.length < 3 || trimmed.length > 30) {
    return false;
  }
  
  // Solo letras, números, guiones y guiones bajos
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(trimmed)) {
    return false;
  }
  
  return true;
}

/**
 * Valida un email
 * @param email - Email a validar
 * @returns true si es válido, false si no
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const trimmed = email.trim().toLowerCase();
  
  // Regex básico de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
}

/**
 * Valida un ID de carta
 * @param cardId - ID de carta a validar
 * @returns true si es válido, false si no
 */
export function validateCardId(cardId: string): boolean {
  if (!cardId || typeof cardId !== 'string') {
    return false;
  }
  
  const trimmed = cardId.trim();
  
  // Formato: MYL-XXXX o MYL-XXXX-XX
  const cardIdRegex = /^MYL-\d{4}(-\d{2})?$/;
  return cardIdRegex.test(trimmed);
}

/**
 * Valida un array de IDs de cartas
 * @param cardIds - Array de IDs de cartas
 * @returns true si todos son válidos, false si no
 */
export function validateCardIds(cardIds: string[]): boolean {
  if (!Array.isArray(cardIds)) {
    return false;
  }
  
  return cardIds.every(id => validateCardId(id));
}

