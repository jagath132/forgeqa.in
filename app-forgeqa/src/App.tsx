import { useEffect, useRef } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "./store/useAppStore";
import { LandingPage } from "./pages/LandingPage";
import { AuthPage } from "./pages/AuthPage";
import { RegisterPage } from "./pages/RegisterPage";
import { CompleteRegistrationPage } from "./pages/CompleteRegistrationPage";
import { DashboardPage } from "./pages/DashboardPage";
import { GeneratorPage } from "./pages/GeneratorPage";
import { TestScripts } from "./pages/TestScripts";
import { KnowledgeBase } from "./pages/KnowledgeBase";
import { SettingsPage } from "./pages/SettingsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { SuitesPage } from "./pages/SuitesPage";
import { RegressionPage } from "./pages/RegressionPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { NavBar } from "./components/NavBar";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ConfirmDialog } from "./components/ui/ConfirmDialog";

function AppLayout() {
  const { pathname } = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop = 0;
        }
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        window.scrollTo(0, 0);
      });
    });
  }, [pathname]);
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
      <NavBar />
      <main className="flex-1 flex flex-col min-w-0">
        <ErrorBoundary>
          <div ref={contentRef} className="flex-1 px-4 py-6 lg:px-8 lg:py-8 overflow-y-auto">
            <Routes>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/generator" element={<GeneratorPage />} />
              <Route path="/test-scripts" element={<TestScripts />} />
              <Route path="/knowledge" element={<KnowledgeBase />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/ai-settings" element={<Navigate to="/settings" replace />} />
              <Route path="/profile" element={<Navigate to="/settings" replace />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/suites" element={<SuitesPage />} />
              <Route path="/regression" element={<RegressionPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </ErrorBoundary>
      </main>
    </div>
  );
}

function AuthLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
      <div className="flex flex-col items-center gap-5">
        <div className="relative flex h-14 w-14 items-center justify-center">
          <div className="absolute inset-0 rounded-full" style={{ border: "3px solid var(--border-default)" }} />
          <div className="absolute inset-0 rounded-full border-[3px] border-t-transparent animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
          <div className="h-5 w-5 rounded-sm" style={{ background: "var(--gradient-primary)" }} />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>ForgeQA</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Restoring your session...</p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const authChecking = useAppStore((s) => s.authChecking);
  const confirmDialog = useAppStore((s) => s.confirmDialog);
  const closeConfirm = useAppStore((s) => s.closeConfirm);
  const initialize = useAppStore((s) => s.initialize);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.dataset.theme = "light";
    document.documentElement.style.colorScheme = "light";
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  /* ── Screenshot prevention ── */
  useEffect(() => {
    function showScreenshotWarning() {
      const overlay = document.createElement("div");
      overlay.style.cssText = "position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);";
      overlay.innerHTML = '<div style="text-align:center;color:#fff;font-family:system-ui,sans-serif;max-width:400px;padding:2rem;"><div style="font-size:3rem;margin-bottom:1rem;">&#128274;</div><h2 style="font-size:1.25rem;font-weight:700;margin:0 0 0.5rem;">Screenshot Blocked</h2><p style="font-size:0.875rem;color:#94A3B8;margin:0;">Taking screenshots is not allowed. This action has been logged for security purposes.</p></div>';
      document.body.appendChild(overlay);
      setTimeout(() => overlay.remove(), 3000);
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "PrintScreen" || (e.metaKey && e.shiftKey && (e.key === "3" || e.key === "4" || e.key === "5"))) {
        e.preventDefault();
        showScreenshotWarning();
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.key === "PrintScreen") {
        navigator.clipboard.writeText("").catch(() => {});
        showScreenshotWarning();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  if (window.location.pathname.startsWith("/reset-password/")) {
    return <ResetPasswordPage />;
  }

  if (authChecking) return <AuthLoadingScreen />;

  if (location.pathname.startsWith("/auth/complete-registration")) {
    return <CompleteRegistrationPage />;
  }

  if (location.pathname.startsWith("/register")) {
    return <RegisterPage />;
  }

  if (location.pathname === "/") {
    return (
      <LandingPage onGetStarted={() => navigate(user ? "/dashboard" : "/register")} onSignIn={() => navigate(user ? "/dashboard" : "/auth")} />
    );
  }

  if (!user) return <AuthPage />;

  return (
    <>
      <AppLayout />
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        onConfirm={() => { confirmDialog.onConfirm?.(); closeConfirm(); }}
        onCancel={closeConfirm}
      />
    </>
  );
}
