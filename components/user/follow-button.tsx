"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { getFollowStatus, followUser, unfollowUser } from "@/lib/api/users";
import { toastSuccess, toastError } from "@/lib/toast";
import { useAuth } from "@/contexts/auth-context";

interface FollowButtonProps {
  username: string;
  onFollowChange?: (isFollowing: boolean, followerCount: number) => void;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function FollowButton({
  username,
  onFollowChange,
  className,
  variant = "default",
  size = "default",
}: FollowButtonProps) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  // Cargar estado inicial
  useEffect(() => {
    if (!user?.id || !username) {
      setIsLoading(false);
      return;
    }

    const loadFollowStatus = async () => {
      try {
        const status = await getFollowStatus(username, user.id);
        if (status) {
          setIsFollowing(status.isFollowing);
          setFollowerCount(status.followerCount);
        }
      } catch (error) {
        console.error("Error al cargar estado de seguimiento:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFollowStatus();
  }, [user?.id, username]);

  const handleToggleFollow = async () => {
    if (!user?.id) {
      toastError("Debes iniciar sesión para seguir usuarios");
      return;
    }

    if (isToggling) return;

    setIsToggling(true);
    const previousState = isFollowing;
    const previousCount = followerCount;

    // Actualización optimista
    setIsFollowing(!previousState);
    setFollowerCount(previousState ? followerCount - 1 : followerCount + 1);

    try {
      if (previousState) {
        await unfollowUser(username, user.id);
        toastSuccess("Dejaste de seguir a este usuario");
      } else {
        await followUser(username, user.id);
        toastSuccess("Comenzaste a seguir a este usuario");
      }

      // Notificar cambio
      if (onFollowChange) {
        onFollowChange(!previousState, previousState ? followerCount - 1 : followerCount + 1);
      }
    } catch (error) {
      // Revertir actualización optimista
      setIsFollowing(previousState);
      setFollowerCount(previousCount);
      
      const errorMessage = error instanceof Error ? error.message : "Error al actualizar seguimiento";
      toastError(errorMessage);
    } finally {
      setIsToggling(false);
    }
  };

  // No mostrar si es el propio perfil (comparación case-insensitive)
  if (user?.id && user.username && user.username.toLowerCase().trim() === username.toLowerCase().trim()) {
    return null;
  }

  // Si no hay usuario logueado, mostrar botón que redirige a login
  if (!user?.id) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => {
          // Redirigir a login - el router se puede obtener del contexto o usar window.location
          if (typeof window !== "undefined") {
            window.location.href = "/inicio-sesion";
          }
        }}
        className={className}
      >
        <UserPlus className="h-4 w-4 mr-2" />
        Iniciar sesión para seguir
      </Button>
    );
  }

  if (isLoading) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={className}
      >
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Cargando...
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleFollow}
      disabled={isToggling}
      className={className}
    >
      {isToggling ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : isFollowing ? (
        <UserMinus className="h-4 w-4 mr-2" />
      ) : (
        <UserPlus className="h-4 w-4 mr-2" />
      )}
      {isFollowing ? "Dejar de seguir" : "Seguir"}
    </Button>
  );
}

