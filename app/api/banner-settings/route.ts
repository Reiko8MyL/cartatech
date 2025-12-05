import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET - Obtener ajustes de banners (público)
 * Retorna los ajustes de banners según los parámetros
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const context = searchParams.get("context");
    const viewMode = searchParams.get("viewMode") || "grid";
    const device = searchParams.get("device") || "desktop";
    const backgroundImageId = searchParams.get("backgroundImageId");

    // Construir filtros
    const where: any = {};
    if (context) where.context = context;
    where.viewMode = viewMode;
    where.device = device;
    
    // Buscar primero ajuste específico para la imagen, luego el genérico
    if (backgroundImageId) {
      where.OR = [
        { backgroundImageId },
        { backgroundImageId: null },
      ];
    } else {
      where.backgroundImageId = null;
    }

    // Obtener ajustes ordenados por especificidad (imagen específica primero)
    const settings = await prisma.deckPanelBannerSettings.findMany({
      where,
      orderBy: [
        { backgroundImageId: { sort: "asc", nulls: "last" } },
      ],
    });

    // Si hay ajuste específico, usarlo; si no, usar el genérico
    const setting = settings.find(s => s.backgroundImageId === backgroundImageId) || settings.find(s => s.backgroundImageId === null);

    // Si no hay ajuste, retornar valores por defecto
    if (!setting) {
      const defaultSettings: Record<string, any> = {
        "mis-mazos": {
          context: "mis-mazos",
          viewMode,
          device,
          backgroundImageId: null,
          backgroundPositionX: 50,
          backgroundPositionY: 50,
          backgroundSize: "cover",
          height: viewMode === "grid" ? 128 : 128,
          overlayOpacity: 0.6,
          overlayGradient: "to-t",
        },
        "mazos-comunidad": {
          context: "mazos-comunidad",
          viewMode,
          device,
          backgroundImageId: null,
          backgroundPositionX: 50,
          backgroundPositionY: 50,
          backgroundSize: "cover",
          height: viewMode === "grid" ? 128 : 128,
          overlayOpacity: 0.6,
          overlayGradient: "to-t",
        },
        favoritos: {
          context: "favoritos",
          viewMode,
          device,
          backgroundImageId: null,
          backgroundPositionX: 50,
          backgroundPositionY: 50,
          backgroundSize: "cover",
          height: viewMode === "grid" ? 128 : 128,
          overlayOpacity: 0.6,
          overlayGradient: "to-t",
        },
        "deck-builder": {
          context: "deck-builder",
          viewMode: "grid",
          device,
          backgroundImageId: null,
          backgroundPositionX: 50,
          backgroundPositionY: 50,
          backgroundSize: "cover",
          height: 80,
          overlayOpacity: 0.7,
          overlayGradient: "to-t",
        },
      };

      return NextResponse.json({
        setting: defaultSettings[context || "mis-mazos"] || defaultSettings["mis-mazos"],
      });
    }

    return NextResponse.json({ setting });
  } catch (error) {
    console.error("Error al obtener ajustes de banners:", error);

    // En caso de error, obtener parámetros de nuevo para valores por defecto
    const searchParams = request.nextUrl.searchParams;
    const contextParam = searchParams.get("context") || "mis-mazos";
    const viewModeParam = searchParams.get("viewMode") || "grid";
    const deviceParam = searchParams.get("device") || "desktop";

    // En caso de error, retornar valores por defecto
    const defaultSetting = {
      context: contextParam,
      viewMode: viewModeParam,
      device: deviceParam,
      backgroundImageId: null,
      backgroundPositionX: 50,
      backgroundPositionY: 50,
      backgroundSize: "cover",
      height: 128,
      overlayOpacity: 0.6,
      overlayGradient: "to-t",
    };

    return NextResponse.json({ setting: defaultSetting });
  }
}
