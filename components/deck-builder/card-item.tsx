"use client"

import { memo } from "react"
import Image from "next/image"
import type { Card } from "@/lib/deck-builder/types"

interface CardItemProps {
  card: Card
  quantity: number
  maxQuantity: number
  canAddMore: boolean
  onCardClick: (card: Card) => void
  onCardRightClick: (e: React.MouseEvent, card: Card) => void
}

export const CardItem = memo(function CardItem({
  card,
  quantity,
  maxQuantity,
  canAddMore,
  onCardClick,
  onCardRightClick,
}: CardItemProps) {
  const fillRatio =
    maxQuantity > 0 ? Math.min(quantity / maxQuantity, 1) : 0
  const overlayOpacity = fillRatio * 0.6

  return (
    <div
      className="group relative aspect-[63/88] cursor-pointer rounded-2xl overflow-hidden"
      onClick={() => onCardClick(card)}
      onContextMenu={(e) => onCardRightClick(e, card)}
    >
      {/* Contenedor que se anima en hover (imagen + nombre) */}
      <div
        className={`relative w-full h-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          canAddMore ? "group-hover:scale-105 group-hover:shadow-lg" : ""
        }`}
      >
        <Image
          src={card.image}
          alt={card.name}
          fill
          className={`object-contain rounded ${
            canAddMore ? "" : "opacity-50"
          }`}
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          loading="lazy"
          decoding="async"
        />

        {/* Sombreado y cantidad centrada según copias en el mazo */}
        {quantity > 0 && (
          <>
            <div
              className="absolute inset-0 bg-black"
              style={{ opacity: overlayOpacity }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-neutral-100 font-bold text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {quantity}
            </div>
          </>
        )}

        {/* Tooltip con nombre - escala junto con la imagen */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-xs p-1 rounded-b opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-out truncate text-center">
          {card.name}
        </div>
      </div>

      {/* Indicadores en el centro del lado derecho */}
      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-20 items-end text-[9px]">
        {/* Única (arriba) */}
        <div
          className={`px-2 py-0.5 rounded-full font-semibold whitespace-nowrap shadow-lg bg-yellow-500 text-white ${
            card.isUnique ? "opacity-100" : "opacity-0"
          }`}
        >
          Única
        </div>

        {/* Banlist (centro) - usa maxQuantity que ya viene calculado según el formato */}
        <div
          className={`px-2 py-0.5 rounded-full font-semibold whitespace-nowrap shadow-lg text-white ${
            maxQuantity === 0
              ? "bg-red-600 opacity-100"
              : maxQuantity === 1 && !card.isUnique
              ? "bg-red-500 opacity-100"
              : maxQuantity === 2
              ? "bg-red-500 opacity-100"
              : "opacity-0"
          }`}
        >
          {maxQuantity === 0
            ? "BAN"
            : maxQuantity === 1 && !card.isUnique
            ? "Max 1"
            : maxQuantity === 2
            ? "Max 2"
            : ""}
        </div>

        {/* Rework (abajo) */}
        <div
          className={`px-2 py-0.5 rounded-full font-semibold whitespace-nowrap shadow-lg bg-purple-500 text-white ${
            card.isRework ? "opacity-100" : "opacity-0"
          }`}
        >
          Rework
        </div>
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Comparación personalizada para evitar re-renders innecesarios
  // Solo re-renderizar si cambian las props relevantes
  if (prevProps.card.id !== nextProps.card.id) return false
  if (prevProps.quantity !== nextProps.quantity) return false
  if (prevProps.maxQuantity !== nextProps.maxQuantity) return false
  if (prevProps.canAddMore !== nextProps.canAddMore) return false
  // Comparar propiedades de la carta que afectan los indicadores
  if (prevProps.card.isUnique !== nextProps.card.isUnique) return false
  if (prevProps.maxQuantity !== nextProps.maxQuantity) return false
  if (prevProps.card.isRework !== nextProps.card.isRework) return false
  // Si las funciones cambian, no re-renderizar (son estables con useCallback)
  return true
})

