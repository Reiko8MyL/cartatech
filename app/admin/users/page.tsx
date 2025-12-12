"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminGuard } from "@/components/admin/admin-guard";
import { useAuth } from "@/contexts/auth-context";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Search,
  RefreshCw,
  Users,
  Shield,
  MessageSquare,
  FileText,
  Calendar,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toastSuccess, toastError } from "@/lib/toast";
import { Pagination } from "@/components/ui/pagination";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: number;
  stats: {
    decksCount: number;
    commentsCount: number;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ROLE_LABELS: Record<string, { label: string; color: string; bgColor: string }> = {
  ADMIN: { label: "Administrador", color: "text-red-600", bgColor: "bg-red-600/10 border-red-600/20" },
  MODERATOR: { label: "Moderador", color: "text-blue-600", bgColor: "bg-blue-600/10 border-blue-600/20" },
  USER: { label: "Usuario", color: "text-gray-600", bgColor: "bg-gray-600/10 border-gray-600/20" },
};

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const url = searchTerm
        ? `/api/admin/users?userId=${user.id}&search=${encodeURIComponent(searchTerm)}&page=${currentPage}&limit=20`
        : `/api/admin/users?userId=${user.id}&page=${currentPage}&limit=20`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Error al cargar usuarios");
      }

      const data = await response.json();
      setUsers(data.users || []);
      setPagination(data.pagination || null);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      toastError("Error al cargar usuarios");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id, searchTerm, currentPage]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Resetear a página 1 cuando cambia el término de búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  async function handleUpdateRole(targetUserId: string, role: string) {
    if (!user?.id) return;

    setUpdatingUserId(targetUserId);

    try {
      const response = await fetch(`/api/admin/users/${targetUserId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUserId: user.id,
          newRole: role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar rol");
      }

      toastSuccess(data.message || "Rol actualizado exitosamente");

      // Actualizar estado local
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, role } : u))
      );

      setEditingUserId(null);
      setNewRole("");
    } catch (error) {
      console.error("Error al actualizar rol:", error);
      toastError(
        error instanceof Error ? error.message : "Error al actualizar rol"
      );
    } finally {
      setUpdatingUserId(null);
    }
  }

  function getRoleLabel(role: string) {
    return ROLE_LABELS[role] || ROLE_LABELS.USER;
  }

  return (
    <AdminGuard requiredRole="ADMIN">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">
              Administra usuarios y sus roles en la plataforma
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setIsRefreshing(true);
              loadUsers();
            }}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw
              className={`size-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>
        </div>

        {/* Búsqueda */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
              <Input
                placeholder="Buscar por nombre de usuario o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
              <Users className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pagination?.total || users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administradores</CardTitle>
              <Shield className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter((u) => u.role === "ADMIN").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Moderadores</CardTitle>
              <Shield className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter((u) => u.role === "MODERATOR").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="size-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No se encontraron usuarios
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {users.map((targetUser) => {
              const roleLabel = getRoleLabel(targetUser.role);
              const isEditing = editingUserId === targetUser.id;
              const isCurrentUser = targetUser.id === user?.id;

              return (
                <Card key={targetUser.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">
                            {targetUser.username}
                          </h3>
                          <Badge variant="outline" className={roleLabel.bgColor}>
                            {roleLabel.label}
                          </Badge>
                          {isCurrentUser && (
                            <Badge variant="outline" className="text-xs">
                              Tú
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mb-3">
                          {targetUser.email}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <FileText className="size-4" />
                            <span>{targetUser.stats.decksCount} mazos</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="size-4" />
                            <span>{targetUser.stats.commentsCount} comentarios</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="size-4" />
                            <span>
                              {new Date(targetUser.createdAt).toLocaleDateString(
                                "es-ES"
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <Select
                              value={newRole || targetUser.role}
                              onValueChange={setNewRole}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USER">Usuario</SelectItem>
                                <SelectItem value="MODERATOR">Moderador</SelectItem>
                                <SelectItem value="ADMIN">Administrador</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              onClick={() =>
                                handleUpdateRole(
                                  targetUser.id,
                                  newRole || targetUser.role
                                )
                              }
                              disabled={
                                updatingUserId === targetUser.id ||
                                (newRole || targetUser.role) === targetUser.role
                              }
                            >
                              {updatingUserId === targetUser.id ? (
                                <Loader2 className="size-3 mr-1 animate-spin" />
                              ) : (
                                "Guardar"
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingUserId(null);
                                setNewRole("");
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingUserId(targetUser.id);
                              setNewRole(targetUser.role);
                            }}
                            disabled={isCurrentUser && targetUser.role === "ADMIN"}
                          >
                            Cambiar Rol
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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

