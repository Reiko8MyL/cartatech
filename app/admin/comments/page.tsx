"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminGuard } from "@/components/admin/admin-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { Loader2, Trash2, MessageSquare, RefreshCw, ExternalLink } from "lucide-react";
import Link from "next/link";
import { toastSuccess, toastError } from "@/lib/toast";
import { Pagination } from "@/components/ui/pagination";

interface Comment {
  id: string;
  content: string;
  createdAt: number;
  parentId: string | null;
  user: {
    id: string;
    username: string;
  };
  deck: {
    id: string;
    name: string;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminCommentsPage() {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/comments?userId=${user.id}&page=${currentPage}&limit=20`
      );

      if (!response.ok) {
        throw new Error("Error al cargar comentarios");
      }

      const data = await response.json();
      setComments(data.comments || []);
      setPagination(data.pagination || null);
    } catch (error) {
      console.error("Error al cargar comentarios:", error);
      toastError("Error al cargar comentarios");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id, currentPage]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  async function handleRefresh() {
    setIsRefreshing(true);
    await loadComments();
  }

  async function handleDeleteComment(commentId: string) {
    if (!user?.id) return;

    if (!confirm("¿Estás seguro de que quieres eliminar este comentario?")) {
      return;
    }

    setDeletingId(commentId);

    try {
      const response = await fetch(
        `/api/admin/comments/${commentId}?userId=${user.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al eliminar comentario");
      }

      toastSuccess("Comentario eliminado exitosamente");
      // Remover el comentario de la lista
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (error) {
      console.error("Error al eliminar comentario:", error);
      toastError(
        error instanceof Error
          ? error.message
          : "Error al eliminar comentario"
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AdminGuard requiredRole="MODERATOR">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Moderación de Comentarios</h1>
            <p className="text-muted-foreground">
              Revisa y gestiona los comentarios de la comunidad
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw
              className={`size-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="size-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No hay comentarios para moderar en este momento.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Los comentarios aparecerán aquí cuando haya contenido para revisar.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {comments.map((comment) => (
                <Card key={comment.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">
                            {comment.user.username}
                          </CardTitle>
                          {comment.parentId && (
                            <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded">
                              Respuesta
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-muted-foreground">
                            En mazo: {comment.deck.name}
                          </p>
                          <Link
                            href={`/mazo/${comment.deck.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="size-3 text-muted-foreground hover:text-foreground" />
                          </Link>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={deletingId === comment.id}
                      >
                        {deletingId === comment.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{comment.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(comment.createdAt).toLocaleString("es-ES")}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Paginación */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={(page) => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </AdminGuard>
  );
}

