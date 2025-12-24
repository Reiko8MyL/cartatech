"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { AvatarCard } from "@/components/ui/avatar-card"
import { Badge } from "@/components/ui/badge"
import { Eye, Heart, MessageCircle, BookOpen, Clock } from "lucide-react"
import { useCards } from "@/hooks/use-cards"
import { getDeckFormatName } from "@/lib/deck-builder/utils"
import type { Activity } from "@/lib/api/feed"
import { formatDistanceToNow } from "date-fns"

interface ActivityItemProps {
  activity: Activity
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const { cards } = useCards(false)
  const user = activity.data.user
  const card = user.avatarCardId ? cards.find(c => c.id === user.avatarCardId) : null

  // Formatear timestamp
  const timeAgo = formatDistanceToNow(new Date(activity.timestamp), {
    addSuffix: true,
  })

  // Renderizar según el tipo de actividad
  if (activity.type === "deck_published") {
    const { deck } = activity.data
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Avatar */}
            <Link href={`/perfil/${user.username}`}>
              <AvatarCard
                card={card ?? null}
                size={48}
                username={user.username}
                zoom={user.avatarZoom || 1.0}
                positionX={user.avatarPositionX || 50}
                positionY={user.avatarPositionY || 50}
                className="cursor-pointer hover:ring-2 ring-primary transition-all"
              />
            </Link>

            {/* Contenido */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">
                    <Link 
                      href={`/perfil/${user.username}`}
                      className="font-semibold text-foreground hover:underline"
                    >
                      {user.username}
                    </Link>
                    {" "}publicó un nuevo mazo
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    {timeAgo}
                  </p>
                </div>
              </div>

              {/* Información del mazo */}
              <Link href={`/mazo/${deck.id}`}>
                <div className="mt-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-base line-clamp-2 flex-1">
                      {deck.name}
                    </h3>
                    <Badge variant="secondary" className="shrink-0">
                      {getDeckFormatName(deck.format)}
                    </Badge>
                  </div>
                  {deck.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {deck.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {deck.viewCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {deck.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {deck.comments}
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (activity.type === "deck_liked") {
    const { like, deck } = activity.data
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Avatar */}
            <Link href={`/perfil/${user.username}`}>
              <AvatarCard
                card={card ?? null}
                size={48}
                username={user.username}
                zoom={user.avatarZoom || 1.0}
                positionX={user.avatarPositionX || 50}
                positionY={user.avatarPositionY || 50}
                className="cursor-pointer hover:ring-2 ring-primary transition-all"
              />
            </Link>

            {/* Contenido */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">
                    <Link 
                      href={`/perfil/${user.username}`}
                      className="font-semibold text-foreground hover:underline"
                    >
                      {user.username}
                    </Link>
                    {" "}le dio like al mazo{" "}
                    <Link 
                      href={`/mazo/${deck.id}`}
                      className="font-semibold text-foreground hover:underline"
                    >
                      {deck.name}
                    </Link>
                    {" "}de{" "}
                    <Link 
                      href={`/perfil/${deck.author.username}`}
                      className="font-semibold text-foreground hover:underline"
                    >
                      {deck.author.username}
                    </Link>
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    {timeAgo}
                  </p>
                </div>
                <Heart className="h-5 w-5 text-red-500 shrink-0" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (activity.type === "deck_commented") {
    const { comment, deck } = activity.data
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Avatar */}
            <Link href={`/perfil/${user.username}`}>
              <AvatarCard
                card={card ?? null}
                size={48}
                username={user.username}
                zoom={user.avatarZoom || 1.0}
                positionX={user.avatarPositionX || 50}
                positionY={user.avatarPositionY || 50}
                className="cursor-pointer hover:ring-2 ring-primary transition-all"
              />
            </Link>

            {/* Contenido */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">
                    <Link 
                      href={`/perfil/${user.username}`}
                      className="font-semibold text-foreground hover:underline"
                    >
                      {user.username}
                    </Link>
                    {" "}comentó en el mazo{" "}
                    <Link 
                      href={`/mazo/${deck.id}`}
                      className="font-semibold text-foreground hover:underline"
                    >
                      {deck.name}
                    </Link>
                    {" "}de{" "}
                    <Link 
                      href={`/perfil/${deck.author.username}`}
                      className="font-semibold text-foreground hover:underline"
                    >
                      {deck.author.username}
                    </Link>
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    {timeAgo}
                  </p>
                </div>
                <MessageCircle className="h-5 w-5 text-blue-500 shrink-0" />
              </div>

              {/* Comentario */}
              <Link href={`/mazo/${deck.id}#comment-${comment.id}`}>
                <div className="mt-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                  <p className="text-sm line-clamp-3">
                    {comment.content}
                  </p>
                  {comment.repliesCount > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {comment.repliesCount} {comment.repliesCount === 1 ? "respuesta" : "respuestas"}
                    </p>
                  )}
                </div>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}

