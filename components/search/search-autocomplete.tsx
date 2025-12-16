"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, Clock, X, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { getAutocompleteSuggestions, AutocompleteCardResult, AutocompleteDeckResult } from "@/lib/api/search";
import {
  getSearchHistoryByType,
  addToSearchHistory,
  removeFromSearchHistory,
  SearchHistoryItem,
} from "@/lib/search/search-history";

type SearchType = "carta" | "mazo";

interface SearchAutocompleteProps {
  className?: string;
  onSearch?: (query: string, type: SearchType) => void;
}

export function SearchAutocomplete({ className, onSearch }: SearchAutocompleteProps) {
  const [searchType, setSearchType] = useState<SearchType>("carta");
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showHistory, setShowHistory] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Obtener historial de búsquedas (actualizar cuando cambia el tipo)
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>(() => 
    getSearchHistoryByType(searchType)
  );

  // Actualizar historial cuando cambia el tipo
  useEffect(() => {
    setSearchHistory(getSearchHistoryByType(searchType));
  }, [searchType]);

  // Query para autocompletado (solo si hay al menos 2 caracteres)
  const shouldFetch = searchQuery.trim().length >= 2;
  const { data: autocompleteData, isLoading: isLoadingSuggestions } = useQuery({
    queryKey: ["autocomplete", searchType, searchQuery],
    queryFn: () => getAutocompleteSuggestions(searchQuery, searchType, 8),
    enabled: shouldFetch && !showHistory,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
  });

  const suggestions = autocompleteData?.results || [];
  const hasSuggestions = suggestions.length > 0;
  const hasHistory = searchHistory.length > 0;

  // Manejar cambios en el input con debounce
  const handleInputChange = useCallback((value: string) => {
    setSearchQuery(value);
    setSelectedIndex(-1);
    
    // Limpiar timeout anterior
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Mostrar historial si el input está vacío
    if (!value.trim()) {
      setShowHistory(true);
      setIsOpen(hasHistory);
      return;
    }

    // Ocultar historial y mostrar sugerencias después del debounce
    setShowHistory(false);
    debounceTimeoutRef.current = setTimeout(() => {
      setIsOpen(value.trim().length >= 2);
    }, 300);
  }, [hasHistory]);

  // Manejar búsqueda
  const handleSearch = useCallback(
    (query?: string, type?: SearchType) => {
      const finalQuery = query || searchQuery.trim();
      const finalType = type || searchType;

      if (!finalQuery) return;

      // Guardar en historial
      addToSearchHistory(finalQuery, finalType);

      // Cerrar dropdown
      setIsOpen(false);
      setShowHistory(false);
      inputRef.current?.blur();

      // Navegar o llamar callback
      if (onSearch) {
        onSearch(finalQuery, finalType);
      } else {
        if (finalType === "carta") {
          router.push(`/galeria?search=${encodeURIComponent(finalQuery)}`);
        } else {
          router.push(`/mazos-comunidad?search=${encodeURIComponent(finalQuery)}`);
        }
      }
    },
    [searchQuery, searchType, router, onSearch]
  );

  // Manejar selección de sugerencia o historial
  const handleSelectItem = useCallback(
    (item: AutocompleteCardResult | AutocompleteDeckResult | SearchHistoryItem) => {
      if ("timestamp" in item) {
        // Es un item del historial
        handleSearch(item.query, item.type);
      } else if (searchType === "carta") {
        // Es una carta
        const card = item as AutocompleteCardResult;
        handleSearch(card.name, "carta");
      } else {
        // Es un mazo
        const deck = item as AutocompleteDeckResult;
        handleSearch(deck.name, "mazo");
      }
    },
    [searchType, handleSearch]
  );

  // Manejar navegación con teclado
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const items = showHistory ? searchHistory : suggestions;
      const maxIndex = items.length - 1;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
          setIsOpen(true);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
          setIsOpen(true);
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && items[selectedIndex]) {
            handleSelectItem(items[selectedIndex]);
          } else if (searchQuery.trim()) {
            handleSearch();
          }
          break;
        case "Escape":
          setIsOpen(false);
          setShowHistory(false);
          inputRef.current?.blur();
          break;
      }
    },
    [selectedIndex, suggestions, searchHistory, showHistory, searchQuery, handleSelectItem, handleSearch]
  );

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowHistory(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mostrar historial cuando el input está vacío y tiene foco
  useEffect(() => {
    if (!searchQuery.trim() && hasHistory && inputRef.current === document.activeElement) {
      setShowHistory(true);
      setIsOpen(true);
    }
  }, [searchQuery, hasHistory]);

  return (
    <div className={cn("w-full max-w-3xl mx-auto relative", className)} ref={containerRef}>
      {/* Selector de tipo */}
      <div className="flex gap-2 mb-3 justify-center">
        <ToggleGroup
          type="single"
          value={searchType}
          onValueChange={(value) => {
            if (value) {
              setSearchType(value as SearchType);
              setSelectedIndex(-1);
              // Actualizar historial cuando cambia el tipo
              const newHistory = getSearchHistoryByType(value as SearchType);
              setShowHistory(newHistory.length > 0 && !searchQuery.trim());
              setIsOpen(newHistory.length > 0 && !searchQuery.trim());
            }
          }}
          size="default"
          className="bg-muted/50 p-0.5 rounded-full"
        >
          <ToggleGroupItem
            value="carta"
            aria-label="Buscar carta"
            className="px-4 text-sm rounded-full data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            Carta
          </ToggleGroupItem>
          <ToggleGroupItem
            value="mazo"
            aria-label="Buscar mazo"
            className="px-4 text-sm rounded-full data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            Mazo
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Input de búsqueda */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground pointer-events-none z-10" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={
            searchType === "carta"
              ? "Buscar una carta..."
              : "Buscar un mazo..."
          }
          value={searchQuery}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (!searchQuery.trim() && hasHistory) {
              setShowHistory(true);
              setIsOpen(true);
            } else if (searchQuery.trim().length >= 2) {
              setIsOpen(true);
            }
          }}
          className="pl-12 h-14 text-lg bg-white dark:bg-gray-800 pr-12"
          aria-label={
            searchType === "carta"
              ? "Buscar una carta"
              : "Buscar un mazo"
          }
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedIndex(-1);
              setIsOpen(false);
              setShowHistory(false);
              inputRef.current?.focus();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Dropdown de sugerencias/historial */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-background border rounded-lg shadow-lg max-h-96 overflow-auto">
          {showHistory ? (
            // Historial de búsquedas
            <div className="p-2">
              <div className="flex items-center justify-between px-3 py-2 text-sm font-semibold text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Búsquedas recientes
                </div>
              </div>
              <div className="space-y-1">
                {searchHistory.map((item, index) => (
                  <div
                    key={`${item.query}-${item.timestamp}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelectItem(item);
                      }
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-md text-left hover:bg-muted transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                      selectedIndex === index && "bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{item.query}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromSearchHistory(item.query, item.type);
                        // Actualizar estado local
                        const newHistory = getSearchHistoryByType(searchType);
                        setSearchHistory(newHistory);
                        if (newHistory.length === 0) {
                          setIsOpen(false);
                          setShowHistory(false);
                        }
                      }}
                      className="ml-2 p-1 hover:bg-background rounded transition-colors"
                      aria-label="Eliminar del historial"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : isLoadingSuggestions ? (
            // Estado de carga
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : hasSuggestions ? (
            // Sugerencias de autocompletado
            <div className="p-2">
              <div className="px-3 py-2 text-sm font-semibold text-muted-foreground">
                Sugerencias
              </div>
              <div className="space-y-1">
                {suggestions.map((item, index) => (
                  <div
                    key={searchType === "carta" ? (item as AutocompleteCardResult).id : (item as AutocompleteDeckResult).id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelectItem(item);
                      }
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left hover:bg-muted transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                      selectedIndex === index && "bg-muted"
                    )}
                  >
                    {searchType === "carta" ? (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{(item as AutocompleteCardResult).name}</div>
                          <div className="text-sm text-muted-foreground">
                            {(item as AutocompleteCardResult).type} • {(item as AutocompleteCardResult).edition}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{(item as AutocompleteDeckResult).name}</div>
                          <div className="text-sm text-muted-foreground">
                            por {(item as AutocompleteDeckResult).author.username} • {(item as AutocompleteDeckResult).viewCount} vistas
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : searchQuery.trim().length >= 2 ? (
            // Sin resultados
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <div className="text-center">
                <p className="text-sm">No se encontraron resultados</p>
                <p className="text-xs mt-1">Intenta con otros términos</p>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

