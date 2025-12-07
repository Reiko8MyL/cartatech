import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logging/logger";

// GET - Obtener likes
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    const searchParams = request.nextUrl.searchParams;
    const deckId = searchParams.get("deckId");
    const userId = searchParams.get("userId");

    // Si se proporciona deckId y userId, verificar si el usuario dio like
    if (deckId && userId) {
      const like = await prisma.deckLike.findUnique({
        where: {
          userId_deckId: {
            userId,
            deckId,
          },
        },
      });

      return NextResponse.json({
        isLiked: !!like,
      });
    }

    // Si solo se proporciona deckId, obtener todos los likes de ese mazo
    if (deckId) {
      const likes = await prisma.deckLike.findMany({
        where: {
          deckId,
        },
        select: {
          userId: true,
        },
      });

      return NextResponse.json({
        userIds: likes.map((like: any) => like.userId),
      });
    }

    // Si no se proporciona ningún parámetro, obtener todos los likes agrupados por deckId
    // Manejar el caso cuando la tabla está vacía o no existe
    let allLikes: Array<{ deckId: string; userId: string }> = [];
    
    try {
      allLikes = await prisma.deckLike.findMany({
        select: {
          deckId: true,
          userId: true,
        },
      });
    } catch (prismaError) {
      if (process.env.NODE_ENV === "development") {
        log.warn("Error de Prisma al obtener likes", { error: prismaError });
      }
      // Si hay un error de Prisma (por ejemplo, tabla no existe), retornar objeto vacío
      return NextResponse.json({
        likes: {},
      });
    }

    // Agrupar por deckId
    const likesByDeck: Record<string, string[]> = {};
    for (const like of allLikes) {
      if (!likesByDeck[like.deckId]) {
        likesByDeck[like.deckId] = [];
      }
      likesByDeck[like.deckId].push(like.userId);
    }

    const duration = Date.now() - startTime;
    log.api('GET', '/api/likes', 200, duration);

    return NextResponse.json({
      likes: likesByDeck,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    log.prisma('getLikes', error, { duration });
    
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al obtener likes";
    const errorDetails = process.env.NODE_ENV === "development" ? errorMessage : undefined;
    
    return NextResponse.json(
      { 
        error: "Error al obtener likes",
        ...(errorDetails && { details: errorMessage, stack: error instanceof Error ? error.stack : undefined })
      },
      { 
        status: 500,
        headers: {
          "Content-Type": "application/json",
        }
      }
    );
  }
}

