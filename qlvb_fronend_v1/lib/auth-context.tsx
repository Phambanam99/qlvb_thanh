"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { authAPI, AuthResponse } from "@/lib/api/auth";
import Cookies from "js-cookie";
import { isTokenExpired } from "@/lib/utils";
import { UserDTO as User } from "./api";
import { hasRoleInGroup } from "./role-utils";
import { ResponseDTO } from "./api/types";
interface AuthContextType {
  user: User | null;
  loading: boolean;
  dataLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  login: (
    username: string,
    password: string,
    rememberMe: boolean
  ) => Promise<boolean | undefined>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (role: string | string[]) => boolean;
  hasPermission: (permission: string) => boolean;
  setDataLoaded: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const getStoredRememberMe = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("rememberMe") === "true";
    }
    return false;
  };

  const setStoredRememberMe = (value: boolean) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("rememberMe", value.toString());
    }
  };

  const refreshAccessToken = async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        return false;
      }

      const response = await authAPI.refreshToken(refreshToken);
      if (response.success && response.data) {
        const {
          accessToken,
          refreshToken: newRefreshToken,
          user,
        } = response.data;

        // Update tokens
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        // Update cookie based on remember me preference
        const rememberMe = getStoredRememberMe();
        if (rememberMe) {
          Cookies.set("auth-token", accessToken, {
            expires: 7, // 7 days for remember me
            sameSite: "strict",
          });
        } else {
          Cookies.set("auth-token", accessToken, { sameSite: "strict" });
        }

        // Update user info
        setUser(user);

        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const validateToken = async () => {
    const token = localStorage.getItem("accessToken");

    if (isTokenExpired(token)) {

      // Try to refresh token
      const refreshSuccess = await refreshAccessToken();
      if (refreshSuccess) {
        return true;
      }

      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("rememberMe");
      Cookies.remove("auth-token");
      setUser(null);
      setIsAuthenticated(false);

      if (window.location.pathname !== "/dang-nhap") {
        router.push("/dang-nhap?session_expired=true");
      }
      return false;
    }
    return true;
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        if (token) {
          // Validate token and refresh if needed
          const isValid = await validateToken();

          if (isValid) {
            const userData_ = await authAPI.getCurrentUser();
            const userData = userData_.data;
            if (userData) {
              setUser(userData);
              setIsAuthenticated(true);
              // Đánh dấu data loading hoàn tất ngay khi có user
              setDataLoading(false);
            } else {
              setIsAuthenticated(false);
            }
          }
        } else {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("rememberMe");
          Cookies.remove("auth-token");
          setIsAuthenticated(false);
        }
      } catch (err) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("rememberMe");
        Cookies.remove("auth-token");
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
        // Luôn set dataLoading = false để tránh loading vô hạn
        setDataLoading(false);
      }
    };

    checkAuth();

    // Set up auto-refresh interval
    const tokenCheckInterval = setInterval(async () => {
      if (isAuthenticated) {
        await validateToken();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => {
      clearInterval(tokenCheckInterval);
    };
  }, []);

  const login = async (
    username: string,
    password: string,
    rememberMe: boolean
  ) => {
    try {
      setLoading(true);
      setDataLoading(true);
      setError(null);
      // console.log("Đang thực hiện đăng nhập cho tài khoản:", username);
      const userData: ResponseDTO<AuthResponse> = await authAPI.login(
        username,
        password,
        rememberMe
      );

      const { accessToken, refreshToken, user } = userData.data;

      // Store remember me preference
      setStoredRememberMe(rememberMe);

      // Lưu token với đúng property names từ backend
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      if (rememberMe) {
        Cookies.set("auth-token", accessToken, {
          expires: 7, // 7 days for remember me
          sameSite: "strict",
        });
      } else {
        Cookies.set("auth-token", accessToken, { sameSite: "strict" });
      }

      // console.log("Login successful", userInfo);
      setUser(user);
      setIsAuthenticated(true);

      try {
      } catch (preloadError) {
      }

      return true;
    } catch (err: any) {
      setError(err.message || "Đăng nhập thất bại. Vui lòng thử lại.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("rememberMe");
      Cookies.remove("auth-token");
      setUser(null);
      router.push("/dang-nhap");
      setIsAuthenticated(false);
    } catch (err) {
    }
  };

  const checkAuth = async () => {
    try {
      setLoading(true);
      const isValid = await validateToken();
      if (!isValid) {
        setUser(null);
        return;
      }

      const userData_ = await authAPI.getCurrentUser();
      const userData = userData_.data;
      if (userData) {
        setUser(userData);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const userData_ = await authAPI.getCurrentUser();
      const userData = userData_.data;
      if (userData) {
        setUser(userData);
      }
    } catch (error) {
    }
  };

  const hasRole = (role: string | string[]) => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.some((r) => user.roles.includes(r));
    }
    return user.roles.includes(role);
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;

    // Check if permission is actually a role (with ROLE_ prefix)
    if (permission.startsWith("ROLE_")) {
      return user.roles.includes(permission);
    }

    // For broader group permissions checks
    if (permission === "manage_departments") {
      return hasRoleInGroup(user.roles, [
        "ROLE_ADMIN",
        "ROLE_TRUONG_PHONG",
        "ROLE_TRUONG_BAN",
        "ROLE_CUC_TRUONG",
        "ROLE_CUC_PHO",
        "ROLE_CHINH_UY",
        "ROLE_PHO_CHINH_UY",
      ]);
    }

    if (permission === "manage_users") {
      return hasRoleInGroup(user.roles, [
        "ROLE_ADMIN",
        "ROLE_TRUONG_PHONG",
        "ROLE_PHO_PHONG",
        "ROLE_TRUONG_BAN",
        "ROLE_PHO_BAN",
        "ROLE_CUC_TRUONG",
        "ROLE_CUC_PHO",
        "ROLE_CHINH_UY",
        "ROLE_PHO_CHINH_UY",
        "ROLE_CUM_TRUONG",
        "ROLE_PHO_CUM_TRUONG",
        "ROLE_TRAM_TRUONG",
      ]);
    }

    if (permission === "view_all_documents") {
      return hasRoleInGroup(user.roles, [
        "ROLE_ADMIN",
        "ROLE_VAN_THU",
        "ROLE_CUC_TRUONG",
        "ROLE_CUC_PHO",
        "ROLE_CHINH_UY",
        "ROLE_PHO_CHINH_UY",
      ]);
    }

    // Default to just checking if role matches permission
    return user.roles.includes(permission);
  };

  const setDataLoaded = () => {
    setDataLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        loading,
        dataLoading,
        error,
        hasRole,
        hasPermission,
        checkAuth,
        refreshUser,
        setDataLoaded,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
