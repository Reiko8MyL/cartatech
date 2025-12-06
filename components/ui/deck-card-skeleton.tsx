import { Skeleton } from "./skeleton"
import { Card, CardContent } from "./card"

interface DeckCardSkeletonProps {
  viewMode?: "grid" | "list"
}

export function DeckCardSkeleton({ viewMode = "grid" }: DeckCardSkeletonProps) {
  if (viewMode === "list") {
    return (
      <Card className="overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          <Skeleton className="w-full sm:w-48 h-32 sm:h-auto flex-shrink-0" />
          <div className="flex-1 p-4 space-y-3">
            <div className="space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col overflow-hidden">
      <Skeleton className="h-32 w-full" />
      <CardContent className="flex-1 flex flex-col p-4 space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2 mt-auto">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-10" />
          <Skeleton className="h-8 w-10" />
        </div>
      </CardContent>
    </Card>
  )
}









