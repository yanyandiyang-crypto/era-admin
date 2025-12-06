import { create } from "zustand";
import { authService } from "@/services/auth.service";
import type { User, LoginRequest } from "@/types/auth.types";
import { STORAGE_KEYS } from "@/lib/constants";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  loadUserFromStorage: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
  refreshToken: localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
  isAuthenticated: !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
  isLoading: false,
  error: null,

  /**
   * Login user with email and password
   */
  login: async (credentials: LoginRequest) => {
    set({ isLoading: true, error: null });
    try {
      console.log('🔐 Attempting login with credentials:', { email: credentials.email });
      const response = await authService.login(credentials);
      console.log('🔐 Login response:', response);
      
      // Backend returns 'personnel' instead of 'user' for personnel login
      // For web clients, tokens are in httpOnly cookies, not in response body
      const { accessToken, refreshToken, user, personnel } = response.data;
      const userData = user || personnel;
      console.log('🔐 Login data extracted:', { accessToken: !!accessToken, refreshToken: !!refreshToken, userData });

      // Only save tokens if they exist in response (mobile apps)
      // For web clients, tokens are stored in httpOnly cookies by the backend
      if (accessToken && refreshToken) {
        console.log('🔐 Setting tokens in localStorage');
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      } else {
        console.log('🔐 Tokens not in response - using httpOnly cookies');
      }
      
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      console.log('🔐 User data saved to localStorage');

      // Update state
      set({
        user: userData,
        accessToken: accessToken || 'cookie-based', // Indicate cookie-based auth
        refreshToken: refreshToken || 'cookie-based',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { error?: { message?: string }; message?: string } } })
          .response?.data?.error?.message ||
        (error as { response?: { data?: { error?: { message?: string }; message?: string } } })
          .response?.data?.message ||
        "Login failed. Please try again.";
      set({
        isLoading: false,
        error: errorMessage,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  /**
   * Logout user
   */
  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // console.error("Logout error:", error);
    } finally {
      // Clear localStorage
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);

      // Clear state
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        error: null,
      });
    }
  },

  /**
   * Set user data
   */
  setUser: (user: User) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    set({ user });
  },

  /**
   * Load user from localStorage on app init
   */
  loadUserFromStorage: () => {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    if (userStr && accessToken) {
      try {
        const user = JSON.parse(userStr);
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      } catch {
        // console.error("Failed to parse user from storage:", error);
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    }
  },

  /**
   * Clear error message
   */
  clearError: () => {
    set({ error: null });
  },
}));
