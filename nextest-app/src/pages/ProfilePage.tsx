import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore, getProviderLabel } from "../store/useAppStore";
import { Card } from "../components/ui/Card";
import { getProfile, saveProfile, getProductKey } from "../lib/api";

const styles = `
  @keyframes logoutShine {
    0% { background-position: 200% center; }
    100% { background-position: -200% center; }
  }
  .logout-btn {
    position: relative;
    overflow: hidden;
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.15);
  }
  .logout-btn::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.15) 30%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.15) 70%, transparent 100%);
    background-size: 200% 100%;
    opacity: 0;
    transition: opacity 0.35s ease;
  }
  .logout-btn:hover {
    background: rgba(239, 68, 68, 0.25);
    border-color: rgba(239, 68, 68, 0.4);
    transform: scale(1.04);
    box-shadow: 0 0 28px rgba(239, 68, 68, 0.2), 0 8px 32px rgba(0,0,0,0.15);
  }
  .logout-btn:hover::before {
    opacity: 1;
    animation: logoutShine 1.2s linear infinite;
  }
  .logout-btn:hover .logout-icon {
    transform: translateX(3px) translateY(-2px);
    filter: drop-shadow(0 0 4px rgba(239,68,68,0.5));
  }
  .logout-btn:hover .logout-label {
    letter-spacing: 0.08em;
    text-shadow: 0 0 8px rgba(239,68,68,0.3);
  }
`;

function getInitials(name: string, fallback = "U") {
  if (!name) return fallback;
  return name.substring(0, 2).toUpperCase();
}

