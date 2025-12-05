import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hasAdminAccess } from "@/lib/auth/authorization";

/**
 * POST - Subir imagen de banner a Cloudinary
 * Solo accesible para administradores
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userId = formData.get("userId") as string;
    const file = formData.get("file") as File;
    const race = formData.get("race") as string;

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: "Archivo es requerido" },
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

    // Subir a Cloudinary usando unsigned upload
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dpbmbrekj";
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || "ml_unsigned";

    if (!cloudName) {
      return NextResponse.json(
        { error: "Cloudinary no está configurado" },
        { status: 500 }
      );
    }

    // Crear FormData para Cloudinary
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append("file", file);
    cloudinaryFormData.append("upload_preset", uploadPreset);
    cloudinaryFormData.append("folder", "banner-images");
    cloudinaryFormData.append("public_id", `banner_${race || "custom"}_${Date.now()}`);

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: cloudinaryFormData,
      }
    );

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      console.error("Error al subir a Cloudinary:", errorData);
      return NextResponse.json(
        { error: "Error al subir la imagen a Cloudinary" },
        { status: 500 }
      );
    }

    const uploadData = await uploadResponse.json();

    return NextResponse.json({
      url: uploadData.secure_url,
      publicId: uploadData.public_id,
      race: race || "Custom",
    });
  } catch (error) {
    console.error("Error al subir imagen de banner:", error);

    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Error al subir imagen de banner",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

