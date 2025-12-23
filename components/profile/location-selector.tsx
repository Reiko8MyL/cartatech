"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { MapPin, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

// Datos simplificados de países, regiones y ciudades
// En producción, esto podría venir de una API o base de datos
const LOCATION_DATA: Record<string, Record<string, string[]>> = {
  "Chile": {
    "Arica y Parinacota": ["Arica", "Putre"],
    "Tarapacá": ["Iquique", "Alto Hospicio", "Pozo Almonte"],
    "Antofagasta": ["Antofagasta", "Calama", "Tocopilla", "Mejillones"],
    "Atacama": ["Copiapó", "Vallenar", "Caldera", "Chañaral"],
    "Coquimbo": ["La Serena", "Coquimbo", "Ovalle", "Illapel"],
    "Valparaíso": ["Valparaíso", "Viña del Mar", "Quilpué", "Villa Alemana", "Quillota", "San Antonio"],
    "Región Metropolitana": ["Santiago", "Puente Alto", "Maipú", "La Florida", "San Bernardo", "Las Condes", "Providencia"],
    "O'Higgins": ["Rancagua", "San Fernando", "Pichilemu", "Rengo"],
    "Maule": ["Talca", "Curicó", "Linares", "Constitución"],
    "Ñuble": ["Chillán", "Bulnes", "San Carlos"],
    "Bío Bío": ["Concepción", "Talcahuano", "Los Ángeles", "Coronel", "Lota"],
    "Araucanía": ["Temuco", "Villarrica", "Pucón", "Angol", "Lautaro"],
    "Los Ríos": ["Valdivia", "La Unión", "Río Bueno"],
    "Los Lagos": ["Puerto Montt", "Osorno", "Castro", "Ancud"],
    "Aysén": ["Coyhaique", "Puerto Aysén"],
    "Magallanes": ["Punta Arenas", "Puerto Natales"],
  },
  "Argentina": {
    "Buenos Aires": ["Buenos Aires", "La Plata", "Mar del Plata", "Bahía Blanca", "Quilmes", "Lanús", "Morón"],
    "Córdoba": ["Córdoba", "Villa María", "Río Cuarto", "Villa Carlos Paz", "San Francisco"],
    "Santa Fe": ["Rosario", "Santa Fe", "Rafaela", "Venado Tuerto", "Reconquista"],
    "Mendoza": ["Mendoza", "San Rafael", "Godoy Cruz"],
    "Tucumán": ["San Miguel de Tucumán", "Yerba Buena"],
    "Salta": ["Salta", "San Salvador de Jujuy"],
  },
  "México": {
    "Ciudad de México": ["Ciudad de México", "Iztapalapa", "Gustavo A. Madero", "Álvaro Obregón", "Benito Juárez"],
    "Jalisco": ["Guadalajara", "Zapopan", "Tlaquepaque", "Tonalá", "Puerto Vallarta"],
    "Nuevo León": ["Monterrey", "San Pedro Garza García", "Guadalupe", "Apodaca", "San Nicolás de los Garza"],
    "Puebla": ["Puebla", "Cholula"],
    "Yucatán": ["Mérida", "Valladolid"],
  },
  "España": {
    "Madrid": ["Madrid", "Móstoles", "Alcalá de Henares", "Fuenlabrada", "Leganés"],
    "Cataluña": ["Barcelona", "Badalona", "Sabadell", "Terrassa", "L'Hospitalet de Llobregat"],
    "Andalucía": ["Sevilla", "Málaga", "Córdoba", "Granada", "Jerez de la Frontera"],
    "Valencia": ["Valencia", "Alicante", "Elche"],
    "País Vasco": ["Bilbao", "Vitoria-Gasteiz", "San Sebastián"],
  },
  "Colombia": {
    "Cundinamarca": ["Bogotá", "Soacha", "Chía", "Zipaquirá", "Facatativá"],
    "Antioquia": ["Medellín", "Bello", "Itagüí", "Envigado", "Rionegro"],
    "Valle del Cauca": ["Cali", "Palmira", "Buenaventura", "Tuluá", "Cartago"],
    "Atlántico": ["Barranquilla", "Soledad"],
    "Santander": ["Bucaramanga", "Floridablanca"],
  },
  "Perú": {
    "Lima": ["Lima", "Callao", "San Juan de Lurigancho", "Comas", "Villa El Salvador"],
    "Arequipa": ["Arequipa", "Cerro Colorado", "Yanahuara", "Cayma", "Sachaca"],
    "Cusco": ["Cusco", "Sicuani"],
    "La Libertad": ["Trujillo", "Chimbote"],
  },
}


interface LocationSelectorProps {
  country?: string | null
  region?: string | null
  city?: string | null
  onCountryChange: (country: string | null) => void
  onRegionChange: (region: string | null) => void
  onCityChange: (city: string | null) => void
}

