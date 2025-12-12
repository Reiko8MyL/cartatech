import { useState, useEffect, useRef, useMemo } from "react";

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
// Función helper para obtener valores por defecto
function getDefaultSetting(
  context: string,
  viewMode: string,
  device: string
): BannerSetting {
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
  return defaults[context] || defaults["mis-mazos"];
}

export function useBannerSettings(
  context: string,
  viewMode: string = "grid",
  device: string = "desktop",
  backgroundImageId?: string | null
) {
  // Inicializar con valores por defecto inmediatamente para evitar layout shift
  const [setting, setSetting] = useState<BannerSetting | null>(() => 
    getDefaultSetting(context, viewMode, device)
  );
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

        // Agregar timestamp para evitar cache del navegador
        params.append("_t", Date.now().toString());

        const response = await fetch(`${url}?${params.toString()}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Error al obtener ajustes de banners");
        }

        const data = await response.json();
        
        if (data.setting) {
          setSetting(data.setting);
        } else {
          // Usar valores por defecto si no se encuentra
          setSetting(getDefaultSetting(context, viewMode, device));
        }
      } catch (error) {
        console.error("Error al cargar ajustes de banners:", error);
        // Usar valores por defecto en caso de error
        setSetting(getDefaultSetting(context, viewMode, device));
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
 * Siempre retorna dimensiones fijas para evitar layout shift
 */
export function getBannerStyle(
  backgroundImage: string,
  setting: BannerSetting | null,
  deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop',
  viewMode: 'grid' | 'list' = 'grid'
): React.CSSProperties {
  const defaultSetting: BannerSetting = {
    context: "default",
    backgroundPositionX: 50,
    backgroundPositionY: 50,
    backgroundSize: "cover",
    height: viewMode === "grid" ? 128 : 128,
    overlayOpacity: 0.6,
    overlayGradient: "to-t",
  };

  const s = setting || defaultSetting;

  // Optimizar URL de Cloudinary si es necesario
  // Para banners, usar isBanner=true para mantener resolución completa
  let optimizedImage = backgroundImage;
  if (backgroundImage && backgroundImage.includes('res.cloudinary.com')) {
    const { optimizeCloudinaryUrl } = require('@/lib/deck-builder/cloudinary-utils');
    optimizedImage = optimizeCloudinaryUrl(backgroundImage, deviceType, true); // isBanner=true
  }

  // Pre-cargar la imagen de forma más eficiente para evitar layout shift
  if (typeof window !== 'undefined' && optimizedImage) {
    // Usar un Set global para trackear imágenes ya pre-cargadas
    if (!(window as any).__preloadedImages) {
      (window as any).__preloadedImages = new Set<string>();
    }
    
    if (!(window as any).__preloadedImages.has(optimizedImage)) {
      (window as any).__preloadedImages.add(optimizedImage);
      
      // Pre-cargar usando HTMLImageElement con callback para asegurar carga
      const img = new window.Image();
      img.onload = () => {
        // Imagen cargada, disparar evento personalizado para actualizar componentes si es necesario
        window.dispatchEvent(new CustomEvent('bannerImageLoaded', { detail: { url: optimizedImage } }));
      };
      img.src = optimizedImage;
      
      // También agregar link preload para navegadores que lo soporten (solo una vez)
      if (!document.querySelector(`link[rel="preload"][href="${optimizedImage}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = optimizedImage;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
    }
  }

  // Calcular altura final - siempre usar valores fijos para evitar layout shift
  const defaultHeight = viewMode === "grid" ? 128 : 128;
  const finalHeight = s.height || defaultHeight;
  
  // Asegurar que backgroundPosition esté definido desde el inicio
  const backgroundPosition = `${s.backgroundPositionX}% ${s.backgroundPositionY}%`;
  
  return {
    // Dimensiones fijas desde el inicio para evitar layout shift
    height: `${finalHeight}px`,
    minHeight: `${finalHeight}px`,
    maxHeight: `${finalHeight}px`,
    // No establecer width aquí - dejar que Tailwind lo maneje (w-full sm:w-48)
    // Estilos de fondo - aplicar desde el inicio incluso si la imagen aún no carga
    backgroundImage: optimizedImage ? `url(${optimizedImage})` : undefined,
    backgroundPosition: backgroundPosition,
    backgroundSize: s.backgroundSize,
    backgroundRepeat: 'no-repeat',
    // Asegurar que el contenedor mantenga sus dimensiones
    boxSizing: 'border-box',
    // Optimizaciones de renderizado
    willChange: 'background-position',
    // Asegurar que el contenido no cause overflow
    overflow: 'hidden',
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
  // Almacenar ajustes para ambos viewModes: { imageId: { grid: setting, list: setting } }
  type SettingsByViewMode = Map<string | null, { grid: BannerSetting | null; list: BannerSetting | null }>;
  
  const defaultGridSetting = getDefaultSetting(context, "grid", device);
  const defaultListSetting = getDefaultSetting(context, "list", device);
  
  const [settingsByViewMode, setSettingsByViewMode] = useState<SettingsByViewMode>(() => {
    const initialMap = new Map<string | null, { grid: BannerSetting | null; list: BannerSetting | null }>();
    // Inicializar todos los imageIds con valores por defecto para ambos modos
    imageIds.forEach(imageId => {
      initialMap.set(imageId, {
        grid: defaultGridSetting,
        list: defaultListSetting,
      });
    });
    return initialMap;
  });
  const [isLoading, setIsLoading] = useState(true);
  const loadedViewModesRef = useRef<Set<string>>(new Set());

  // Precargar ajustes para ambos viewModes al inicio
  useEffect(() => {
    async function loadAllViewModes() {
      if (imageIds.length === 0) {
        setIsLoading(false);
        return;
      }

      const viewModesToLoad: ("grid" | "list")[] = [];
      if (!loadedViewModesRef.current.has("grid")) viewModesToLoad.push("grid");
      if (!loadedViewModesRef.current.has("list")) viewModesToLoad.push("list");

      if (viewModesToLoad.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        const url = API_BASE_URL
          ? `${API_BASE_URL}/api/banner-settings`
          : `/api/banner-settings`;

        // Cargar ajustes para todos los viewModes necesarios
        const allPromises = viewModesToLoad.flatMap(mode => 
          imageIds.map(async (imageId) => {
            const params = new URLSearchParams({
              context,
              viewMode: mode,
              device,
            });
            if (imageId !== undefined && imageId !== null) {
              params.append("backgroundImageId", imageId);
            }
            params.append("_t", Date.now().toString());

            try {
              const response = await fetch(`${url}?${params.toString()}`, {
                cache: "no-store",
              });
              if (!response.ok) {
                return { imageId, viewMode: mode, setting: getDefaultSetting(context, mode, device) };
              }
              const data = await response.json();
              return { imageId, viewMode: mode, setting: data.setting || getDefaultSetting(context, mode, device) };
            } catch (error) {
              return { imageId, viewMode: mode, setting: getDefaultSetting(context, mode, device) };
            }
          })
        );

        const results = await Promise.all(allPromises);

        setSettingsByViewMode(prevMap => {
          const newMap = new Map(prevMap);
          
          results.forEach(({ imageId, viewMode: mode, setting }) => {
            const current = newMap.get(imageId) || { grid: defaultGridSetting, list: defaultListSetting };
            if (mode === "grid") {
              newMap.set(imageId, { ...current, grid: setting });
            } else {
              newMap.set(imageId, { ...current, list: setting });
            }
          });

          // Asegurar que todos los imageIds tengan ajustes para ambos modos
          imageIds.forEach(imageId => {
            if (!newMap.has(imageId)) {
              newMap.set(imageId, {
                grid: defaultGridSetting,
                list: defaultListSetting,
              });
            } else {
              const current = newMap.get(imageId)!;
              if (!current.grid) current.grid = defaultGridSetting;
              if (!current.list) current.list = defaultListSetting;
            }
          });

          return newMap;
        });

        viewModesToLoad.forEach(mode => loadedViewModesRef.current.add(mode));
      } catch (error) {
        console.error("Error al cargar ajustes de banners:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadAllViewModes();
  }, [context, device, JSON.stringify(imageIds)]);

  // Obtener el mapa de ajustes para el viewMode actual
  const settingsMap = useMemo(() => {
    const map = new Map<string | null, BannerSetting | null>();
    settingsByViewMode.forEach((settings, imageId) => {
      const setting = viewMode === "grid" ? settings.grid : settings.list;
      map.set(imageId, setting);
    });
    return map;
  }, [settingsByViewMode, viewMode]);

  return { settingsMap, isLoading };
}
