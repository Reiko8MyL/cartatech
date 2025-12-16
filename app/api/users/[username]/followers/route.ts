import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/rate-limit/rate-limit";
import { log } from "@/lib/logging/logger";

// GET - Obtener lista de seguidores de un usuario
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const startTime = Date.now();
  
  // Rate limiting para lectura
  const rateLimit = checkRateLimit(request);
  if (rateLimit?.limit) {
    log.warn("Rate limit exceeded for followers", {
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
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
    const skip = (page - 1) * limit;

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

    // Obtener total de seguidores
    const total = await prisma.follow.count({
      where: { followingId: user.id },
    });

    // Obtener seguidores con información del usuario
    const followers = await prisma.follow.findMany({
      where: { followingId: user.id },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            avatarCardId: true,
            avatarZoom: true,
            avatarPositionX: true,
            avatarPositionY: true,
            bio: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    const duration = Date.now() - startTime;
    log.api('GET', `/api/users/${username}/followers`, 200, duration);

    return NextResponse.json({
      followers: followers.map((follow) => ({
        id: follow.follower.id,
        username: follow.follower.username,
        avatarCardId: follow.follower.avatarCardId,
        avatarZoom: follow.follower.avatarZoom,
        avatarPositionX: follow.follower.avatarPositionX,
        avatarPositionY: follow.follower.avatarPositionY,
        bio: follow.follower.bio,
        createdAt: follow.follower.createdAt.getTime(),
        followedAt: follow.createdAt.getTime(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    log.error("Error al obtener seguidores", error, { duration });
    
    return NextResponse.json(
      { 
        error: "Error al obtener seguidores",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

