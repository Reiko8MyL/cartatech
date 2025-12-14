import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/rate-limit/rate-limit";
import { log } from "@/lib/logging/logger";

export async function GET(request: NextRequest) {
  // Rate limiting para autenticación
  const rateLimit = checkRateLimit(request);
  if (rateLimit?.limit) {
    return NextResponse.json(
      { 
        error: "Demasiadas solicitudes. Por favor, intenta de nuevo más tarde.",
        retryAfter: rateLimit.retryAfter,
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetAt.toString(),
          'Retry-After': (rateLimit.retryAfter || 60).toString(),
        },
      }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get("username");

    if (!username || username.trim().length === 0) {
      return NextResponse.json(
        { error: "El nombre de usuario es requerido" },
        { status: 400 }
      );
    }

    // Verificar si el username ya existe
    const existingUser = await prisma.user.findFirst({
      where: {
        username: { equals: username.trim(), mode: "insensitive" },
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({
      available: !existingUser,
      username: username.trim(),
    });
  } catch (error) {
    log.error("Error al verificar username", error);
    return NextResponse.json(
      { 
        error: "Error al verificar nombre de usuario",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}
