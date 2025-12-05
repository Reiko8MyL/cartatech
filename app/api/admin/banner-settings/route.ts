import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hasAdminAccess } from "@/lib/auth/authorization";

/**
 * GET - Obtener todos los ajustes de banners
 * Solo accesible para administradores
 */
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

        return setting;
      })
    );

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error al obtener ajustes de banners:", error);

    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Error al obtener ajustes de banners",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

/**
 * PUT - Actualizar ajustes de banners
 * Solo accesible para administradores
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, settings } = body as {
      userId: string;
      settings: Array<{
        context: string;
        backgroundPosition: string;
        backgroundSize: string;
        height: number;
        overlayOpacity: number;
        overlayGradient: string;
      }>;
    };

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

    // Actualizar cada ajuste
    const updatedSettings = await Promise.all(
      settings.map(async (setting) => {
        return await prisma.deckPanelBannerSettings.upsert({
          where: { context: setting.context },
          update: {
            backgroundPosition: setting.backgroundPosition,
            backgroundSize: setting.backgroundSize,
            height: setting.height,
            overlayOpacity: setting.overlayOpacity,
            overlayGradient: setting.overlayGradient,
          },
          create: {
            context: setting.context,
            backgroundPosition: setting.backgroundPosition,
            backgroundSize: setting.backgroundSize,
            height: setting.height,
            overlayOpacity: setting.overlayOpacity,
            overlayGradient: setting.overlayGradient,
          },
        });
      })
    );

    return NextResponse.json({ settings: updatedSettings });
  } catch (error) {
    console.error("Error al actualizar ajustes de banners:", error);

    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Error al actualizar ajustes de banners",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

