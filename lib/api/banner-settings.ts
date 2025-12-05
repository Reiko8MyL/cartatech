const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface BannerSetting {
  id: string;
  context: string;
  backgroundPosition: string;
  backgroundSize: string;
  height: number;
  overlayOpacity: number;
  overlayGradient: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Obtener todos los ajustes de banners
 */
export async function getBannerSettings(
  userId: string
): Promise<BannerSetting[]> {
  try {
    const url = API_BASE_URL
      ? `${API_BASE_URL}/api/admin/banner-settings`
      : `/api/admin/banner-settings`;

    const response = await fetch(`${url}?userId=${userId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Error al obtener ajustes de banners");
    }

    const data = await response.json();
    return data.settings || [];
  } catch (error) {
    console.error("Error al obtener ajustes de banners:", error);
    return [];
  }
}

/**
 * Actualizar ajustes de banners
 */
export async function updateBannerSettings(
  userId: string,
  settings: Omit<BannerSetting, "id" | "createdAt" | "updatedAt">[]
): Promise<BannerSetting[]> {
  try {
    const url = API_BASE_URL
      ? `${API_BASE_URL}/api/admin/banner-settings`
      : `/api/admin/banner-settings`;

    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, settings }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error al actualizar ajustes de banners");
    }

    const data = await response.json();
    return data.settings || [];
  } catch (error) {
    console.error("Error al actualizar ajustes de banners:", error);
    throw error;
  }
}

