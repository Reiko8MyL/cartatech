// Configuración centralizada de anuncios
export interface AdConfig {
  adSlot: string
  adFormat: string
  responsive?: boolean
  style?: React.CSSProperties
}

export const AD_SIZES = {
  BANNER: { width: 728, height: 90 }, // Leaderboard
  LARGE_BANNER: { width: 970, height: 250 }, // Billboard
  RECTANGLE: { width: 300, height: 250 }, // Medium Rectangle
  SKYSCRAPER: { width: 160, height: 600 }, // Wide Skyscraper
  MOBILE_BANNER: { width: 320, height: 50 }, // Mobile Banner
} as const

export const AD_POSITIONS = {
  TOP: "top",
  SIDEBAR: "sidebar",
  INLINE: "inline",
  FOOTER: "footer",
} as const

export type AdPosition = (typeof AD_POSITIONS)[keyof typeof AD_POSITIONS]

// Configuración de anuncios por posición
export const getAdConfig = (position: AdPosition): AdConfig => {
  switch (position) {
    case AD_POSITIONS.TOP:
      return {
        adSlot: "top-banner",
        adFormat: "auto",
        responsive: true,
        style: { display: "block", width: "100%", maxWidth: "728px", margin: "0 auto" },
      }
    case AD_POSITIONS.SIDEBAR:
      return {
        adSlot: "sidebar",
        adFormat: "auto",
        responsive: true,
        style: { display: "block", width: "100%", maxWidth: "300px", margin: "0 auto" },
      }
    case AD_POSITIONS.INLINE:
      return {
        adSlot: "inline",
        adFormat: "auto",
        responsive: true,
        style: { display: "block", width: "100%", maxWidth: "728px", margin: "1rem auto" },
      }
    case AD_POSITIONS.FOOTER:
      return {
        adSlot: "footer",
        adFormat: "auto",
        responsive: true,
        style: { display: "block", width: "100%", maxWidth: "728px", margin: "1rem auto" },
      }
    default:
      return {
        adSlot: "default",
        adFormat: "auto",
        responsive: true,
      }
  }
}





















