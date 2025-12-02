import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

// GET - Obtener notificaciones del usuario
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      )
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    // Obtener notificaciones no leídas primero, luego las leídas
    // Manejar el caso donde la tabla no existe aún (migración pendiente)
    let notifications = []
    try {
      notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: [
          { read: "asc" },
          { createdAt: "desc" },
        ],
        take: 50, // Limitar a 50 notificaciones más recientes
      })
    } catch (dbError: any) {
      // Si la tabla no existe (error P2001 o similar), retornar array vacío
      if (dbError?.code === "P2001" || dbError?.message?.includes("does not exist")) {
        return NextResponse.json({ notifications: [] })
      }
      // Re-lanzar otros errores
      throw dbError
    }

    // Convertir fechas a timestamps
    const formattedNotifications = notifications.map((notification) => ({
      ...notification,
      createdAt: notification.createdAt.getTime(),
    }))

    return NextResponse.json({ notifications: formattedNotifications })
  } catch (error) {
    // Loggear solo en desarrollo para debugging
    if (process.env.NODE_ENV === "development") {
      console.error("Error al obtener notificaciones:", error)
      if (error instanceof Error) {
        console.error("Error message:", error.message)
        console.error("Error stack:", error.stack)
      }
      if (error && typeof error === 'object' && 'code' in error) {
        console.error("Prisma error code:", (error as any).code)
      }
    }

    // SIEMPRE retornar array vacío - las notificaciones son opcionales y no deben afectar UX
    // No retornar error 500 para evitar errores en la consola del navegador
    return NextResponse.json({ notifications: [] })
  }
}

// PUT - Marcar notificaciones como leídas
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, notificationIds } = body

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      )
    }

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: "notificationIds debe ser un array" },
        { status: 400 }
      )
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    // Marcar notificaciones como leídas
    // Manejar el caso donde la tabla no existe aún
    try {
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId, // Asegurar que solo se actualicen las del usuario
        },
        data: {
          read: true,
        },
      })
    } catch (dbError: any) {
      // Si la tabla no existe, simplemente retornar éxito (no crítico)
      if (dbError?.code === "P2001" || dbError?.message?.includes("does not exist")) {
        return NextResponse.json({ success: true })
      }
      // Re-lanzar otros errores
      throw dbError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    // Loggear solo en desarrollo para debugging
    if (process.env.NODE_ENV === "development") {
      console.error("Error al marcar notificaciones como leídas:", error)
      if (error instanceof Error) {
        console.error("Error message:", error.message)
        console.error("Error stack:", error.stack)
      }
      if (error && typeof error === 'object' && 'code' in error) {
        console.error("Prisma error code:", (error as any).code)
      }
    }

    // SIEMPRE retornar éxito - las notificaciones son opcionales y no deben afectar UX
    // No retornar error 500 para evitar errores en la consola del navegador
    return NextResponse.json({ success: true })
  }
}

