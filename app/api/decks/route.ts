import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { SavedDeck, DeckCard } from "@/lib/deck-builder/types";
import { checkRateLimit } from "@/lib/rate-limit/rate-limit";
import { log } from "@/lib/logging/logger";
import { sanitizeDeckName, sanitizeDeckDescription } from "@/lib/validation/sanitize";

// GET - Obtener mazos del usuario o mazos públicos
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const publicOnly = searchParams.get("publicOnly") === "true";

    if (publicOnly) {
      // Parámetros de paginación
      const page = parseInt(searchParams.get("page") || "1", 10);
      const limit = parseInt(searchParams.get("limit") || "12", 10);
      const skip = (page - 1) * limit;

      // Parámetros de filtros
      const format = searchParams.get("format") as "RE" | "RL" | "LI" | null;
      const author = searchParams.get("author"); // username del autor
      const dateFrom = searchParams.get("dateFrom"); // fecha desde (timestamp o ISO string)
      const dateTo = searchParams.get("dateTo"); // fecha hasta (timestamp o ISO string)
      const search = searchParams.get("search"); // búsqueda en nombre/descripción
      
      // Parámetros de ordenamiento
      const sortBy = searchParams.get("sortBy") || "publishedAt"; // publishedAt, viewCount, createdAt, likeCount, favoriteCount
      const sortOrder = searchParams.get("sortOrder") || "desc"; // asc, desc
      
      // Parámetros de filtros de popularidad
      const minLikes = parseInt(searchParams.get("minLikes") || "0", 10);
      const minFavorites = parseInt(searchParams.get("minFavorites") || "0", 10);

      // Construir where clause con filtros
      const where: any = {
        isPublic: true,
        publishedAt: { not: null }, // Solo mazos publicados
      };

      // Filtro por formato
      if (format && ["RE", "RL", "LI"].includes(format)) {
        where.format = format;
      }

      // Filtro por autor (username)
      if (author) {
        where.user = {
          username: {
            contains: author,
            mode: "insensitive",
          },
        };
      }

      // Filtro por rango de fechas (publicación)
      if (dateFrom || dateTo) {
        where.publishedAt = {};
        if (dateFrom) {
          // Si es un string de fecha (YYYY-MM-DD), agregar hora 00:00:00
          const fromDateStr = dateFrom.includes("T") ? dateFrom : `${dateFrom}T00:00:00`;
          const fromDate = new Date(fromDateStr);
          where.publishedAt.gte = fromDate;
        }
        if (dateTo) {
          // Si es un string de fecha (YYYY-MM-DD), agregar hora 23:59:59
          const toDateStr = dateTo.includes("T") ? dateTo : `${dateTo}T23:59:59`;
          const toDate = new Date(toDateStr);
          where.publishedAt.lte = toDate;
        }
      }

      // Filtro por búsqueda en nombre/descripción
      if (search && search.trim()) {
        where.OR = [
          {
            name: {
              contains: search.trim(),
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: search.trim(),
              mode: "insensitive",
            },
          },
        ];
      }

      // Construir orderBy según sortBy
      // Para likeCount y favoriteCount, necesitamos ordenar por agregación
      let orderBy: any = {};
      if (sortBy === "viewCount") {
        orderBy = { viewCount: sortOrder };
      } else if (sortBy === "createdAt") {
        orderBy = { createdAt: sortOrder };
      } else if (sortBy === "publishedAt") {
        orderBy = { publishedAt: sortOrder };
      } else if (sortBy === "likeCount" || sortBy === "favoriteCount") {
        // Para likes y favoritos, ordenaremos después de obtener los datos
        // Por ahora, ordenar por publishedAt como fallback
        orderBy = { publishedAt: "desc" };
      } else {
        // Default: ordenar por fecha de publicación
        orderBy = { publishedAt: "desc" };
      }

      // Obtener mazos públicos con filtros (sin paginación inicial para poder filtrar por popularidad)
      const allDecks = await prisma.deck.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
          _count: {
            select: {
              likes: true,
              favorites: true,
            },
          },
        },
        // Solo aplicar orderBy si no es por likes/favoritos (se ordenará después)
        orderBy: (sortBy === "likeCount" || sortBy === "favoriteCount") ? { publishedAt: "desc" } : orderBy,
      });

      // Filtrar por popularidad (mínimo de likes/favoritos)
      let filteredDecks = allDecks.filter((deck) => {
        const likeCount = deck._count?.likes || 0;
        const favoriteCount = deck._count?.favorites || 0;
        return likeCount >= minLikes && favoriteCount >= minFavorites;
      });

      // Ordenar por likes o favoritos si es necesario
      if (sortBy === "likeCount") {
        filteredDecks.sort((a, b) => {
          const aLikes = a._count?.likes || 0;
          const bLikes = b._count?.likes || 0;
          return sortOrder === "desc" ? bLikes - aLikes : aLikes - bLikes;
        });
      } else if (sortBy === "favoriteCount") {
        filteredDecks.sort((a, b) => {
          const aFavorites = a._count?.favorites || 0;
          const bFavorites = b._count?.favorites || 0;
          return sortOrder === "desc" ? bFavorites - aFavorites : aFavorites - bFavorites;
        });
      }

      // Aplicar paginación después de filtrar y ordenar
      const total = filteredDecks.length;
      const paginatedDecks = filteredDecks.slice(skip, skip + limit);

      const formattedDecks = paginatedDecks.map((deck: any) => ({
        id: deck.id,
        name: deck.name,
        description: deck.description,
        cards: deck.cards as unknown as DeckCard[],
        format: deck.format,
        createdAt: deck.createdAt.getTime(),
        userId: deck.userId,
        author: deck.user.username,
        isPublic: deck.isPublic,
        publishedAt: deck.publishedAt?.getTime(),
        techCardId: deck.techCardId,
        backgroundImage: deck.backgroundImage,
        viewCount: deck.viewCount,
        tags: deck.tags,
        likeCount: deck._count?.likes || 0,
        favoriteCount: deck._count?.favorites || 0,
      }));

      const duration = Date.now() - startTime;
      log.api('GET', '/api/decks', 200, duration, { 
        publicOnly: true, 
        filters: { format, author, search, minLikes, minFavorites, sortBy } 
      });

      return NextResponse.json({
        decks: formattedDecks,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      );
    }

    // Parámetros de paginación
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const skip = (page - 1) * limit;

    // Obtener total de mazos del usuario para paginación
    const total = await prisma.deck.count({
      where: {
        userId,
      },
    });

    // Obtener mazos del usuario con paginación
    const decks = await prisma.deck.findMany({
      where: {
        userId,
      },
      orderBy: {
        updatedAt: "desc",
      },
      skip,
      take: limit,
    });

    const formattedUserDecks = decks.map((deck: any) => ({
      id: deck.id,
      name: deck.name,
      description: deck.description,
      cards: deck.cards as DeckCard[],
      format: deck.format,
      createdAt: deck.createdAt.getTime(),
      userId: deck.userId,
      isPublic: deck.isPublic,
      publishedAt: deck.publishedAt?.getTime(),
      techCardId: deck.techCardId,
      backgroundImage: deck.backgroundImage,
      viewCount: deck.viewCount,
      tags: deck.tags,
    }));

      const duration = Date.now() - startTime;
      log.api('GET', '/api/decks', 200, duration);

      return NextResponse.json({
        decks: formattedUserDecks,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
  } catch (error) {
    const duration = Date.now() - startTime;
    log.prisma('getDecks', error, { duration });
    return NextResponse.json(
      { error: "Error al obtener mazos" },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo mazo
export async function POST(request: NextRequest) {
  // Rate limiting para escritura
  const rateLimit = checkRateLimit(request);
  if (rateLimit?.limit) {
    log.warn("Rate limit exceeded for deck creation", {
      identifier: request.headers.get('x-forwarded-for') || 'unknown',
    });
    return NextResponse.json(
      { 
        error: "Demasiadas solicitudes. Por favor, intenta de nuevo más tarde.",
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
    const { userId, deck } = body as { userId: string; deck: SavedDeck };

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      );
    }

    // Si el mazo tiene un ID, NO crear uno nuevo - debería usar PUT en su lugar
    if (deck.id) {
      log.warn("Intento de crear mazo con ID existente", { deckId: deck.id });
      return NextResponse.json(
        { error: "No se puede crear un mazo con un ID existente. Use PUT para actualizar." },
        { status: 400 }
      );
    }

    // Sanitizar nombre y descripción del mazo
    const sanitizedName = sanitizeDeckName(deck.name);
    if (!sanitizedName) {
      return NextResponse.json(
        { error: "El nombre del mazo es requerido y debe tener entre 1 y 100 caracteres" },
        { status: 400 }
      );
    }

    const sanitizedDescription = sanitizeDeckDescription(deck.description);

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Crear mazo
    const newDeck = await prisma.deck.create({
      data: {
        name: sanitizedName,
        description: sanitizedDescription,
        cards: deck.cards as any,
        format: deck.format || "RE",
        userId,
        isPublic: deck.isPublic || false,
        publishedAt: deck.publishedAt ? new Date(deck.publishedAt) : null,
        techCardId: deck.techCardId,
        backgroundImage: deck.backgroundImage || null,
        tags: deck.tags || [],
      },
    });

    // Crear versión inicial del mazo
    await prisma.deckVersion.create({
      data: {
        deckId: newDeck.id,
        userId,
        name: deck.name,
        description: deck.description,
        cards: deck.cards as any,
        format: deck.format || "RE",
        tags: deck.tags || [],
      },
    });

    const duration = Date.now() - startTime;
    log.api('POST', '/api/decks', 200, duration);

    return NextResponse.json({
      deck: {
        id: newDeck.id,
        name: newDeck.name,
        description: newDeck.description,
        cards: newDeck.cards as unknown as DeckCard[],
        format: newDeck.format,
        createdAt: newDeck.createdAt.getTime(),
        userId: newDeck.userId,
        isPublic: newDeck.isPublic,
        publishedAt: newDeck.publishedAt?.getTime(),
        techCardId: newDeck.techCardId,
        backgroundImage: newDeck.backgroundImage,
        viewCount: newDeck.viewCount,
        tags: newDeck.tags,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    log.prisma('createDeck', error, { duration });
    
    // Asegurar que siempre devolvemos un JSON válido
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al crear mazo";
    const errorDetails = process.env.NODE_ENV === "development" ? errorMessage : undefined;
    
    return NextResponse.json(
      { 
        error: "Error al crear mazo",
        ...(errorDetails && { details: errorDetails })
      },
      { 
        status: 500,
        headers: {
          "Content-Type": "application/json",
        }
      }
    );
  }
}