export function LocationSelector({
  country,
  region,
  city,
  onCountryChange,
  onRegionChange,
  onCityChange,
}: LocationSelectorProps) {
  const [countryOpen, setCountryOpen] = useState(false)
  const [regionOpen, setRegionOpen] = useState(false)
  const [cityOpen, setCityOpen] = useState(false)
  const [countrySearch, setCountrySearch] = useState(country || "")
  const [regionSearch, setRegionSearch] = useState(region || "")
  const [citySearch, setCitySearch] = useState(city || "")

  const availableRegions = country ? Object.keys(LOCATION_DATA[country] || {}) : []
  const availableCities = country && region ? LOCATION_DATA[country]?.[region] || [] : []

  // Filtrar países según búsqueda
  const filteredCountries = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(countrySearch.toLowerCase())
  )

  // Filtrar regiones según búsqueda
  const filteredRegions = availableRegions.filter((r) =>
    r.toLowerCase().includes(regionSearch.toLowerCase())
  )

  // Filtrar ciudades según búsqueda
  const filteredCities = availableCities.filter((c) =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  )

  // Sincronizar búsqueda con valores actuales
  useEffect(() => {
    if (country) setCountrySearch(country)
  }, [country])
  
  useEffect(() => {
    if (region) setRegionSearch(region)
  }, [region])
  
  useEffect(() => {
    if (city) setCitySearch(city)
  }, [city])

  // Resetear región y ciudad cuando cambia el país
  useEffect(() => {
    if (!country) {
      onRegionChange(null)
      onCityChange(null)
      setRegionSearch("")
      setCitySearch("")
    } else if (region && !availableRegions.includes(region)) {
      onRegionChange(null)
      onCityChange(null)
      setRegionSearch("")
      setCitySearch("")
    }
  }, [country, region, availableRegions, onRegionChange, onCityChange])

  // Resetear ciudad cuando cambia la región
  useEffect(() => {
    if (!region) {
      onCityChange(null)
      setCitySearch("")
    } else if (city && !availableCities.includes(city)) {
      onCityChange(null)
      setCitySearch("")
    }
  }, [region, city, availableCities, onCityChange])
  
  // Cerrar dropdowns al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-location-selector]')) {
        setCountryOpen(false)
        setRegionOpen(false)
        setCityOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="space-y-4">
      {/* Selector de País */}
      <div className="space-y-2" data-location-selector>
        <Label htmlFor="country">País</Label>
        <div className="relative">
          <Input
            id="country"
            type="text"
            placeholder={country ? country : "Buscar país..."}
            value={countrySearch}
            onChange={(e) => {
              setCountrySearch(e.target.value)
              setCountryOpen(true)
            }}
            onFocus={() => setCountryOpen(true)}
            className="pr-10"
          />
          <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {countryOpen && filteredCountries.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredCountries.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground"
                  onClick={() => {
                    onCountryChange(c)
                    setCountryOpen(false)
                    setCountrySearch(c)
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
        {country && (
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onCountryChange(null)
                setCountrySearch("")
              }}
              className="h-7"
            >
              <X className="h-3 w-3 mr-1" />
              {country}
            </Button>
          </div>
        )}
      </div>

      {/* Selector de Región */}
      {country && (
        <div className="space-y-2" data-location-selector>
          <Label htmlFor="region">Región</Label>
          <div className="relative">
            <Input
              id="region"
              type="text"
              placeholder={region ? region : "Buscar región..."}
              value={regionSearch}
              onChange={(e) => {
                setRegionSearch(e.target.value)
                setRegionOpen(true)
              }}
              onFocus={() => setRegionOpen(true)}
              disabled={!country}
              className="pr-10"
            />
            <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            {regionOpen && availableRegions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredRegions.length > 0 ? (
                  filteredRegions.map((r) => (
                    <button
                      key={r}
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground"
                      onClick={() => {
                        onRegionChange(r)
                        setRegionOpen(false)
                        setRegionSearch(r)
                      }}
                    >
                      {r}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-muted-foreground">
                    No se encontraron regiones que coincidan con "{regionSearch}"
                  </div>
                )}
              </div>
            )}
          </div>
          {region && (
            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onRegionChange(null)
                  setRegionSearch("")
                }}
                className="h-7"
              >
                <X className="h-3 w-3 mr-1" />
                {region}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Selector de Ciudad */}
      {country && region && (
        <div className="space-y-2" data-location-selector>
          <Label htmlFor="city">Ciudad</Label>
          <div className="relative">
            <Input
              id="city"
              type="text"
              placeholder={city ? city : "Buscar ciudad..."}
              value={citySearch}
              onChange={(e) => {
                setCitySearch(e.target.value)
                setCityOpen(true)
              }}
              onFocus={() => setCityOpen(true)}
              disabled={!region}
              className="pr-10"
            />
            <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            {cityOpen && availableCities.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredCities.length > 0 ? (
                  filteredCities.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground"
                      onClick={() => {
                        onCityChange(c)
                        setCityOpen(false)
                        setCitySearch(c)
                      }}
                    >
                      {c}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-muted-foreground">
                    No se encontraron ciudades que coincidan con "{citySearch}"
                  </div>
                )}
              </div>
            )}
          </div>
          {city && (
            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onCityChange(null)
                  setCitySearch("")
                }}
                className="h-7"
              >
                <X className="h-3 w-3 mr-1" />
                {city}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
