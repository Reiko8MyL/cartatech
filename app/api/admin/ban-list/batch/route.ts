import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hasAdminAccess } from "@/lib/auth/authorization";
import { getBaseCardId } from "@/lib/deck-builder/utils";
import { updateCardBanList, clearCardsCache } from "@/lib/deck-builder/cards-db";

/**
 * PUT /api/admin/ban-list/batch
 * Actualiza el ban list de múltiples cartas en una sola operación
 * Solo accesible para administradores
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, updates } = body;

    if (!userId || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "userId y updates (array) son requeridos" },
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

    // Validar cada actualización
    for (const update of updates) {
      const { cardId, format, value } = update;

      if (!cardId || !format || value === undefined) {
        return NextResponse.json(
          { error: "Cada update debe tener cardId, format y value" },
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
    }

    // Agrupar actualizaciones por formato y carta base para optimizar
    const updateMap = new Map<string, { format: "RE" | "RL" | "LI"; value: number }[]>();
    
    for (const update of updates) {
      const baseId = getBaseCardId(update.cardId);
      const key = `${baseId}_${update.format}`;
      
      if (!updateMap.has(key)) {
        updateMap.set(key, []);
      }
      
      updateMap.get(key)!.push({
        format: update.format,
        value: update.value,
      });
    }

    // Ejecutar todas las actualizaciones
    const results: Array<{ cardId: string; format: string; success: boolean; updated?: number; error?: string }> = [];
    
    for (const update of updates) {
      const baseId = getBaseCardId(update.cardId);
      
      try {
        // Verificar que la carta existe
        const cardExists = await prisma.card.findUnique({
          where: { id: baseId },
          select: { id: true },
        });

        if (!cardExists) {
          results.push({
            cardId: baseId,
            format: update.format,
            success: false,
            error: `Carta ${baseId} no encontrada`,
          });
          continue;
        }

        // Actualizar ban list
        const result = await updateCardBanList(baseId, update.format, update.value);
        
        results.push({
          cardId: baseId,
          format: update.format,
          success: true,
          updated: result.updated,
        });
      } catch (error) {
        console.error(`Error al actualizar ${baseId}:`, error);
        results.push({
          cardId: baseId,
          format: update.format,
          success: false,
          error: error instanceof Error ? error.message : "Error desconocido",
        });
      }
    }

    // Limpiar cache después de todas las actualizaciones
    clearCardsCache();

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: failCount === 0,
      message: `${successCount} carta(s) actualizada(s) exitosamente${failCount > 0 ? `, ${failCount} fallaron` : ""}`,
      results,
      summary: {
        total: updates.length,
        successful: successCount,
        failed: failCount,
      },
    });
  } catch (error) {
    console.error("Error al actualizar ban list en batch:", error);

    return NextResponse.json(
      {
        error: "Error al actualizar ban list en batch",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

