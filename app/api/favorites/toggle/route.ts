import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// POST - Alternar estado de favorito
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, deckId } = body;

    if (!userId || !deckId) {
      return NextResponse.json(
        { error: "userId y deckId son requeridos" },
        { status: 400 }
      );
    }

    // Verificar que el mazo existe en la base de datos
    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
    });

    if (!deck) {
      return NextResponse.json(
        { error: "El mazo no existe" },
        { status: 404 }
      );
    }

    // Verificar si ya es favorito
    const existing = await prisma.favoriteDeck.findUnique({
      where: {
        userId_deckId: {
          userId,
          deckId,
        },
      },
    });

    if (existing) {
      // Eliminar de favoritos
      await prisma.favoriteDeck.delete({
        where: {
          userId_deckId: {
            userId,
            deckId,
          },
        },
      });
      return NextResponse.json({ isFavorite: false });
    } else {
      // Agregar a favoritos
      await prisma.favoriteDeck.create({
        data: {
          userId,
          deckId,
        },
      });
      return NextResponse.json({ isFavorite: true });
    }
  } catch (error) {
    console.error("Error al alternar favorito:", error);
    
    // Log detallado del error para debugging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    // Verificar si es un error de Prisma
    if (error && typeof error === 'object' && 'code' in error) {
      // Error de foreign key constraint (el mazo o usuario no existe)
      if (error.code === 'P2003') {
        return NextResponse.json(
          { error: "El mazo o usuario no existe" },
          { status: 404 }
        );
      }
      // Error de unique constraint (ya existe)
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: "El favorito ya existe" },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: "Error al alternar favorito",
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}

