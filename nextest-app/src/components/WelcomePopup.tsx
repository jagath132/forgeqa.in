import { useState } from "react";
import { markWelcomeSeen } from "../lib/api";

export function WelcomePopup({ onDismiss }: { onDismiss: () => void }) {
  const [closing, setClosing] = useState(false);

  const handleDismiss = async () => {
    setClosing(true);
    try {
      await markWelcomeSeen();
    } catch { /* ignore */ }
    setTimeout(onDismiss, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={handleDismiss} />
      <div className={`relative w-full max-w-sm card p-8 text-center ${closing ? "animate-fade-in" : "animate-slide-up"}`} style={{ opacity: closing ? 0 : 1, transition: "opacity 0.3s" }}>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "rgba(47,214,117,0.12)" }}>
          <svg className="h-8 w-8" style={{ color: "var(--signal-green)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Welcome to NexTest</h2>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          You're all set. Start generating test cases, automation scripts, and regression suites from your requirements.
        </p>
        <button type="button" onClick={handleDismiss}
          className="mt-6 w-full py-2.5 text-sm font-semibold rounded-lg transition-all cursor-pointer"
          style={{ background: "var(--ink)", color: "var(--paper)", border: "none" }}
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
