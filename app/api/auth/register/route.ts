import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/utils";
import { checkRateLimit } from "@/lib/rate-limit/rate-limit";
import { log } from "@/lib/logging/logger";

export async function POST(request: NextRequest) {
  // Rate limiting para autenticación
  const rateLimit = checkRateLimit(request);
  if (rateLimit?.limit) {
    log.warn("Rate limit exceeded for register", {
      identifier: request.headers.get('x-forwarded-for') || 'unknown',
    });
    return NextResponse.json(
      { 
        error: "Demasiados intentos de registro. Por favor, intenta de nuevo más tarde.",
        retryAfter: rateLimit.retryAfter,
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetAt.toString(),
          'Retry-After': (rateLimit.retryAfter || 60).toString(),
        },
      }
    );
  }

  const startTime = Date.now();
  try {
    const body = await request.json();
    const { username, email, password } = body;

    // Validaciones básicas
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "Formato de email inválido" },
        { status: 400 }
      );
    }

    // Validar contraseña: al menos 8 caracteres, una mayúscula y un número
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres, una letra mayúscula y un número" },
        { status: 400 }
      );
    }

    // Verificar si el username ya existe
    const existingUsername = await prisma.user.findFirst({
      where: {
        username: { equals: username.trim(), mode: "insensitive" },
      },
    });

    if (existingUsername) {
      return NextResponse.json(
        { error: "El nombre de usuario ya está en uso" },
        { status: 409 }
      );
    }

    // Verificar si el email ya existe
    const existingEmail = await prisma.user.findFirst({
      where: {
        email: { equals: email.trim().toLowerCase(), mode: "insensitive" },
      },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "El email ya está en uso" },
        { status: 409 }
      );
    }

    // Hashear contraseña
    const hashedPassword = await hashPassword(password);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        username,
        email: email.toLowerCase(),
        password: hashedPassword,
        // role se asigna automáticamente como "USER" por el default en el schema
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    const duration = Date.now() - startTime;
    log.api('POST', '/api/auth/register', 201, duration);

    return NextResponse.json(
      {
        user: {
          ...user,
          createdAt: user.createdAt.getTime(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    log.prisma('register', error, { duration });
    
    // Devolver un mensaje de error más específico
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    
    return NextResponse.json(
      { 
        error: "Error al registrar usuario",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

