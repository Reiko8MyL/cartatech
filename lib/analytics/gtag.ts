// Utilidades para Google Analytics 4 (GA4)

declare global {
  interface Window {
    gtag: (
      command: "config" | "event" | "js" | "set",
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
    dataLayer: any[];
  }
}

/**
 * Verifica si Google Analytics está disponible
 */
export const isGAEnabled = (): boolean => {
  return (
    typeof window !== "undefined" &&
    typeof window.gtag === "function" &&
    !!process.env.NEXT_PUBLIC_GA_ID
  );
};

/**
 * Envía un pageview a Google Analytics 4
 * @param url - La URL de la página (ej: "/mazo/123")
 */
export const pageview = (url: string) => {
  if (!isGAEnabled()) return;

  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (!gaId) return;

  window.gtag("config", gaId, {
    page_path: url,
    page_title: document.title,
    page_location: window.location.href,
  });
};

/**
 * Envía un evento personalizado a Google Analytics 4
 * @param eventName - Nombre del evento (ej: "deck_created")
 * @param parameters - Parámetros adicionales del evento
 */
export const event = (
  eventName: string,
  parameters?: Record<string, any>
) => {
  if (!isGAEnabled()) return;

  window.gtag("event", eventName, {
    ...parameters,
    // Agregar timestamp para mejor tracking
    timestamp: new Date().toISOString(),
  });
};

/**
 * Envía un evento con la estructura legacy (para compatibilidad)
 * @deprecated Usar event() directamente con parámetros GA4
 */
export const legacyEvent = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (!isGAEnabled()) return;

  // Convertir a formato GA4
  const parameters: Record<string, any> = {
    event_category: category,
  };

  if (label) {
    parameters.event_label = label;
  }

  if (value !== undefined) {
    parameters.value = value;
  }

  window.gtag("event", action, parameters);
};

/**
 * Configura parámetros personalizados del usuario
 * @param userId - ID del usuario (opcional, para tracking de usuarios autenticados)
 * @param customParams - Parámetros personalizados adicionales
 */
export const setUserProperties = (
  userId?: string,
  customParams?: Record<string, any>
) => {
  if (!isGAEnabled()) return;

  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (!gaId) return;

  const config: Record<string, any> = {
    ...customParams,
  };

  if (userId) {
    config.user_id = userId;
  }

  window.gtag("set", "user_properties", config);
};

/**
 * Limpia los parámetros del usuario (útil para logout)
 */
export const clearUserProperties = () => {
  if (!isGAEnabled()) return;

  window.gtag("set", "user_properties", {
    user_id: null,
  });
};

