import { useState } from "react";
import axios from "axios";
import { api, type AiProvider } from "../lib/api";
import { useAppStore } from "../store/useAppStore";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { MobilePageHeader } from "../components/PageHeader";

const providerOptions: { id: AiProvider; label: string; description: string; color: string }[] = [
  { id: "gemini", label: "Google Gemini", description: "Gemini models optimized for structured multi-modal instructions.", color: "from-blue-500 to-cyan-500" },
  { id: "openai", label: "OpenAI GPT-4", description: "Industry standard models for multi-scenario QA verification.", color: "from-emerald-500 to-teal-500" },
  { id: "groq", label: "Groq LLaMA", description: "Ultra-fast low-latency models for immediate test compilation.", color: "from-orange-500 to-rose-500" },
  { id: "claude", label: "Anthropic Claude", description: "Claude conversational AI models for highly complex logic.", color: "from-purple-500 to-indigo-500" },
  { id: "openrouter", label: "OpenRouter Proxy", description: "Access any open source or commercial models from a unified gateway.", color: "from-pink-500 to-rose-500" },
  { id: "opencode", label: "OpenCode Engine", description: "Code-specific developer model proxies for scripting logic.", color: "from-slate-500 to-slate-700" },
];

export function AISettings() {
  const storeProvider = useAppStore((s) => s.provider);
  const activeProvider = useAppStore((s) => s.activeProvider);
  const setProvider = useAppStore((s) => s.setProvider);
  const setActiveProvider = useAppStore((s) => s.setActiveProvider);
  const savedProviderKeys = useAppStore((s) => s.savedProviderKeys);
  const setSavedProviderKeys = useAppStore((s) => s.setSavedProviderKeys);

  const [selectedProvider, setSelectedProvider] = useState<AiProvider | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [settingsMessage, setSettingsMessage] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [savingProvider, setSavingProvider] = useState(false);

  const hasDbKey = storeProvider ? !!savedProviderKeys[storeProvider] : false;
  const activeProviderObj = storeProvider ? providerOptions.find((option) => option.id === storeProvider) : undefined;
  const selectedProviderObj = selectedProvider ? providerOptions.find((option) => option.id === selectedProvider) : undefined;
  const noProviderSaved = !activeProvider;

  async function handleSaveProvider() {
    if (!selectedProvider) return;
    setSavingProvider(true);
    setSettingsError("");
    setSettingsMessage("");
    try {
      await api.put("/api/settings/active-provider", { provider: selectedProvider });
      setActiveProvider(selectedProvider);
      setProvider(selectedProvider);
      setSettingsMessage(`Provider set to ${selectedProviderObj?.label || selectedProvider}.`);
      window.setTimeout(() => setSettingsMessage(""), 3000);
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error ?? err.message : "Failed to save provider.";
      setSettingsError(msg);
    } finally {
      setSavingProvider(false);
    }
  }

  async function handleSaveApiKey() {
    if (!selectedProvider && !storeProvider) { setSettingsError("Select a provider first."); setSettingsMessage(""); return; }
    const key = apiKeyInput.trim();
    const targetProvider = selectedProvider || storeProvider;
    if (!targetProvider) return;
    if (!key) { setSettingsError("Please enter an API key before saving."); setSettingsMessage(""); return; }
    try {
      await api.post("/api/settings/api-key", { provider: targetProvider, apiKey: key });
      const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      window.localStorage.setItem("qacopilot_ai_settings", JSON.stringify({ provider: targetProvider, keyHash: hashHex }));
      setSavedProviderKeys({ ...savedProviderKeys, [targetProvider]: true });
      setApiKeyInput("");
      setSettingsMessage("API key saved successfully."); setSettingsError("");
      window.setTimeout(() => setSettingsMessage(""), 3000);
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.response?.data?.error ?? error.message : "Unable to save API key.";
      setSettingsError(message); setSettingsMessage("");
    }
  }

  async function handleClearApiKey() {
    const targetProvider = selectedProvider || storeProvider;
    if (!targetProvider) return;
    try {
      await api.delete(`/api/settings/api-key?provider=${encodeURIComponent(targetProvider)}`);
      window.localStorage.removeItem("qacopilot_ai_settings");
      setSavedProviderKeys({ ...savedProviderKeys, [targetProvider]: false });
      setApiKeyInput(""); setSettingsMessage("Saved API key has been removed."); setSettingsError("");
      window.setTimeout(() => setSettingsMessage(""), 3000);
    } catch (error) {
      const msg = axios.isAxiosError(error) ? error.response?.data?.error ?? error.message : "Unable to clear saved API key.";
      setSettingsError(msg); setSettingsMessage("");
    }
  }

  const saveDisabled = !selectedProvider || selectedProvider === activeProvider || savingProvider;

  return (
    <section className="space-y-6 animate-fade-in">
      <MobilePageHeader pageKey="ai-settings" />

      {/* Warning banner when no provider saved */}
      {noProviderSaved && (
        <div className="flex items-start gap-3 rounded-xl px-5 py-4" style={{ background: "var(--warning-soft)", border: "1px solid color-mix(in srgb, var(--warning) 25%, transparent)" }}>
          <svg className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--warning)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm" style={{ color: "var(--text-primary)" }}>
            <strong>No provider selected yet</strong> — choose one below and save it. Test generation stays disabled until you do.
          </div>
        </div>
      )}

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>Credentials Console</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>AI Provider Configuration</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Choose the LLM provider to power your generation. Keys are encrypted with AES-256-GCM and stored securely in the database.
            </p>
          </div>
          <Badge variant={hasDbKey ? "success" : "warning"} className="shrink-0 self-start sm:self-center">
            {hasDbKey ? "API Key Configured" : "No Credentials Stored"}
          </Badge>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Select Active Provider</h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Click a card to select it, then save to activate.</p>
          </div>
          <button type="button" disabled={saveDisabled} onClick={handleSaveProvider}
            className="px-5 py-2.5 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            style={{
              background: saveDisabled ? "var(--bg-tertiary)" : "var(--accent)",
              color: saveDisabled ? "var(--text-muted)" : "#fff",
              border: saveDisabled ? "1px solid var(--border-default)" : "none",
            }}
          >
            {savingProvider ? (
              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            Save provider
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {providerOptions.map((option) => {
            const isActive = storeProvider === option.id;
            const isSelected = selectedProvider === option.id;
            const cardStyle = isActive
              ? { background: "var(--accent-soft)", borderColor: "var(--accent)", outline: "none" }
              : isSelected
              ? { background: "var(--bg-secondary)", borderColor: "var(--accent)", outline: "2px solid var(--accent)", outlineOffset: "-2px" }
              : { background: "var(--bg-secondary)", borderColor: "var(--border-subtle)", outline: "none" };

            return (
              <button key={option.id} type="button"
                onClick={() => { setSelectedProvider((prev) => prev === option.id ? null : option.id); setSettingsMessage(""); setSettingsError(""); }}
                className="rounded-lg p-5 text-left transition-all cursor-pointer min-h-[130px] flex flex-col justify-between"
                style={cardStyle}
              >
                <div>
                  <div className="flex items-center justify-between gap-2.5">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{option.label}</p>
                    {isActive ? (
                      <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "var(--accent)", color: "#fff" }}>Active</span>
                    ) : isSelected ? (
                      <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>Selected</span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs leading-normal" style={{ color: "var(--text-secondary)" }}>{option.description}</p>
                </div>
                {isActive ? (
                  <span className="text-xs font-semibold mt-2" style={{ color: "var(--accent)" }}>Active provider</span>
                ) : (
                  <span className="text-xs font-semibold mt-2" style={{ color: "var(--text-muted)" }}>{isSelected ? "Click to deselect" : "Click to select"}</span>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between pb-5 mb-5" style={{ borderBottom: "1px solid var(--border-default)" }}>
          <div>
            <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Provider Credentials</h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Secure authorization parameters for {selectedProviderObj?.label ?? activeProviderObj?.label ?? "selected provider"}.
            </p>
          </div>
          <span className="badge badge-primary self-start">{selectedProviderObj?.label ?? activeProviderObj?.label ?? "Not selected"}</span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            API Authorization Token
            <input className="input-modern w-full px-4 py-3 text-sm" type="password" value={apiKeyInput}
              onChange={(event) => setApiKeyInput(event.target.value)}
              placeholder={`Enter ${selectedProviderObj?.label ?? activeProviderObj?.label ?? "provider"} API key...`}
            />
          </label>

          <div className="rounded-lg p-4 text-sm leading-relaxed" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
            <p className="font-semibold uppercase tracking-wider text-xs" style={{ color: "var(--text-secondary)" }}>Token Status</p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              {hasDbKey
                ? "Your API key is encrypted and stored in the database."
                : "No saved API credentials found. Enter a token above to encrypt and store it securely."}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="btn-primary px-5 py-2.5 text-sm font-semibold" onClick={handleSaveApiKey}>
            Save API Key
          </button>
          <button type="button" className="btn-secondary px-5 py-2.5 text-sm font-semibold" onClick={handleClearApiKey}>
            Clear Credentials
          </button>
        </div>

        {settingsMessage ? (
          <div className="mt-5 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium" style={{ background: "var(--success-soft)", color: "var(--success)", border: "1px solid color-mix(in srgb, var(--success) 25%, transparent)" }}>
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{settingsMessage}</span>
          </div>
        ) : null}
        {settingsError ? (
          <div className="mt-5 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium" style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid color-mix(in srgb, var(--danger) 25%, transparent)" }}>
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{settingsError}</span>
          </div>
        ) : null}
      </Card>
    </section>
  );
}