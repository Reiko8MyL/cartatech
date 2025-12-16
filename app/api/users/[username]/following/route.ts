import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/rate-limit/rate-limit";
import { log } from "@/lib/logging/logger";

// GET - Obtener lista de usuarios seguidos
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const startTime = Date.now();
  
  // Rate limiting para lectura
  const rateLimit = checkRateLimit(request);
  if (rateLimit?.limit) {
    log.warn("Rate limit exceeded for following", {
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

    // Obtener total de usuarios seguidos
    const total = await prisma.follow.count({
      where: { followerId: user.id },
    });

    // Obtener usuarios seguidos con información
    const following = await prisma.follow.findMany({
      where: { followerId: user.id },
      include: {
        following: {
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
    log.api('GET', `/api/users/${username}/following`, 200, duration);

    return NextResponse.json({
      following: following.map((follow) => ({
        id: follow.following.id,
        username: follow.following.username,
        avatarCardId: follow.following.avatarCardId,
        avatarZoom: follow.following.avatarZoom,
        avatarPositionX: follow.following.avatarPositionX,
        avatarPositionY: follow.following.avatarPositionY,
        bio: follow.following.bio,
        createdAt: follow.following.createdAt.getTime(),
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
    log.error("Error al obtener usuarios seguidos", error, { duration });
    
    return NextResponse.json(
      { 
        error: "Error al obtener usuarios seguidos",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

