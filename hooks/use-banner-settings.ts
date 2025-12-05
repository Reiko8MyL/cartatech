import { useState, useEffect } from "react";

export interface BannerSetting {
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
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Hook para obtener ajustes de banners
 */
export function useBannerSettings(
  context: string,
  viewMode: string = "grid",
  device: string = "desktop",
  backgroundImageId?: string | null
) {
  const [setting, setSetting] = useState<BannerSetting | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const params = new URLSearchParams({
          context,
          viewMode,
          device,
        });
        if (backgroundImageId !== undefined) {
          params.append("backgroundImageId", backgroundImageId || "");
        }

        const url = API_BASE_URL
          ? `${API_BASE_URL}/api/banner-settings`
          : `/api/banner-settings`;

        const response = await fetch(`${url}?${params.toString()}`);
        if (!response.ok) {
          throw new Error("Error al obtener ajustes de banners");
        }

        const data = await response.json();
        
        if (data.setting) {
          setSetting(data.setting);
        } else {
          // Valores por defecto si no se encuentra
          const defaults: Record<string, BannerSetting> = {
            "mis-mazos": {
              context: "mis-mazos",
              viewMode,
              device,
              backgroundImageId: null,
              backgroundPositionX: 50,
              backgroundPositionY: 50,
              backgroundSize: "cover",
              height: viewMode === "grid" ? 128 : 128,
              overlayOpacity: 0.6,
              overlayGradient: "to-t",
            },
            "mazos-comunidad": {
              context: "mazos-comunidad",
              viewMode,
              device,
              backgroundImageId: null,
              backgroundPositionX: 50,
              backgroundPositionY: 50,
              backgroundSize: "cover",
              height: viewMode === "grid" ? 128 : 128,
              overlayOpacity: 0.6,
              overlayGradient: "to-t",
            },
            favoritos: {
              context: "favoritos",
              viewMode,
              device,
              backgroundImageId: null,
              backgroundPositionX: 50,
              backgroundPositionY: 50,
              backgroundSize: "cover",
              height: viewMode === "grid" ? 128 : 128,
              overlayOpacity: 0.6,
              overlayGradient: "to-t",
            },
            "deck-builder": {
              context: "deck-builder",
              viewMode: "grid",
              device,
              backgroundImageId: null,
              backgroundPositionX: 50,
              backgroundPositionY: 50,
              backgroundSize: "cover",
              height: 80,
              overlayOpacity: 0.7,
              overlayGradient: "to-t",
            },
            "mazo-individual": {
              context: "mazo-individual",
              viewMode: "grid",
              device,
              backgroundImageId: null,
              backgroundPositionX: 50,
              backgroundPositionY: 50,
              backgroundSize: "cover",
              height: 256,
              overlayOpacity: 0.8,
              overlayGradient: "to-t",
            },
          };
          setSetting(defaults[context] || defaults["mis-mazos"]);
        }
      } catch (error) {
        console.error("Error al cargar ajustes de banners:", error);
        // Usar valores por defecto en caso de error
        const defaults: Record<string, BannerSetting> = {
          "mis-mazos": {
            context: "mis-mazos",
            viewMode,
            device,
            backgroundImageId: null,
            backgroundPositionX: 50,
            backgroundPositionY: 50,
            backgroundSize: "cover",
            height: viewMode === "grid" ? 128 : 128,
            overlayOpacity: 0.6,
            overlayGradient: "to-t",
          },
          "mazos-comunidad": {
            context: "mazos-comunidad",
            viewMode,
            device,
            backgroundImageId: null,
            backgroundPositionX: 50,
            backgroundPositionY: 50,
            backgroundSize: "cover",
            height: viewMode === "grid" ? 128 : 128,
            overlayOpacity: 0.6,
            overlayGradient: "to-t",
          },
          favoritos: {
            context: "favoritos",
            viewMode,
            device,
            backgroundImageId: null,
            backgroundPositionX: 50,
            backgroundPositionY: 50,
            backgroundSize: "cover",
            height: viewMode === "grid" ? 128 : 128,
            overlayOpacity: 0.6,
            overlayGradient: "to-t",
          },
          "deck-builder": {
            context: "deck-builder",
            viewMode: "grid",
            device,
            backgroundImageId: null,
            backgroundPositionX: 50,
            backgroundPositionY: 50,
            backgroundSize: "cover",
            height: 80,
            overlayOpacity: 0.7,
            overlayGradient: "to-t",
          },
          "mazo-individual": {
            context: "mazo-individual",
            viewMode: "grid",
            device,
            backgroundImageId: null,
            backgroundPositionX: 50,
            backgroundPositionY: 50,
            backgroundSize: "cover",
            height: 256,
            overlayOpacity: 0.8,
            overlayGradient: "to-t",
          },
        };
        setSetting(defaults[context] || defaults["mis-mazos"]);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, [context, viewMode, device, backgroundImageId]);

