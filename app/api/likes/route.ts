import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// GET - Obtener likes
export async function GET(request: NextRequest) {
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
        userIds: likes.map((like) => like.userId),
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
      console.error("Error de Prisma al obtener likes:", prismaError);
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

    return NextResponse.json({
      likes: likesByDeck,
    });
  } catch (error) {
    console.error("Error al obtener likes:", error);
    
    // Log detallado del error para debugging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    // Si es un error de Prisma, log más detalles
    if (error && typeof error === "object" && "code" in error) {
      console.error("Prisma error code:", (error as any).code);
      console.error("Prisma error meta:", (error as any).meta);
    }
    
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

