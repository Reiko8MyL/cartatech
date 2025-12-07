"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

type SearchType = "carta" | "mazo";

export function HeroSearch() {
  const [searchType, setSearchType] = useState<SearchType>("carta");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  function handleSearch() {
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);
    
    // Pequeña animación antes de navegar
    setTimeout(() => {
      if (searchType === "carta") {
        router.push(`/galeria?search=${encodeURIComponent(searchQuery)}`);
      } else {
        router.push(`/mazos-comunidad?search=${encodeURIComponent(searchQuery)}`);
      }
      setIsSearching(false);
    }, 300);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleSearch();
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex gap-2 mb-3 justify-center">
        <ToggleGroup
          type="single"
          value={searchType}
          onValueChange={(value) => {
            if (value) setSearchType(value as SearchType);
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
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
          <Input
            type="text"
            placeholder={
              searchType === "carta"
                ? "Buscar una carta..."
                : "Buscar un mazo..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-12 h-14 text-lg bg-white dark:bg-gray-800"
            aria-label={
              searchType === "carta"
                ? "Buscar una carta"
                : "Buscar un mazo"
            }
            aria-describedby="search-description"
          />
          <span id="search-description" className="sr-only">
            Presiona Enter para buscar o haz clic en el botón Buscar
          </span>
        </div>
        <Button
          type="button"
          onClick={handleSearch}
          size="lg"
          disabled={isSearching}
          className={cn(
            "h-14 px-10 text-lg font-semibold transition-opacity duration-300",
            "disabled:opacity-70 disabled:cursor-not-allowed",
            isSearching && "animate-pulse"
          )}
          aria-label={isSearching ? "Buscando..." : `Buscar ${searchType === "carta" ? "carta" : "mazo"}`}
          aria-busy={isSearching}
        >
          {isSearching ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Buscando...
            </>
          ) : (
            "Buscar"
          )}
        </Button>
      </div>
    </div>
  );
}

