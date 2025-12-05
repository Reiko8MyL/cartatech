import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET - Obtener ajustes de banners (público)
 * Retorna los ajustes de banners para todos los contextos
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener todos los ajustes o crear valores por defecto si no existen
    const contexts = ["mis-mazos", "mazos-comunidad", "favoritos", "deck-builder"];
    const settings = await Promise.all(
      contexts.map(async (context) => {
        let setting = await prisma.deckPanelBannerSettings.findUnique({
          where: { context },
        });

        if (!setting) {
          // Crear valores por defecto según el contexto
          const defaults = {
            "mis-mazos": {
              backgroundPosition: "center",
              backgroundSize: "cover",
              height: 128, // h-32
              overlayOpacity: 0.6,
              overlayGradient: "to-t",
            },
            "mazos-comunidad": {
              backgroundPosition: "center",
              backgroundSize: "cover",
              height: 128, // h-32
              overlayOpacity: 0.6,
              overlayGradient: "to-t",
            },
            favoritos: {
              backgroundPosition: "center",
              backgroundSize: "cover",
              height: 128, // h-32
              overlayOpacity: 0.6,
              overlayGradient: "to-t",
            },
            "deck-builder": {
              backgroundPosition: "center",
              backgroundSize: "cover",
              height: 80, // h-20
              overlayOpacity: 0.7,
              overlayGradient: "to-t",
            },
          };

          setting = await prisma.deckPanelBannerSettings.create({
            data: {
              context,
              ...defaults[context as keyof typeof defaults],
            },
          });
        }

        return {
          context: setting.context,
          backgroundPosition: setting.backgroundPosition,
          backgroundSize: setting.backgroundSize,
          height: setting.height,
          overlayOpacity: setting.overlayOpacity,
          overlayGradient: setting.overlayGradient,
        };
      })
    );

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error al obtener ajustes de banners:", error);

    // En caso de error, retornar valores por defecto
    const defaultSettings = [
      {
        context: "mis-mazos",
        backgroundPosition: "center",
        backgroundSize: "cover",
        height: 128,
        overlayOpacity: 0.6,
        overlayGradient: "to-t",
      },
      {
        context: "mazos-comunidad",
        backgroundPosition: "center",
        backgroundSize: "cover",
        height: 128,
        overlayOpacity: 0.6,
        overlayGradient: "to-t",
      },
      {
        context: "favoritos",
        backgroundPosition: "center",
        backgroundSize: "cover",
        height: 128,
        overlayOpacity: 0.6,
        overlayGradient: "to-t",
      },
      {
        context: "deck-builder",
        backgroundPosition: "center",
        backgroundSize: "cover",
        height: 80,
        overlayOpacity: 0.7,
        overlayGradient: "to-t",
      },
    ];

    return NextResponse.json({ settings: defaultSettings });
  }
}

