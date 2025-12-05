import { useState, useEffect } from "react";

export interface BannerSetting {
  context: string;
  backgroundPosition: string;
  backgroundSize: string;
  height: number;
  overlayOpacity: number;
  overlayGradient: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Hook para obtener ajustes de banners
 */
export function useBannerSettings(context: string) {
  const [setting, setSetting] = useState<BannerSetting | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const url = API_BASE_URL
          ? `${API_BASE_URL}/api/banner-settings`
          : `/api/banner-settings`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Error al obtener ajustes de banners");
        }

        const data = await response.json();
        const foundSetting = data.settings?.find(
          (s: BannerSetting) => s.context === context
        );

        if (foundSetting) {
          setSetting(foundSetting);
        } else {
          // Valores por defecto si no se encuentra
          const defaults: Record<string, BannerSetting> = {
            "mis-mazos": {
              context: "mis-mazos",
              backgroundPosition: "center",
              backgroundSize: "cover",
              height: 128,
              overlayOpacity: 0.6,
              overlayGradient: "to-t",
            },
            "mazos-comunidad": {
              context: "mazos-comunidad",
              backgroundPosition: "center",
              backgroundSize: "cover",
              height: 128,
              overlayOpacity: 0.6,
              overlayGradient: "to-t",
            },
            favoritos: {
              context: "favoritos",
              backgroundPosition: "center",
              backgroundSize: "cover",
              height: 128,
              overlayOpacity: 0.6,
              overlayGradient: "to-t",
            },
            "deck-builder": {
              context: "deck-builder",
              backgroundPosition: "center",
              backgroundSize: "cover",
              height: 80,
              overlayOpacity: 0.7,
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
            backgroundPosition: "center",
            backgroundSize: "cover",
            height: 128,
            overlayOpacity: 0.6,
            overlayGradient: "to-t",
          },
          "mazos-comunidad": {
            context: "mazos-comunidad",
            backgroundPosition: "center",
            backgroundSize: "cover",
            height: 128,
            overlayOpacity: 0.6,
            overlayGradient: "to-t",
          },
          favoritos: {
            context: "favoritos",
            backgroundPosition: "center",
            backgroundSize: "cover",
            height: 128,
            overlayOpacity: 0.6,
            overlayGradient: "to-t",
          },
          "deck-builder": {
            context: "deck-builder",
            backgroundPosition: "center",
            backgroundSize: "cover",
            height: 80,
            overlayOpacity: 0.7,
            overlayGradient: "to-t",
          },
        };
        setSetting(defaults[context] || defaults["mis-mazos"]);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, [context]);

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
    backgroundPosition: "center",
    backgroundSize: "cover",
    height: 128,
    overlayOpacity: 0.6,
    overlayGradient: "to-t",
  };

  const s = setting || defaultSetting;

  return {
    backgroundImage: `url(${backgroundImage})`,
    backgroundPosition: s.backgroundPosition,
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
    backgroundPosition: "center",
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

