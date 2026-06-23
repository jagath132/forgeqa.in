import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";

export function UserDropdown() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const profileName = useAppStore((s) => s.profileName);
  const openConfirm = useAppStore((s) => s.openConfirm);
  const logout = useAppStore((s) => s.logout);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("nextest_picture");
    if (saved) setAvatarUrl(saved);
    const handleStorage = () => {
      const saved = localStorage.getItem("nextest_picture");
      if (saved) setAvatarUrl(saved);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  function getInitials(email: string) {
    if (!email) return "U";
    const part = email.split("@")[0];
    return part.length <= 2 ? part.toUpperCase() : part.substring(0, 2).toUpperCase();
  }

  function handleLogout() {
    setOpen(false);
    openConfirm("Sign Out", "Are you sure you want to sign out?", () => {
      logout();
      navigate("/");
    }, "Sign Out");
  }

  if (!user) return null;

  const displayName = profileName || user.email.split("@")[0];

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} type="button"
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer nav-focus-visible" aria-label="User menu"
        style={{ background: "transparent", border: "none", outline: "none", fontFamily: "inherit" }}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: "var(--accent)" }}>
            {getInitials(displayName)}
          </div>
        )}
        <span className="hidden lg:block text-sm max-w-[120px] truncate" style={{ color: "var(--ink, var(--text-primary))" }}>{displayName}</span>
        <svg className="hidden lg:block h-3.5 w-3.5" style={{
          color: "var(--muted, var(--text-muted))",
          transition: "transform 150ms ease-out",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
        }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border shadow-lg animate-fade-in z-50" style={{ background: "var(--bg-card)", borderColor: "var(--border-default)" }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border-default)" }}>
            <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{displayName}</p>
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{user.email}</p>
          </div>
          <div className="py-1.5">
            <button onClick={() => { setOpen(false); navigate("/settings"); }} type="button"
              className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-[var(--accent-soft)] transition-colors cursor-pointer"
              style={{ color: "var(--text-secondary)" }}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              Settings
            </button>
          </div>
          <div className="border-t py-1.5" style={{ borderColor: "var(--border-default)" }}>
            <button onClick={handleLogout} type="button"
              className="w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors cursor-pointer"
              style={{ color: "var(--danger)" }}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
