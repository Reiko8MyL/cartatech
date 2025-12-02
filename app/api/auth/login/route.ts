import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Usuario y contraseña son requeridos" },
        { status: 400 }
      );
    }

    // Buscar usuario
    const user = await prisma.user.findFirst({
      where: {
        username: { equals: username, mode: "insensitive" },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario o contraseña incorrectos" },
        { status: 401 }
      );
    }

    // Verificar contraseña
    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Usuario o contraseña incorrectos" },
        { status: 401 }
      );
    }

    // Retornar usuario sin contraseña
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: {
        ...userWithoutPassword,
        createdAt: user.createdAt.getTime(),
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    
    // Log detallado para debugging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    // Si es un error de Prisma, log más detalles
    if (error && typeof error === 'object' && 'code' in error) {
      console.error("Prisma error code:", (error as any).code);
      console.error("Prisma error meta:", (error as any).meta);
    }
    
    return NextResponse.json(
      { 
        error: "Error al iniciar sesión",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error)
        })
      },
      { status: 500 }
    );
  }
}


