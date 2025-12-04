import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hasAdminAccess } from "@/lib/auth/authorization";

/**
 * GET - Obtener lista de usuarios
 * Solo accesible para administradores
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const search = searchParams.get("search") || "";

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el usuario es admin
    const admin = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    if (!hasAdminAccess(admin.role)) {
      return NextResponse.json(
        {
          error:
            "No tienes permiso para realizar esta acción. Se requiere rol de administrador.",
        },
        { status: 403 }
      );
    }

    // Construir query de búsqueda
    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Obtener usuarios
    const users = await prisma.user.findMany({
      where,
      take: limit,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            decks: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Formatear usuarios
    const formattedUsers = users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role || "USER",
      createdAt: user.createdAt.getTime(),
      stats: {
        decksCount: user._count.decks,
        commentsCount: user._count.comments,
      },
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error("Error al obtener usuarios:", error);

    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Error al obtener usuarios",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

