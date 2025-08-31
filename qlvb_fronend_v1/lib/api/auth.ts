import api from "./config";
import { UserDTO as User } from "./users";
import { ResponseDTO } from "./types";
export interface AuthRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  fullName: any;
  accessToken: string;
  refreshToken: string;
  user: User;
  roles: string[];
  rememberMe?: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  roles: string[];
  tokenType: string;
  expiresIn: number;
}

export interface RegisterRequest {
  username: string;
  password: string;
  fullName: string;
  email?: string;
  departmentId: number;
  roles: string[];
}

export const authAPI = {
  /**
   * Login user
   * @param username Username
   * @param password Password
   * @param rememberMe Remember me option
   * @returns Authentication response with token and user info
   */
  login: async (
    username: string,
    password: string,
    rememberMe: boolean = false
  ): Promise<ResponseDTO<AuthResponse>> => {
    try {
      const response = await api.post("/auth/login", {
        username,
        password,
        rememberMe,
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Refresh access token
   * @param refreshToken Refresh token
   * @returns New access token and refresh token
   */
  refreshToken: async (
    refreshToken: string
  ): Promise<ResponseDTO<RefreshTokenResponse>> => {
    try {
      const response = await api.post("/auth/refresh-token", { refreshToken });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Register new user
   * @param userData User data
   * @returns Created user data
   */
  register: async (userData: RegisterRequest): Promise<User> => {
    try {
      const response = await api.post("/auth/register", userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get current user information
   * @returns Current user data
   */
  getCurrentUser: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
};
