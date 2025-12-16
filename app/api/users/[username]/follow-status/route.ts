import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/rate-limit/rate-limit";
import { log } from "@/lib/logging/logger";

// GET - Obtener estado de seguimiento (si el usuario actual sigue al usuario del perfil)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const startTime = Date.now();
  
  // Rate limiting para lectura
  const rateLimit = checkRateLimit(request);
  if (rateLimit?.limit) {
    log.warn("Rate limit exceeded for follow-status", {
      identifier: request.headers.get('x-forwarded-for') || 'unknown',
    });
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
    const { username } = await params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      );
    }

    // Buscar el usuario por username
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si el usuario actual sigue al usuario del perfil
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: user.id,
        },
      },
    });

    // Obtener contadores de seguidores y seguidos
    const [followerCount, followingCount] = await Promise.all([
      prisma.follow.count({
        where: { followingId: user.id },
      }),
      prisma.follow.count({
        where: { followerId: user.id },
      }),
    ]);

    const duration = Date.now() - startTime;
    log.api('GET', `/api/users/${username}/follow-status`, 200, duration);

    return NextResponse.json({
      isFollowing: !!follow,
      followerCount,
      followingCount,
      followId: follow?.id || null,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    log.error("Error al obtener estado de seguimiento", error, { duration });
    
    return NextResponse.json(
      { 
        error: "Error al obtener estado de seguimiento",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

