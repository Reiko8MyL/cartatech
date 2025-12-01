import { Skeleton } from "./skeleton"

interface CardGridSkeletonProps {
  count?: number
  columns?: number
}

export function CardGridSkeleton({ 
  count = 12, 
  columns = 6 
}: CardGridSkeletonProps) {
  // Mapear columnas a clases de Tailwind válidas
  const gridColsClass = columns === 5 
    ? "lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5"
    : columns === 6
    ? "lg:grid-cols-6 xl:grid-cols-6 2xl:grid-cols-6"
    : "lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4"

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-3 lg:p-4">
      {[1, 2, 3].map((edition) => (
        <div key={edition} className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 ${gridColsClass} gap-2 sm:gap-3`}>
            {Array.from({ length: Math.min(count, 12) }).map((_, i) => (
              <Skeleton 
                key={i} 
                className="aspect-[63/88] rounded-lg"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

