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

  // Tracking de búsqueda en descripciones con debounce
  useEffect(() => {
    if (filters.descriptionSearch && filters.descriptionSearch !== previousFiltersRef.current.descriptionSearch) {
      // Limpiar timeout anterior
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      
      // Trackear después de 500ms de inactividad
      searchTimeoutRef.current = setTimeout(() => {
        import("@/lib/analytics/events").then(({ trackCardSearched }) => {
          trackCardSearched(filters.descriptionSearch || "");
        });
      }, 500);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [filters.descriptionSearch])

  // Tracking de filtros cuando cambian
  useEffect(() => {
    const prev = previousFiltersRef.current
    const hasFilterChanged = 
      JSON.stringify(prev.edition) !== JSON.stringify(filters.edition) ||
      JSON.stringify(prev.type) !== JSON.stringify(filters.type) ||
      JSON.stringify(prev.race) !== JSON.stringify(filters.race) ||
      JSON.stringify(prev.cost) !== JSON.stringify(filters.cost)

    if (hasFilterChanged && (
      filters.edition.length > 0 || 
      filters.type.length > 0 || 
      filters.race.length > 0 || 
      filters.cost.length > 0
    )) {
      import("@/lib/analytics/events").then(({ trackCardFiltered }) => {
        trackCardFiltered({
          edition: filters.edition.length > 0 ? filters.edition : undefined,
          type: filters.type.length > 0 ? filters.type : undefined,
          race: filters.race.length > 0 ? filters.race : undefined,
          cost: filters.cost.length > 0 ? filters.cost : undefined,
        });
      });
    }

    previousFiltersRef.current = filters
  }, [filters.edition, filters.type, filters.race, filters.cost])

  function toggleFilterValue<K extends "edition" | "type" | "race">(
    key: K,
    value: string,
    checked: boolean
  ) {
    const currentArray = filters[key] as string[]
    if (checked) {
      // Agregar valor si no existe
      if (!currentArray.includes(value)) {
        onFiltersChange({
          ...filters,
          [key]: [...currentArray, value] as DeckFilters[K],
        })
      }
    } else {
      // Remover valor
      onFiltersChange({
        ...filters,
        [key]: currentArray.filter((v) => v !== value) as DeckFilters[K],
      })
    }
  }

  function toggleCostFilter(cost: number, checked: boolean) {
    const currentArray = filters.cost
    if (checked) {
      // Agregar coste si no existe
      if (!currentArray.includes(cost)) {
        onFiltersChange({
          ...filters,
          cost: [...currentArray, cost],
        })
      }
    } else {
      // Remover coste
      onFiltersChange({
        ...filters,
        cost: currentArray.filter((c) => c !== cost),
      })
    }
  }

  function clearFilterArray<K extends "edition" | "type" | "race">(key: K) {
    onFiltersChange({
      ...filters,
      [key]: [] as DeckFilters[K],
    })
  }

  function clearCostFilter() {
    onFiltersChange({
      ...filters,
      cost: [],
    })
  }

  function toggleRaceFilter(race: string, checked: boolean) {
    if (checked) {
      // Cuando se selecciona una raza, asegurar que "Aliado" esté en los tipos
      const currentTypes = filters.type
      const hasAliado = currentTypes.includes("Aliado")
      
      onFiltersChange({
        ...filters,
        race: [...filters.race, race],
        type: hasAliado ? currentTypes : [...currentTypes, "Aliado"],
      })
    } else {
      // Remover raza
      onFiltersChange({
        ...filters,
        race: filters.race.filter((r) => r !== race),
      })
    }
  }

  function handleTypeFilterChange(type: string, checked: boolean) {
    if (checked) {
      // Agregar tipo
      const newTypes = [...filters.type, type]
      onFiltersChange({
        ...filters,
        type: newTypes,
      })
    } else {
      // Remover tipo
      const newTypes = filters.type.filter((t) => t !== type)
      // Si se quita "Aliado", también quitar todas las razas
      if (type === "Aliado") {
        onFiltersChange({
          ...filters,
          type: newTypes,
          race: [],
        })
      } else {
        onFiltersChange({
          ...filters,
          type: newTypes,
        })
      }
    }
  }

  function clearFilters() {
    onFiltersChange({
      search: "",
      descriptionSearch: "",
      edition: [],
      type: [],
      race: [],
      cost: [],
    })
  }

  const hasActiveFilters =
    filters.search.trim() !== "" ||
    filters.descriptionSearch.trim() !== "" ||
    filters.edition.length > 0 ||
    filters.type.length > 0 ||
    filters.race.length > 0 ||
    filters.cost.length > 0

  // Funciones helper para mostrar texto en los botones
  function getFilterButtonText(
    label: string,
    selectedValues: string[] | number[],
    maxDisplay: number = 2
  ): string {
    if (selectedValues.length === 0) {
      return label
    }
    if (selectedValues.length === 1) {
      return String(selectedValues[0])
    }
    if (selectedValues.length <= maxDisplay) {
      return selectedValues.join(", ")
    }
    return `${selectedValues.slice(0, maxDisplay).join(", ")} +${selectedValues.length - maxDisplay}`
  }

  const hasAliadoType = filters.type.includes("Aliado")

  return (
    <div className="flex flex-col gap-2 sm:gap-3 rounded-lg border bg-card p-1.5 sm:p-2 lg:p-4">
      {/* Primera fila: Label y buscadores */}
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
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="w-full h-8 sm:h-9 text-sm"
          />
        </div>
        {/* Buscador por descripción */}
        <div className="flex-1 min-w-0">
          <Input
            type="text"
            placeholder="Buscar en descripciones..."
            value={filters.descriptionSearch}
            onChange={(e) => onFiltersChange({ ...filters, descriptionSearch: e.target.value })}
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
            {getFilterButtonText("Edición", filters.edition)}
            {filters.edition.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                {filters.edition.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
          <DropdownMenuLabel>Edición</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={filters.edition.length === 0}
            onCheckedChange={(checked) => {
              if (checked) clearFilterArray("edition")
            }}
          >
            Todas
          </DropdownMenuCheckboxItem>
          {availableEditions.map((edition) => (
            <DropdownMenuCheckboxItem
              key={edition}
              checked={filters.edition.includes(edition)}
              onCheckedChange={(checked) => {
                toggleFilterValue("edition", edition, checked)
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
            {getFilterButtonText("Tipo", filters.type)}
            {filters.type.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                {filters.type.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
          <DropdownMenuLabel>Tipo</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={filters.type.length === 0}
            onCheckedChange={(checked) => {
              if (checked) {
                // Si se selecciona "Todos", resetear también la raza
                onFiltersChange({
                  ...filters,
                  type: [],
                  race: [],
                })
              }
            }}
          >
            Todos
          </DropdownMenuCheckboxItem>
          {availableTypes.map((type) => (
            <DropdownMenuCheckboxItem
              key={type}
              checked={filters.type.includes(type)}
              onCheckedChange={(checked) => {
                handleTypeFilterChange(type, checked)
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
            disabled={filters.type.length > 0 && !hasAliadoType}
            className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
          >
            {getFilterButtonText("Raza", filters.race)}
            {filters.race.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                {filters.race.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
          <DropdownMenuLabel>Raza</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={filters.race.length === 0}
            onCheckedChange={(checked) => {
              if (checked) {
                onFiltersChange({
                  ...filters,
                  race: [],
                })
              }
            }}
          >
            Todas
          </DropdownMenuCheckboxItem>
          {availableRaces.map((race) => (
            <DropdownMenuCheckboxItem
              key={race}
              checked={filters.race.includes(race)}
              onCheckedChange={(checked) => {
                toggleRaceFilter(race, checked)
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
            {getFilterButtonText("Coste", filters.cost)}
            {filters.cost.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                {filters.cost.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
          <DropdownMenuLabel>Coste</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={filters.cost.length === 0}
            onCheckedChange={(checked) => {
              if (checked) clearCostFilter()
            }}
          >
            Todos
          </DropdownMenuCheckboxItem>
          {availableCosts.map((cost) => (
            <DropdownMenuCheckboxItem
              key={cost}
              checked={filters.cost.includes(cost)}
              onCheckedChange={(checked) => {
                toggleCostFilter(cost, checked)
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

