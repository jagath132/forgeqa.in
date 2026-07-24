import { create } from 'zustand';
import {
  api,
  clearSession,
  getHistory,
  getProfile,
  getQaResult,
  hasSession,
  saveHistory,
  saveQaResult,
  type AiProvider,
  type HistoryItem,
  type ProviderKeyMap,
  type QaResponse,
  type TestScriptResponse,
  type User,
} from '../lib/api';

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
  loginUser: (user: User, providerKeys?: ProviderKeyMap) => void;
  openConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmLabel?: string
  ) => void;
  closeConfirm: () => void;
  initialize: () => Promise<void>;
}

export const useAppStore = create<AppState>()((set, get) => ({
  user: null,
  authChecking: true,
  provider: null,
  activeProvider: null,
  profileName: '',
  savedProviderKeys: {},
  qaResult: null,
  scriptResult: null,
  history: [],
  sidebarOpen: false,
  searchOpen: false,
  navDrawerOpen: false,
  confirmDialog: { open: false, title: '', message: '', onConfirm: () => {} },

  setUser: (user) => set({ user }),
  setAuthChecking: (authChecking) => set({ authChecking }),
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
    api.post('/api/auth/logout').catch(() => {});
    set({
      user: null,
      qaResult: null,
      scriptResult: null,
      history: [],
      profileName: '',
      savedProviderKeys: {},
    });
  },

  // Set user immediately after login — navigates to dashboard without any extra API calls
  loginUser: (user, providerKeys) => {
    const activeProv = user.activeProvider || null;
    set({ user, activeProvider: activeProv, provider: activeProv });
    if (providerKeys) set({ savedProviderKeys: providerKeys });
    // Load secondary data in background — does NOT block navigation
    Promise.all([
      getHistory(),
      getQaResult(),
      api
        .get<{ keys: ProviderKeyMap }>('/api/settings/api-keys')
        .catch(() => ({ data: { keys: {} } })),
      getProfile().catch(() => ({ displayName: '' })),
    ])
      .then(([loadedHistory, loadedQaResult, settingsRes, loadedProfile]) => {
        const cleanHistory = loadedHistory.filter((item) => !isSampleHistoryItem(item));
        if (cleanHistory.length !== loadedHistory.length) {
          void saveHistory(cleanHistory);
        }
        const cleanQaResult = isSampleQaResult(loadedQaResult) ? null : loadedQaResult;
        if (cleanQaResult !== loadedQaResult) {
          void saveQaResult(null);
        }

        set({ history: cleanHistory, savedProviderKeys: settingsRes.data.keys ?? {} });
        if (loadedProfile?.displayName) set({ profileName: loadedProfile.displayName });
        if (cleanQaResult) {
          set({ qaResult: cleanQaResult });
        } else if (cleanHistory.length > 0) {
          set({ qaResult: cleanHistory[0].result });
        } else {
          set({ qaResult: null });
        }
      })
      .catch(() => {});
  },

  openConfirm: (title, message, onConfirm, confirmLabel) => {
    set({ confirmDialog: { open: true, title, message, onConfirm, confirmLabel } });
  },
  closeConfirm: () => {
    set({ confirmDialog: { open: false, title: '', message: '', onConfirm: () => {} } });
  },

  initialize: async () => {
    if (!hasSession()) {
      set({ authChecking: false });
      return;
    }
    try {
      // Only fetch user identity — show the UI immediately
      const res = await api.get<{ user: User }>('/api/auth/me');
      const activeProv = res.data.user.activeProvider || null;
      set({
        user: res.data.user,
        activeProvider: activeProv,
        provider: activeProv,
        authChecking: false,
      });

      // Load secondary data in the background — does NOT block authChecking
      Promise.all([
        getHistory(),
        getQaResult(),
        api.get<{ keys: ProviderKeyMap }>('/api/settings/api-keys'),
        getProfile().catch(() => ({ displayName: '' })),
      ])
        .then(([loadedHistory, loadedQaResult, settingsRes, loadedProfile]) => {
          const cleanHistory = loadedHistory.filter((item) => !isSampleHistoryItem(item));
          if (cleanHistory.length !== loadedHistory.length) {
            void saveHistory(cleanHistory);
          }
          const cleanQaResult = isSampleQaResult(loadedQaResult) ? null : loadedQaResult;
          if (cleanQaResult !== loadedQaResult) {
            void saveQaResult(null);
          }

          set({ history: cleanHistory, savedProviderKeys: settingsRes.data.keys ?? {} });
          if (loadedProfile?.displayName) set({ profileName: loadedProfile.displayName });
          if (cleanQaResult) {
            set({ qaResult: cleanQaResult });
          } else if (cleanHistory.length > 0) {
            set({ qaResult: cleanHistory[0].result });
          } else {
            set({ qaResult: null });
          }
        })
        .catch(() => {});
    } catch {
      clearSession();
      set({ authChecking: false });
    }
  },
}));

function isSampleTcId(id?: string): boolean {
  if (!id) return false;
  return /^TC_(00[1-9]|01[0-2]|HIST_\d+)$/.test(id);
}

function isSampleQaResult(result: QaResponse | null): boolean {
  if (!result || !Array.isArray(result.testCases)) return false;
  if (result.summary === 'User Authentication & Registration — Test Matrix') return true;
  return result.testCases.some((tc) => isSampleTcId(tc?.tcId));
}

function isSampleHistoryItem(item: HistoryItem): boolean {
  if (!item) return false;
  if (typeof item.id === 'string' && item.id.startsWith('TEST_HIST_')) return true;
  if (item.result && isSampleQaResult(item.result)) return true;
  return false;
}

export function getProviderLabel(provider: AiProvider | null): string {
  if (!provider) return 'Not Selected';
  const labels: Record<AiProvider, string> = {
    gemini: 'Gemini',
    openai: 'OpenAI',
    groq: 'Groq',
    claude: 'Claude',
    openrouter: 'OpenRouter',
    opencode: 'OpenCode',
  };
  return labels[provider] ?? provider;
}
