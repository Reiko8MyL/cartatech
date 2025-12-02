import { User } from "@/contexts/auth-context";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface LoginResponse {
  user: User;
}

export interface RegisterResponse {
  user: User;
}

/**
 * Inicia sesión con usuario y contraseña
 */
export async function login(
  username: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Error al iniciar sesión",
      };
    }

    return {
      success: true,
      user: data.user,
    };
  } catch (error) {
    console.error("Error en login:", error);
    
    // Log detallado del error
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return {
      success: false,
      error: error instanceof Error ? `Error de conexión: ${error.message}` : "Error de conexión al iniciar sesión",
    };
  }
}

/**
 * Registra un nuevo usuario
 */
export async function register(
  username: string,
  email: string,
  password: string,
  dateOfBirth: { month: string; day: string; year: string }
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        email,
        password,
        dateOfBirth,
      }),
    });

    // Verificar que la respuesta sea JSON antes de parsear
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Respuesta no es JSON:", text);
      return {
        success: false,
        error: "Error del servidor. Por favor intenta de nuevo.",
      };
    }

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Error al registrar usuario",
      };
    }

    return {
      success: true,
      user: data.user,
    };
  } catch (error) {
    console.error("Error en registro:", error);
    return {
      success: false,
      error: "Error de conexión al registrar usuario",
    };
  }
}

