import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// POST - Alternar like
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, deckId } = body as { userId: string; deckId: string };

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      );
    }

    if (!deckId) {
      return NextResponse.json(
        { error: "deckId es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el mazo existe
    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
    });

    if (!deck) {
      return NextResponse.json(
        { error: "Mazo no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si el usuario ya dio like
    const existingLike = await prisma.deckLike.findUnique({
      where: {
        userId_deckId: {
          userId,
          deckId,
        },
      },
    });

    if (existingLike) {
      // Eliminar like
      await prisma.deckLike.delete({
        where: {
          userId_deckId: {
            userId,
            deckId,
          },
        },
      });

      return NextResponse.json({
        isLiked: false,
      });
    } else {
      // Crear like
      await prisma.deckLike.create({
        data: {
          userId,
          deckId,
        },
      });

      return NextResponse.json({
        isLiked: true,
      });
    }
  } catch (error) {
    console.error("Error al alternar like:", error);
    
    // Log detallado del error para debugging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    // Verificar si es un error de Prisma
    if (error && typeof error === 'object' && 'code' in error) {
      console.error("Prisma error code:", error.code);
    }
    
    // Asegurar que siempre devolvemos un JSON válido
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al alternar like";
    const errorDetails = process.env.NODE_ENV === "development" ? errorMessage : undefined;
    
    return NextResponse.json(
      { 
        error: "Error al alternar like",
        ...(errorDetails && { details: errorDetails })
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





