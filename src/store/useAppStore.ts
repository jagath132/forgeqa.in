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
  type TestingFramework,
  type ScriptLanguage,
  type TestCase,
  type User,
} from '../lib/api';

export interface SavedTestScript {
  id: string;
  timestamp: string;
  fileName: string;
  framework: TestingFramework;
  language: ScriptLanguage;
  testCaseCount: number;
  testCaseIds: string[];
  testCases: TestCase[];
  script: string;
  targetUrl: string;
}

interface ConfirmDialogState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
}

export interface PrdHistoryItem {
  id: string;
  title: string;
  mode: 'text' | 'url';
  productName?: string;
  moduleName?: string;
  appUrl?: string;
  details?: string;
  focusArea?: string;
  prdText: string;
  createdAt: string;
  wordCount: number;
  provider?: string;
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
  savedScripts: SavedTestScript[];
  activeScriptId: string | null;
  history: HistoryItem[];
  prdHistory: PrdHistoryItem[];
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
  addSavedScript: (script: TestScriptResponse, targetUrl?: string) => void;
  selectSavedScript: (id: string) => void;
  deleteSavedScript: (id: string) => void;
  clearSavedScripts: () => void;
  addToHistory: (requirement: string, result: QaResponse) => void;
  deleteHistoryItem: (id: string) => void;
  clearHistory: () => void;
  addToPrdHistory: (item: Omit<PrdHistoryItem, 'id' | 'createdAt'>) => void;
  deletePrdHistoryItem: (id: string) => void;
  clearPrdHistory: () => void;
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

const QA_RESULT_KEY = 'forgeqa_qa_result';
const HISTORY_KEY = 'forgeqa_history';
const SCRIPT_RESULT_KEY = 'forgeqa_script_result';
const SAVED_SCRIPTS_KEY = 'forgeqa_saved_scripts';
const PRD_HISTORY_KEY = 'forgeqa_prd_history';

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (err) {
    console.error(`Failed to save to localStorage (${key}):`, err);
  }
}

const initialSavedScripts = loadFromStorage<SavedTestScript[]>(SAVED_SCRIPTS_KEY, []);
const initialScriptResult =
  loadFromStorage<TestScriptResponse | null>(SCRIPT_RESULT_KEY, null) ||
  (initialSavedScripts.length > 0
    ? {
        script: initialSavedScripts[0].script,
        framework: initialSavedScripts[0].framework,
        language: initialSavedScripts[0].language,
        fileName: initialSavedScripts[0].fileName,
        testCases: initialSavedScripts[0].testCases,
      }
    : null);

