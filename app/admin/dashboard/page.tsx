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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Plus,
  BarChart3,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useBannerSettings, getBannerStyle, getOverlayStyle } from "@/hooks/use-banner-settings";
import { useDeviceType } from "@/hooks/use-banner-settings";
import { getAllBackgroundImages } from "@/lib/deck-builder/banner-utils";

interface AdminStats {
  totalUsers: number;
  totalDecks: number;
  totalPublicDecks: number;
  totalComments: number;
  recentComments: number;
  usersInRange: number;
  decksInRange: number;
  commentsInRange: number;
  timeRange: string;
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
  cardImage?: string | null;
  cardName?: string | null;
}

type TimeRange = "7" | "30" | "90" | "all";

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  "7": "Últimos 7 días",
  "30": "Últimos 30 días",
  "90": "Últimos 90 días",
  all: "Todos los tiempos",
};

// IDs de los cards del dashboard para banners
const DASHBOARD_CARD_IDS = [
  "moderar-comentarios",
  "agregar-carta",
  "ban-list",
  "gestionar-usuarios",
  "ajustar-cartas",
  "ajustar-banners",
] as const;

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const deviceType = useDeviceType();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentDecks, setRecentDecks] = useState<RecentDeck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>("7");

  // Obtener ajustes de banners para cada card
  const cardBannerSettings = DASHBOARD_CARD_IDS.reduce((acc, cardId) => {
    const { setting } = useBannerSettings(`admin-dashboard-card-${cardId}`, "grid", deviceType);
    acc[cardId] = setting;
    return acc;
  }, {} as Record<string, any>);

  async function loadStats() {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/stats?userId=${user.id}&timeRange=${timeRange}`
      );

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
  }, [user, timeRange]);

  async function handleRefresh() {
    setIsRefreshing(true);
    await loadStats();
  }

  function handleTimeRangeChange(value: string) {
    setTimeRange(value as TimeRange);
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

  const getTimeRangeLabel = () => {
    return TIME_RANGE_LABELS[timeRange];
  };

  return (
    <AdminGuard requiredRole="MODERATOR">
      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Panel de Administración
            </h1>
            <p className="text-2xl md:text-4xl lg:text-5xl font-black text-primary animate-pulse">
              Ahora tengo el poder <span className="uppercase">ABSOLUTO</span>
              <br />
              y me la <span className="uppercase">PELA</span>!
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
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
              size="sm"
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
            {/* Selector de rango de tiempo */}
            <Card className="mb-6">
              <CardContent className="py-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-muted-foreground" />
                    <span className="text-xs sm:text-sm font-medium">
                      Rango de tiempo para estadísticas:
                    </span>
                  </div>
                  <Select value={timeRange} onValueChange={handleTimeRangeChange}>
                    <SelectTrigger className="w-full sm:w-[200px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Últimos 7 días</SelectItem>
                      <SelectItem value="30">Últimos 30 días</SelectItem>
                      <SelectItem value="90">Últimos 90 días</SelectItem>
                      <SelectItem value="all">Todos los tiempos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Estadísticas principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 md:mb-8">
              <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Usuarios
                  </CardTitle>
                  <div className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Users className="size-5 text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">
                    {stats?.totalUsers || 0}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <TrendingUp className="size-3" />
                    <span>
                      {stats?.usersInRange || 0} en {getTimeRangeLabel().toLowerCase()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Mazos</CardTitle>
                  <div className="size-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <FileText className="size-5 text-green-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">
                    {stats?.totalDecks || 0}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <TrendingUp className="size-3" />
                    <span>
                      {stats?.decksInRange || 0} en {getTimeRangeLabel().toLowerCase()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Mazos Públicos
                  </CardTitle>
                  <div className="size-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Globe className="size-5 text-purple-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">
                    {stats?.totalPublicDecks || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.totalDecks
                      ? Math.round(
                          (stats.totalPublicDecks / stats.totalDecks) * 100
                        )
                      : 0}
                    % del total
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Comentarios
                  </CardTitle>
                  <div className="size-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <MessageSquare className="size-5 text-orange-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">
                    {stats?.totalComments || 0}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MessageSquare className="size-3" />
                      <span>
                        {stats?.recentComments || 0} en las últimas 24 horas
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      <span>
                        {stats?.commentsInRange || 0} en {getTimeRangeLabel().toLowerCase()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contenido principal */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 md:mb-8">
              {/* Usuarios recientes */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Usuarios Recientes</CardTitle>
                      <CardDescription>
                        Últimos usuarios registrados
                      </CardDescription>
                    </div>
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="size-5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {recentUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No hay usuarios recientes
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {recentUsers.map((recentUser) => (
                        <div
                          key={recentUser.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <Users className="size-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
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
                            className={`${getRoleBadgeColor(recentUser.role)} shrink-0 ml-2`}
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
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Mazos Recientes</CardTitle>
                      <CardDescription>
                        Últimos mazos creados en la plataforma
                      </CardDescription>
                    </div>
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="size-5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {recentDecks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No hay mazos recientes
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {recentDecks.map((deck) => (
                        <Link
                          key={deck.id}
                          href={`/mazo/${deck.id}`}
                          className="block p-3 rounded-lg border bg-card hover:bg-muted/50 transition-all hover:shadow-sm group"
                        >
                          <div className="flex items-center gap-3">
                            {/* Imagen de la carta */}
                            {deck.cardImage ? (
                              <div className="relative size-16 rounded-lg overflow-hidden border border-border shrink-0 bg-muted">
                                <Image
                                  src={deck.cardImage}
                                  alt={deck.cardName || "Carta del mazo"}
                                  fill
                                  className="object-contain p-1"
                                  sizes="64px"
                                  loading="lazy"
                                />
                              </div>
                            ) : (
                              <div className="size-16 rounded-lg border border-border bg-muted flex items-center justify-center shrink-0">
                                <FileText className="size-6 text-muted-foreground" />
                              </div>
                            )}
                            
                            {/* Información del mazo */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                                  {deck.name}
                                </p>
                                {deck.isPublic ? (
                                  <Globe className="size-3 text-green-500 shrink-0" />
                                ) : (
                                  <Lock className="size-3 text-gray-500 shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                <span className="truncate">por {deck.user.username}</span>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                  <Eye className="size-3" />
                                  <span>{deck.viewCount}</span>
                                </div>
                              </div>
                            </div>
                            
                            <ArrowUpRight className="size-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
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
                <Card className="hover:border-primary hover:shadow-md transition-all cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
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
                  <Link href="/admin/agregar-carta">
                    <Card className="hover:border-primary hover:shadow-md transition-all cursor-pointer h-full overflow-hidden relative">
                      {cardBannerSettings["agregar-carta"] && (() => {
                        const bannerImages = getAllBackgroundImages();
                        const bannerImage = bannerImages.find(img => 
                          cardBannerSettings["agregar-carta"]?.backgroundImageId === img.id
                        )?.url;
                        if (bannerImage) {
                          return (
                            <>
                              <div
                                className="absolute inset-0 z-0"
                                style={getBannerStyle(bannerImage, cardBannerSettings["agregar-carta"])}
                              />
                              <div
                                className="absolute inset-0 z-0"
                                style={getOverlayStyle(cardBannerSettings["agregar-carta"])}
                              />
                            </>
                          );
                        }
                        return null;
                      })()}
                      <CardHeader className="relative z-10">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Plus className="size-5" />
                          Agregar Nueva Carta
                        </CardTitle>
                        <CardDescription>
                          Crea nuevas cartas y agrégalas a la base de datos
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <ArrowUpRight className="size-4 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/admin/ban-list">
                    <Card className="hover:border-primary hover:shadow-md transition-all cursor-pointer h-full overflow-hidden relative">
                      {cardBannerSettings["ban-list"] && (() => {
                        const bannerImages = getAllBackgroundImages();
                        const bannerImage = bannerImages.find(img => 
                          cardBannerSettings["ban-list"]?.backgroundImageId === img.id
                        )?.url;
                        if (bannerImage) {
                          return (
                            <>
                              <div
                                className="absolute inset-0 z-0"
                                style={getBannerStyle(bannerImage, cardBannerSettings["ban-list"])}
                              />
                              <div
                                className="absolute inset-0 z-0"
                                style={getOverlayStyle(cardBannerSettings["ban-list"])}
                              />
                            </>
                          );
                        }
                        return null;
                      })()}
                      <CardHeader className="relative z-10">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Settings className="size-5" />
                          Gestionar Ban List
                        </CardTitle>
                        <CardDescription>
                          Actualiza la lista de cartas prohibidas y restringidas
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <ArrowUpRight className="size-4 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/admin/users">
                    <Card className="hover:border-primary hover:shadow-md transition-all cursor-pointer h-full overflow-hidden relative">
                      {cardBannerSettings["gestionar-usuarios"] && (() => {
                        const bannerImages = getAllBackgroundImages();
                        const bannerImage = bannerImages.find(img => 
                          cardBannerSettings["gestionar-usuarios"]?.backgroundImageId === img.id
                        )?.url;
                        if (bannerImage) {
                          return (
                            <>
                              <div
                                className="absolute inset-0 z-0"
                                style={getBannerStyle(bannerImage, cardBannerSettings["gestionar-usuarios"])}
                              />
                              <div
                                className="absolute inset-0 z-0"
                                style={getOverlayStyle(cardBannerSettings["gestionar-usuarios"])}
                              />
                            </>
                          );
                        }
                        return null;
                      })()}
                      <CardHeader className="relative z-10">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Users className="size-5" />
                          Gestionar Usuarios
                        </CardTitle>
                        <CardDescription>
                          Administra usuarios y sus roles
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="relative z-10">
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
                <Card className="hover:border-primary hover:shadow-md transition-all cursor-pointer h-full overflow-hidden relative">
                  {cardBannerSettings["ajustar-cartas"] && (() => {
                    const bannerImages = getAllBackgroundImages();
                    const bannerImage = bannerImages.find(img => 
                      cardBannerSettings["ajustar-cartas"]?.backgroundImageId === img.id
                    )?.url;
                    if (bannerImage) {
                      return (
                        <>
                          <div
                            className="absolute inset-0 z-0"
                            style={getBannerStyle(bannerImage, cardBannerSettings["ajustar-cartas"])}
                          />
                          <div
                            className="absolute inset-0 z-0"
                            style={getOverlayStyle(cardBannerSettings["ajustar-cartas"])}
                          />
                        </>
                      );
                    }
                    return null;
                  })()}
                  <CardHeader className="relative z-10">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Settings className="size-5" />
                      Ajustar Cartas
                    </CardTitle>
                    <CardDescription>
                      Ajusta la posición Y de las cartas en la lista
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <ArrowUpRight className="size-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>

              {user?.role === "ADMIN" && (
                <Link href="/admin/ajustar-banners">
                  <Card className="hover:border-primary hover:shadow-md transition-all cursor-pointer h-full overflow-hidden relative">
                    {cardBannerSettings["ajustar-banners"] && (() => {
                      const bannerImages = getAllBackgroundImages();
                      const bannerImage = bannerImages.find(img => 
                        cardBannerSettings["ajustar-banners"]?.backgroundImageId === img.id
                      )?.url;
                      if (bannerImage) {
                        return (
                          <>
                            <div
                              className="absolute inset-0 z-0"
                              style={getBannerStyle(bannerImage, cardBannerSettings["ajustar-banners"])}
                            />
                            <div
                              className="absolute inset-0 z-0"
                              style={getOverlayStyle(cardBannerSettings["ajustar-banners"])}
                            />
                          </>
                        );
                      }
                      return null;
                    })()}
                    <CardHeader className="relative z-10">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="size-5" />
                        Ajustar Banners
                      </CardTitle>
                      <CardDescription>
                        Ajusta cómo se ven los banners de los deck panels
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <ArrowUpRight className="size-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </AdminGuard>
  );
}
