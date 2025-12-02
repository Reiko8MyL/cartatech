import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

// PUT - Actualizar un comentario
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id, commentId } = await params
    const body = await request.json()
    const { content, userId } = body

    if (!content || !userId) {
      return NextResponse.json(
        { error: "content y userId son requeridos" },
        { status: 400 }
      )
    }

    // Verificar que el comentario existe y pertenece al usuario
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, userId: true, deckId: true },
    })

    if (!comment) {
      return NextResponse.json(
        { error: "Comentario no encontrado" },
        { status: 404 }
      )
    }

    if (comment.deckId !== id) {
      return NextResponse.json(
        { error: "El comentario no pertenece a este mazo" },
        { status: 400 }
      )
    }

    if (comment.userId !== userId) {
      return NextResponse.json(
        { error: "No tienes permiso para editar este comentario" },
        { status: 403 }
      )
    }

    // Actualizar el comentario
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        replies: [],
      },
    })

    return NextResponse.json({
      comment: {
        ...updatedComment,
        createdAt: updatedComment.createdAt.getTime(),
        updatedAt: updatedComment.updatedAt.getTime(),
      },
    })
  } catch (error) {
    console.error("Error al actualizar comentario:", error)

    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }

    return NextResponse.json(
      {
        error: "Error al actualizar comentario",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar un comentario
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id, commentId } = await params
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      )
    }

    // Verificar que el comentario existe y pertenece al usuario
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, userId: true, deckId: true },
    })

    if (!comment) {
      return NextResponse.json(
        { error: "Comentario no encontrado" },
        { status: 404 }
      )
    }

    if (comment.deckId !== id) {
      return NextResponse.json(
        { error: "El comentario no pertenece a este mazo" },
        { status: 400 }
      )
    }

    if (comment.userId !== userId) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar este comentario" },
        { status: 403 }
      )
    }

    // Eliminar el comentario (las respuestas se eliminan en cascada)
    await prisma.comment.delete({
      where: { id: commentId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al eliminar comentario:", error)

    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }

    return NextResponse.json(
      {
        error: "Error al eliminar comentario",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    )
  }
}