  return { setting, isLoading };
}

/**
 * Función helper para obtener el estilo del banner
 */
export function getBannerStyle(
  backgroundImage: string,
  setting: BannerSetting | null
): React.CSSProperties {
  const defaultSetting: BannerSetting = {
    context: "default",
    backgroundPositionX: 50,
    backgroundPositionY: 50,
    backgroundSize: "cover",
    height: 128,
    overlayOpacity: 0.6,
    overlayGradient: "to-t",
  };

  const s = setting || defaultSetting;

  return {
    backgroundImage: `url(${backgroundImage})`,
    backgroundPosition: `${s.backgroundPositionX}% ${s.backgroundPositionY}%`,
    backgroundSize: s.backgroundSize,
    height: `${s.height}px`,
  };
}

/**
 * Función helper para obtener el estilo del overlay
 */
export function getOverlayStyle(
  setting: BannerSetting | null
): React.CSSProperties {
  const defaultSetting: BannerSetting = {
    context: "default",
    backgroundPositionX: 50,
    backgroundPositionY: 50,
    backgroundSize: "cover",
    height: 128,
    overlayOpacity: 0.6,
    overlayGradient: "to-t",
  };

  const s = setting || defaultSetting;

  const gradientMap: Record<string, string> = {
    "to-t": "to top",
    "to-b": "to bottom",
    "to-l": "to left",
    "to-r": "to right",
  };

  const gradientDirection = gradientMap[s.overlayGradient] || "to top";

  return {
    background: `linear-gradient(${gradientDirection}, rgba(0,0,0,${s.overlayOpacity}) 0%, transparent 100%)`,
  };
}

/**
 * Hook para detectar el dispositivo actual
 */
export function useDeviceType(): "desktop" | "tablet" | "mobile" {
  const [deviceType, setDeviceType] = useState<"desktop" | "tablet" | "mobile">("desktop");

  useEffect(() => {
    function updateDeviceType() {
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceType("mobile");
      } else if (width < 1024) {
        setDeviceType("tablet");
      } else {
        setDeviceType("desktop");
      }
    }

    updateDeviceType();
    window.addEventListener("resize", updateDeviceType);
    return () => window.removeEventListener("resize", updateDeviceType);
  }, []);

  return deviceType;
}

/**
 * Hook para obtener múltiples ajustes de banners (para diferentes imágenes)
 * Útil cuando necesitas ajustes para diferentes imágenes en la misma página
 */
export function useBannerSettingsMap(
  context: string,
  viewMode: string = "grid",
  device: string = "desktop",
  imageIds: (string | null)[]
) {
  const [settingsMap, setSettingsMap] = useState<Map<string | null, BannerSetting | null>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const params = new URLSearchParams({
          context,
          viewMode,
          device,
        });

        const url = API_BASE_URL
          ? `${API_BASE_URL}/api/banner-settings`
          : `/api/banner-settings`;

        // Obtener ajustes para todas las imágenes
        const settingsPromises = imageIds.map(async (imageId) => {
          const imageParams = new URLSearchParams(params);
          if (imageId !== undefined && imageId !== null) {
            imageParams.append("backgroundImageId", imageId);
          }

          const response = await fetch(`${url}?${imageParams.toString()}`);
          if (!response.ok) {
            return { imageId, setting: null };
          }

          const data = await response.json();
          return { imageId, setting: data.setting || null };
        });

        const results = await Promise.all(settingsPromises);
        const newMap = new Map<string | null, BannerSetting | null>();
        
        results.forEach(({ imageId, setting }) => {
          newMap.set(imageId, setting);
        });

        setSettingsMap(newMap);
      } catch (error) {
        console.error("Error al cargar ajustes de banners:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (imageIds.length > 0) {
      loadSettings();
    } else {
      setIsLoading(false);
    }
  }, [context, viewMode, device, JSON.stringify(imageIds)]);

  return { settingsMap, isLoading };
}
