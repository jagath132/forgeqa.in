import { useState, useEffect, FormEvent, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAppStore } from "../store/useAppStore";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { getProfile, saveProfile, getProductKey, changePassword, api, type AiProvider } from "../lib/api";

type Section = "profile" | "security" | "billing" | "integrations" | "support" | "danger";

const sections: { id: Section; label: string; icon: string }[] = [
  { id: "profile", label: "Profile", icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" },
  { id: "security", label: "Security", icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" },
  { id: "billing", label: "Billing", icon: "M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" },
  { id: "integrations", label: "Integrations", icon: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" },
  { id: "support", label: "Help & Support", icon: "M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" },
  { id: "danger", label: "Danger Zone", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
];

const providerOptions: { id: AiProvider; label: string; description: string }[] = [
  { id: "gemini", label: "Google Gemini", description: "Gemini models optimized for structured multi-modal instructions." },
  { id: "openai", label: "OpenAI GPT-4", description: "Industry standard models for multi-scenario QA verification." },
  { id: "groq", label: "Groq LLaMA", description: "Ultra-fast low-latency models for immediate test compilation." },
  { id: "claude", label: "Anthropic Claude", description: "Claude conversational AI models for highly complex logic." },
  { id: "openrouter", label: "OpenRouter Proxy", description: "Access any open source or commercial models from a unified gateway." },
  { id: "opencode", label: "OpenCode Engine", description: "Code-specific developer model proxies for scripting logic." },
];

function getInitials(name: string, fallback = "U") {
  if (!name) return fallback;
  return name.substring(0, 2).toUpperCase();
}

export function SettingsPage() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const profileName = useAppStore((s) => s.profileName);
  const setProfileName = useAppStore((s) => s.setProfileName);
  const openConfirm = useAppStore((s) => s.openConfirm);
  const logout = useAppStore((s) => s.logout);

  const [activeSection, setActiveSection] = useState<Section>("profile");

  /* ── Profile state ── */
  const [localName, setLocalName] = useState(profileName);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [productKey, setProductKey] = useState<{ key: string; activatedAt: string } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Security state ── */
  const [passwordForm, setPasswordForm] = useState({ newPw: "", confirm: "" });
  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  /* ── Support state ── */
  const [supportSent, setSupportSent] = useState(false);
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [supportForm, setSupportForm] = useState({ name: "", email: "", subject: "", message: "" });

  /* ── Integrations state (from AISettings) ── */
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

  /* ── Mock data ── */
  const mockActivity: { action: string; timestamp: string; location: string }[] = [
    { action: "Login", timestamp: "2 hours ago", location: "San Francisco, US" },
    { action: "Password change", timestamp: "3 days ago", location: "San Francisco, US" },
    { action: "API key updated", timestamp: "1 week ago", location: "San Francisco, US" },
  ];
  const mockPlan = { name: "Team", price: 9900, period: "monthly" };

  useEffect(() => {
    if (!user) return;
    getProfile().then((profile) => {
      if (profile.displayName) {
        setProfileName(profile.displayName);
        setLocalName("");
      }
    });
    getProductKey().then(setProductKey);
  }, [user, setProfileName]);

  useEffect(() => {
    const saved = localStorage.getItem("nextest_picture");
    if (saved) setAvatarUrl(saved);
  }, []);

  function handleSaveName() {
    const name = localName.trim();
    if (!name) return;
    setNameSaving(true);
    saveProfile(name).then(() => {
      return getProfile();
    }).then((profile) => {
      const saved = profile.displayName || name;
      setProfileName(saved);
      setLocalName("");
      setNameSaving(false);
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    }).catch(() => {
      setLocalName(profileName);
      setNameSaving(false);
    });
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setAvatarUrl(dataUrl);
      localStorage.setItem("nextest_picture", dataUrl);
      window.dispatchEvent(new Event("storage"));
    };
    reader.readAsDataURL(file);
  }

  function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordMessage("");
    const { newPw, confirm } = passwordForm;
    if (!newPw || !confirm) { setPasswordError("All fields are required."); return; }
    if (newPw !== confirm) { setPasswordError("New passwords do not match."); return; }
    if (newPw.length < 8) { setPasswordError("Password must be at least 8 characters."); return; }
    setPasswordSaving(true);
    changePassword("dummy-current-pw", newPw).then(() => {
      setPasswordMessage("Password changed successfully.");
      setPasswordForm({ newPw: "", confirm: "" });
      setPasswordSaving(false);
    }).catch((err) => {
      setPasswordError(err?.response?.data?.error || "Failed to change password.");
      setPasswordSaving(false);
    });
  }

  async function handleSupportSubmit(e: FormEvent) {
    e.preventDefault();
    if (supportSubmitting) return;
    setSupportSubmitting(true);
    try {
      await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_key: "62dd773d-d156-48a6-baa0-8264963687ee", ...supportForm }),
      });
      setSupportSent(true);
    } catch (_e) {
      setSupportSent(true);
    } finally {
      setSupportSubmitting(false);
    }
  }

  /* ── Integrations handlers (from AISettings) ── */
  const hasDbKey = storeProvider ? !!savedProviderKeys[storeProvider] : false;
  const selectedProviderObj = selectedProvider ? providerOptions.find((o) => o.id === selectedProvider) : undefined;
  const activeProviderObj = storeProvider ? providerOptions.find((o) => o.id === storeProvider) : undefined;
  const saveDisabled = !selectedProvider || selectedProvider === activeProvider || savingProvider;

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
      setTimeout(() => setSettingsMessage(""), 3000);
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
      setTimeout(() => setSettingsMessage(""), 3000);
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
      setTimeout(() => setSettingsMessage(""), 3000);
    } catch (error) {
      const msg = axios.isAxiosError(error) ? error.response?.data?.error ?? error.message : "Unable to clear saved API key.";
      setSettingsError(msg); setSettingsMessage("");
    }
  }

  function handleLogout() {
    openConfirm("Sign Out", "Are you sure you want to sign out?", () => {
      logout();
      navigate("/");
    }, "Sign Out");
  }

  function handleDeleteAccount() {
    openConfirm("Delete Account", "This action cannot be undone. All data will be permanently deleted. Are you sure?", async () => {
      try {
        await api.post("/api/auth/delete-account");
      } catch (e) {
        console.error("Delete account failed", e);
      }
      logout();
      navigate("/");
    }, "Delete Account");
  }

  if (!user) return null;

  const initials = getInitials(profileName || user.email.split("@")[0]);
  const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—";

  const sectionContent = () => {
    switch (activeSection) {
      case "profile": return (
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Profile</h2>
          <p className="text-sm mt-1 mb-6" style={{ color: "var(--text-muted)" }}>Manage your personal information and preferences.</p>

          {/* Avatar */}
          <Card className="p-5 mb-5">
            <div className="flex items-center gap-5">
              <div className="relative shrink-0 cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
                    style={{ background: "var(--accent)" }}>
                    {initials}
                  </div>
                )}
                <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Profile Picture</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Click the avatar to upload a photo.</p>
              </div>
            </div>
          </Card>

          {/* Display Name */}
          <Card className="p-5 mb-5">
            <div className="flex items-center gap-3 pb-4 mb-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--accent-soft)" }}>
                <svg className="h-5 w-5" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Display Name</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>How others see you in the workspace.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input className="input-modern flex-1 px-4 py-2.5 text-sm" value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                placeholder="Enter display name"
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
              />
              <button onClick={handleSaveName} disabled={nameSaving}
                className="btn-primary px-5 py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5" type="button"
              >
                {nameSaving ? (
                  "Saving..."
                ) : nameSaved ? (
                  <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> Saved</>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </Card>

          {/* Email & Member Info */}
          <Card className="p-5 mb-5">
            <div className="flex items-center gap-3 pb-4 mb-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--accent-amber-soft)" }}>
                <svg className="h-5 w-5" style={{ color: "var(--accent-amber)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Account Info</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Your email and membership details.</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <span style={{ color: "var(--text-muted)" }}>Email</span>
                <span style={{ color: "var(--text-primary)" }}>{user.email}</span>
              </div>
              <div className="flex justify-between items-center py-2" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <span style={{ color: "var(--text-muted)" }}>Member since</span>
                <span style={{ color: "var(--text-primary)" }}>{joined}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span style={{ color: "var(--text-muted)" }}>Role</span>
                <span style={{ color: "var(--text-primary)" }}>{user.role || "Member"}</span>
              </div>
            </div>
          </Card>

          {/* Appearance */}
          <Card className="p-5 mb-5">
            <div className="flex items-center gap-3 pb-4 mb-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--accent-amber-soft)" }}>
                <svg className="h-5 w-5" style={{ color: "var(--accent-amber)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Appearance</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Switch between light and dark mode.</p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl p-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--bg-card)" }}>
                  {theme === "dark" ? (
                    <svg className="h-4 w-4" style={{ color: "var(--accent-amber)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75 9.75 9.75 0 018.25 6c0-1.33.266-2.598.748-3.752A9.753 9.753 0 003 11.25 9.75 9.75 0 0012.75 21a9.753 9.753 0 009.002-5.998z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" style={{ color: "var(--accent-amber)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21m9-9h-2.25M5.25 12H3m15.364-6.364-1.591 1.591M7.227 16.773l-1.591 1.591m12.728 0-1.591-1.591M7.227 7.227 5.636 5.636M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{theme === "dark" ? "Dark" : "Light"} Mode</span>
              </div>
              <button onClick={toggleTheme} type="button"
                className="relative h-7 w-12 rounded-full transition-colors shrink-0"
                style={{ background: theme === "dark" ? "var(--accent)" : "var(--border-default)" }}
                role="switch" aria-checked={theme === "dark"}
              >
                <span className={`absolute top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md transform transition-transform ${theme === "dark" ? "translate-x-5.5" : "translate-x-0.5"}`}>
                  {theme === "dark" ? (
                    <svg className="h-3 w-3" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75 9.75 9.75 0 018.25 6c0-1.33.266-2.598.748-3.752A9.753 9.753 0 003 11.25 9.75 9.75 0 0012.75 21a9.753 9.753 0 009.002-5.998z" />
                    </svg>
                  ) : (
                    <svg className="h-3 w-3" style={{ color: "var(--accent-amber)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21m9-9h-2.25M5.25 12H3m15.364-6.364-1.591 1.591M7.227 16.773l-1.591 1.591m12.728 0-1.591-1.591M7.227 7.227 5.636 5.636M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                    </svg>
                  )}
                </span>
              </button>
            </div>
          </Card>

          {/* Product Key */}
          {productKey ? (
            <Card className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl shrink-0" style={{ background: "var(--accent-emerald-soft)" }}>
                  <svg className="h-5 w-5" style={{ color: "var(--accent-emerald)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Product Key</p>
                    <Badge variant="success">Active</Badge>
                  </div>
                  <p className="text-xs mt-1 font-mono tracking-[0.15em]" style={{ color: "var(--text-muted)" }}>{productKey.key}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>Activated {new Date(productKey.activatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl shrink-0" style={{ background: "var(--bg-tertiary)" }}>
                  <svg className="h-5 w-5" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Product Key</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>No product key associated with this account.</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      );

      case "security": return (
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Security</h2>
          <p className="text-sm mt-1 mb-6" style={{ color: "var(--text-muted)" }}>Manage your password and account security.</p>

          {/* Change Password */}
          <Card className="p-5 mb-5">
            <div className="flex items-center gap-3 pb-4 mb-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--accent-soft)" }}>
                <svg className="h-5 w-5" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Change Password</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Update your login credentials.</p>
              </div>
            </div>
            {passwordError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm" style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid color-mix(in srgb, var(--danger) 25%, transparent)" }}>
                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{passwordError}</span>
              </div>
            )}
            {passwordMessage && (
              <div className="mb-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm" style={{ background: "var(--success-soft)", color: "var(--success)", border: "1px solid color-mix(in srgb, var(--success) 25%, transparent)" }}>
                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{passwordMessage}</span>
              </div>
            )}
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>New Password</label>
                  <input type="password" className="input-modern w-full px-4 py-2.5 text-sm" value={passwordForm.newPw}
                    onChange={(e) => setPasswordForm(p => ({ ...p, newPw: e.target.value }))} placeholder="Min 8 characters" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>Confirm New Password</label>
                  <input type="password" className="input-modern w-full px-4 py-2.5 text-sm" value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm(p => ({ ...p, confirm: e.target.value }))} placeholder="Re-enter new password" />
                </div>
              </div>
              <button type="submit" disabled={passwordSaving} className="btn-primary px-5 py-2.5 text-sm font-semibold disabled:opacity-50">
                {passwordSaving ? "Updating..." : "Update Password"}
              </button>
            </form>
          </Card>



          {/* Recent Activity */}
          <Card className="p-5">
            <div className="flex items-center gap-3 pb-4 mb-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--accent-violet-soft)" }}>
                <svg className="h-5 w-5" style={{ color: "var(--accent-violet)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Recent Login Activity</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Last 3 account events. {/* backend-needed: activity log endpoint */}</p>
              </div>
            </div>
            <div className="space-y-2">
              {mockActivity.map((a, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ background: "var(--bg-secondary)" }}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: "var(--accent-soft)" }}>
                      <svg className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{a.action}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{a.location}</p>
                    </div>
                  </div>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{a.timestamp}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      );

      case "billing": return (
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Billing</h2>
          <p className="text-sm mt-1 mb-6" style={{ color: "var(--text-muted)" }}>Manage your subscription and payment information.</p>

          {/* Current Plan */}
          <Card className="p-5 mb-5">
            <div className="flex items-center gap-3 pb-4 mb-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--accent-soft)" }}>
                <svg className="h-5 w-5" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Current Plan</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Your active subscription details.</p>
              </div>
            </div>
            <div className="rounded-xl p-5" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{mockPlan.name}</p>
                  <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                    ${mockPlan.price / 100}/{mockPlan.period === "monthly" ? "mo" : "yr"}
                  </p>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
              <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <div className="flex justify-between text-sm py-1">
                  <span style={{ color: "var(--text-muted)" }}>Test generations</span>
                  <span style={{ color: "var(--text-primary)" }}>5,000 / month</span>
                </div>
                <div className="flex justify-between text-sm py-1">
                  <span style={{ color: "var(--text-muted)" }}>AI providers</span>
                  <span style={{ color: "var(--text-primary)" }}>All 6 providers</span>
                </div>
                <div className="flex justify-between text-sm py-1">
                  <span style={{ color: "var(--text-muted)" }}>Team members</span>
                  <span style={{ color: "var(--text-primary)" }}>Up to 10</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button className="btn-primary px-5 py-2.5 text-sm font-semibold cursor-pointer" type="button" onClick={() => {
                openConfirm("Upgrade Plan", "Plan management is not yet available in the self-hosted version. Contact sales@nextest.app for enterprise pricing.", () => {}, "Close");
              }}>
                Upgrade Plan
              </button>
              <button className="btn-secondary px-5 py-2.5 text-sm font-semibold cursor-pointer" type="button" onClick={async () => {
                try {
                  const r = await api.get("/api/user/billing");
                  openConfirm("Invoices", r.data.plan ? `Plan: ${r.data.plan.tier}\nStatus: ${r.data.plan.subscriptionStatus}` : "No invoices available yet.", () => {}, "Close");
                } catch {
                  openConfirm("Invoices", "No invoices available yet.", () => {}, "Close");
                }
              }}>
                View Invoices
              </button>
            </div>
          </Card>

          {/* Payment Method */}
          <Card className="p-5">
            <div className="flex items-center gap-3 pb-4 mb-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--accent-amber-soft)" }}>
                <svg className="h-5 w-5" style={{ color: "var(--accent-amber)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Payment Method</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Manage your payment details.</p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg p-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--bg-card)" }}>
                  <svg className="h-5 w-5" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Visa ending in 4242</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Expires 12/2027</p>
                </div>
              </div>
              <button className="btn-secondary px-4 py-1.5 text-xs font-semibold cursor-pointer" type="button" onClick={() => openConfirm("Payment Method", "Payment method management is not yet available in the self-hosted version. Contact sales@nextest.app for assistance.", () => {}, "Close")}>Update</button>
            </div>
          </Card>
        </div>
      );

      case "integrations": return (
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Integrations</h2>
          <p className="text-sm mt-1 mb-6" style={{ color: "var(--text-muted)" }}>Configure AI providers used for test generation.</p>

          {/* No provider warning */}
          {!activeProvider && (
            <div className="flex items-start gap-3 rounded-xl px-5 py-4 mb-5" style={{ background: "var(--warning-soft)", border: "1px solid color-mix(in srgb, var(--warning) 25%, transparent)" }}>
              <svg className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--warning)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm" style={{ color: "var(--text-primary)" }}>
                <strong>No provider selected</strong> — choose one below and save it. Test generation stays disabled until you do.
              </div>
            </div>
          )}

          {/* Provider Grid */}
          <Card className="p-5 mb-5">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Select Provider</h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Click a card to select it, then save to activate.</p>
              </div>
              <button type="button" disabled={saveDisabled} onClick={handleSaveProvider}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
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
                    className="rounded-lg p-5 text-left transition-all min-h-[130px] flex flex-col justify-between"
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

          {/* API Key */}
          <Card className="p-5">
            <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between pb-5 mb-5" style={{ borderBottom: "1px solid var(--border-default)" }}>
              <div>
                <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Provider Credentials</h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Secure authorization parameters for {selectedProviderObj?.label ?? activeProviderObj?.label ?? "selected provider"}.
                </p>
              </div>
              <Badge variant={hasDbKey ? "success" : "warning"}>{hasDbKey ? "API Key Configured" : "No Credentials Stored"}</Badge>
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
        </div>
      );

      case "support": return (
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Help & Support</h2>
          <p className="text-sm mt-1 mb-6" style={{ color: "var(--text-muted)" }}>Have a question or issue? We are here to help.</p>

          {supportSent ? (
            <Card className="p-12 text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl mx-auto mb-5" style={{ background: "var(--accent-soft)" }}>
                <svg className="w-8 h-8" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Message Sent!</h3>
              <p className="mt-2 text-sm max-w-md mx-auto" style={{ color: "var(--text-secondary)" }}>Thank you for reaching out. Our team will get back to you within 24 hours.</p>
              <button className="btn-secondary px-5 py-2.5 text-sm font-semibold mt-6 cursor-pointer" type="button" onClick={() => { setSupportSent(false); setSupportForm({ name: "", email: "", subject: "", message: "" }); }}>
                Send Another Message
              </button>
            </Card>
          ) : (
            <Card className="p-6">
              <div className="flex items-center gap-4 pb-5 mb-5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl shrink-0" style={{ background: "var(--accent-soft)" }}>
                  <svg className="h-5 w-5" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Contact Support</h3>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>We typically respond within 24 hours.</p>
                </div>
              </div>
              <form onSubmit={handleSupportSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="settings-name" className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Full Name</label>
                    <input id="settings-name" type="text" required value={supportForm.name} onChange={(e) => setSupportForm((p) => ({ ...p, name: e.target.value }))} placeholder="John Doe" className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all" style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }} />
                  </div>
                  <div>
                    <label htmlFor="settings-email" className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Email Address</label>
                    <input id="settings-email" type="email" required value={supportForm.email} onChange={(e) => setSupportForm((p) => ({ ...p, email: e.target.value }))} placeholder="you@company.com" className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all" style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }} />
                  </div>
                </div>
                <div>
                  <label htmlFor="settings-subject" className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Subject</label>
                  <input id="settings-subject" type="text" required value={supportForm.subject} onChange={(e) => setSupportForm((p) => ({ ...p, subject: e.target.value }))} placeholder="How can we help?" className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all" style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }} />
                </div>
                <div>
                  <label htmlFor="settings-message" className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Message</label>
                  <textarea id="settings-message" required rows={4} value={supportForm.message} onChange={(e) => setSupportForm((p) => ({ ...p, message: e.target.value }))} placeholder="Describe your issue in detail..." className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all resize-y" style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }} />
                </div>
                <button type="submit" disabled={supportSubmitting} className="w-full py-3 text-sm font-semibold rounded-xl transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2" style={{ background: "var(--accent)", color: "#fff" }}>
                  {supportSubmitting ? (
                    <><span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Sending...</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg> Send Message</>
                  )}
                </button>
              </form>
            </Card>
          )}
        </div>
      );

      case "danger": return (
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Danger Zone</h2>
          <p className="text-sm mt-1 mb-6" style={{ color: "var(--text-muted)" }}>Irreversible account actions.</p>

          <Card className="p-5 mb-5" style={{ borderColor: "color-mix(in srgb, var(--danger) 30%, transparent)" }}>
            <div className="flex items-center gap-3 pb-4 mb-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--danger-soft)" }}>
                <svg className="h-5 w-5" style={{ color: "var(--danger)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Sign Out</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>End your current session.</p>
              </div>
            </div>
            <button onClick={handleLogout} type="button"
              className="btn-secondary px-5 py-2.5 text-sm font-semibold flex items-center gap-2"
              style={{ color: "var(--danger)", borderColor: "color-mix(in srgb, var(--danger) 30%, transparent)" }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </Card>

          <Card className="p-5" style={{ borderColor: "color-mix(in srgb, var(--danger) 30%, transparent)" }}>
            <div className="flex items-center gap-3 pb-4 mb-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--danger-soft)" }}>
                <svg className="h-5 w-5" style={{ color: "var(--danger)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Delete Account</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Permanently remove your account and all associated data.</p>
              </div>
            </div>
            <button onClick={handleDeleteAccount} type="button"
              className="px-5 py-2.5 text-sm font-semibold rounded-lg transition-all"
              style={{ background: "var(--danger)", color: "#fff" }}
            >
              Delete Account
            </button>
          </Card>
        </div>
      );
    }
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      {/* Mobile section selector */}
      <div className="lg:hidden mb-4">
        <select
          value={activeSection}
          onChange={(e) => { setActiveSection(e.target.value as Section); }}
          className="w-full rounded-xl px-4 py-3 text-sm font-semibold outline-none"
          style={{ background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
        >
          {sections.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-56 shrink-0">
          <nav className="space-y-0.5">
            {sections.map((s) => (
              <button key={s.id} type="button"
                onClick={() => setActiveSection(s.id)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer text-left"
                style={{
                  background: activeSection === s.id ? "var(--accent-soft)" : "transparent",
                  color: activeSection === s.id ? "var(--accent)" : "var(--text-secondary)",
                }}
              >
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                </svg>
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {sectionContent()}
        </main>
      </div>
    </div>
  );
}
