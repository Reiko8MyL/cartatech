const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""

export interface UserProfile {
  user: {
    id: string
    username: string
    avatarCardId: string | null
    avatarZoom: number | null
    avatarPositionX: number | null
    avatarPositionY: number | null
    bio: string | null
    profileBannerImage: string | null
    country: string | null
    region: string | null
    city: string | null
    favoriteRaces: string[] | null
    favoriteFormat: string | null
    team: string | null
    preferredStore: string | null
    createdAt: number
  }
  stats: {
    totalDecks: number
    publicDecks: number
    totalLikes: number
    totalViews: number
    followerCount: number
    followingCount: number
  }
  publicDecks: Array<{
    id: string
    name: string
    description?: string
    format: string
    tags: string[]
    publishedAt?: number
    viewCount: number
    createdAt: number
    cards: any
  }>
}

export interface MyProfile {
  user: {
    id: string
    username: string
    email: string
    role: string
    avatarCardId: string | null
    avatarZoom: number | null
    avatarPositionX: number | null
    avatarPositionY: number | null
    bio: string | null
    profileBannerImage: string | null
    country: string | null
    region: string | null
    city: string | null
    favoriteRaces: string[] | null
    favoriteFormat: string | null
    team: string | null
    preferredStore: string | null
    createdAt: number
    updatedAt: number
  }
  stats: {
    totalDecks: number
    publicDecks: number
    privateDecks: number
    totalLikes: number
    totalViews: number
    favoriteCount: number
    commentCount: number
  }
  recentDecks: Array<{
    id: string
    name: string
    description: string | null
    isPublic: boolean
    format: string
    tags: string[]
    backgroundImage: string | null
    viewCount: number
    updatedAt: number
    createdAt: number
    cards: any
  }>
  recentFavorites: Array<{
    id: string
    createdAt: number
    deck: {
      id: string
      name: string
      description: string | null
      isPublic: boolean
      format: string
      tags: string[]
      backgroundImage: string | null
      viewCount: number
      createdAt: number
      cards: any
      user: {
        username: string
      }
    }
  }>
}

// Obtener perfil de usuario por username
export async function getUserProfile(username: string): Promise<UserProfile | null> {
  try {
    const url = API_BASE_URL 
      ? `${API_BASE_URL}/api/users/${username}`
      : `/api/users/${username}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    if (!response.ok) {
      let errorData: any = {}
      let errorText = ""
      
      try {
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          errorData = await response.json()
        } else {
          errorText = await response.text()
        }
      } catch (e) {
        console.error("Error al parsear respuesta de error:", e)
      }
      
      console.error("Error al obtener perfil de usuario:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData.error || errorText || "Error desconocido",
        errorData,
        username,
        url,
      })
      
      if (response.status === 404) {
        return null
      }
      
      // Retornar null en lugar de lanzar error para que el componente pueda manejar el estado
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error al obtener perfil de usuario:", error)
    return null
  }
}

// Obtener perfil completo del usuario actual
export async function getMyProfile(userId: string): Promise<MyProfile | null> {
  try {
    if (!userId) {
      console.error("getMyProfile: userId no proporcionado")
      return null
    }

    const url = API_BASE_URL 
      ? `${API_BASE_URL}/api/users/me?userId=${userId}`
      : `/api/users/me?userId=${userId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    if (!response.ok) {
      let errorData: any = {}
      let errorText = ""
      
      try {
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          errorData = await response.json()
        } else {
          errorText = await response.text()
        }
      } catch (e) {
        console.error("Error al parsear respuesta de error:", e)
      }
      
      console.error("Error al obtener perfil:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData.error || errorText || "Error desconocido",
        errorData,
        userId,
        url,
      })
      
      if (response.status === 404) {
        return null
      }
      
      // Retornar null en lugar de lanzar error para que el componente pueda manejar el estado
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error al obtener perfil:", error)
    return null
  }
}

