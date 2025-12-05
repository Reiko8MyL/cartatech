"use client"

import { useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Filter, X } from "lucide-react"
import type { DeckFilters } from "@/lib/deck-builder/types"

interface FiltersPanelProps {
  filters: DeckFilters
  onFiltersChange: (filters: DeckFilters) => void
  availableEditions: string[]
  availableTypes: string[]
  availableRaces: string[]
  availableCosts: number[]
}

// Mapeo de razas a ediciones
const RACE_TO_EDITION: Record<string, string> = {
  "Caballero": "Espada Sagrada",
  "Dragón": "Espada Sagrada",
  "Faerie": "Espada Sagrada",
  "Héroe": "Helénica",
  "Olímpico": "Helénica",
  "Titán": "Helénica",
  "Defensor": "Hijos de Daana",
  "Desafiante": "Hijos de Daana",
  "Sombra": "Hijos de Daana",
  "Eterno": "Dominios de Ra",
  "Faraón": "Dominios de Ra",
  "Sacerdote": "Dominios de Ra",
}

export function FiltersPanel({
  filters,
  onFiltersChange,
  availableEditions,
  availableTypes,
  availableRaces,
  availableCosts,
}: FiltersPanelProps) {
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const previousFiltersRef = useRef<DeckFilters>(filters)

  // Tracking de búsqueda con debounce
  useEffect(() => {
    if (filters.search && filters.search !== previousFiltersRef.current.search) {
      // Limpiar timeout anterior
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      
      // Trackear después de 500ms de inactividad
      searchTimeoutRef.current = setTimeout(() => {
        import("@/lib/analytics/events").then(({ trackCardSearched }) => {
          trackCardSearched(filters.search);
        });
      }, 500);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [filters.search])

  // Tracking de filtros cuando cambian
  useEffect(() => {
    const prev = previousFiltersRef.current
    const hasFilterChanged = 
      prev.edition !== filters.edition ||
      prev.type !== filters.type ||
      prev.race !== filters.race ||
      prev.cost !== filters.cost

    if (hasFilterChanged && (filters.edition || filters.type || filters.race || filters.cost)) {
      import("@/lib/analytics/events").then(({ trackCardFiltered }) => {
        trackCardFiltered({
          edition: filters.edition || undefined,
          type: filters.type || undefined,
          race: filters.race || undefined,
          cost: filters.cost || undefined,
        });
      });
    }

    previousFiltersRef.current = filters
  }, [filters.edition, filters.type, filters.race, filters.cost])

  function updateFilter<K extends keyof DeckFilters>(
    key: K,
    value: DeckFilters[K]
  ) {
    onFiltersChange({ ...filters, [key]: value })
  }

  function updateRace(race: string) {
    if (race) {
      // Cuando se selecciona una raza, establecer tipo a "Aliado"
      onFiltersChange({
        ...filters,
        race,
        type: "Aliado",
      })
    } else {
      // Cuando se deselecciona la raza, solo limpiar la raza
      updateFilter("race", "")
    }
  }

  function clearFilters() {
    onFiltersChange({
      search: "",
      edition: "",
      type: "",
      race: "",
      cost: "",
    })
  }

  const hasActiveFilters =
    filters.search ||
    filters.edition ||
    filters.type ||
    filters.race ||
    filters.cost

  return (
    <div className="flex flex-col gap-2 sm:gap-3 rounded-lg border bg-card p-1.5 sm:p-2 lg:p-4">
      {/* Primera fila: Label y buscador */}
      <div className="flex items-center gap-2 w-full">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Filter className="size-3.5 sm:size-4 text-muted-foreground" />
          <span className="text-xs sm:text-sm font-medium">Filtros</span>
      </div>
      {/* Buscador por nombre */}
        <div className="flex-1 min-w-0">
        <Input
          type="text"
          placeholder="Buscar por nombre..."
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
            className="w-full h-8 sm:h-9 text-sm"
        />
        </div>
        {/* Botón para limpiar filtros */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">
            <X className="size-3.5 sm:size-4" />
            <span className="hidden sm:inline">Limpiar</span>
          </Button>
        )}
      </div>

      {/* Segunda fila: Filtros */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
      {/* Filtro por edición */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="relative h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3">
            {filters.edition || "Edición"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
          <DropdownMenuLabel>Edición</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={filters.edition === ""}
            onCheckedChange={(checked) => {
              if (checked) updateFilter("edition", "")
            }}
          >
            Todas
          </DropdownMenuCheckboxItem>
          {availableEditions.map((edition) => (
            <DropdownMenuCheckboxItem
              key={edition}
              checked={filters.edition === edition}
              onCheckedChange={(checked) => {
                updateFilter("edition", checked ? edition : "")
              }}
            >
              {edition}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Filtro por tipo */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3">
            {filters.type || "Tipo"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
          <DropdownMenuLabel>Tipo</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={filters.type === ""}
            onCheckedChange={(checked) => {
              if (checked) {
                // Si se selecciona "Todos", resetear también la raza
                onFiltersChange({
                  ...filters,
                  type: "",
                  race: "",
                })
              }
            }}
          >
            Todos
          </DropdownMenuCheckboxItem>
          {availableTypes.map((type) => (
            <DropdownMenuCheckboxItem
              key={type}
              checked={filters.type === type}
              onCheckedChange={(checked) => {
                const newType = checked ? type : ""
                // Si el tipo cambia a algo que no sea "Aliado", resetear la raza
                if (newType !== "Aliado" && filters.race) {
                  onFiltersChange({
                    ...filters,
                    type: newType,
                    race: "",
                  })
                } else {
                  updateFilter("type", newType)
                }
              }}
            >
              {type}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Filtro por raza */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            disabled={filters.type !== "" && filters.type !== "Aliado"}
            className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
          >
            {filters.race || "Raza"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
          <DropdownMenuLabel>Raza</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={filters.race === ""}
            onCheckedChange={(checked) => {
              if (checked) updateRace("")
            }}
          >
            Todas
          </DropdownMenuCheckboxItem>
          {availableRaces.map((race) => (
            <DropdownMenuCheckboxItem
              key={race}
              checked={filters.race === race}
              onCheckedChange={(checked) => {
                updateRace(checked ? race : "")
              }}
            >
              {race}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Filtro por coste */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3">
            {filters.cost || "Coste"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
          <DropdownMenuLabel>Coste</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={filters.cost === ""}
            onCheckedChange={(checked) => {
              if (checked) updateFilter("cost", "")
            }}
          >
            Todos
          </DropdownMenuCheckboxItem>
          {availableCosts.map((cost) => (
            <DropdownMenuCheckboxItem
              key={cost}
              checked={filters.cost === String(cost)}
              onCheckedChange={(checked) => {
                updateFilter("cost", checked ? String(cost) : "")
              }}
            >
              {cost}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </div>
  )
}

