import { useEffect } from "react";
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
import { AdminPage } from "./pages/AdminPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { NavBar } from "./components/NavBar";
import { Sidebar } from "./components/Sidebar";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ConfirmDialog } from "./components/ui/ConfirmDialog";

function AppLayout() {
  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 min-h-screen">
        <NavBar />
        <ErrorBoundary>
          <div className="flex-1 px-4 py-6 lg:px-8 lg:py-8 overflow-y-auto">
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
              <Route path="/admin" element={<AdminPage />} />
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
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex h-12 w-12 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4" style={{ borderColor: "var(--border-default)" }} />
          <div className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
        </div>
        <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Restoring your session...</p>
      </div>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const authChecking = useAppStore((s) => s.authChecking);
  const theme = useAppStore((s) => s.theme);
  const confirmDialog = useAppStore((s) => s.confirmDialog);
  const closeConfirm = useAppStore((s) => s.closeConfirm);
  const initialize = useAppStore((s) => s.initialize);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    initialize();
  }, [initialize]);

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
