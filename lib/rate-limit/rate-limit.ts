/**
 * Sistema de Rate Limiting para APIs de CartaTech
 * 
 * Implementa rate limiting usando una estrategia simple en memoria
 * Para producción, se recomienda usar @upstash/ratelimit o similar
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Ventana de tiempo en milisegundos
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

// Store en memoria (para producción, usar Redis o similar)
const store: RateLimitStore = {};

// Configuraciones por tipo de endpoint
const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // Autenticación: más restrictivo
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutos
  },
  // APIs de escritura (POST, PUT, DELETE)
  write: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minuto
  },
  // APIs de lectura (GET)
  read: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minuto
  },
  // APIs de administración
  admin: {
    maxRequests: 50,
    windowMs: 60 * 1000, // 1 minuto
  },
  // Default
  default: {
    maxRequests: 60,
    windowMs: 60 * 1000, // 1 minuto
  },
};

/**
 * Limpia entradas expiradas del store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetAt < now) {
      delete store[key];
    }
  });
}

/**
 * Obtiene el identificador único para rate limiting
 */
function getIdentifier(request: Request): string {
  // En producción, podrías usar IP, userId, o combinación
  // Por ahora, usamos IP del request
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  
  // También podríamos usar userId si está disponible en headers
  const userId = request.headers.get('x-user-id');
  
  return userId ? `user:${userId}` : `ip:${ip}`;
}

/**
 * Determina el tipo de rate limit según el método HTTP y la ruta
 */
function getRateLimitType(method: string, pathname: string): string {
  // Autenticación
  if (pathname.includes('/api/auth/')) {
    return 'auth';
  }
  
  // Administración
  if (pathname.includes('/api/admin/')) {
    return 'admin';
  }
  
  // Escritura
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return 'write';
  }
  
  // Lectura
  if (method === 'GET') {
    return 'read';
  }
  
  return 'default';
}

/**
 * Verifica si una request excede el rate limit
 * 
 * @returns { limit: boolean, remaining: number, resetAt: number } o null si no hay límite
 */
export function checkRateLimit(
  request: Request,
  customConfig?: RateLimitConfig
): {
  limit: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
} | null {
  // En desarrollo, opcionalmente deshabilitar rate limiting
  if (process.env.NODE_ENV === 'development' && process.env.DISABLE_RATE_LIMIT === 'true') {
    return null;
  }

  // Limpiar entradas expiradas periódicamente
  if (Math.random() < 0.1) {
    // 10% de probabilidad de limpiar (para no hacerlo en cada request)
    cleanupExpiredEntries();
  }

  const identifier = getIdentifier(request);
  const method = request.method;
  const pathname = new URL(request.url).pathname;
  
  const type = getRateLimitType(method, pathname);
  const config = customConfig || RATE_LIMIT_CONFIGS[type] || RATE_LIMIT_CONFIGS.default;
  
  const now = Date.now();
  const entry = store[identifier];
  
  // Si no existe entrada o está expirada, crear nueva
  if (!entry || entry.resetAt < now) {
    store[identifier] = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    
    return {
      limit: false,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }
  
  // Incrementar contador
  entry.count++;
  
  // Verificar si excede el límite
  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return {
      limit: true,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter,
    };
  }
  
  return {
    limit: false,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Middleware helper para usar en API routes
 * 
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const rateLimit = checkRateLimit(request);
 *   if (rateLimit?.limit) {
 *     return NextResponse.json(
 *       { error: 'Too many requests' },
 *       { 
 *         status: 429,
 *         headers: {
 *           'X-RateLimit-Remaining': rateLimit.remaining.toString(),
 *           'X-RateLimit-Reset': rateLimit.resetAt.toString(),
 *           'Retry-After': rateLimit.retryAfter?.toString() || '60',
 *         },
 *       }
 *     );
 *   }
 *   // ... resto del código
 * }
 * ```
 */
export function withRateLimit<T>(
  request: Request,
  handler: () => Promise<T>
): Promise<T | NextResponse> {
  const rateLimit = checkRateLimit(request);
  
  if (rateLimit?.limit) {
    return Promise.resolve(
      new NextResponse(
        JSON.stringify({
          error: 'Demasiadas solicitudes. Por favor, intenta de nuevo más tarde.',
          retryAfter: rateLimit.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetAt.toString(),
            'Retry-After': (rateLimit.retryAfter || 60).toString(),
          },
        }
      ) as any
    );
  }
  
  return handler();
}

// Importar NextResponse para el tipo
import { NextResponse } from 'next/server';

