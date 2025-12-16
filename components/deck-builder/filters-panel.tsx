"use client"

import { useEffect, useRef, useState, memo, useCallback } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Filter, X, ChevronDown, ChevronUp, Minus, Plus } from "lucide-react"
import type { DeckFilters, DeckFormat } from "@/lib/deck-builder/types"

interface FiltersPanelProps {
  filters: DeckFilters
  onFiltersChange: (filters: DeckFilters) => void
  availableEditions: string[]
  availableTypes: string[]
  availableRaces: string[]
  availableCosts: number[]
  defaultExpanded?: boolean // Prop para controlar si los filtros avanzados están expandidos por defecto
  searchFieldsInRow?: boolean // Prop para controlar si los campos de búsqueda están en la misma fila (default: true)
  showFiltersExpanded?: boolean // Prop para mostrar los filtros siempre expandidos (sin dropdowns) - solo para galería
  deckFormat?: DeckFormat // Formato del deck para filtrar por ban list (solo deck builder)
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

export const FiltersPanel = memo(function FiltersPanel({
  filters,
  onFiltersChange,
  availableEditions,
  availableTypes,
  availableRaces,
  availableCosts,
  defaultExpanded = false, // Por defecto, no expandido (comportamiento original)
  searchFieldsInRow = true, // Por defecto, en la misma fila (comportamiento del deck builder)
  showFiltersExpanded = false, // Por defecto, usar dropdowns (comportamiento original)
  deckFormat, // Formato del deck (opcional, solo para deck builder)
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
          cost: filters.cost.length > 0 ? filters.cost.map(c => Number(c)) : undefined,
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
    const costString = String(cost)
    if (checked) {
      // Agregar coste si no existe
      if (!currentArray.includes(costString)) {
        onFiltersChange({
          ...filters,
          cost: [...currentArray, costString],
        })
      }
    } else {
      // Remover coste
      onFiltersChange({
        ...filters,
        cost: currentArray.filter((c) => c !== costString),
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
      showOnlyUnique: false,
      showOnlyBanned: false,
      showOnlyRework: false,
      showOnlyAvailable: false,
    })
  }

  const hasActiveFilters =
    filters.search.trim() !== "" ||
    (filters.descriptionSearch && filters.descriptionSearch.trim() !== "") ||
    filters.edition.length > 0 ||
    filters.type.length > 0 ||
    filters.race.length > 0 ||
    filters.cost.length > 0 ||
    filters.showOnlyUnique === true ||
    filters.showOnlyBanned === true ||
    filters.showOnlyRework === true ||
    filters.showOnlyAvailable === true

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
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(defaultExpanded)
  
  // Estado para controlar qué filtros individuales están expandidos (solo cuando showFiltersExpanded es true)
  // Por defecto, todos cerrados cuando showFiltersExpanded es true (para galería)
  const [expandedFilters, setExpandedFilters] = useState<Set<string>>(() => 
    new Set() // Todos los filtros individuales cerrados por defecto
  )
  
  const toggleFilterSection = useCallback((filterKey: string) => {
    setExpandedFilters((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(filterKey)) {
        newSet.delete(filterKey)
      } else {
        newSet.add(filterKey)
      }
      return newSet
    })
  }, [])

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card p-2 lg:p-3">
      {/* Header con título y botón de expandir/colapsar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Filter className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">Filtros</span>
        </div>
        {/* Botón para limpiar filtros */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs px-1.5">
            <X className="size-3" />
            <span className="hidden sm:inline ml-0.5">Limpiar</span>
          </Button>
        )}
      </div>

      {/* Fila de búsquedas - Siempre visible */}
      <div className={searchFieldsInRow ? "flex flex-col sm:flex-row gap-1.5" : "flex flex-col gap-1.5"}>
        <Input
          type="text"
          placeholder="Buscar por nombre..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className={searchFieldsInRow ? "w-full sm:flex-1 h-8 text-xs" : "w-full h-8 text-xs"}
        />
        <Input
          type="text"
          placeholder="Buscar en descripciones..."
          value={filters.descriptionSearch}
          onChange={(e) => onFiltersChange({ ...filters, descriptionSearch: e.target.value })}
          className={searchFieldsInRow ? "w-full sm:flex-1 h-8 text-xs" : "w-full h-8 text-xs"}
        />
      </div>

      {/* Botón para expandir/colapsar filtros */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
        className="w-full justify-between h-8 text-xs"
      >
        <span className="text-xs">Filtros avanzados</span>
        {isFiltersExpanded ? (
          <ChevronUp className="size-3.5" />
        ) : (
          <ChevronDown className="size-3.5" />
        )}
      </Button>

      {/* Filtros avanzados - Desplegables o expandidos según showFiltersExpanded */}
      {isFiltersExpanded && (
        <div className="flex flex-col gap-2.5 pt-2 border-t">
          {showFiltersExpanded ? (
            // Vista expandida: todas las opciones siempre visibles
            <>
              {/* Filtro por edición - Expandido */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleFilterSection("edition")}
                    className="flex items-center gap-1.5 text-xs font-medium hover:text-primary transition-colors"
                  >
                    {expandedFilters.has("edition") ? (
                      <Minus className="size-3.5" />
                    ) : (
                      <Plus className="size-3.5" />
                    )}
                    <span>Edición</span>
                  </button>
                  {filters.edition.length > 0 && (
                    <span className="text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                      {filters.edition.length}
                    </span>
                  )}
                </div>
                {expandedFilters.has("edition") && (
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-1.5">
                    <Checkbox
                      id="edition-all"
                      checked={filters.edition.length === 0}
                      onCheckedChange={(checked) => {
                        if (checked === true) clearFilterArray("edition")
                      }}
                    />
                    <label
                      htmlFor="edition-all"
                      className="text-xs cursor-pointer select-none"
                    >
                      Todas
                    </label>
                  </div>
                  {availableEditions.map((edition) => (
                    <div key={edition} className="flex items-center space-x-1.5">
                      <Checkbox
                        id={`edition-${edition}`}
                        checked={filters.edition.includes(edition)}
                        onCheckedChange={(checked) => {
                          toggleFilterValue("edition", edition, checked === true)
                        }}
                      />
                      <label
                        htmlFor={`edition-${edition}`}
                        className="text-xs cursor-pointer select-none"
                      >
                        {edition}
                      </label>
                    </div>
                  ))}
                </div>
                )}
              </div>

              {/* Filtro por tipo - Expandido */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleFilterSection("type")}
                    className="flex items-center gap-1.5 text-xs font-medium hover:text-primary transition-colors"
                  >
                    {expandedFilters.has("type") ? (
                      <Minus className="size-3.5" />
                    ) : (
                      <Plus className="size-3.5" />
                    )}
                    <span>Tipo</span>
                  </button>
                  {filters.type.length > 0 && (
                    <span className="text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                      {filters.type.length}
                    </span>
                  )}
                </div>
                {expandedFilters.has("type") && (
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-1.5">
                    <Checkbox
                      id="type-all"
                      checked={filters.type.length === 0}
                      onCheckedChange={(checked) => {
                        if (checked === true) {
                          onFiltersChange({
                            ...filters,
                            type: [],
                            race: [],
                          })
                        }
                      }}
                    />
                    <label
                      htmlFor="type-all"
                      className="text-xs cursor-pointer select-none"
                    >
                      Todos
                    </label>
                  </div>
                  {availableTypes.map((type) => (
                    <div key={type} className="flex items-center space-x-1.5">
                      <Checkbox
                        id={`type-${type}`}
                        checked={filters.type.includes(type)}
                        onCheckedChange={(checked) => {
                          handleTypeFilterChange(type, checked === true)
                        }}
                      />
                      <label
                        htmlFor={`type-${type}`}
                        className="text-xs cursor-pointer select-none"
                      >
                        {type}
                      </label>
                    </div>
                  ))}
                </div>
                )}
              </div>

              {/* Filtro por raza - Expandido */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleFilterSection("race")}
                    className="flex items-center gap-1.5 text-xs font-medium hover:text-primary transition-colors"
                  >
                    {expandedFilters.has("race") ? (
                      <Minus className="size-3.5" />
                    ) : (
                      <Plus className="size-3.5" />
                    )}
                    <span>Raza</span>
                  </button>
                  {filters.race.length > 0 && (
                    <span className="text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                      {filters.race.length}
                    </span>
                  )}
                </div>
                {expandedFilters.has("race") && (
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-1.5">
                    <Checkbox
                      id="race-all"
                      checked={filters.race.length === 0}
                      onCheckedChange={(checked) => {
                        if (checked === true) {
                          onFiltersChange({
                            ...filters,
                            race: [],
                          })
                        }
                      }}
                      disabled={filters.type.length > 0 && !hasAliadoType}
                    />
                    <label
                      htmlFor="race-all"
                      className={`text-xs cursor-pointer select-none ${
                        filters.type.length > 0 && !hasAliadoType ? "opacity-50" : ""
                      }`}
                    >
                      Todas
                    </label>
                  </div>
                  {availableRaces.map((race) => (
                    <div key={race} className="flex items-center space-x-1.5">
                      <Checkbox
                        id={`race-${race}`}
                        checked={filters.race.includes(race)}
                        onCheckedChange={(checked) => {
                          toggleRaceFilter(race, checked === true)
                        }}
                        disabled={filters.type.length > 0 && !hasAliadoType}
                      />
                      <label
                        htmlFor={`race-${race}`}
                        className={`text-xs cursor-pointer select-none ${
                          filters.type.length > 0 && !hasAliadoType ? "opacity-50" : ""
                        }`}
                      >
                        {race}
                      </label>
                    </div>
                  ))}
                </div>
                )}
              </div>

              {/* Filtro por coste - Expandido */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleFilterSection("cost")}
                    className="flex items-center gap-1.5 text-xs font-medium hover:text-primary transition-colors"
                  >
                    {expandedFilters.has("cost") ? (
                      <Minus className="size-3.5" />
                    ) : (
                      <Plus className="size-3.5" />
                    )}
                    <span>Coste</span>
                  </button>
                  {filters.cost.length > 0 && (
                    <span className="text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                      {filters.cost.length}
                    </span>
                  )}
                </div>
                {expandedFilters.has("cost") && (
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-1.5">
                    <Checkbox
                      id="cost-all"
                      checked={filters.cost.length === 0}
                      onCheckedChange={(checked) => {
                        if (checked === true) clearCostFilter()
                      }}
                    />
                    <label
                      htmlFor="cost-all"
                      className="text-xs cursor-pointer select-none"
                    >
                      Todos
                    </label>
                  </div>
                  {availableCosts.map((cost) => (
                    <div key={cost} className="flex items-center space-x-1.5">
                      <Checkbox
                        id={`cost-${cost}`}
                        checked={filters.cost.includes(String(cost))}
                        onCheckedChange={(checked) => {
                          toggleCostFilter(cost, checked === true)
                        }}
                      />
                      <label
                        htmlFor={`cost-${cost}`}
                        className="text-xs cursor-pointer select-none"
                      >
                        {cost}
                      </label>
                    </div>
                  ))}
                </div>
                )}
              </div>

              {/* Filtros adicionales - Abajo de coste en modo expandido (galería) */}
              <div className="space-y-1.5 pt-2 border-t">
                <div className="flex items-center space-x-1.5">
                  <Checkbox
                    id="filter-unique-expanded"
                    checked={filters.showOnlyUnique === true}
                    onCheckedChange={(checked) => {
                      onFiltersChange({
                        ...filters,
                        showOnlyUnique: checked === true,
                      })
                    }}
                  />
                  <label
                    htmlFor="filter-unique-expanded"
                    className="text-xs cursor-pointer select-none"
                  >
                    Solo Únicas
                  </label>
                </div>
                {deckFormat && (
                  <>
                    <div className="flex items-center space-x-1.5">
                      <Checkbox
                        id="filter-available-expanded"
                        checked={filters.showOnlyAvailable === true}
                        onCheckedChange={(checked) => {
                          onFiltersChange({
                            ...filters,
                            showOnlyAvailable: checked === true,
                          })
                        }}
                      />
                      <label
                        htmlFor="filter-available-expanded"
                        className="text-xs cursor-pointer select-none"
                      >
                        Solo Disponibles
                      </label>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Checkbox
                        id="filter-banned-expanded"
                        checked={filters.showOnlyBanned === true}
                        onCheckedChange={(checked) => {
                          onFiltersChange({
                            ...filters,
                            showOnlyBanned: checked === true,
                          })
                        }}
                      />
                      <label
                        htmlFor="filter-banned-expanded"
                        className="text-xs cursor-pointer select-none"
                      >
                        En Ban List
                      </label>
                    </div>
                  </>
                )}
                <div className="flex items-center space-x-1.5">
                  <Checkbox
                    id="filter-rework-expanded"
                    checked={filters.showOnlyRework === true}
                    onCheckedChange={(checked) => {
                      onFiltersChange({
                        ...filters,
                        showOnlyRework: checked === true,
                      })
                    }}
                  />
                  <label
                    htmlFor="filter-rework-expanded"
                    className="text-xs cursor-pointer select-none"
                  >
                    Solo Rework
                  </label>
                </div>
              </div>
            </>
          ) : (
            // Vista con dropdowns (comportamiento original)
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Filtro por edición */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="relative h-7 text-xs px-2">
                    {getFilterButtonText("Edición", filters.edition)}
                    {filters.edition.length > 0 && (
                      <span className="ml-1 text-[9px] bg-primary text-primary-foreground rounded-full px-1 py-0.5">
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
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                    {getFilterButtonText("Tipo", filters.type)}
                    {filters.type.length > 0 && (
                      <span className="ml-1 text-[9px] bg-primary text-primary-foreground rounded-full px-1 py-0.5">
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
                    className="h-7 text-xs px-2"
                  >
                    {getFilterButtonText("Raza", filters.race)}
                    {filters.race.length > 0 && (
                      <span className="ml-1 text-[9px] bg-primary text-primary-foreground rounded-full px-1 py-0.5">
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
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                    {getFilterButtonText("Coste", filters.cost)}
                    {filters.cost.length > 0 && (
                      <span className="ml-1 text-[9px] bg-primary text-primary-foreground rounded-full px-1 py-0.5">
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
                      checked={filters.cost.includes(String(cost))}
                      onCheckedChange={(checked) => {
                        toggleCostFilter(cost, checked)
                      }}
                    >
                      {cost}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Filtros adicionales - En la misma fila que los otros filtros (modo dropdown, deck builder) */}
              {/* Solo Únicas */}
              <Button
                variant={filters.showOnlyUnique ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  onFiltersChange({
                    ...filters,
                    showOnlyUnique: !filters.showOnlyUnique,
                  })
                }}
                className="h-7 text-xs px-2"
              >
                Solo Únicas
              </Button>
              
              {/* Solo Disponibles - Solo visible si hay deckFormat */}
              {deckFormat && (
                <Button
                  variant={filters.showOnlyAvailable ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    onFiltersChange({
                      ...filters,
                      showOnlyAvailable: !filters.showOnlyAvailable,
                    })
                  }}
                  className="h-7 text-xs px-2"
                >
                  Solo Disponibles
                </Button>
              )}
              
              {/* En Ban List - Solo visible si hay deckFormat */}
              {deckFormat && (
                <Button
                  variant={filters.showOnlyBanned ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    onFiltersChange({
                      ...filters,
                      showOnlyBanned: !filters.showOnlyBanned,
                    })
                  }}
                  className="h-7 text-xs px-2"
                >
                  En Ban List
                </Button>
              )}
              
              {/* Solo Rework */}
              <Button
                variant={filters.showOnlyRework ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  onFiltersChange({
                    ...filters,
                    showOnlyRework: !filters.showOnlyRework,
                  })
                }}
                className="h-7 text-xs px-2"
              >
                Solo Rework
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  // Comparación optimizada para evitar re-renders innecesarios
  return (
    JSON.stringify(prevProps.filters) === JSON.stringify(nextProps.filters) &&
    JSON.stringify(prevProps.availableEditions) === JSON.stringify(nextProps.availableEditions) &&
    JSON.stringify(prevProps.availableTypes) === JSON.stringify(nextProps.availableTypes) &&
    JSON.stringify(prevProps.availableRaces) === JSON.stringify(nextProps.availableRaces) &&
    JSON.stringify(prevProps.availableCosts) === JSON.stringify(nextProps.availableCosts) &&
    prevProps.onFiltersChange === nextProps.onFiltersChange
  )
})

