import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/rate-limit/rate-limit";
import { log } from "@/lib/logging/logger";

// POST - Seguir usuario
// DELETE - Dejar de seguir usuario
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const startTime = Date.now();
  
  // Rate limiting para escritura
  const rateLimit = checkRateLimit(request);
  if (rateLimit?.limit) {
    log.warn("Rate limit exceeded for follow", {
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
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Buscar el usuario a seguir por username
    const userToFollow = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true },
    });

    if (!userToFollow) {
      return NextResponse.json(
        { error: "Usuario a seguir no encontrado" },
        { status: 404 }
      );
    }

    // No permitir seguirse a sí mismo
    if (userToFollow.id === userId) {
      return NextResponse.json(
        { error: "No puedes seguirte a ti mismo" },
        { status: 400 }
      );
    }

    // Verificar si ya lo está siguiendo
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: userToFollow.id,
        },
      },
    });

    if (existingFollow) {
      return NextResponse.json(
        { error: "Ya estás siguiendo a este usuario" },
        { status: 409 }
      );
    }

    // Crear el seguimiento
    const follow = await prisma.follow.create({
      data: {
        followerId: userId,
        followingId: userToFollow.id,
      },
      include: {
        following: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // Crear notificación para el usuario seguido
    try {
      await prisma.notification.create({
        data: {
          userId: userToFollow.id,
          type: "follow",
          title: "Nuevo seguidor",
          message: `${user.username} comenzó a seguirte`,
          link: `/perfil/${user.username}`,
        },
      });
    } catch (notificationError) {
      // Si falla la notificación, no romper el flujo
      log.warn("Error al crear notificación de follow", {
        error: notificationError instanceof Error ? notificationError.message : String(notificationError),
      });
    }

    const duration = Date.now() - startTime;
    log.api('POST', `/api/users/${username}/follow`, 200, duration);

    return NextResponse.json({
      success: true,
      follow: {
        id: follow.id,
        followerId: follow.followerId,
        followingId: follow.followingId,
        createdAt: follow.createdAt.getTime(),
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    log.error("Error al seguir usuario", error, { duration });
    
    return NextResponse.json(
      { 
        error: "Error al seguir usuario",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

// DELETE - Dejar de seguir usuario
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const startTime = Date.now();
  
  // Rate limiting para escritura
  const rateLimit = checkRateLimit(request);
  if (rateLimit?.limit) {
    log.warn("Rate limit exceeded for unfollow", {
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

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Buscar el usuario a dejar de seguir por username
    const userToUnfollow = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!userToUnfollow) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar el seguimiento
    const deleted = await prisma.follow.deleteMany({
      where: {
        followerId: userId,
        followingId: userToUnfollow.id,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "No estás siguiendo a este usuario" },
        { status: 404 }
      );
    }

    const duration = Date.now() - startTime;
    log.api('DELETE', `/api/users/${username}/follow`, 200, duration);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    log.error("Error al dejar de seguir usuario", error, { duration });
    
    return NextResponse.json(
      { 
        error: "Error al dejar de seguir usuario",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

