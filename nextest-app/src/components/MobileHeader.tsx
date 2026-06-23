import { useAppStore } from "../store/useAppStore";
import { Logo } from "./ui/Logo";

export function MobileHeader() {
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  return (
    <header className="flex items-center gap-3 px-4 py-3 border-b lg:hidden" style={{ background: "var(--bg-glass)", borderColor: "var(--border-default)", backdropFilter: "blur(12px)" }}>
      <div style={{ width: 3, height: 24, borderRadius: 2, background: "var(--accent)", position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)" }} />
      <button
        className="flex h-9 w-9 items-center justify-center rounded-lg btn-ghost"
        onClick={() => setSidebarOpen(true)}
        type="button"
        aria-label="Open sidebar"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>
      <div className="flex items-center gap-2">
        <Logo variant="mark" />
      </div>
    </header>
  );
}
