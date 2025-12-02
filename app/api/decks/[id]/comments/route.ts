import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

// GET - Obtener comentarios de un mazo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: "ID de mazo es requerido" },
        { status: 400 }
      )
    }

    // Verificar que el mazo existe
    const deck = await prisma.deck.findUnique({
      where: { id },
      select: { id: true, isPublic: true },
    })

    if (!deck) {
      return NextResponse.json(
        { error: "Mazo no encontrado" },
        { status: 404 }
      )
    }

    // Obtener comentarios (solo comentarios principales, no respuestas)
    // Manejar el caso donde la tabla no existe aún (migración pendiente)
    let comments = []
    try {
      comments = await prisma.comment.findMany({
        where: {
          deckId: id,
          parentId: null, // Solo comentarios principales
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    } catch (dbError: any) {
      // Si la tabla no existe (varios códigos de error posibles), retornar array vacío
      const tableNotFound = 
        dbError?.code === "P2001" || 
        dbError?.code === "P2021" ||
        dbError?.code === "P2025" ||
        dbError?.message?.includes("does not exist") || 
        dbError?.message?.includes("not found") ||
        dbError?.message?.includes("relation") && dbError?.message?.includes("does not exist") ||
        dbError?.meta?.target?.includes("comments")
      
      if (tableNotFound) {
        // En desarrollo, loggear el error para debugging
        if (process.env.NODE_ENV === "development") {
          console.warn("Tabla de comentarios no existe. Ejecuta las migraciones de Prisma:", dbError?.message)
        }
        return NextResponse.json({ comments: [] })
      }
      // Re-lanzar otros errores
      throw dbError
    }

    // Convertir fechas a timestamps
    const formattedComments = comments.map((comment) => ({
      ...comment,
      createdAt: comment.createdAt.getTime(),
      updatedAt: comment.updatedAt.getTime(),
      replies: comment.replies.map((reply) => ({
        ...reply,
        createdAt: reply.createdAt.getTime(),
        updatedAt: reply.updatedAt.getTime(),
      })),
    }))

    return NextResponse.json({ comments: formattedComments })
  } catch (error) {
    // Loggear solo en desarrollo para debugging
    if (process.env.NODE_ENV === "development") {
      console.error("Error al obtener comentarios:", error)
      if (error instanceof Error) {
        console.error("Error message:", error.message)
        console.error("Error stack:", error.stack)
      }
      if (error && typeof error === 'object' && 'code' in error) {
        console.error("Prisma error code:", (error as any).code)
      }
    }

    // SIEMPRE retornar array vacío - los comentarios son opcionales y no deben afectar UX
    // No retornar error 500 para evitar errores en la consola del navegador
    return NextResponse.json({ comments: [] })
  }
}

// POST - Crear un comentario
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Logging detallado en desarrollo
    if (process.env.NODE_ENV === "development") {
      console.log("=== POST /api/decks/[id]/comments ===")
      console.log("Deck ID:", id)
    }
    
    let body
    try {
      body = await request.json()
      if (process.env.NODE_ENV === "development") {
        console.log("Body recibido:", JSON.stringify(body, null, 2))
      }
    } catch (parseError) {
      console.error("Error al parsear body JSON:", parseError)
      return NextResponse.json(
        { error: "El cuerpo de la petición no es un JSON válido" },
        { status: 400 }
      )
    }
    
    const { content, userId: rawUserId, parentId } = body
    
    // Limpiar y validar userId
    const userId = typeof rawUserId === "string" ? rawUserId.trim() : rawUserId

    if (!id) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error: ID de mazo no proporcionado")
      }
      return NextResponse.json(
        { error: "ID de mazo es requerido" },
        { status: 400 }
      )
    }

    // Validar que content sea un string no vacío
    const contentStr = typeof content === "string" ? content.trim() : content
    
    if (!contentStr || contentStr.length === 0) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error de validación: content vacío o inválido", {
          content: content,
          contentType: typeof content,
        })
      }
      return NextResponse.json(
        { 
          error: "El contenido del comentario es requerido y no puede estar vacío",
          ...(process.env.NODE_ENV === "development" && {
            received: { content: content, contentType: typeof content }
          })
        },
        { status: 400 }
      )
    }

    if (!userId || typeof userId !== "string" || userId.length === 0) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error de validación: userId inválido", {
          userId: rawUserId,
          userIdType: typeof rawUserId,
          userIdLength: rawUserId?.length,
        })
      }
      return NextResponse.json(
        { 
          error: "ID de usuario es requerido. Por favor, inicia sesión nuevamente.",
          ...(process.env.NODE_ENV === "development" && {
            received: { userId: rawUserId, userIdType: typeof rawUserId }
          })
        },
        { status: 400 }
      )
    }

    // Verificar que el mazo existe y es público
    const deck = await prisma.deck.findUnique({
      where: { id },
      select: { id: true, isPublic: true },
    })

    if (!deck) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error: Mazo no encontrado con ID:", id)
      }
      return NextResponse.json(
        { error: "Mazo no encontrado" },
        { status: 404 }
      )
    }

    if (!deck.isPublic) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error: Intento de comentar en mazo privado. Deck ID:", id, "isPublic:", deck.isPublic)
      }
      return NextResponse.json(
        { error: "Solo se pueden comentar mazos públicos" },
        { status: 403 }
      )
    }
    
    if (process.env.NODE_ENV === "development") {
      console.log("Mazo validado:", { id: deck.id, isPublic: deck.isPublic })
    }

    // Verificar que el usuario existe y obtener su username
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true },
    })

    if (!user) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error: Usuario no encontrado con ID:", userId)
      }
      return NextResponse.json(
        { 
          error: "Usuario no encontrado. Por favor, inicia sesión nuevamente.",
          ...(process.env.NODE_ENV === "development" && {
            userId: userId
          })
        },
        { status: 404 }
      )
    }
    
    if (process.env.NODE_ENV === "development") {
      console.log("Usuario validado:", { id: user.id, username: user.username })
    }

    // Si hay parentId, verificar que el comentario padre existe
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { id: true, deckId: true },
      })

      if (!parentComment) {
        return NextResponse.json(
          { error: "Comentario padre no encontrado" },
          { status: 404 }
        )
      }

      if (parentComment.deckId !== id) {
        return NextResponse.json(
          { error: "El comentario padre no pertenece a este mazo" },
          { status: 400 }
        )
      }
    }

    // Crear el comentario
    // Manejar el caso donde la tabla no existe aún (migración pendiente)
    let comment
    try {
      comment = await prisma.comment.create({
        data: {
          content: contentStr,
          deckId: id,
          userId,
          parentId: parentId ? (typeof parentId === "string" ? parentId.trim() : parentId) : null,
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
    } catch (dbError: any) {
      // Loggear el error completo en desarrollo
      if (process.env.NODE_ENV === "development") {
        console.error("Error de Prisma al crear comentario:", dbError)
        console.error("Error code:", dbError?.code)
        console.error("Error message:", dbError?.message)
        console.error("Error meta:", dbError?.meta)
      }
      
      // Detectar si la tabla no existe - varios códigos de error posibles
      const tableNotFound = 
        dbError?.code === "P2001" || 
        dbError?.code === "P2021" ||
        dbError?.code === "P2025" ||
        dbError?.message?.includes("does not exist") || 
        dbError?.message?.includes("not found") ||
        dbError?.message?.includes("relation") && dbError?.message?.includes("does not exist") ||
        dbError?.meta?.target?.includes("comments")
      
      if (tableNotFound) {
        return NextResponse.json(
          { 
            error: "La funcionalidad de comentarios no está disponible. La tabla de comentarios no existe en la base de datos. Por favor, ejecuta las migraciones de Prisma.",
            ...(process.env.NODE_ENV === "development" && {
              details: `Error: ${dbError?.message || "Tabla no encontrada"}`,
              code: dbError?.code
            })
          },
          { status: 503 }
        )
      }
      
      // Si es un error de foreign key constraint (P2003), el usuario o mazo no existe
      if (dbError?.code === "P2003") {
        const field = dbError?.meta?.field_name || "campo desconocido"
        return NextResponse.json(
          { 
            error: `Error de validación en ${field}. Verifica que el mazo y usuario existan.`,
            ...(process.env.NODE_ENV === "development" && {
              details: dbError?.message,
              field
            })
          },
          { status: 400 }
        )
      }
      
      // Re-lanzar otros errores para que sean manejados por el catch general
      throw dbError
    }

    // Crear notificación para el dueño del mazo (si no es el mismo usuario)
    // Manejar errores silenciosamente - las notificaciones son opcionales
    try {
      const deckOwner = await prisma.deck.findUnique({
        where: { id },
        select: { userId: true },
      })

      if (deckOwner && deckOwner.userId !== userId) {
        try {
          await prisma.notification.create({
            data: {
              userId: deckOwner.userId,
              type: parentId ? "comment_reply" : "comment",
              title: parentId ? "Nueva respuesta a tu comentario" : "Nuevo comentario en tu mazo",
              message: `${user.username} ${parentId ? "respondió a tu comentario" : "comentó en tu mazo"}`,
              link: `/mazo/${id}`,
            },
          })
        } catch (notifError) {
          // Silenciar errores de notificaciones - no crítico
          if (process.env.NODE_ENV === "development") {
            console.debug("Error al crear notificación (no crítico):", notifError)
          }
        }
      }
    } catch (notifError) {
      // Silenciar errores de notificaciones - no crítico
      if (process.env.NODE_ENV === "development") {
        console.debug("Error al obtener dueño del mazo para notificación (no crítico):", notifError)
      }
    }

    return NextResponse.json({
      comment: {
        ...comment,
        createdAt: comment.createdAt.getTime(),
        updatedAt: comment.updatedAt.getTime(),
      },
    })
  } catch (error) {
    // Loggear solo en desarrollo para debugging
    if (process.env.NODE_ENV === "development") {
      console.error("Error al crear comentario:", error)
      if (error instanceof Error) {
        console.error("Error message:", error.message)
        console.error("Error stack:", error.stack)
      }
      if (error && typeof error === 'object' && 'code' in error) {
        const prismaError = error as any
        console.error("Prisma error code:", prismaError.code)
        console.error("Prisma error meta:", prismaError.meta)
      }
    }

    // Retornar error descriptivo pero no 500 para evitar errores en consola
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    
    // Si es un error de tabla no encontrada, retornar 503 (Service Unavailable)
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; message?: string; meta?: any }
      const tableNotFound = 
        prismaError.code === "P2001" || 
        prismaError.code === "P2021" ||
        prismaError.code === "P2025" ||
        prismaError.message?.includes("does not exist") || 
        prismaError.message?.includes("not found") ||
        prismaError.message?.includes("relation") && prismaError.message?.includes("does not exist") ||
        prismaError.meta?.target?.includes("comments")
      
      if (tableNotFound) {
        return NextResponse.json(
          { 
            error: "La funcionalidad de comentarios no está disponible. La tabla de comentarios no existe en la base de datos. Por favor, ejecuta las migraciones de Prisma.",
            ...(process.env.NODE_ENV === "development" && {
              details: `Error: ${prismaError.message || "Tabla no encontrada"}`,
              code: prismaError.code
            })
          },
          { status: 503 }
        )
      }
      
      // Si es un error de foreign key constraint
      if (prismaError.code === "P2003") {
        const field = prismaError.meta?.field_name || "campo desconocido"
        return NextResponse.json(
          { 
            error: `Error de validación en ${field}. Verifica que el mazo y usuario existan.`,
            ...(process.env.NODE_ENV === "development" && {
              details: prismaError.message,
              field
            })
          },
          { status: 400 }
        )
      }
    }

    // Para otros errores, retornar 400 (Bad Request) en lugar de 500
    // Incluir detalles del error en desarrollo para debugging
    return NextResponse.json(
      {
        error: "Error al crear comentario. Por favor, intenta nuevamente.",
        ...(process.env.NODE_ENV === "development" && {
          details: errorMessage,
          ...(error && typeof error === 'object' && 'code' in error && {
            prismaCode: (error as any).code,
          }),
        }),
      },
      { status: 400 }
    )
  }
}

