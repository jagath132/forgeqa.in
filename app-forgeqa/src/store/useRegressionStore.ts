import { create } from "zustand";
import { api, type RegressionRun, type RegressionBuildArtifact, type TestCase } from "../lib/api";

interface RegressionState {
  runs: RegressionRun[];
  currentRun: RegressionRun | null;
  latestBuild: RegressionBuildArtifact | null;
  isLoading: boolean;
  error: string;

  loadRuns: () => Promise<void>;
  createRun: (data: { platform: "web" | "mobile"; testCases: TestCase[]; buildVersion?: string; suiteName?: string }) => Promise<RegressionRun>;
  selectRun: (run: RegressionRun | null) => void;
  setError: (error: string) => void;
}

export const useRegressionStore = create<RegressionState>()((set, _get) => ({
  runs: [],
  currentRun: null,
  latestBuild: null,
  isLoading: false,
  error: "",

  loadRuns: async () => {
    set({ isLoading: true, error: "" });
    try {
      const res = await api.get<{ runs: RegressionRun[] }>("/api/regression/runs");
      set({ runs: res.data.runs, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to load runs", isLoading: false });
    }
  },

  createRun: async (data) => {
    set({ isLoading: true, error: "" });
    try {
      const res = await api.post<RegressionRun>("/api/regression/runs", data);
      const run = res.data;
      set((s) => ({ runs: [run, ...s.runs], currentRun: run, isLoading: false }));
      return run;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create run";
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  selectRun: (run) => set({ currentRun: run, error: "" }),

  setError: (error) => set({ error }),
}));
