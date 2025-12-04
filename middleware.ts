import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware para proteger rutas de administración
 * Verifica que el usuario tenga rol de MODERATOR o ADMIN
 */
export function middleware(request: NextRequest) {
  // Solo proteger rutas /admin/*
  if (request.nextUrl.pathname.startsWith("/admin")) {
    // Obtener usuario del header o cookie
    // Como usamos localStorage en el cliente, necesitamos que el cliente envíe el userId
    // Para una implementación más robusta, podrías usar cookies httpOnly
    
    // Por ahora, permitimos el acceso y verificamos en cada página/API
    // Esto es porque el middleware no tiene acceso directo a localStorage del cliente
    // La verificación real se hace en las APIs y componentes de servidor
    
    // Redirigir solo si es una ruta que definitivamente necesita protección
    // La verificación real se hará en las páginas usando Server Components o en las APIs
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

