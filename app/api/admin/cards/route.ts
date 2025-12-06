import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hasAdminAccess } from "@/lib/auth/authorization";
import { clearCardsCache } from "@/lib/deck-builder/cards-db";
import { getBaseCardId } from "@/lib/deck-builder/utils";

/**
 * POST /api/admin/cards
 * Crea una nueva carta en la base de datos
 * Solo accesible para administradores
 */
export async function POST(request: NextRequest) {
  let cardId: string | undefined;
  try {
    const body = await request.json();
    const { userId, card } = body;
    cardId = card?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el usuario es admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    if (!hasAdminAccess(user.role)) {
      return NextResponse.json(
        {
          error:
            "No tienes permiso para realizar esta acción. Se requiere rol de administrador.",
        },
        { status: 403 }
      );
    }

    // Validar campos requeridos
    if (!card.id || !card.name || !card.type || !card.edition || !card.image) {
      return NextResponse.json(
        { error: "id, name, type, edition e image son campos requeridos" },
        { status: 400 }
      );
    }

    // Validar que el ID no existe ya
    const existingCard = await prisma.card.findUnique({
      where: { id: card.id },
    });

    if (existingCard) {
      return NextResponse.json(
        { error: `La carta con ID ${card.id} ya existe` },
        { status: 400 }
      );
    }

    // Validar tipo de carta
    const validTypes = ["Aliado", "Arma", "Talismán", "Tótem", "Oro"];
    if (!validTypes.includes(card.type)) {
      return NextResponse.json(
        { error: `type debe ser uno de: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validar edición
    const validEditions = [
      "Espada Sagrada",
      "Helénica",
      "Hijos de Daana",
      "Dominios de Ra",
      "Drácula",
    ];
    if (!validEditions.includes(card.edition)) {
      return NextResponse.json(
        { error: `edition debe ser una de: ${validEditions.join(", ")}` },
        { status: 400 }
      );
    }

    // Validar ban list (0-3)
    const validBanListValues = [0, 1, 2, 3];
    if (
      !validBanListValues.includes(card.banListRE) ||
      !validBanListValues.includes(card.banListRL) ||
      !validBanListValues.includes(card.banListLI)
    ) {
      return NextResponse.json(
        { error: "banListRE, banListRL y banListLI deben ser 0, 1, 2 o 3" },
        { status: 400 }
      );
    }

    // Si es una carta alternativa (isCosmetic = true), validar baseCardId
    if (card.isCosmetic && card.baseCardId) {
      const baseCard = await prisma.card.findUnique({
        where: { id: card.baseCardId },
      });

      if (!baseCard) {
        return NextResponse.json(
          { error: `La carta base ${card.baseCardId} no existe` },
          { status: 400 }
        );
      }

      // Validar que el baseCardId coincida con el ID base de la carta
      const expectedBaseId = getBaseCardId(card.id);
      if (card.baseCardId !== expectedBaseId) {
        return NextResponse.json(
          {
            error: `baseCardId debe ser ${expectedBaseId} para la carta ${card.id}`,
          },
          { status: 400 }
        );
      }
    }

    // Si no es cosmética, asegurar que baseCardId sea null
    if (!card.isCosmetic) {
      card.baseCardId = null;
    } else if (!card.baseCardId) {
      // Si es cosmética pero no tiene baseCardId, calcularlo
      card.baseCardId = getBaseCardId(card.id);
    }

    // Validar cost y power según el tipo
    // Cost: requerido para Aliado, Arma, Tótem y Talismán, no permitido para Oro
    if (card.type === "Oro") {
      if (card.cost !== null && card.cost !== undefined) {
        return NextResponse.json(
          { error: `${card.type} no puede tener cost` },
          { status: 400 }
        );
      }
      card.cost = null;
    }

    // Power: requerido solo para Aliado, no permitido para Arma, Tótem, Talismán y Oro
    if (card.type === "Arma" || card.type === "Talismán" || card.type === "Tótem" || card.type === "Oro") {
      if (card.power !== null && card.power !== undefined) {
        return NextResponse.json(
          { error: `${card.type} no puede tener power` },
          { status: 400 }
        );
      }
      card.power = null;
    }

    // Race: requerido solo para Aliado, no permitido para Arma, Tótem, Talismán y Oro
    if (card.type === "Arma" || card.type === "Talismán" || card.type === "Tótem" || card.type === "Oro") {
      if (card.race !== null && card.race !== undefined) {
        return NextResponse.json(
          { error: `${card.type} no puede tener race` },
          { status: 400 }
        );
      }
      card.race = null;
    }

    // Crear la carta
    const newCard = await prisma.card.create({
      data: {
        id: card.id,
        name: card.name,
        type: card.type,
        cost: card.cost ?? null,
        power: card.power ?? null,
        race: card.race ?? null,
        isCosmetic: card.isCosmetic || false,
        isRework: card.isRework || false,
        isUnique: card.isUnique || false,
        edition: card.edition,
        banListRE: card.banListRE ?? 3,
        banListRL: card.banListRL ?? 3,
        banListLI: card.banListLI ?? 3,
        isOroIni: card.isOroIni || false,
        image: card.image,
        description: card.description || "",
        baseCardId: card.baseCardId ?? null,
      },
    });

    // Limpiar cache para que la nueva carta aparezca inmediatamente
    clearCardsCache();

    return NextResponse.json({
      success: true,
      message: `Carta ${card.id} creada exitosamente`,
      card: {
        id: newCard.id,
        name: newCard.name,
        type: newCard.type,
        cost: newCard.cost,
        power: newCard.power,
        race: newCard.race,
        isCosmetic: newCard.isCosmetic,
        isRework: newCard.isRework,
        isUnique: newCard.isUnique,
        edition: newCard.edition,
        banListRE: newCard.banListRE,
        banListRL: newCard.banListRL,
        banListLI: newCard.banListLI,
        isOroIni: newCard.isOroIni,
        image: newCard.image,
        description: newCard.description,
        baseCardId: newCard.baseCardId,
      },
    });
  } catch (error) {
    console.error("Error al crear carta:", error);

    // Manejar errores de Prisma
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as any;
      if (prismaError.code === "P2002") {
        return NextResponse.json(
          { error: `La carta con ID ${cardId || "desconocido"} ya existe` },
          { status: 400 }
        );
      }
      if (prismaError.code === "P2003") {
        return NextResponse.json(
          { error: "La carta base especificada no existe" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Error al crear carta",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/cards
 * Obtiene todas las cartas o una carta específica por ID
 * Solo accesible para administradores
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const cardId = searchParams.get("cardId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el usuario es admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    if (!hasAdminAccess(user.role)) {
      return NextResponse.json(
        {
          error:
            "No tienes permiso para realizar esta acción. Se requiere rol de administrador.",
        },
        { status: 403 }
      );
    }

    // Si se especifica cardId, obtener una carta específica
    if (cardId) {
      const card = await prisma.card.findUnique({
        where: { id: cardId },
      });

      if (!card) {
        return NextResponse.json(
          { error: "Carta no encontrada" },
          { status: 404 }
        );
      }

      return NextResponse.json({ card });
    }

    // Si no se especifica cardId, obtener todas las cartas
    const cards = await prisma.card.findMany({
      orderBy: { id: "asc" },
    });

    return NextResponse.json({ cards, total: cards.length });
  } catch (error) {
    console.error("Error al obtener cartas:", error);

    return NextResponse.json(
      {
        error: "Error al obtener cartas",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/cards
 * Actualiza una carta existente en la base de datos
 * Solo accesible para administradores
 */
export async function PUT(request: NextRequest) {
  let cardId: string | undefined;
  try {
    const body = await request.json();
    const { userId, card } = body;
    cardId = card?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      );
    }

    if (!cardId) {
      return NextResponse.json(
        { error: "card.id es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el usuario es admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    if (!hasAdminAccess(user.role)) {
      return NextResponse.json(
        {
          error:
            "No tienes permiso para realizar esta acción. Se requiere rol de administrador.",
        },
        { status: 403 }
      );
    }

    // Verificar que la carta existe
    const existingCard = await prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!existingCard) {
      return NextResponse.json(
        { error: `La carta con ID ${cardId} no existe` },
        { status: 404 }
      );
    }

    // Validar campos requeridos
    if (!card.name || !card.type || !card.edition || !card.image) {
      return NextResponse.json(
        { error: "name, type, edition e image son campos requeridos" },
        { status: 400 }
      );
    }

    // Validar tipo de carta
    const validTypes = ["Aliado", "Arma", "Talismán", "Tótem", "Oro"];
    if (!validTypes.includes(card.type)) {
      return NextResponse.json(
        { error: `type debe ser uno de: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validar edición
    const validEditions = [
      "Espada Sagrada",
      "Helénica",
      "Hijos de Daana",
      "Dominios de Ra",
      "Drácula",
    ];
    if (!validEditions.includes(card.edition)) {
      return NextResponse.json(
        { error: `edition debe ser una de: ${validEditions.join(", ")}` },
        { status: 400 }
      );
    }

    // Validar ban list (0-3)
    const validBanListValues = [0, 1, 2, 3];
    if (
      !validBanListValues.includes(card.banListRE) ||
      !validBanListValues.includes(card.banListRL) ||
      !validBanListValues.includes(card.banListLI)
    ) {
      return NextResponse.json(
        { error: "banListRE, banListRL y banListLI deben ser 0, 1, 2 o 3" },
        { status: 400 }
      );
    }

    // Si es una carta alternativa (isCosmetic = true), validar baseCardId
    if (card.isCosmetic && card.baseCardId) {
      const baseCard = await prisma.card.findUnique({
        where: { id: card.baseCardId },
      });

      if (!baseCard) {
        return NextResponse.json(
          { error: `La carta base ${card.baseCardId} no existe` },
          { status: 400 }
        );
      }

      // Validar que el baseCardId coincida con el ID base de la carta
      const expectedBaseId = getBaseCardId(cardId);
      if (card.baseCardId !== expectedBaseId) {
        return NextResponse.json(
          {
            error: `baseCardId debe ser ${expectedBaseId} para la carta ${cardId}`,
          },
          { status: 400 }
        );
      }
    }

    // Si no es cosmética, asegurar que baseCardId sea null
    if (!card.isCosmetic) {
      card.baseCardId = null;
    } else if (!card.baseCardId) {
      // Si es cosmética pero no tiene baseCardId, calcularlo
      card.baseCardId = getBaseCardId(cardId);
    }

    // Validar cost y power según el tipo
    // Cost: requerido para Aliado, Arma, Tótem y Talismán, no permitido para Oro
    if (card.type === "Oro") {
      if (card.cost !== null && card.cost !== undefined) {
        return NextResponse.json(
          { error: `${card.type} no puede tener cost` },
          { status: 400 }
        );
      }
      card.cost = null;
    }

    // Power: requerido solo para Aliado, no permitido para Arma, Tótem, Talismán y Oro
    if (card.type === "Arma" || card.type === "Talismán" || card.type === "Tótem" || card.type === "Oro") {
      if (card.power !== null && card.power !== undefined) {
        return NextResponse.json(
          { error: `${card.type} no puede tener power` },
          { status: 400 }
        );
      }
      card.power = null;
    }

    // Race: requerido solo para Aliado, no permitido para Arma, Tótem, Talismán y Oro
    if (card.type === "Arma" || card.type === "Talismán" || card.type === "Tótem" || card.type === "Oro") {
      if (card.race !== null && card.race !== undefined) {
        return NextResponse.json(
          { error: `${card.type} no puede tener race` },
          { status: 400 }
        );
      }
      card.race = null;
    }

    // Actualizar la carta
    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: {
        name: card.name,
        type: card.type,
        cost: card.cost ?? null,
        power: card.power ?? null,
        race: card.race ?? null,
        isCosmetic: card.isCosmetic || false,
        isRework: card.isRework || false,
        isUnique: card.isUnique || false,
        edition: card.edition,
        banListRE: card.banListRE ?? 3,
        banListRL: card.banListRL ?? 3,
        banListLI: card.banListLI ?? 3,
        isOroIni: card.isOroIni || false,
        image: card.image,
        description: card.description || "",
        baseCardId: card.baseCardId ?? null,
      },
    });

    // Limpiar cache para que la actualización aparezca inmediatamente
    clearCardsCache();

    return NextResponse.json({
      success: true,
      message: `Carta ${cardId} actualizada exitosamente`,
      card: {
        id: updatedCard.id,
        name: updatedCard.name,
        type: updatedCard.type,
        cost: updatedCard.cost,
        power: updatedCard.power,
        race: updatedCard.race,
        isCosmetic: updatedCard.isCosmetic,
        isRework: updatedCard.isRework,
        isUnique: updatedCard.isUnique,
        edition: updatedCard.edition,
        banListRE: updatedCard.banListRE,
        banListRL: updatedCard.banListRL,
        banListLI: updatedCard.banListLI,
        isOroIni: updatedCard.isOroIni,
        image: updatedCard.image,
        description: updatedCard.description,
        baseCardId: updatedCard.baseCardId,
      },
    });
  } catch (error) {
    console.error("Error al actualizar carta:", error);

    // Manejar errores de Prisma
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as any;
      if (prismaError.code === "P2025") {
        return NextResponse.json(
          { error: `La carta con ID ${cardId || "desconocido"} no existe` },
          { status: 404 }
        );
      }
      if (prismaError.code === "P2003") {
        return NextResponse.json(
          { error: "La carta base especificada no existe" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Error al actualizar carta",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/cards
 * Elimina una carta de la base de datos
 * Solo accesible para administradores
 */
export async function DELETE(request: NextRequest) {
  let cardId: string | undefined;
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    cardId = searchParams.get("cardId") || undefined;

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      );
    }

    if (!cardId) {
      return NextResponse.json(
        { error: "cardId es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el usuario es admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    if (!hasAdminAccess(user.role)) {
      return NextResponse.json(
        {
          error:
            "No tienes permiso para realizar esta acción. Se requiere rol de administrador.",
        },
        { status: 403 }
      );
    }

    // Verificar que la carta existe
    const existingCard = await prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!existingCard) {
      return NextResponse.json(
        { error: `La carta con ID ${cardId} no existe` },
        { status: 404 }
      );
    }

    // Eliminar la carta (las cartas alternativas se eliminan en cascada)
    await prisma.card.delete({
      where: { id: cardId },
    });

    // Limpiar cache para que la eliminación aparezca inmediatamente
    clearCardsCache();

    return NextResponse.json({
      success: true,
      message: `Carta ${cardId} eliminada exitosamente`,
    });
  } catch (error) {
    console.error("Error al eliminar carta:", error);

    // Manejar errores de Prisma
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as any;
      if (prismaError.code === "P2025") {
        return NextResponse.json(
          { error: `La carta con ID ${cardId || "desconocido"} no existe` },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Error al eliminar carta",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

