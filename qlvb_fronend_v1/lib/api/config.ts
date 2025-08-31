import axios from "axios";

// API base URL
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "/api";

// Create axios instance with common configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
// List các endpoint không cần auth
const publicEndpoints = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
];
// Hàm kiểm tra xem request có cần token không
function requiresAuth(url?: string): boolean {
  if (!url) return true;
  return !publicEndpoints.some((path) => url.includes(path));
}
// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Use localStorage only in browser environment
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (requiresAuth(config.url)) {
        // Validate token before adding to header
        if (token && token !== "undefined" && token !== "null") {
          config.headers.Authorization = `Bearer ${token}`;
          // Debug log để verify (disabled to reduce console noise)
          // console.log(
          //   "🔑 API Request: Added Authorization header for:",
          //   config.url,
          //   "Token:", token.substring(0, 20) + "..."
          // );
        } else {
        
          delete config.headers.Authorization;
        }
      } else {
     
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors here
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
    

      // Handle 401 Unauthorized - redirect to login
      if (error.response.status === 401 && typeof window !== "undefined") {
       
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/dang-nhap";
      }

      // Handle 403 Forbidden - log detailed information
      if (error.response.status === 403) {
      
      }
    } else if (error.request) {
      // The request was made but no response was received
    } else {
      // Something happened in setting up the request that triggered an Error
    }

    return Promise.reject(error);
  }
);

export { api };
export default api;
