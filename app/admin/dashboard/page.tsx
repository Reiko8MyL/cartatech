"use client";

import { useEffect, useState } from "react";
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
import {
  Loader2,
  Shield,
  MessageSquare,
  Users,
  Settings,
  FileText,
  TrendingUp,
  RefreshCw,
  Eye,
  Globe,
  Lock,
  Calendar,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface AdminStats {
  totalUsers: number;
  totalDecks: number;
  totalPublicDecks: number;
  totalComments: number;
  recentComments: number;
  usersLast7Days: number;
  decksLast7Days: number;
}

interface RecentUser {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: number;
}

interface RecentDeck {
  id: string;
  name: string;
  isPublic: boolean;
  viewCount: number;
  createdAt: number;
  user: {
    id: string;
    username: string;
  };
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentDecks, setRecentDecks] = useState<RecentDeck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function loadStats() {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/stats?userId=${user.id}`);

      if (!response.ok) {
        throw new Error("Error al cargar estadísticas");
      }

      const data = await response.json();
      setStats(data.stats);
      setRecentUsers(data.recentUsers || []);
      setRecentDecks(data.recentDecks || []);
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, [user]);

  async function handleRefresh() {
    setIsRefreshing(true);
    await loadStats();
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "MODERATOR":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  return (
    <AdminGuard requiredRole="MODERATOR">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Panel de Administración</h1>
            <p className="text-muted-foreground">
              Bienvenido, {user?.username}. Gestiona el contenido y los usuarios
              de la plataforma.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user?.role === "ADMIN" && (
              <Badge
                variant="outline"
                className="bg-red-500/10 text-red-500 border-red-500/20"
              >
                <Shield className="size-3 mr-1" />
                Administrador
              </Badge>
            )}
            {user?.role === "MODERATOR" && (
              <Badge
                variant="outline"
                className="bg-blue-500/10 text-blue-500 border-blue-500/20"
              >
                <Shield className="size-3 mr-1" />
                Moderador
              </Badge>
            )}
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
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Estadísticas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Usuarios
                  </CardTitle>
                  <Users className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.totalUsers || 0}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <TrendingUp className="size-3" />
                    <span>
                      +{stats?.usersLast7Days || 0} en los últimos 7 días
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Mazos</CardTitle>
                  <FileText className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.totalDecks || 0}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <TrendingUp className="size-3" />
                    <span>
                      +{stats?.decksLast7Days || 0} en los últimos 7 días
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Mazos Públicos
                  </CardTitle>
                  <Globe className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.totalPublicDecks || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.totalDecks
                      ? Math.round(
                          (stats.totalPublicDecks / stats.totalDecks) * 100
                        )
                      : 0}
                    % del total
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Comentarios
                  </CardTitle>
                  <MessageSquare className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.totalComments || 0}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <MessageSquare className="size-3" />
                    <span>
                      {stats?.recentComments || 0} en las últimas 24 horas
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contenido principal */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Usuarios recientes */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Usuarios Recientes</CardTitle>
                      <CardDescription>
                        Últimos usuarios registrados
                      </CardDescription>
                    </div>
                    <Users className="size-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  {recentUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay usuarios recientes
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {recentUsers.map((recentUser) => (
                        <div
                          key={recentUser.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="size-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {recentUser.username}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(recentUser.createdAt).toLocaleDateString(
                                  "es-ES",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={getRoleBadgeColor(recentUser.role)}
                          >
                            {recentUser.role}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Mazos recientes */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Mazos Recientes</CardTitle>
                      <CardDescription>
                        Últimos mazos creados en la plataforma
                      </CardDescription>
                    </div>
                    <FileText className="size-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  {recentDecks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay mazos recientes
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {recentDecks.map((deck) => (
                        <Link
                          key={deck.id}
                          href={`/mazo/${deck.id}`}
                          className="block p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm truncate">
                                  {deck.name}
                                </p>
                                {deck.isPublic ? (
                                  <Globe className="size-3 text-green-500 shrink-0" />
                                ) : (
                                  <Lock className="size-3 text-gray-500 shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>por {deck.user.username}</span>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                  <Eye className="size-3" />
                                  <span>{deck.viewCount}</span>
                                </div>
                              </div>
                            </div>
                            <ArrowUpRight className="size-4 text-muted-foreground shrink-0 ml-2" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Accesos rápidos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/admin/comments">
                <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="size-5" />
                      Moderar Comentarios
                    </CardTitle>
                    <CardDescription>
                      Revisa y gestiona comentarios de la comunidad
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {stats?.totalComments || 0}
                      </span>
                      <ArrowUpRight className="size-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {user?.role === "ADMIN" && (
                <>
                  <Link href="/admin/ban-list">
                    <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Settings className="size-5" />
                          Gestionar Ban List
                        </CardTitle>
                        <CardDescription>
                          Actualiza la lista de cartas prohibidas y restringidas
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ArrowUpRight className="size-4 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/admin/users">
                    <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="size-5" />
                          Gestionar Usuarios
                        </CardTitle>
                        <CardDescription>
                          Administra usuarios y sus roles
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold">
                            {stats?.totalUsers || 0}
                          </span>
                          <ArrowUpRight className="size-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </>
              )}

              <Link href="/admin/ajustar-cartas">
                <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="size-5" />
                      Ajustar Cartas
                    </CardTitle>
                    <CardDescription>
                      Ajusta la posición Y de las cartas en la lista
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ArrowUpRight className="size-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            </div>
          </>
        )}
      </div>
    </AdminGuard>
  );
}
