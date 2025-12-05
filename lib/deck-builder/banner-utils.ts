/**
 * Obtiene el ID único de una imagen de fondo desde su URL
 * Usa la URL completa como ID único
 */
export function getBackgroundImageId(imageUrl: string): string {
  return imageUrl;
}

/**
 * Obtiene todas las imágenes de fondo disponibles
 */
export function getAllBackgroundImages(): Array<{ id: string; url: string; race: string }> {
  return [
    {
      id: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435845/Caballero_Lancelot_yktyqi.webp",
      url: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435845/Caballero_Lancelot_yktyqi.webp",
      race: "Caballero",
    },
    {
      id: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435846/dragon_dem_iuixsa.webp",
      url: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435846/dragon_dem_iuixsa.webp",
      race: "Dragón",
    },
    {
      id: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435846/faerie_nim_elqmid.webp",
      url: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435846/faerie_nim_elqmid.webp",
      race: "Faerie",
    },
    {
      id: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435846/heroe_leonidas_fhiwcj.webp",
      url: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435846/heroe_leonidas_fhiwcj.webp",
      race: "Héroe",
    },
    {
      id: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435846/olimpico_zeus_xcq0lg.webp",
      url: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435846/olimpico_zeus_xcq0lg.webp",
      race: "Olímpico",
    },
    {
      id: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435849/titan_cron_whvnwe.webp",
      url: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435849/titan_cron_whvnwe.webp",
      race: "Titán",
    },
    {
      id: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435846/Defensor_Fergus_mwqmua.webp",
      url: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435846/Defensor_Fergus_mwqmua.webp",
      race: "Defensor",
    },
    {
      id: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435846/desafiante_mac_fcx7cl.webp",
      url: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435846/desafiante_mac_fcx7cl.webp",
      race: "Desafiante",
    },
    {
      id: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435847/SOMBRA_CAO_z0awvj.webp",
      url: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435847/SOMBRA_CAO_z0awvj.webp",
      race: "Sombra",
    },
    {
      id: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435845/eterno_heka_pks5d3.webp",
      url: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435845/eterno_heka_pks5d3.webp",
      race: "Eterno",
    },
    {
      id: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435846/faraon_necho_1_zn7zuy.webp",
      url: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435846/faraon_necho_1_zn7zuy.webp",
      race: "Faraón",
    },
    {
      id: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435846/sacer_quika_gv4nzi.webp",
      url: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435846/sacer_quika_gv4nzi.webp",
      race: "Sacerdote",
    },
  ];
}