export function ProfilePage() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const theme = useAppStore((s) => s.theme);
  const provider = useAppStore((s) => s.provider);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const openConfirm = useAppStore((s) => s.openConfirm);
  const logout = useAppStore((s) => s.logout);
  const profileName = useAppStore((s) => s.profileName);
  const savedProviderKeys = useAppStore((s) => s.savedProviderKeys);
  const setProfileName = useAppStore((s) => s.setProfileName);

  const [localName, setLocalName] = useState(profileName);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [productKey, setProductKey] = useState<{ key: string; activatedAt: string } | null>(null);
  const [supportSent, setSupportSent] = useState(false);
  const [supportForm, setSupportForm] = useState({ name: "", email: "", subject: "", message: "" });

  async function handleSupportSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_key: "62dd773d-d156-48a6-baa0-8264963687ee", ...supportForm }),
      });
      setSupportSent(true);
    } catch {
      setSupportSent(true);
    }
  }

  useEffect(() => {
    if (!user) return;
    getProfile().then((profile) => {
      if (profile.displayName) {
        setProfileName(profile.displayName);
        setLocalName(profile.displayName);
      }
    });
    getProductKey().then(setProductKey);
  }, [user, setProfileName]);

  function handleSaveName() {
    const name = localName.trim();
    if (!name) return;
    setNameSaving(true);
    saveProfile(name).then(() => {
      setProfileName(name);
      setLocalName("");
      setNameSaving(false);
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    }).catch(() => {
      setLocalName(profileName);
      setNameSaving(false);
    });
  }

  function handleLogout() {
    openConfirm("Sign Out", "Are you sure you want to sign out?", () => {
      logout();
      navigate("/");
    }, "Sign Out");
  }

  const providerHasKey = provider ? savedProviderKeys[provider] === true : false;

  if (!user) return null;

  const initials = getInitials(profileName || user.email.split("@")[0]);
  const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—";
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <style>{styles}</style>

      {/* ── Profile Hero ── */}
      <div className="relative overflow-hidden rounded-2xl" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-xl)" }}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)"
        }} />
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl" style={{ background: "rgba(255,255,255,0.08)", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl" style={{ background: "rgba(255,255,255,0.05)", transform: "translate(-20%, 20%)" }} />
        <div className="relative px-6 sm:px-10 py-8 sm:py-10 flex flex-col sm:flex-row items-center sm:items-end gap-6">
          <div className="shrink-0">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-bold text-white shadow-2xl"
                style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.08))", backdropFilter: "blur(12px)", border: "2px solid rgba(255,255,255,0.2)" }}>
                {initials}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2" style={{ borderColor: "var(--accent)" }}>
                <svg className="w-full h-full p-1 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
            </div>
          </div>
          <div className="text-center sm:text-left text-white min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold drop-shadow-sm truncate">{profileName || "Your Account"}</h1>
            <p className="text-sm opacity-90 mt-1">{user.email}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-xs opacity-75">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                Member since {joined}
              </span>
            </div>
          </div>
          <button onClick={handleLogout} type="button"
            className="logout-btn shrink-0 flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
            style={{ color: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)" }}
          >
            <svg className="logout-icon w-4 h-4 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="logout-label transition-all duration-300">Sign Out</span>
          </button>
        </div>
      </div>

      {/* ── Product Key ── */}
      {productKey ? (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-default)", background: "var(--bg-card)", boxShadow: "var(--shadow-sm)" }}>
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl shrink-0" style={{ background: "linear-gradient(135deg, var(--accent-emerald-soft), transparent)" }}>
              <svg className="h-5 w-5" style={{ color: "var(--accent-emerald)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5">
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Product Key</p>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: "var(--accent-emerald-soft)", color: "var(--accent-emerald)" }}>
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Active
                </span>
              </div>
              <p className="text-xs mt-1 font-mono tracking-[0.15em]" style={{ color: "var(--text-muted)" }}>{productKey.key}</p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>Activated {new Date(productKey.activatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-default)", background: "var(--bg-card)", boxShadow: "var(--shadow-sm)" }}>
          <div className="flex items-center gap-4 px-5 py-4">
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
        </div>
      )}

      {/* ── Settings Grid ── */}
      <div className="grid gap-5 md:grid-cols-2">

        {/* Display Name */}
        <Card className="flex flex-col">
          <div className="flex items-center gap-3 pb-4 mb-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--accent-soft)" }}>
              <svg className="h-5 w-5" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Display Name</h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>How others see you in the workspace.</p>
            </div>
          </div>
          <div className="flex gap-2 mt-auto">
            <input className="input-modern flex-1 px-4 py-2.5 text-sm" value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              placeholder="Enter your display name"
              onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
            />
            <button onClick={handleSaveName} disabled={nameSaving}
              className="btn-primary px-5 py-2.5 text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" type="button"
            >
              {nameSaving ? "Saving..." : nameSaved ? "Saved!" : "Save"}
            </button>
          </div>
        </Card>

        {/* Appearance */}
        <Card className="flex flex-col">
          <div className="flex items-center gap-3 pb-4 mb-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--accent-amber-soft)" }}>
              <svg className="h-5 w-5" style={{ color: "var(--accent-amber)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Appearance</h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Switch between light and dark mode.</p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl p-4 mt-auto" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
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
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{theme === "dark" ? "Dark" : "Light"} Mode</p>
              </div>
            </div>
            <button onClick={toggleTheme} type="button"
              className="relative h-7 w-12 rounded-full transition-colors cursor-pointer shrink-0"
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
          <div className="mt-3 flex gap-2">
            <button onClick={() => { if (theme !== "dark") toggleTheme(); }} type="button"
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${theme === "dark" ? "ring-2" : "hover:bg-[var(--bg-tertiary)]"}`}
              style={{
                background: theme === "dark" ? "var(--accent-soft)" : "var(--bg-secondary)",
                color: theme === "dark" ? "var(--accent)" : "var(--text-muted)",
                borderColor: theme === "dark" ? "var(--accent)" : "var(--border-subtle)",
              }}
            >
              Dark
            </button>
            <button onClick={() => { if (theme !== "light") toggleTheme(); }} type="button"
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${theme === "light" ? "ring-2" : "hover:bg-[var(--bg-tertiary)]"}`}
              style={{
                background: theme === "light" ? "var(--accent-soft)" : "var(--bg-secondary)",
                color: theme === "light" ? "var(--accent)" : "var(--text-muted)",
              }}
            >
              Light
            </button>
          </div>
        </Card>

        {/* AI Provider Status — replaces Change Password */}
        <Card className="md:col-span-2">
          <div className="flex items-center gap-3 pb-4 mb-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: provider ? "var(--accent-violet-soft)" : "var(--bg-tertiary)" }}>
              <svg className="h-5 w-5" style={{ color: provider ? "var(--accent-violet)" : "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <circle cx="12" cy="12" r="7" /><path d="M12 5v14M5 12h14" opacity="0.5" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>AI Provider</h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Active provider used for test generation.</p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl p-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: provider ? "var(--accent-soft)" : "var(--bg-card)" }}>
                {provider ? (
                  <svg className="h-4 w-4" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="7" /><path d="M12 5v14M5 12h14" opacity="0.5" /></svg>
                ) : (
                  <svg className="h-4 w-4" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {provider ? getProviderLabel(provider) : "Not configured"}
                </p>
                {provider && (
                  <p className="text-xs mt-0.5" style={{ color: providerHasKey ? "var(--accent-emerald)" : "var(--warning)" }}>
                    {providerHasKey ? "API key saved" : "No API key configured"}
                  </p>
                )}
              </div>
            </div>
            <button onClick={() => navigate("/ai-settings")} type="button"
              className="px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer"
              style={{ background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)" }}
            >
              {provider ? "Change Provider" : "Configure"}
            </button>
          </div>
        </Card>

      </div>

      {/* Support */}
      <section>
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4" style={{ background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)" }}>
            Get Help
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Contact Support
          </h2>
          <p className="mt-3 text-lg" style={{ color: "var(--text-secondary)" }}>
            Have a question or issue? We are here to help.
          </p>
        </div>

        {supportSent ? (
          <div className="rounded-2xl p-12 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl mx-auto mb-5" style={{ background: "var(--accent-soft)" }}>
              <svg className="w-8 h-8" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Message Sent!</h3>
            <p className="mt-2 text-sm max-w-md mx-auto" style={{ color: "var(--text-secondary)" }}>Thank you for reaching out. Our team will get back to you within 24 hours.</p>
          </div>
        ) : (
          <form onSubmit={handleSupportSubmit} className="rounded-2xl p-8 sm:p-10 space-y-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="support-name" className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Name</label>
                <input id="support-name" type="text" required value={supportForm.name} onChange={(e) => setSupportForm((p) => ({ ...p, name: e.target.value }))} placeholder="Your name" className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all" style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }} />
              </div>
              <div>
                <label htmlFor="support-email" className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Email</label>
                <input id="support-email" type="email" required value={supportForm.email} onChange={(e) => setSupportForm((p) => ({ ...p, email: e.target.value }))} placeholder="you@company.com" className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all" style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }} />
              </div>
            </div>
            <div>
              <label htmlFor="support-subject" className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Subject</label>
              <input id="support-subject" type="text" required value={supportForm.subject} onChange={(e) => setSupportForm((p) => ({ ...p, subject: e.target.value }))} placeholder="How can we help?" className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all" style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }} />
            </div>
            <div>
              <label htmlFor="support-message" className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Message</label>
              <textarea id="support-message" required rows={4} value={supportForm.message} onChange={(e) => setSupportForm((p) => ({ ...p, message: e.target.value }))} placeholder="Describe your issue in detail..." className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all resize-y" style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }} />
            </div>
            <button type="submit" className="w-full py-3 text-sm font-semibold rounded-xl transition-all hover:opacity-90" style={{ background: "var(--accent)", color: "#fff" }}>
              Send Message
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
