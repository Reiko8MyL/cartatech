import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// GET - Obtener la colección de un usuario
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      );
    }

    // Buscar la colección del usuario
    let collection = await prisma.userCollection.findUnique({
      where: { userId },
      select: { cardIds: true },
    });

    // Si no existe, intentar crear una colección vacía
    if (!collection) {
      try {
        // Verificar que el usuario existe primero
        const userExists = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true },
        });

        if (!userExists) {
          // Si el usuario no existe, retornar array vacío (fallback)
          return NextResponse.json({
            cardIds: [],
          });
        }

        // Crear la colección
        collection = await prisma.userCollection.create({
          data: {
            userId,
            cardIds: [],
          },
          select: { cardIds: true },
        });
      } catch (createError) {
        console.error("Error al crear colección:", createError);
        
        // Si es un error de foreign key constraint, el usuario no existe
        if (createError && typeof createError === "object" && "code" in createError) {
          const prismaError = createError as any;
          if (prismaError.code === "P2003") {
            // Foreign key constraint failed - usuario no existe
            return NextResponse.json({
              cardIds: [],
            });
          }
        }
        
        // Si falla la creación por otro motivo, retornar array vacío
        return NextResponse.json({
          cardIds: [],
        });
      }
    }

    return NextResponse.json({
      cardIds: collection.cardIds || [],
    });
  } catch (error) {
    console.error("Error al obtener colección:", error);
    
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
    
    return NextResponse.json(
      { error: "Error al obtener colección" },
      { status: 500 }
    );
  }
}

// POST - Agregar o quitar una carta de la colección (toggle)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, cardId } = body;

    if (!userId || !cardId) {
      return NextResponse.json(
        { error: "userId y cardId son requeridos" },
        { status: 400 }
      );
    }

    // Buscar la colección del usuario
    let collection = await prisma.userCollection.findUnique({
      where: { userId },
    });

    // Si no existe, crear una nueva
    if (!collection) {
      collection = await prisma.userCollection.create({
        data: {
          userId,
          cardIds: [],
        },
      });
    }

    // Toggle: agregar si no existe, quitar si existe
    const currentCardIds = collection.cardIds || [];
    const isInCollection = currentCardIds.includes(cardId);
    
    const updatedCardIds = isInCollection
      ? currentCardIds.filter((id: string) => id !== cardId)
      : [...currentCardIds, cardId];

    // Actualizar la colección
    const updatedCollection = await prisma.userCollection.update({
      where: { userId },
      data: {
        cardIds: updatedCardIds,
      },
      select: { cardIds: true },
    });

    return NextResponse.json({
      cardIds: updatedCollection.cardIds,
      isInCollection: !isInCollection,
    });
  } catch (error) {
    console.error("Error al actualizar colección:", error);
    
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { error: "Error al actualizar colección" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar toda la colección (reemplazar completamente)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, cardIds } = body;

    if (!userId || !Array.isArray(cardIds)) {
      return NextResponse.json(
        { error: "userId y cardIds (array) son requeridos" },
        { status: 400 }
      );
    }

    // Upsert: actualizar si existe, crear si no existe
    const collection = await prisma.userCollection.upsert({
      where: { userId },
      update: {
        cardIds: cardIds,
      },
      create: {
        userId,
        cardIds: cardIds,
      },
      select: { cardIds: true },
    });

    return NextResponse.json({
      cardIds: collection.cardIds,
    });
  } catch (error) {
    console.error("Error al actualizar colección completa:", error);
    
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { error: "Error al actualizar colección completa" },
      { status: 500 }
    );
  }
}

