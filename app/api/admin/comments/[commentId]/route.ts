import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hasModeratorAccess } from "@/lib/auth/authorization";

/**
 * DELETE - Eliminar un comentario (solo para moderadores/admins)
 * Esta API permite que moderadores y administradores eliminen cualquier comentario
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el usuario es moderador o admin
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

    if (!hasModeratorAccess(user.role)) {
      return NextResponse.json(
        { error: "No tienes permiso para realizar esta acción. Se requiere rol de moderador o administrador." },
        { status: 403 }
      );
    }

    // Verificar que el comentario existe
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, userId: true, deckId: true, content: true },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Comentario no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar el comentario (las respuestas se eliminan en cascada)
    await prisma.comment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({
      success: true,
      message: "Comentario eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar comentario (admin):", error);

    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Error al eliminar comentario",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

