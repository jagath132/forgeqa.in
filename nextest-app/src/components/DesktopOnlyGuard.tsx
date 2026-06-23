import { useIsDesktop } from "../hooks/useIsDesktop";
import { Logo } from "./ui/Logo";

export function DesktopOnlyGuard({ children }: { children: React.ReactNode }) {
  const isDesktop = useIsDesktop();

  if (isDesktop) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center animate-fade-in">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl mb-5" style={{ background: "var(--accent)" }}>
        <Logo variant="mark" />
      </div>
      <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
        Desktop Required
      </h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        Test case and test script generation is computationally intensive and requires a desktop or laptop browser.
      </p>
      <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
        Please open NexTest on a computer to access this workspace.
      </p>
      <div className="mt-8 flex items-center gap-2 rounded-lg px-5 py-3 text-sm" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span>Use a laptop or desktop computer</span>
      </div>
    </div>
  );
}
