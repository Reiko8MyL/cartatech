/**
 * Sistema de logging estructurado para CartaTech
 * 
 * Este logger reemplaza console.log/error/warn y proporciona:
 * - Logging solo en desarrollo por defecto
 * - Integración con servicios externos (Sentry, etc.) en producción
 * - Formato estructurado para mejor debugging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isClient = typeof window !== 'undefined';

  /**
   * Log de debug (solo en desarrollo)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context || '');
    }
  }

  /**
   * Log de información
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, context || '');
    }
    // En producción, podrías enviar a un servicio de analytics
  }

  /**
   * Log de advertencia
   */
  warn(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, context || '');
    }
    // En producción, podrías enviar a un servicio de monitoreo
    this.sendToExternalService('warn', message, context);
  }

  /**
   * Log de error
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorDetails = error instanceof Error 
      ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        }
      : error;

    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, errorDetails, context || '');
    }

    // En producción, siempre enviar errores a servicio externo
    this.sendToExternalService('error', message, {
      ...context,
      error: errorDetails,
    });
  }

  /**
   * Envía logs a servicios externos (Sentry, LogRocket, etc.)
   * Solo para errores y advertencias en producción
   */
  private sendToExternalService(
    level: 'warn' | 'error',
    message: string,
    context?: LogContext
  ): void {
    if (this.isDevelopment) {
      return; // No enviar en desarrollo
    }

    // Aquí puedes integrar con Sentry, LogRocket, etc.
    // Ejemplo con Sentry (descomentar cuando esté configurado):
    /*
    if (this.isClient && typeof window !== 'undefined' && (window as any).Sentry) {
      const Sentry = (window as any).Sentry;
      if (level === 'error') {
        Sentry.captureException(new Error(message), {
          extra: context,
        });
      } else {
        Sentry.captureMessage(message, {
          level: 'warning',
          extra: context,
        });
      }
    }
    */

    // Por ahora, solo loguear en consola del servidor si está disponible
    if (!this.isClient && this.isDevelopment === false) {
      // En servidor, podrías usar un servicio de logging como Winston
      // Por ahora, no hacer nada para evitar spam en producción
    }
  }

  /**
   * Log específico para APIs (con información de request)
   */
  api(
    method: string,
    path: string,
    statusCode: number,
    duration?: number,
    error?: Error | unknown
  ): void {
    const context: LogContext = {
      method,
      path,
      statusCode,
      ...(duration && { duration: `${duration}ms` }),
    };

    if (statusCode >= 500) {
      this.error(`API Error: ${method} ${path}`, error, context);
    } else if (statusCode >= 400) {
      this.warn(`API Warning: ${method} ${path}`, context);
    } else {
      this.info(`API: ${method} ${path}`, context);
    }
  }

  /**
   * Log específico para Prisma (errores de base de datos)
   */
  prisma(operation: string, error: unknown, context?: LogContext): void {
    const prismaError = error && typeof error === 'object' && 'code' in error
      ? {
          code: (error as any).code,
          meta: (error as any).meta,
        }
      : undefined;

    this.error(`Prisma Error: ${operation}`, error instanceof Error ? error : new Error(String(error)), {
      ...context,
      prisma: prismaError,
    });
  }
}

// Exportar instancia singleton
export const logger = new Logger();

// Exportar funciones de conveniencia para uso directo
export const log = {
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  warn: (message: string, context?: LogContext) => logger.warn(message, context),
  error: (message: string, error?: Error | unknown, context?: LogContext) => 
    logger.error(message, error, context),
  api: (
    method: string,
    path: string,
    statusCode: number,
    duration?: number,
    error?: Error | unknown
  ) => logger.api(method, path, statusCode, duration, error),
  prisma: (operation: string, error: unknown, context?: LogContext) =>
    logger.prisma(operation, error, context),
};