// Actualizar perfil del usuario actual
export async function updateMyProfile(
  userId: string,
  updates: { 
    avatarCardId?: string | null
    avatarZoom?: number | null
    avatarPositionX?: number | null
    avatarPositionY?: number | null
    bio?: string | null
    profileBannerImage?: string | null
    country?: string | null
    region?: string | null
    city?: string | null
    favoriteRaces?: string[] | null
    favoriteFormat?: string | null
    team?: string | null
    preferredStore?: string | null
  }
): Promise<{ success: boolean; user?: MyProfile['user']; error?: string }> {
  try {
    const url = API_BASE_URL 
      ? `${API_BASE_URL}/api/users/me?userId=${userId}`
      : `/api/users/me?userId=${userId}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.error || "Error al actualizar el perfil",
      }
    }

    const data = await response.json()
    return {
      success: true,
      user: data.user,
    }
  } catch (error) {
    console.error("Error al actualizar perfil:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al actualizar el perfil",
    }
  }
}

// Interfaces para seguimiento
export interface FollowStatus {
  isFollowing: boolean;
  followerCount: number;
  followingCount: number;
  followId: string | null;
}

export interface FollowUser {
  id: string;
  username: string;
  avatarCardId: string | null;
  avatarZoom: number | null;
  avatarPositionX: number | null;
  avatarPositionY: number | null;
  bio: string | null;
  createdAt: number;
  followedAt: number;
}

export interface FollowListResponse {
  followers?: FollowUser[];
  following?: FollowUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Obtener estado de seguimiento
export async function getFollowStatus(
  username: string,
  userId: string
): Promise<FollowStatus | null> {
  try {
    const url = API_BASE_URL
      ? `${API_BASE_URL}/api/users/${username}/follow-status?userId=${userId}`
      : `/api/users/${username}/follow-status?userId=${userId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Error al obtener estado de seguimiento");
    }

    const data: FollowStatus = await response.json();
    return data;
  } catch (error) {
    console.error("Error en getFollowStatus:", error);
    return null;
  }
}

// Seguir usuario
export async function followUser(
  username: string,
  userId: string
): Promise<boolean> {
  try {
    const url = API_BASE_URL
      ? `${API_BASE_URL}/api/users/${username}/follow`
      : `/api/users/${username}/follow`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error al seguir usuario");
    }

    return true;
  } catch (error) {
    console.error("Error en followUser:", error);
    throw error;
  }
}

// Dejar de seguir usuario
export async function unfollowUser(
  username: string,
  userId: string
): Promise<boolean> {
  try {
    const url = API_BASE_URL
      ? `${API_BASE_URL}/api/users/${username}/follow?userId=${userId}`
      : `/api/users/${username}/follow?userId=${userId}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error al dejar de seguir usuario");
    }

    return true;
  } catch (error) {
    console.error("Error en unfollowUser:", error);
    throw error;
  }
}

// Obtener seguidores
export async function getFollowers(
  username: string,
  page: number = 1,
  limit: number = 20
): Promise<FollowListResponse | null> {
  try {
    const url = API_BASE_URL
      ? `${API_BASE_URL}/api/users/${username}/followers?page=${page}&limit=${limit}`
      : `/api/users/${username}/followers?page=${page}&limit=${limit}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Error al obtener seguidores");
    }

    const data: FollowListResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error en getFollowers:", error);
    return null;
  }
}

// Obtener usuarios seguidos
export async function getFollowing(
  username: string,
  page: number = 1,
  limit: number = 20
): Promise<FollowListResponse | null> {
  try {
    const url = API_BASE_URL
      ? `${API_BASE_URL}/api/users/${username}/following?page=${page}&limit=${limit}`
      : `/api/users/${username}/following?page=${page}&limit=${limit}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Error al obtener usuarios seguidos");
    }

    const data: FollowListResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error en getFollowing:", error);
    return null;
  }
}






















