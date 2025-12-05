const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface BannerSetting {
  id?: string;
  context: string;
  viewMode?: string;
  device?: string;
  backgroundImageId?: string | null;
  backgroundPositionX: number;
  backgroundPositionY: number;
  backgroundSize: string;
  height: number;
  overlayOpacity: number;
  overlayGradient: string;
  createdAt?: number;
  updatedAt?: number;
}

/**
 * Obtener ajustes de banners
 */
export async function getBannerSettings(
  userId: string,
  context?: string,
  viewMode?: string,
  device?: string,
  backgroundImageId?: string | null
): Promise<BannerSetting[]> {
  try {
    const url = API_BASE_URL
      ? `${API_BASE_URL}/api/admin/banner-settings`
      : `/api/admin/banner-settings`;

    const params = new URLSearchParams({ userId });
    if (context) params.append("context", context);
    if (viewMode) params.append("viewMode", viewMode);
    if (device) params.append("device", device);
    if (backgroundImageId !== undefined) {
      params.append("backgroundImageId", backgroundImageId || "");
    }

    const response = await fetch(`${url}?${params.toString()}`, {
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

/**
 * Eliminar ajuste de banner
 */
export async function deleteBannerSetting(
  userId: string,
  id: string
): Promise<boolean> {
  try {
    const url = API_BASE_URL
      ? `${API_BASE_URL}/api/admin/banner-settings`
      : `/api/admin/banner-settings`;

    const params = new URLSearchParams({ userId, id });

    const response = await fetch(`${url}?${params.toString()}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Error al eliminar ajuste de banner");
    }

    return true;
  } catch (error) {
    console.error("Error al eliminar ajuste de banner:", error);
    throw error;
  }
}
