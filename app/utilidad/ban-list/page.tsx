"use client"

import { useState } from "react"
import { sortCardsByEditionAndId } from "@/lib/deck-builder/utils"
import { useCards } from "@/hooks/use-cards"
import type { Card, DeckFormat } from "@/lib/deck-builder/types"
import { BanListSection } from "@/components/ban-list/ban-list-section"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"


interface BanListCategory {
  title: string
  description: string
  cards: Card[]
  badgeColor: string
  badgeText: string
}

function getBanListCards(allCards: Card[], format: DeckFormat): BanListCategory[] {
  // Obtener la ban list según el formato
  const getBanListValue = (card: Card) => {
    if (format === "RE") {
      return card.banListRE ?? 3
    } else if (format === "RL") {
      return card.banListRL ?? 3
    } else {
      return card.banListLI ?? 3
    }
  }

  // Filtrar cartas según los criterios:
  // - banList = 0 (banned)
  // - banList = 1 Y isUnique = false (restricted, pero no las únicas)
  // - banList = 2 (restricted)
  // - NO mostrar banList = 3
  // - NO mostrar banList = 1 con isUnique = true
  // - Para "Racial Edición" (RE), excluir cartas de la edición "Drácula"

  const filteredCards = format === "RE" 
    ? allCards.filter((card) => card.edition !== "Drácula")
    : allCards

  const banned = filteredCards.filter((card) => getBanListValue(card) === 0)
  const restricted1 = filteredCards.filter(
    (card) => getBanListValue(card) === 1 && !card.isUnique
  )
  const restricted2 = filteredCards.filter((card) => getBanListValue(card) === 2)

  const categories: BanListCategory[] = []

  if (banned.length > 0) {
    categories.push({
      title: "Cartas Prohibidas",
      description: "Estas cartas están completamente prohibidas (0 copias permitidas).",
      cards: sortCardsByEditionAndId(banned),
      badgeColor: "bg-red-600",
      badgeText: "BAN",
    })
  }

  if (restricted1.length > 0) {
    categories.push({
      title: "Cartas Restringidas a 1 Copia",
      description: "Estas cartas están restringidas a máximo 1 copia por mazo.",
      cards: sortCardsByEditionAndId(restricted1),
      badgeColor: "bg-red-500",
      badgeText: "Max 1",
    })
  }

  if (restricted2.length > 0) {
    categories.push({
      title: "Cartas Restringidas a 2 Copias",
      description: "Estas cartas están restringidas a máximo 2 copias por mazo.",
      cards: sortCardsByEditionAndId(restricted2),
      badgeColor: "bg-orange-500",
      badgeText: "Max 2",
    })
  }

  return categories
}

export default function BanListPage() {
  const [selectedFormat, setSelectedFormat] = useState<DeckFormat>("RE")
  // Cargar todas las cartas desde la API con cache
  const { cards: allCards } = useCards(false)
  const banListCategories = getBanListCards(allCards, selectedFormat)

  const totalBanned = banListCategories.reduce(
    (sum, cat) => sum + cat.cards.length,
    0
  )

  return (
    <main className="w-full px-4 py-8 sm:px-6 lg:px-8 xl:px-12">
      <div className="mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ban List
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Lista de cartas prohibidas y restringidas en el formato seleccionado.
          </p>
          
          {/* Selector de formato */}
          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Formato</label>
            <ToggleGroup
              type="single"
              value={selectedFormat}
              onValueChange={(value) => {
                if (value) setSelectedFormat(value as DeckFormat)
              }}
              className="w-full max-w-md"
              variant="outline"
              spacing={0}
            >
              <ToggleGroupItem value="RE" className="flex-1 rounded-r-none">
                Racial Edición
              </ToggleGroupItem>
              <ToggleGroupItem value="RL" className="flex-1 rounded-none border-x">
                Racial Libre
              </ToggleGroupItem>
              <ToggleGroupItem value="LI" className="flex-1 rounded-l-none">
                Formato Libre
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {totalBanned > 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              Total de cartas en la ban list:{" "}
              <span className="font-semibold text-foreground">
                {totalBanned}
              </span>
            </p>
          )}
        </div>

        {banListCategories.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-lg text-muted-foreground">
              No hay cartas en la ban list actualmente.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {banListCategories.map((category) => (
              <BanListSection
                key={category.title}
                title={category.title}
                description={category.description}
                cards={category.cards}
                badgeColor={category.badgeColor}
                badgeText={category.badgeText}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

