const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface ActivityUser {
  id: string;
  username: string;
  avatarCardId: string | null;
  avatarZoom: number | null;
  avatarPositionX: number | null;
  avatarPositionY: number | null;
}

export interface ActivityDeck {
  id: string;
  name: string;
  description?: string | null;
  format: string;
  publishedAt?: number;
  viewCount: number;
  likes: number;
  favorites: number;
  comments: number;
  backgroundImage?: string | null;
  techCardId?: string | null;
}

export interface ActivityDeckAuthor {
  id: string;
  username: string;
}

export interface DeckPublishedActivity {
  type: 'deck_published';
  timestamp: number;
  data: {
    deck: ActivityDeck;
    user: ActivityUser;
  };
}

export interface DeckLikedActivity {
  type: 'deck_liked';
  timestamp: number;
  data: {
    like: {
      id: string;
      createdAt: number;
    };
    user: ActivityUser;
    deck: {
      id: string;
      name: string;
      format: string;
      userId: string;
      author: ActivityDeckAuthor;
    };
  };
}

export interface DeckCommentedActivity {
  type: 'deck_commented';
  timestamp: number;
  data: {
    comment: {
      id: string;
      content: string;
      createdAt: number;
      repliesCount: number;
    };
    user: ActivityUser;
    deck: {
      id: string;
      name: string;
      format: string;
      userId: string;
      author: ActivityDeckAuthor;
    };
  };
}

export type Activity = DeckPublishedActivity | DeckLikedActivity | DeckCommentedActivity;

export interface FeedResponse {
  activities: Activity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Obtiene el feed de actividad de usuarios seguidos
 */
export async function getFeed(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<FeedResponse | null> {
  try {
    const url = API_BASE_URL 
      ? `${API_BASE_URL}/api/feed?userId=${userId}&page=${page}&limit=${limit}`
      : `/api/feed?userId=${userId}&page=${page}&limit=${limit}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    
    if (!response.ok) {
      throw new Error("Error al obtener feed de actividad");
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al obtener feed de actividad:", error);
    return null;
  }
}

