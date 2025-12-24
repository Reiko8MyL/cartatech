"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useFeedQuery } from "@/hooks/use-feed-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Users, RefreshCw, Loader2 } from "lucide-react"
import Link from "next/link"
import { ActivityItem } from "@/components/feed/activity-item"
import { Pagination } from "@/components/ui/pagination"
import type { Activity } from "@/lib/api/feed"

export default function FeedPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentPage, setCurrentPage] = useState(1)
  const limit = 20

  const { data, isLoading, error, refetch, isRefetching } = useFeedQuery(
    user?.id,
    currentPage,
    limit
  )

  useEffect(() => {
    if (!user) {
      router.push("/inicio-sesion")
      return
    }
  }, [user, router])

  if (!user) {
    return null // Redirigiendo...
  }

  const activities = data?.activities || []
  const pagination = data?.pagination

  return (
    <main id="main-content" className="w-full min-h-screen px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Feed de Actividad</h1>
            <p className="text-muted-foreground mt-1">
              Actividad reciente de usuarios que sigues
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            {isRefetching ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Actualizar
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-destructive mb-4">
                  Error al cargar el feed de actividad
                </p>
                <Button onClick={() => refetch()} variant="outline">
                  Intentar de nuevo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State - No sigue a nadie */}
        {!isLoading && !error && activities.length === 0 && !pagination && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  No sigues a nadie aún
                </h3>
                <p className="text-muted-foreground mb-4">
                  Comienza a seguir usuarios para ver su actividad aquí
                </p>
                <Button asChild>
                  <Link href="/mazos-comunidad">
                    Explorar mazos
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State - Feed vacío pero sigue a alguien */}
        {!isLoading && !error && activities.length === 0 && pagination && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No hay actividad reciente de los usuarios que sigues
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activities List */}
        {!isLoading && !error && activities.length > 0 && (
          <>
            <div className="space-y-4 mb-6">
              {activities.map((activity) => (
                <ActivityItem key={`${activity.type}-${activity.data.deck?.id || activity.data.like?.id || activity.data.comment?.id}`} activity={activity} />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

