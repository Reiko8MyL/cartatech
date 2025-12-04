"use client";

import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/admin/admin-guard";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, MessageSquare, Users, Settings } from "lucide-react";
import Link from "next/link";

interface AdminStats {
  totalUsers: number;
  totalDecks: number;
  totalComments: number;
  recentComments: number;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // En una implementación real, aquí harías fetch a una API de estadísticas
    // Por ahora, solo mostramos un dashboard básico
    setIsLoading(false);
    setStats({
      totalUsers: 0,
      totalDecks: 0,
      totalComments: 0,
      recentComments: 0,
    });
  }, []);

  return (
    <AdminGuard requiredRole="MODERATOR">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Panel de Administración</h1>
          <p className="text-muted-foreground">
            Bienvenido, {user?.username}. Gestiona el contenido y los usuarios de la plataforma.
          </p>
          {user?.role === "ADMIN" && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
              <Shield className="size-4" />
              Administrador
            </div>
          )}
          {user?.role === "MODERATOR" && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-sm font-medium">
              <Shield className="size-4" />
              Moderador
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
                  <Users className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">Usuarios registrados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Mazos</CardTitle>
                  <Settings className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalDecks || 0}</div>
                  <p className="text-xs text-muted-foreground">Mazos creados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Comentarios</CardTitle>
                  <MessageSquare className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalComments || 0}</div>
                  <p className="text-xs text-muted-foreground">Comentarios en total</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Comentarios Recientes</CardTitle>
                  <MessageSquare className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.recentComments || 0}</div>
                  <p className="text-xs text-muted-foreground">Últimas 24 horas</p>
                </CardContent>
              </Card>
            </div>

            {/* Accesos rápidos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Moderar Comentarios</CardTitle>
                  <CardDescription>
                    Revisa y gestiona comentarios de la comunidad
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/comments">
                    <Button className="w-full" variant="outline">
                      <MessageSquare className="size-4 mr-2" />
                      Ir a Moderación
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {user?.role === "ADMIN" && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Gestionar Ban List</CardTitle>
                      <CardDescription>
                        Actualiza la lista de cartas prohibidas y restringidas
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link href="/admin/ban-list">
                        <Button className="w-full" variant="outline">
                          <Settings className="size-4 mr-2" />
                          Gestionar Ban List
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Gestionar Usuarios</CardTitle>
                      <CardDescription>
                        Administra usuarios y sus roles
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link href="/admin/users">
                        <Button className="w-full" variant="outline">
                          <Users className="size-4 mr-2" />
                          Gestionar Usuarios
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Ajustar Cartas</CardTitle>
                  <CardDescription>
                    Ajusta la posición Y de las cartas en la lista
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/ajustar-cartas">
                    <Button className="w-full" variant="outline">
                      <Settings className="size-4 mr-2" />
                      Ir a Ajustes
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminGuard>
  );
}

