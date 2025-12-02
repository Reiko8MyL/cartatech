import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// GET - Obtener votos
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const race = searchParams.get("race");

    // Si se proporciona userId y race, obtener el voto específico del usuario
    if (userId && race) {
      const vote = await prisma.vote.findUnique({
        where: {
          userId_race: {
            userId,
            race,
          },
        },
      });

      return NextResponse.json({
        cardId: vote?.cardId || null,
      });
    }

    // Si solo se proporciona race, obtener todos los votos de esa raza
    if (race) {
      const votes = await prisma.vote.findMany({
        where: {
          race,
        },
        select: {
          race: true,
          cardId: true,
          userId: true,
          createdAt: true,
        },
      });

      return NextResponse.json({
        votes: votes.map((v) => ({
          race: v.race,
          cardId: v.cardId,
          userId: v.userId,
          timestamp: v.createdAt.getTime(),
        })),
      });
    }

    // Si no se proporciona ningún parámetro, obtener todos los votos
    const allVotes = await prisma.vote.findMany({
      select: {
        race: true,
        cardId: true,
        userId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      votes: allVotes.map((v) => ({
        race: v.race,
        cardId: v.cardId,
        userId: v.userId,
        timestamp: v.createdAt.getTime(),
      })),
    });
  } catch (error) {
    console.error("Error al obtener votos:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al obtener votos";
    const errorDetails = process.env.NODE_ENV === "development" ? errorMessage : undefined;
    
    return NextResponse.json(
      { 
        error: "Error al obtener votos",
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

// POST - Guardar o actualizar un voto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, race, cardId } = body as { userId: string; race: string; cardId: string };

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      );
    }

    if (!race) {
      return NextResponse.json(
        { error: "race es requerido" },
        { status: 400 }
      );
    }

    if (!cardId) {
      return NextResponse.json(
        { error: "cardId es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Usar upsert para crear o actualizar el voto
    await prisma.vote.upsert({
      where: {
        userId_race: {
          userId,
          race,
        },
      },
      create: {
        userId,
        race,
        cardId,
      },
      update: {
        cardId,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error al guardar voto:", error);
    
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
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al guardar voto";
    const errorDetails = process.env.NODE_ENV === "development" ? errorMessage : undefined;
    
    return NextResponse.json(
      { 
        error: "Error al guardar voto",
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

