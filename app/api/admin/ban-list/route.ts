import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hasAdminAccess } from "@/lib/auth/authorization";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { getAllCards, getAlternativeArtCards, getBaseCardId } from "@/lib/deck-builder/utils";

/**
 * GET - Obtener todas las cartas con su ban list actual
 * Solo accesible para administradores
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const format = searchParams.get("format") as "RE" | "RL" | "LI" | null;

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

    // Obtener todas las cartas (principales y alternativas)
    const allCards = getAllCards();
    const altCards = getAlternativeArtCards();

    // Agrupar cartas por ID base para mostrar solo las principales
    // pero incluir información de cuántas alternativas tienen
    const cardsMap = new Map<string, any>();
    const altCardsByBase = new Map<string, any[]>();

    // Procesar cartas alternativas
    for (const altCard of altCards) {
      const baseId = getBaseCardId(altCard.id);
      if (!altCardsByBase.has(baseId)) {
        altCardsByBase.set(baseId, []);
      }
      altCardsByBase.get(baseId)!.push(altCard);
    }

    // Procesar cartas principales
    for (const card of allCards) {
      const baseId = getBaseCardId(card.id);
      if (!cardsMap.has(baseId)) {
        cardsMap.set(baseId, {
          id: baseId,
          name: card.name,
          type: card.type,
          edition: card.edition,
          image: card.image,
          isUnique: card.isUnique,
          banListRE: card.banListRE,
          banListRL: card.banListRL,
          banListLI: card.banListLI,
          alternativeArtsCount: altCardsByBase.get(baseId)?.length || 0,
        });
      }
    }

    const cards = Array.from(cardsMap.values());

    // Si se especifica un formato, ordenar por ban list de ese formato
    if (format) {
      cards.sort((a, b) => {
        const aValue = format === "RE" ? a.banListRE : format === "RL" ? a.banListRL : a.banListLI;
        const bValue = format === "RE" ? b.banListRE : format === "RL" ? b.banListRL : b.banListLI;
        return aValue - bValue;
      });
    }

    return NextResponse.json({ cards });
  } catch (error) {
    console.error("Error al obtener ban list:", error);

    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Error al obtener ban list",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

/**
 * PUT - Actualizar ban list de una carta
 * Solo accesible para administradores
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, cardId, format, value } = body;

    if (!userId || !cardId || !format || value === undefined) {
      return NextResponse.json(
        { error: "userId, cardId, format y value son requeridos" },
        { status: 400 }
      );
    }

    if (!["RE", "RL", "LI"].includes(format)) {
      return NextResponse.json(
        { error: "format debe ser RE, RL o LI" },
        { status: 400 }
      );
    }

    if (![0, 1, 2, 3].includes(value)) {
      return NextResponse.json(
        { error: "value debe ser 0, 1, 2 o 3" },
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

    // Obtener ID base de la carta
    const baseId = getBaseCardId(cardId);

    // Leer archivos de cartas
    const cardsPath = join(process.cwd(), "lib", "data", "cards.js");
    const aacardsPath = join(process.cwd(), "lib", "data", "AAcards.js");

    let cardsContent = readFileSync(cardsPath, "utf-8");
    let aacardsContent = readFileSync(aacardsPath, "utf-8");

    // Escapar caracteres especiales para regex
    const escapedBaseId = baseId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const banListField = `banList${format}`;

    // Actualizar carta principal en cards.js
    // El formato es: { id: "MYL-XXXX", ... banListRE: 1, ... }
    // Usar un regex más específico que busque el campo exacto
    const cardRegex = new RegExp(
      `(id:\\s*"${escapedBaseId}"[^}]*${banListField}:\\s*)\\d+`,
      "g"
    );
    cardsContent = cardsContent.replace(cardRegex, `$1${value}`);

    // Actualizar todas las versiones alternativas en AAcards.js
    // El formato es: { id: "MYL-XXXX-XX", ... banListRE: 1, ... }
    const altCardRegex = new RegExp(
      `(id:\\s*"${escapedBaseId}-[^"]*"[^}]*${banListField}:\\s*)\\d+`,
      "g"
    );
    aacardsContent = aacardsContent.replace(altCardRegex, `$1${value}`);

    // Escribir archivos actualizados
    writeFileSync(cardsPath, cardsContent, "utf-8");
    writeFileSync(aacardsPath, aacardsContent, "utf-8");

    return NextResponse.json({
      success: true,
      message: `Ban list actualizada para ${baseId} y todas sus versiones alternativas`,
    });
  } catch (error) {
    console.error("Error al actualizar ban list:", error);

    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Error al actualizar ban list",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

