"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Send, Edit2, Trash2, Reply, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { getDeckComments, createComment, updateComment, deleteComment, type Comment } from "@/lib/api/comments"
import { toastSuccess, toastError } from "@/lib/toast"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Skeleton } from "@/components/ui/skeleton"

interface CommentsSectionProps {
  deckId: string
  deckName: string
}

export function CommentsSection({ deckId, deckName }: CommentsSectionProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null)

  useEffect(() => {
    loadComments()
  }, [deckId])

  const loadComments = async () => {
    setIsLoading(true)
    try {
      const loadedComments = await getDeckComments(deckId)
      setComments(loadedComments)
    } catch (error) {
      console.error("Error al cargar comentarios:", error)
      toastError("Error al cargar comentarios")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) {
      if (!user) {
        toastError("Debes iniciar sesión para comentar")
      }
      return
    }

    // Validar que tenemos todos los datos necesarios
    if (!user.id) {
      console.error("Error: user.id no está disponible", { user })
      toastError("Error: No se pudo identificar tu usuario. Por favor, inicia sesión nuevamente.")
      return
    }

    if (!deckId) {
      console.error("Error: deckId no está disponible")
      toastError("Error: No se pudo identificar el mazo.")
      return
    }

    try {
      const comment = await createComment(deckId, newComment.trim(), user.id)
      if (comment) {
        setNewComment("")
        await loadComments()
        toastSuccess("Comentario publicado")
      }
    } catch (error) {
      console.error("Error al crear comentario:", error)
      toastError(error instanceof Error ? error.message : "Error al publicar comentario")
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!user || !replyContent.trim()) return

    try {
      const comment = await createComment(deckId, replyContent.trim(), user.id, parentId)
      if (comment) {
        setReplyContent("")
        setReplyingTo(null)
        await loadComments()
        toastSuccess("Respuesta publicada")
      }
    } catch (error) {
      console.error("Error al crear respuesta:", error)
      toastError(error instanceof Error ? error.message : "Error al publicar respuesta")
    }
  }

  const handleStartEdit = (comment: Comment) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
  }

  const handleSaveEdit = async (commentId: string) => {
    if (!user || !editContent.trim()) return

    try {
      await updateComment(deckId, commentId, editContent.trim(), user.id)
      setEditingId(null)
      setEditContent("")
      await loadComments()
      toastSuccess("Comentario actualizado")
    } catch (error) {
      console.error("Error al actualizar comentario:", error)
      toastError(error instanceof Error ? error.message : "Error al actualizar comentario")
    }
  }

  const handleDelete = (commentId: string) => {
    setCommentToDelete(commentId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!user || !commentToDelete) return

    try {
      await deleteComment(deckId, commentToDelete, user.id)
      setDeleteDialogOpen(false)
      setCommentToDelete(null)
      await loadComments()
      toastSuccess("Comentario eliminado")
    } catch (error) {
      console.error("Error al eliminar comentario:", error)
      toastError(error instanceof Error ? error.message : "Error al eliminar comentario")
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Ahora"
    if (minutes < 60) return `Hace ${minutes} minuto${minutes > 1 ? "s" : ""}`
    if (hours < 24) return `Hace ${hours} hora${hours > 1 ? "s" : ""}`
    if (days < 7) return `Hace ${days} día${days > 1 ? "s" : ""}`
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comentarios ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Formulario de nuevo comentario */}
          {user ? (
            <div className="space-y-2">
              <Textarea
                placeholder="Escribe un comentario..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <div className="flex justify-end">
                <Button onClick={handleSubmitComment} disabled={!newComment.trim()}>
                  <Send className="h-4 w-4 mr-2" />
                  Publicar
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              <a href="/inicio-sesion" className="text-primary hover:underline">
                Inicia sesión
              </a>{" "}
              para comentar
            </p>
          )}

          {/* Lista de comentarios */}
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay comentarios aún. ¡Sé el primero en comentar!
            </p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                        {comment.user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{comment.user.username}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(comment.createdAt)}
                        </p>
                      </div>
                    </div>
                    {user && user.id === comment.userId && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartEdit(comment)}
                          className="h-7 px-2"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(comment.id)}
                          className="h-7 px-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {editingId === comment.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingId(null)
                            setEditContent("")
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button size="sm" onClick={() => handleSaveEdit(comment.id)}>
                          Guardar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap mb-2">{comment.content}</p>
                  )}

                  {user && editingId !== comment.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setReplyingTo(replyingTo === comment.id ? null : comment.id)
                        setReplyContent("")
                      }}
                      className="h-7 px-2 text-xs"
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      {replyingTo === comment.id ? "Cancelar" : "Responder"}
                    </Button>
                  )}

                  {/* Formulario de respuesta */}
                  {replyingTo === comment.id && (
                    <div className="ml-8 mt-2 space-y-2 border-l-2 pl-4">
                      <Textarea
                        placeholder="Escribe una respuesta..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setReplyingTo(null)
                            setReplyContent("")
                          }}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSubmitReply(comment.id)}
                          disabled={!replyContent.trim()}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Responder
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Respuestas */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-8 mt-4 space-y-4 border-l-2 pl-4">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">
                                {reply.user.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-xs font-semibold">{reply.user.username}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(reply.createdAt)}
                                </p>
                              </div>
                            </div>
                            {user && user.id === reply.userId && (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(reply.id)}
                                  className="h-6 px-2 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                          <p className="text-xs whitespace-pre-wrap">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Eliminar comentario"
        description="¿Estás seguro de que quieres eliminar este comentario? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </>
  )
}

