import { create } from "zustand";
import { api, setAuthToken, clearAuthToken, type Admin, type KeyStats } from "../lib/api";

interface AdminState {
  admin: Admin | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string;
  keyStats: KeyStats | null;

  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setKeyStats: (stats: KeyStats) => void;
}

export const useAdminStore = create<AdminState>()((set) => ({
  admin: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  error: "",
  keyStats: null,

  login: async (email, password) => {
    set({ error: "", loading: true });
    try {
      const res = await api.post<{ token: string; admin: Admin }>("/api/admin/login", { email, password });
      setAuthToken(res.data.token);
      set({
        admin: res.data.admin,
        token: res.data.token,
        isAuthenticated: true,
        loading: false,
      });
      localStorage.setItem("lm_token", res.data.token);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Login failed";
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  logout: () => {
    clearAuthToken();
    localStorage.removeItem("lm_token");
    set({ admin: null, token: null, isAuthenticated: false, loading: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem("lm_token");
    if (!token) {
      set({ loading: false });
      return;
    }
    setAuthToken(token);
    try {
      const res = await api.get<{ admin: Admin }>("/api/admin/me");
      set({ admin: res.data.admin, token, isAuthenticated: true, loading: false });
    } catch {
      localStorage.removeItem("lm_token");
      clearAuthToken();
      set({ loading: false });
    }
  },

  setKeyStats: (keyStats) => set({ keyStats }),
}));
