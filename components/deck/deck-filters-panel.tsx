"use client";

import { useState } from "react";
import { X, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DeckFormat } from "@/lib/deck-builder/types";

export interface DeckFiltersState {
  search: string;
  format: string;
  author: string;
  dateFrom: string;
  dateTo: string;
  sortBy: "publishedAt" | "viewCount" | "createdAt" | "likeCount" | "favoriteCount";
  sortOrder: "asc" | "desc";
  minLikes: string;
  minFavorites: string;
}

interface DeckFiltersPanelProps {
  filters: DeckFiltersState;
  onFiltersChange: (filters: DeckFiltersState) => void;
  onClearFilters: () => void;
  totalResults?: number;
  className?: string;
}

export function DeckFiltersPanel({
  filters,
  onFiltersChange,
  onClearFilters,
  totalResults,
  className,
}: DeckFiltersPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Contar filtros activos
  const activeFiltersCount = [
    filters.search,
    filters.format,
    filters.author,
    filters.dateFrom,
    filters.dateTo,
    filters.minLikes,
    filters.minFavorites,
  ].filter(Boolean).length;

  const hasActiveFilters = activeFiltersCount > 0;

  function handleFilterChange(key: keyof DeckFiltersState, value: string) {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  }

  function handleClearFilters() {
    onClearFilters();
  }

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Header del panel de filtros */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
              Limpiar filtros
            </Button>
          )}
        </div>
        {totalResults !== undefined && (
          <div className="text-sm text-muted-foreground">
            {totalResults} {totalResults === 1 ? "resultado" : "resultados"}
          </div>
        )}
      </div>

      {/* Filtros activos (badges) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Búsqueda: {filters.search}
              <button
                type="button"
                onClick={() => handleFilterChange("search", "")}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
                aria-label="Eliminar filtro de búsqueda"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.format && (
            <Badge variant="secondary" className="gap-1">
              Formato: {filters.format}
              <button
                type="button"
                onClick={() => handleFilterChange("format", "")}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
                aria-label="Eliminar filtro de formato"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.author && (
            <Badge variant="secondary" className="gap-1">
              Autor: {filters.author}
              <button
                type="button"
                onClick={() => handleFilterChange("author", "")}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
                aria-label="Eliminar filtro de autor"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {(filters.dateFrom || filters.dateTo) && (
            <Badge variant="secondary" className="gap-1">
              Fecha: {filters.dateFrom ? "desde " + new Date(filters.dateFrom + "T00:00:00").toLocaleDateString("es-ES") : ""}
              {filters.dateFrom && filters.dateTo ? " - " : ""}
              {filters.dateTo ? "hasta " + new Date(filters.dateTo + "T23:59:59").toLocaleDateString("es-ES") : ""}
              <button
                type="button"
                onClick={() => {
                  handleFilterChange("dateFrom", "");
                  handleFilterChange("dateTo", "");
                }}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
                aria-label="Eliminar filtro de fecha"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.minLikes && (
            <Badge variant="secondary" className="gap-1">
              Mín. likes: {filters.minLikes}
              <button
                type="button"
                onClick={() => handleFilterChange("minLikes", "")}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
                aria-label="Eliminar filtro de likes mínimos"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.minFavorites && (
            <Badge variant="secondary" className="gap-1">
              Mín. favoritos: {filters.minFavorites}
              <button
                type="button"
                onClick={() => handleFilterChange("minFavorites", "")}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
                aria-label="Eliminar filtro de favoritos mínimos"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Panel de filtros expandible */}
      {isExpanded && (
        <div className="border rounded-lg p-3 space-y-2.5 bg-muted/30">
          {/* Fila 1: Búsqueda y Formato - Filtros principales de contenido */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="search-filter" className="text-xs">Buscar</Label>
              <Input
                id="search-filter"
                type="text"
                placeholder="Buscar por nombre o descripción..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="format-filter" className="text-xs">Formato</Label>
              <Select
                value={filters.format || "all"}
                onValueChange={(value) =>
                  handleFilterChange("format", value === "all" ? "" : value)
                }
              >
                <SelectTrigger id="format-filter" className="h-8 text-sm">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los formatos</SelectItem>
                  <SelectItem value="RE">RE - Racial Edición</SelectItem>
                  <SelectItem value="RL">RL - Racial Libre</SelectItem>
                  <SelectItem value="LI">LI - Formato Libre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fila 2: Autor y Fechas - Filtros de metadatos */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="author-filter" className="text-xs">Autor</Label>
              <Input
                id="author-filter"
                type="text"
                placeholder="Nombre de usuario..."
                value={filters.author}
                onChange={(e) => handleFilterChange("author", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date-from-filter" className="text-xs">Fecha desde</Label>
              <Input
                id="date-from-filter"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date-to-filter" className="text-xs">Fecha hasta</Label>
              <Input
                id="date-to-filter"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Fila 3: Popularidad - Filtros de interacción */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
            <div className="space-y-1.5 md:col-span-2">
              {/* Espacio vacío para alinear con autor */}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="min-likes-filter" className="text-xs">Mín. likes</Label>
              <Input
                id="min-likes-filter"
                type="number"
                min="0"
                placeholder="0"
                value={filters.minLikes}
                onChange={(e) => handleFilterChange("minLikes", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="min-favorites-filter" className="text-xs">Mín. favoritos</Label>
              <Input
                id="min-favorites-filter"
                type="number"
                min="0"
                placeholder="0"
                value={filters.minFavorites}
                onChange={(e) => handleFilterChange("minFavorites", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Fila 4: Ordenamiento - Controles de visualización, discretos */}
          <div className="flex items-end justify-end gap-2 pt-1 border-t border-border/50">
            <div className="space-y-1">
              <Label htmlFor="sort-by-filter" className="text-xs text-muted-foreground">Ordenar por</Label>
              <Select
                value={filters.sortBy}
                onValueChange={(value: "publishedAt" | "viewCount" | "createdAt" | "likeCount" | "favoriteCount") =>
                  handleFilterChange("sortBy", value)
                }
              >
                <SelectTrigger id="sort-by-filter" className="h-7 text-xs w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="publishedAt">Fecha publicación</SelectItem>
                  <SelectItem value="viewCount">Más vistos</SelectItem>
                  <SelectItem value="likeCount">Más likes</SelectItem>
                  <SelectItem value="favoriteCount">Más favoritos</SelectItem>
                  <SelectItem value="createdAt">Fecha creación</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="sort-order-filter" className="text-xs text-muted-foreground">Orden</Label>
              <Select
                value={filters.sortOrder}
                onValueChange={(value: "asc" | "desc") =>
                  handleFilterChange("sortOrder", value)
                }
              >
                <SelectTrigger id="sort-order-filter" className="h-7 text-xs w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descendente</SelectItem>
                  <SelectItem value="asc">Ascendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

