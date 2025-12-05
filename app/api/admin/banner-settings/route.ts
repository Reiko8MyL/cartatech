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
    const context = searchParams.get("context");
    const viewMode = searchParams.get("viewMode") || "grid";
    const device = searchParams.get("device") || "desktop";
    const backgroundImageId = searchParams.get("backgroundImageId");

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

    // Construir filtros
    const where: any = {};
    if (context) where.context = context;
    if (viewMode) where.viewMode = viewMode;
    if (device) where.device = device;
    if (backgroundImageId !== null) {
      where.backgroundImageId = backgroundImageId === "" ? null : backgroundImageId;
    }

    // Obtener ajustes
    const settings = await prisma.deckPanelBannerSettings.findMany({
      where,
      orderBy: [
        { context: "asc" },
        { viewMode: "asc" },
        { device: "asc" },
        { backgroundImageId: "asc" },
      ],
    });

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
 * PUT - Actualizar o crear ajustes de banners
 * Solo accesible para administradores
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, settings } = body as {
      userId: string;
      settings: Array<{
        context: string;
        viewMode?: string;
        device?: string;
        backgroundImageId?: string | null;
        backgroundPositionX: number;
        backgroundPositionY: number;
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

    // Actualizar o crear cada ajuste
    const updatedSettings = await Promise.all(
      settings.map(async (setting) => {
        const viewMode = setting.viewMode || "grid";
        const device = setting.device || "desktop";
        const backgroundImageId: string | null = setting.backgroundImageId === "" || setting.backgroundImageId === undefined ? null : setting.backgroundImageId;

        return await prisma.deckPanelBannerSettings.upsert({
          where: {
            context_viewMode_device_backgroundImageId: {
              context: setting.context,
              viewMode,
              device,
              backgroundImageId,
            },
          },
          update: {
            backgroundPositionX: setting.backgroundPositionX,
            backgroundPositionY: setting.backgroundPositionY,
            backgroundSize: setting.backgroundSize,
            height: setting.height,
            overlayOpacity: setting.overlayOpacity,
            overlayGradient: setting.overlayGradient,
          },
          create: {
            context: setting.context,
            viewMode,
            device,
            backgroundImageId,
            backgroundPositionX: setting.backgroundPositionX,
            backgroundPositionY: setting.backgroundPositionY,
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

/**
 * DELETE - Eliminar ajustes de banners
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const id = searchParams.get("id");

    if (!userId || !id) {
      return NextResponse.json(
        { error: "userId e id son requeridos" },
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

    await prisma.deckPanelBannerSettings.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar ajustes de banners:", error);

    return NextResponse.json(
      {
        error: "Error al eliminar ajustes de banners",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}
