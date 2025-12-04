"use client";

import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/admin/admin-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { Loader2, Trash2, MessageSquare } from "lucide-react";
import { toastSuccess, toastError } from "@/lib/toast";

interface Comment {
  id: string;
  content: string;
  createdAt: number;
  user: {
    id: string;
    username: string;
  };
  deck: {
    id: string;
    name: string;
  };
}

export default function AdminCommentsPage() {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Implementar API para obtener comentarios recientes
    // Por ahora, mostramos un placeholder
    setIsLoading(false);
  }, []);

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Moderación de Comentarios</h1>
          <p className="text-muted-foreground">
            Revisa y gestiona los comentarios de la comunidad
          </p>
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
          <div className="space-y-4">
            {comments.map((comment) => (
              <Card key={comment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {comment.user.username}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        En mazo: {comment.deck.name}
                      </p>
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
        )}
      </div>
    </AdminGuard>
  );
}

