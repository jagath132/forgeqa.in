import { create } from "zustand";
import { api, clearSession, clearStoredToken, getHistory, getProfile, getQaResult, getStoredToken, saveHistory, saveQaResult, type AiProvider, type HistoryItem, type ProviderKeyMap, type QaResponse, type TestScriptResponse, type ThemeMode, type User } from "../lib/api";

interface ConfirmDialogState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
}

interface AppState {
  user: User | null;
  authChecking: boolean;
  theme: ThemeMode;
  provider: AiProvider | null;
  activeProvider: AiProvider | null;
  profileName: string;
  savedProviderKeys: ProviderKeyMap;
  qaResult: QaResponse | null;
  scriptResult: TestScriptResponse | null;
  history: HistoryItem[];
  sidebarOpen: boolean;
  searchOpen: boolean;
  navDrawerOpen: boolean;
  confirmDialog: ConfirmDialogState;

  setUser: (user: User | null) => void;
  setAuthChecking: (checking: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setProvider: (provider: AiProvider | null) => void;
  setActiveProvider: (provider: AiProvider | null) => void;
  setProfileName: (name: string) => void;
  setSavedProviderKeys: (keys: ProviderKeyMap) => void;
  setQaResult: (result: QaResponse | null) => void;
  setScriptResult: (result: TestScriptResponse | null) => void;
  addToHistory: (requirement: string, result: QaResponse) => void;
  deleteHistoryItem: (id: string) => void;
  clearHistory: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setNavDrawerOpen: (open: boolean) => void;
  logout: () => void;
  openConfirm: (title: string, message: string, onConfirm: () => void, confirmLabel?: string) => void;
  closeConfirm: () => void;
  initialize: () => Promise<void>;
}

function loadTheme(): ThemeMode {
  const saved = window.localStorage.getItem("qacopilot_theme") as ThemeMode | null;
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export const useAppStore = create<AppState>()((set, get) => ({
  user: null,
  authChecking: true,
  theme: loadTheme(),
  provider: null,
  activeProvider: null,
  profileName: "",
  savedProviderKeys: {},
  qaResult: null,
  scriptResult: null,
  history: [],
  sidebarOpen: false,
  searchOpen: false,
  navDrawerOpen: false,
  confirmDialog: { open: false, title: "", message: "", onConfirm: () => {} },

  setUser: (user) => set({ user }),
  setAuthChecking: (authChecking) => set({ authChecking }),
  setTheme: (theme) => {
    window.localStorage.setItem("qacopilot_theme", theme);
    set({ theme });
  },
  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    window.localStorage.setItem("qacopilot_theme", next);
    set({ theme: next });
  },
  setProvider: (provider) => set({ provider }),
  setActiveProvider: (activeProvider) => set({ activeProvider }),
  setProfileName: (profileName) => set({ profileName }),
  setSavedProviderKeys: (keys) => set({ savedProviderKeys: keys }),
  setQaResult: (qaResult) => {
    set({ qaResult });
    void saveQaResult(qaResult);
  },
  setScriptResult: (scriptResult) => set({ scriptResult }),
  addToHistory: (requirement, result) => {
    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      requirement,
      result,
    };
    const newHistory = [newItem, ...get().history].slice(0, 50);
    set({ history: newHistory });
    void saveHistory(newHistory);
  },
  deleteHistoryItem: (id) => {
    const itemToDelete = get().history.find((item) => item.id === id);
    const newHistory = get().history.filter((item) => item.id !== id);
    set({ history: newHistory });
    void saveHistory(newHistory);
    const qaResult = get().qaResult;
    if (qaResult && itemToDelete && qaResult.summary === itemToDelete.result.summary) {
      const nextResult = newHistory.length > 0 ? newHistory[0].result : null;
      set({ qaResult: nextResult });
      void saveQaResult(nextResult);
    }
  },
  clearHistory: () => {
    set({ history: [], qaResult: null });
    void saveHistory([]);
    void saveQaResult(null);
  },
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setNavDrawerOpen: (navDrawerOpen) => set({ navDrawerOpen }),
  logout: () => {
    clearSession();
    clearStoredToken();
    set({ user: null });
  },
  openConfirm: (title, message, onConfirm, confirmLabel) => {
    set({ confirmDialog: { open: true, title, message, onConfirm, confirmLabel } });
  },
  closeConfirm: () => {
    set({ confirmDialog: { open: false, title: "", message: "", onConfirm: () => {} } });
  },

  initialize: async () => {
    if (!getStoredToken()) {
      clearSession();
      api.post("/api/auth/logout").catch(() => {});
      set({ authChecking: false });
      return;
    }
    try {
      const res = await api.get<{ user: User }>("/api/auth/me");
      const activeProv = res.data.user.activeProvider || null;
      set({ user: res.data.user, activeProvider: activeProv, provider: activeProv });
      const [loadedHistory, loadedQaResult, settingsRes, loadedProfile] = await Promise.all([
        getHistory(),
        getQaResult(),
        api.get<{ keys: ProviderKeyMap }>("/api/settings/api-keys"),
        getProfile().catch(() => ({ displayName: "" })),
      ]);
      set({ history: loadedHistory, savedProviderKeys: settingsRes.data.keys ?? {} });
      if (loadedProfile?.displayName) {
        set({ profileName: loadedProfile.displayName });
      }
      if (loadedQaResult) {
        set({ qaResult: loadedQaResult });
      } else if (loadedHistory.length > 0) {
        set({ qaResult: loadedHistory[0].result });
      }
    } catch {
      clearSession();
      clearStoredToken();
    }
    set({ authChecking: false });
  },
}));

export function getProviderLabel(provider: AiProvider | null): string {
  if (!provider) return "Not Selected";
  const labels: Record<AiProvider, string> = {
    gemini: "Gemini",
    openai: "OpenAI",
    groq: "Groq",
    claude: "Claude",
    openrouter: "OpenRouter",
    opencode: "OpenCode",
  };
  return labels[provider] ?? provider;
}
