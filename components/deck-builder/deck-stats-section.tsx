"use client"

import { useState } from "react"
import type { DeckStats } from "@/lib/deck-builder/types"

interface DeckStatsSectionProps {
  stats: DeckStats
}

export function DeckStatsSection({ stats }: DeckStatsSectionProps) {
  const [showAliadosTooltip, setShowAliadosTooltip] = useState(false)
  const [showOrosTooltip, setShowOrosTooltip] = useState(false)
  const [showTotalCartasTooltip, setShowTotalCartasTooltip] = useState(false)

  return (
    <div className="p-2 sm:p-3 lg:p-4 border-b space-y-2">
      <h3 className="text-sm font-semibold">Estadísticas</h3>
      <div className="space-y-1.5 text-sm">
        <div className="flex gap-4">
          <div className="relative inline-flex items-center gap-0.5">
            <span className="text-muted-foreground">Total cartas: </span>
            <span
              className={`font-medium ${
                stats.totalCards === 50
                  ? "text-green-600 dark:text-green-500"
                  : stats.totalCards < 50
                  ? "text-destructive"
                  : ""
              }`}
            >
              {stats.totalCards}
            </span>
            {stats.totalCards < 50 && (
              <div className="relative inline-block">
                <button
                  type="button"
                  className="text-destructive hover:text-destructive/80 transition-colors text-[0.7rem] leading-none align-super"
                  onMouseEnter={() => setShowTotalCartasTooltip(true)}
                  onMouseLeave={() => setShowTotalCartasTooltip(false)}
                  onClick={() => setShowTotalCartasTooltip(!showTotalCartasTooltip)}
                  aria-label="Información sobre Total de Cartas"
                >
                  (?)
                </button>
                {showTotalCartasTooltip && (
                  <div
                    className="absolute bottom-full left-0 mb-2 z-50"
                    onMouseEnter={() => setShowTotalCartasTooltip(true)}
                    onMouseLeave={() => setShowTotalCartasTooltip(false)}
                  >
                    <div className="bg-popover text-popover-foreground text-xs rounded-none border shadow-md px-3 py-2 w-[140px] whitespace-normal break-words">
                      El mazo necesita 50 cartas
                      <div className="absolute top-full left-4 -mt-1">
                        <div className="border-4 border-transparent border-t-popover" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <span className="text-muted-foreground">Coste promedio: </span>
            <span className="font-medium">{stats.averageCost}</span>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-1 text-center">
          {/* Aliados */}
          <span className="text-xs relative inline-flex items-center gap-0.5">
            Aliados:{" "}
            <span
              className={`font-semibold ${
                stats.totalCards === 50
                  ? (stats.cardsByType["Aliado"] || 0) >= 16
                    ? "text-green-600 dark:text-green-500"
                    : "text-destructive"
                  : ""
              }`}
            >
              {stats.cardsByType["Aliado"] || 0}
            </span>
            {stats.totalCards === 50 &&
              (stats.cardsByType["Aliado"] || 0) < 16 && (
                <div className="relative inline-block">
                  <button
                    type="button"
                    className="text-destructive hover:text-destructive/80 transition-colors text-[0.7rem] leading-none align-super"
                    onMouseEnter={() => setShowAliadosTooltip(true)}
                    onMouseLeave={() => setShowAliadosTooltip(false)}
                    onClick={() => setShowAliadosTooltip(!showAliadosTooltip)}
                    aria-label="Información sobre Aliados"
                  >
                    (?)
                  </button>
                  {showAliadosTooltip && (
                    <div
                      className="absolute bottom-full left-0 mb-2 z-50"
                      onMouseEnter={() => setShowAliadosTooltip(true)}
                      onMouseLeave={() => setShowAliadosTooltip(false)}
                    >
                      <div className="bg-popover text-popover-foreground text-xs rounded-none border shadow-md px-3 py-2 w-[140px] whitespace-normal break-words">
                        El mínimo de Aliados por mazo es de 16
                        <div className="absolute top-full left-4 -mt-1">
                          <div className="border-4 border-transparent border-t-popover" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
          </span>
          <span className="text-xs">
            Arma: <span className="font-semibold">{stats.cardsByType["Arma"] || 0}</span>
          </span>
          <span className="text-xs">
            Talismán: <span className="font-semibold">{stats.cardsByType["Talismán"] || 0}</span>
          </span>
          <span className="text-xs">
            Tótem: <span className="font-semibold">{stats.cardsByType["Tótem"] || 0}</span>
          </span>
          {/* Oros */}
          <span className="text-xs relative inline-flex items-center gap-0.5">
            Oros:{" "}
            <span
              className={`font-semibold ${
                stats.totalCards === 50
                  ? stats.hasOroIni
                    ? "text-green-600 dark:text-green-500"
                    : "text-destructive"
                  : ""
              }`}
            >
              {stats.cardsByType["Oro"] || 0}
            </span>
            {stats.totalCards === 50 && !stats.hasOroIni && (
              <div className="relative inline-block">
                <button
                  type="button"
                  className="text-destructive hover:text-destructive/80 transition-colors text-[0.7rem] leading-none align-super"
                  onMouseEnter={() => setShowOrosTooltip(true)}
                  onMouseLeave={() => setShowOrosTooltip(false)}
                  onClick={() => setShowOrosTooltip(!showOrosTooltip)}
                  aria-label="Información sobre Oros"
                >
                  (?)
                </button>
                {showOrosTooltip && (
                  <div
                    className="absolute bottom-full right-0 mb-2 z-50"
                    onMouseEnter={() => setShowOrosTooltip(true)}
                    onMouseLeave={() => setShowOrosTooltip(false)}
                  >
                    <div className="bg-popover text-popover-foreground text-xs rounded-none border shadow-md px-3 py-2 w-[140px] whitespace-normal break-words">
                      Agrega un Oro Inicial (Sin habilidad)
                      <div className="absolute top-full right-4 -mt-1">
                        <div className="border-4 border-transparent border-t-popover" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </span>
        </div>
      </div>
    </div>
  )
}

