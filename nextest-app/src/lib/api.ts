import axios from "axios";

export type User = {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  createdAt: string;
  activeProvider?: AiProvider | null;
  has_seen_welcome?: boolean;
};

export type AuthResponse = {
  token: string;
  user: User;
};

const SESSION_TOKEN_KEY = "nextest_token";

export function getStoredToken(): string | null {
  try { return sessionStorage.getItem(SESSION_TOKEN_KEY); } catch { return null; }
}

export function setStoredToken(token: string): void {
  try { sessionStorage.setItem(SESSION_TOKEN_KEY, token); } catch { /* ignored */ }
}

export function clearStoredToken(): void {
  try { sessionStorage.removeItem(SESSION_TOKEN_KEY); } catch { /* ignored */ }
}

export const api = axios.create({
  baseURL: "",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type KnowledgeFile = {
  id: string;
  file_name: string;
  file_type: string;
  upload_date: string;
  source_type: "upload" | "sharepoint";
  status: "processing" | "needs_chunking" | "ready" | "failed";
  chunk_count?: number;
};

export type KnowledgeChunk = {
  fileName: string;
  chunkText: string;
  score: number;
};

export type ThemeMode = "dark" | "light";
export type ProviderKeyMap = Partial<Record<AiProvider, boolean>>;
export interface HistoryItem {
  id: string;
  timestamp: string;
  requirement: string;
  result: QaResponse;
}
export type TestCaseStatus = "draft" | "reviewed" | "approved";

export type TestCaseCategory =
  | "Positive"
  | "Negative"
  | "Validation"
  | "Validation checks"
  | "Edge"
  | "Edge cases";

export type TestCase = {
  tcId: string;
  category: TestCaseCategory;
  summary: string;
  testDescription: string;
  testSteps: string[];
  expected: string;
  status?: TestCaseStatus;
};

export type QaResponse = {
  summary: string;
  testCases: TestCase[];
  knowledgeContext?: KnowledgeChunk[];
};

export type AiProvider = "gemini" | "openai" | "claude" | "openrouter" | "opencode" | "groq";

export type GeminiModel = "gemini-2.0-flash" | "gemini-2.5-flash";

export type TestingFramework = "playwright" | "cypress" | "selenium" | "puppeteer";
export type ScriptLanguage =
  | "javascript"
  | "typescript"
  | "python"
  | "java"
  | "csharp";

export type TestScriptOptions = {
  headless: boolean;
  viewport: { width: number; height: number };
};

export type TestScriptRequest = {
  testCaseIds: string[];
  testCases: TestCase[];
  framework: TestingFramework;
  language: ScriptLanguage;
  provider?: AiProvider;
  targetUrl: string;
  apiKey?: string;
  model?: string;
  options: TestScriptOptions;
};

export type TestScriptResponse = {
  script: string;
  framework: TestingFramework;
  language: ScriptLanguage;
  fileName: string;
  testCases: TestCase[];
};

export type TeamMember = {
  id: string;
  email: string;
  role: "Admin" | "Member" | "Viewer";
  joinedAt: string;
};

export type Suite = {
  id: string;
  name: string;
  description: string;
  color: string;
  caseIds: string[];
};

export type RegressionPlatform = "web" | "mobile";
export type RegressionStatus = "pending" | "running" | "passed" | "failed" | "error";
export type RegressionResult = {
  testCaseId: string;
  passed: boolean;
  actualOutput?: string;
  errorMessage?: string;
  screenshot?: string;
};
export type RegressionRun = {
  id: string;
  platform: RegressionPlatform;
  status: RegressionStatus;
  testCases: TestCase[];
  scripts: TestScriptResponse[];
  results: RegressionResult[];
  startedAt: string;
  completedAt?: string;
  buildVersion?: string;
  suiteName?: string;
};
export type RegressionBuildArtifact = {
  id: string;
  platform: "android" | "web";
  version: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
};
export type RegressionScriptRequest = {
  testCases: TestCase[];
  platform: RegressionPlatform;
  framework: string;
  language: string;
  targetUrl?: string;
  provider?: AiProvider;
  apiKey?: string;
  model?: string;
};
export type RegressionGenerateRequest = {
  requirement: string;
  testCases?: TestCase[];
  platform: RegressionPlatform;
  provider?: AiProvider;
  apiKey?: string;
  model?: string;
};

export function hasSession(): boolean {
  return document.cookie.split(";").some((c) => c.trim().startsWith("session="));
}

export function clearSession(): void {
  document.cookie = "session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

export async function getProfile() {
  const res = await api.get<{ profile: { displayName: string } }>("/api/user/profile");
  return res.data.profile;
}

export async function saveProfile(displayName: string) {
  await api.post("/api/user/profile", { displayName });
}

export async function changePassword(currentPassword: string, newPassword: string) {
  await api.put("/api/auth/password", { currentPassword, newPassword });
}

export async function getProductKey() {
  const res = await api.get<{ productKey: { key: string; activatedAt: string } | null }>("/api/user/product-key");
  return res.data.productKey;
}

export async function getTeam() {
  const res = await api.get<{ members: TeamMember[] }>("/api/user/team");
  return res.data.members;
}

export async function saveTeam(members: TeamMember[]) {
  await api.post("/api/user/team", { members });
}

export async function getSuites() {
  const res = await api.get<{ suites: Suite[] }>("/api/user/suites");
  return res.data.suites;
}

export async function saveSuites(suites: Suite[]) {
  await api.post("/api/user/suites", { suites });
}

export async function getHistory() {
  const res = await api.get<{ items: HistoryItem[] }>("/api/history");
  return res.data.items;
}

export async function saveHistory(items: HistoryItem[]) {
  await api.post("/api/history", { items });
}

export async function getQaResult() {
  const res = await api.get<{ result: QaResponse | null }>("/api/qa-result");
  return res.data.result;
}

export async function saveQaResult(result: QaResponse | null) {
  await api.post("/api/qa-result", { result });
}

export async function regressionGenerate(data: RegressionGenerateRequest) {
  const res = await api.post<{ testCases: TestCase[]; summary: string }>("/api/regression/generate", data);
  return res.data;
}

export async function regressionGenerateScripts(data: RegressionScriptRequest) {
  const res = await api.post<{ scripts: TestScriptResponse[] }>("/api/regression/scripts", data);
  return res.data;
}

export async function regressionRun(runId: string) {
  const res = await api.post<RegressionRun>(`/api/regression/runs/${runId}/execute`);
  return res.data;
}

export async function getRegressionRuns() {
  const res = await api.get<{ runs: RegressionRun[] }>("/api/regression/runs");
  return res.data.runs;
}

export async function getRegressionRun(id: string) {
  const res = await api.get<RegressionRun>(`/api/regression/runs/${id}`);
  return res.data;
}

export async function createRegressionRun(data: {
  platform: RegressionPlatform;
  testCases: TestCase[];
  buildVersion?: string;
  suiteName?: string;
}) {
  const res = await api.post<RegressionRun>("/api/regression/runs", data);
  return res.data;
}

export async function uploadBuildArtifact(platform: "android" | "web", version: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("platform", platform);
  formData.append("version", version);
  const res = await api.post<RegressionBuildArtifact>("/api/regression/builds/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function getLatestBuildArtifact(platform: "android" | "web") {
  const res = await api.get<{ artifact: RegressionBuildArtifact | null }>(`/api/regression/builds/latest/${platform}`);
  return res.data.artifact;
}

export async function saveBuildWebhook(platform: "android" | "web", url: string) {
  await api.post("/api/regression/builds/webhook", { platform, url });
}

export async function getBuildWebhooks() {
  const res = await api.get<{ webhooks: { platform: string; url: string }[] }>("/api/regression/builds/webhook");
  return res.data.webhooks;
}

export async function startRegistration(data: { name: string; email: string; password: string }) {
  const res = await api.post<{ pendingId: string; email: string }>("/api/auth/start-registration", data);
  return res.data;
}

export async function selectPlan(data: { pendingId: string; plan: string }) {
  const res = await api.post<{ status: string; email?: string; pendingId?: string; plan?: string; message?: string }>("/api/auth/select-plan", data);
  return res.data;
}

export async function completeRegistration(data: { email: string; productKey: string }) {
  const res = await api.post<{ ok: boolean }>("/api/auth/complete-registration", data);
  return res.data;
}

export async function markWelcomeSeen() {
  await api.post("/api/auth/welcome-seen");
}

export async function createCheckoutSession(data: { pendingId: string; plan: string; email: string }) {
  const res = await api.post<{ url: string }>("/api/payments/create-checkout", data);
  return res.data;
}
