"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, User, LogOut, LogIn, UserPlus, Sun, Moon, Monitor, Shield } from "lucide-react";
import { NavLink } from "./nav-link";
import { UtilidadDropdown } from "./utilidad-dropdown";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Logo } from "@/components/ui/logo";
import { useAuth } from "@/contexts/auth-context";
import { hasModeratorAccess } from "@/lib/auth/authorization";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mobileNavLinks = [
  { href: "/", label: "Inicio" },
  { href: "/deck-builder", label: "Deck Builder" },
  { href: "/galeria", label: "Galería" },
  { href: "/mis-mazos", label: "Mis Mazos" },
  { href: "/mis-favoritos", label: "Mis Favoritos" },
  { href: "/mazos-comunidad", label: "Mazos de la Comunidad" },
];

const utilidadLinks = [
  { href: "/utilidad/ban-list", label: "Ban List" },
  { href: "/utilidad/comunidad-vota", label: "La Comunidad Vota" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo y navegación a la izquierda */}
        <div className="flex items-center gap-4 lg:gap-6">
          <Link
            href="/"
            prefetch={true}
            className="flex items-center transition-opacity hover:opacity-80"
          >
            <Logo
              width={150}
              height={50}
              className="h-12 sm:h-14"
              priority={false}
            />
          </Link>
          <div className="hidden items-center gap-1 lg:flex">
            <NavLink href="/">Inicio</NavLink>
            <NavLink href="/deck-builder">Deck Builder</NavLink>
            <NavLink href="/galeria">Galería</NavLink>
            <NavLink href="/mis-mazos">Mis Mazos</NavLink>
            <NavLink href="/mazos-comunidad">Mazos de la Comunidad</NavLink>
            <UtilidadDropdown />
          </div>
        </div>

        {/* Opciones de usuario a la derecha */}
        <div className="flex items-center gap-2">
          {/* Toggle de tema */}
          <ThemeToggle />
          
          {/* Notificaciones */}
          {user && <NotificationBell />}
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2" aria-label={`Menú de usuario: ${user.username}`}>
                  <User className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">{user.username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/mis-mazos" className="cursor-pointer">
                    Mis Mazos
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/mis-favoritos" className="cursor-pointer">
                    Mis Favoritos
                  </Link>
                </DropdownMenuItem>
                {hasModeratorAccess(user.role) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin/dashboard" className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" aria-hidden="true" />
                        Panel de Administración
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" asChild>
                <Link href="/registro" className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Registro
                </Link>
              </Button>
              <Button asChild>
                <Link href="/inicio-sesion" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Iniciar Sesión
                </Link>
              </Button>
            </div>
          )}

          {/* Menú móvil */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <button
                className="inline-flex items-center justify-center rounded-md p-2 text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                aria-label="Abrir menú"
              >
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] flex flex-col">
              <SheetHeader className="flex-shrink-0">
                <SheetTitle>Menú</SheetTitle>
              </SheetHeader>
              <nav className="mt-4 flex flex-col gap-1 overflow-y-auto flex-1 min-h-0">
                {mobileNavLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground rounded-md"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="border-t pt-2 mt-2">
                  <p className="px-4 py-1.5 text-xs font-semibold text-foreground">
                    Utilidad
                  </p>
                  {utilidadLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className="block px-8 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground rounded-md"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
                {/* Toggle de tema en móvil */}
                <div className="border-t pt-2 mt-2">
                  <div className="px-4 py-1.5 text-xs font-semibold text-foreground">
                    Tema
                  </div>
                  <button
                    onClick={() => setTheme("light")}
                    className={`w-full text-left px-4 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-md ${
                      mounted && theme === "light" ? "bg-accent text-accent-foreground" : ""
                    }`}
                    aria-label="Cambiar a tema claro"
                    aria-pressed={mounted && theme === "light"}
                    role="button"
                  >
                    <Sun className="h-4 w-4" aria-hidden="true" />
                    <span>Claro</span>
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`w-full text-left px-4 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-md ${
                      mounted && theme === "dark" ? "bg-accent text-accent-foreground" : ""
                    }`}
                    aria-label="Cambiar a tema oscuro"
                    aria-pressed={mounted && theme === "dark"}
                    role="button"
                  >
                    <Moon className="h-4 w-4" aria-hidden="true" />
                    <span>Oscuro</span>
                  </button>
                  <button
                    onClick={() => setTheme("system")}
                    className={`w-full text-left px-4 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-md ${
                      mounted && theme === "system" ? "bg-accent text-accent-foreground" : ""
                    }`}
                    aria-label="Usar tema del sistema"
                    aria-pressed={mounted && theme === "system"}
                    role="button"
                  >
                    <Monitor className="h-4 w-4" aria-hidden="true" />
                    <span>Sistema</span>
                  </button>
                </div>
                
                {!user && (
                  <div className="border-t pt-2 mt-2 space-y-1">
                    <Link
                      href="/registro"
                      onClick={() => setIsOpen(false)}
                      className="block px-4 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground rounded-md"
                    >
                      Registro
                    </Link>
                    <Link
                      href="/inicio-sesion"
                      onClick={() => setIsOpen(false)}
                      className="block px-4 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground rounded-md"
                    >
                      Iniciar Sesión
                    </Link>
                  </div>
                )}
                {user && (
                  <div className="border-t pt-2 mt-2">
                    <div className="px-4 py-1.5 text-xs text-muted-foreground">
                      {user.username}
                    </div>
                    {hasModeratorAccess(user.role) && (
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground rounded-md"
                      >
                        <Shield className="h-4 w-4" />
                        Panel de Administración
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-4 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-destructive rounded-md"
                      aria-label="Cerrar sesión"
                      role="button"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}