export const useAppStore = create<AppState>()((set, get) => ({
  user: null,
  authChecking: true,
  provider: null,
  activeProvider: null,
  profileName: '',
  savedProviderKeys: {},
  qaResult: loadFromStorage<QaResponse | null>(QA_RESULT_KEY, null),
  scriptResult: initialScriptResult,
  savedScripts: initialSavedScripts,
  activeScriptId: initialSavedScripts.length > 0 ? initialSavedScripts[0].id : null,
  history: loadFromStorage<HistoryItem[]>(HISTORY_KEY, []),
  prdHistory: loadFromStorage<PrdHistoryItem[]>(PRD_HISTORY_KEY, []),
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
    saveToStorage(QA_RESULT_KEY, qaResult);
    void saveQaResult(qaResult);
  },
  setScriptResult: (scriptResult) => {
    set({ scriptResult });
    saveToStorage(SCRIPT_RESULT_KEY, scriptResult);
  },
  addSavedScript: (script, targetUrl = '') => {
    const newSaved: SavedTestScript = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      fileName: script.fileName,
      framework: script.framework,
      language: script.language,
      testCaseCount: script.testCases?.length ?? 0,
      testCaseIds: script.testCases?.map((tc) => tc.tcId) ?? [],
      testCases: script.testCases ?? [],
      script: script.script,
      targetUrl,
    };
    const updated = [newSaved, ...get().savedScripts];
    set({
      savedScripts: updated,
      activeScriptId: newSaved.id,
      scriptResult: script,
    });
    saveToStorage(SAVED_SCRIPTS_KEY, updated);
    saveToStorage(SCRIPT_RESULT_KEY, script);
  },
  selectSavedScript: (id) => {
    const found = get().savedScripts.find((s) => s.id === id);
    if (!found) return;
    const scriptRes: TestScriptResponse = {
      script: found.script,
      framework: found.framework,
      language: found.language,
      fileName: found.fileName,
      testCases: found.testCases,
    };
    set({
      activeScriptId: found.id,
      scriptResult: scriptRes,
    });
    saveToStorage(SCRIPT_RESULT_KEY, scriptRes);
  },
  deleteSavedScript: (id) => {
    const updated = get().savedScripts.filter((s) => s.id !== id);
    let nextActiveId = get().activeScriptId;
    let nextResult = get().scriptResult;
    if (get().activeScriptId === id) {
      if (updated.length > 0) {
        nextActiveId = updated[0].id;
        nextResult = {
          script: updated[0].script,
          framework: updated[0].framework,
          language: updated[0].language,
          fileName: updated[0].fileName,
          testCases: updated[0].testCases,
        };
      } else {
        nextActiveId = null;
        nextResult = null;
      }
    }
    set({
      savedScripts: updated,
      activeScriptId: nextActiveId,
      scriptResult: nextResult,
    });
    saveToStorage(SAVED_SCRIPTS_KEY, updated);
    saveToStorage(SCRIPT_RESULT_KEY, nextResult);
  },
  clearSavedScripts: () => {
    set({ savedScripts: [], activeScriptId: null, scriptResult: null });
    saveToStorage(SAVED_SCRIPTS_KEY, []);
    saveToStorage(SCRIPT_RESULT_KEY, null);
  },
  addToHistory: (requirement, result) => {
    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      requirement,
      result,
    };
    const newHistory = [newItem, ...get().history].slice(0, 50);
    set({ history: newHistory });
    saveToStorage(HISTORY_KEY, newHistory);
    void saveHistory(newHistory);
  },
  deleteHistoryItem: (id) => {
    const itemToDelete = get().history.find((item) => item.id === id);
    const newHistory = get().history.filter((item) => item.id !== id);
    set({ history: newHistory });
    saveToStorage(HISTORY_KEY, newHistory);
    void saveHistory(newHistory);
    const qaResult = get().qaResult;
    if (qaResult && itemToDelete && qaResult.summary === itemToDelete.result.summary) {
      const nextResult = newHistory.length > 0 ? newHistory[0].result : null;
      set({ qaResult: nextResult });
      saveToStorage(QA_RESULT_KEY, nextResult);
      void saveQaResult(nextResult);
    }
  },
  clearHistory: () => {
    set({ history: [], qaResult: null, scriptResult: null });
    saveToStorage(HISTORY_KEY, []);
    saveToStorage(QA_RESULT_KEY, null);
    saveToStorage(SCRIPT_RESULT_KEY, null);
    void saveHistory([]);
    void saveQaResult(null);
  },
  addToPrdHistory: (item) => {
    const newItem: PrdHistoryItem = {
      ...item,
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `prd_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    const existing = get().prdHistory;
    const filtered = existing.filter(
      (p) => p.title !== newItem.title || p.prdText !== newItem.prdText
    );
    const newHistory = [newItem, ...filtered].slice(0, 50);
    set({ prdHistory: newHistory });
    saveToStorage(PRD_HISTORY_KEY, newHistory);
  },
  deletePrdHistoryItem: (id) => {
    const newHistory = get().prdHistory.filter((item) => item.id !== id);
    set({ prdHistory: newHistory });
    saveToStorage(PRD_HISTORY_KEY, newHistory);
  },
  clearPrdHistory: () => {
    set({ prdHistory: [] });
    saveToStorage(PRD_HISTORY_KEY, []);
  },
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setNavDrawerOpen: (navDrawerOpen) => set({ navDrawerOpen }),
  logout: () => {
    clearSession();
    api.post('/api/auth/logout').catch(() => {});
    saveToStorage(QA_RESULT_KEY, null);
    saveToStorage(SCRIPT_RESULT_KEY, null);
    saveToStorage(SAVED_SCRIPTS_KEY, []);
    saveToStorage(HISTORY_KEY, []);
    set({
      user: null,
      qaResult: null,
      scriptResult: null,
      savedScripts: [],
      activeScriptId: null,
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
        const mergedHistory = cleanHistory.length > 0 ? cleanHistory : get().history;
        set({ history: mergedHistory, savedProviderKeys: settingsRes.data.keys ?? {} });
        saveToStorage(HISTORY_KEY, mergedHistory);

        if (loadedProfile?.displayName) set({ profileName: loadedProfile.displayName });
        if (loadedQaResult && loadedQaResult.testCases?.length > 0) {
          set({ qaResult: loadedQaResult });
          saveToStorage(QA_RESULT_KEY, loadedQaResult);
        } else if (!get().qaResult && mergedHistory.length > 0) {
          set({ qaResult: mergedHistory[0].result });
          saveToStorage(QA_RESULT_KEY, mergedHistory[0].result);
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
          const mergedHistory = cleanHistory.length > 0 ? cleanHistory : get().history;
          set({ history: mergedHistory, savedProviderKeys: settingsRes.data.keys ?? {} });
          saveToStorage(HISTORY_KEY, mergedHistory);

          if (loadedProfile?.displayName) set({ profileName: loadedProfile.displayName });
          if (loadedQaResult && loadedQaResult.testCases?.length > 0) {
            set({ qaResult: loadedQaResult });
            saveToStorage(QA_RESULT_KEY, loadedQaResult);
          } else if (!get().qaResult && mergedHistory.length > 0) {
            set({ qaResult: mergedHistory[0].result });
            saveToStorage(QA_RESULT_KEY, mergedHistory[0].result);
          }
        })
        .catch(() => {});
    } catch {
      clearSession();
      set({ authChecking: false });
    }
  },
}));

function isSampleHistoryItem(item: HistoryItem): boolean {
  if (!item) return false;
  if (typeof item.id === 'string' && item.id.startsWith('MOCK_TEST_HIST_SEED_')) return true;
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
