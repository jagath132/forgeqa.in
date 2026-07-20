import { useEffect, useState, useCallback } from "react";
import { useAdminStore } from "./store/useAdminStore";
import { api } from "./lib/api";
import { LoginPage } from "./pages/Login";
import { LandingPage } from "./pages/LandingPage";
import { DashboardPage } from "./pages/Dashboard";
import { KeysPage } from "./pages/Keys";
import { CustomersPage } from "./pages/Customers";
import { EmailLogPage } from "./pages/EmailLog";
import { PaymentsPage } from "./pages/Payments";
import { VerificationsPage } from "./pages/Verifications";
import { PlansPage } from "./pages/Plans";
import { DeletedUsersPage } from "./pages/DeletedUsers";
import {
  LayoutDashboard,
  Blocks,
  ShieldCheck,
  KeyRound,
  Users,
  Mail,
  CreditCard,
  UserX,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";

export type Page = "dashboard" | "plans" | "keys" | "customers" | "email" | "payments" | "verifications" | "deleted-users";

const NAV_ITEMS: { key: Page; label: string; icon: React.ElementType }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "plans", label: "Plans", icon: Blocks },
  { key: "verifications", label: "Verifications", icon: ShieldCheck },
  { key: "keys", label: "Product Keys", icon: KeyRound },
  { key: "customers", label: "Customers", icon: Users },
  { key: "email", label: "Email Log", icon: Mail },
  { key: "payments", label: "Transactions", icon: CreditCard },
  { key: "deleted-users", label: "Deleted Users", icon: UserX },
];

export function App() {
  const { isAuthenticated, loading, checkAuth, logout, admin, keyStats } = useAdminStore();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [showLanding, setShowLanding] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("lm_sidebar_collapsed") === "true");
  const [pendingVerificationsCount, setPendingVerificationsCount] = useState(0);

  useEffect(() => { checkAuth(); }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    function fetchPendingCount() {
      api.get<{ registrations: any[] }>("/api/admin/verifications?status=pending_verification")
        .then((r) => setPendingVerificationsCount(r.data.registrations.length))
        .catch(() => {});
    }
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const getInitials = useCallback((email: string) => {
    return email.split("@")[0].slice(0, 2).toUpperCase();
  }, []);

  const navigate = useCallback((page: Page) => setCurrentPage(page), []);

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard": return <DashboardPage onNavigate={navigate} />;
      case "plans": return <PlansPage />;
      case "verifications": return <VerificationsPage />;
      case "keys": return <KeysPage />;
      case "customers": return <CustomersPage />;
      case "email": return <EmailLogPage />;
      case "payments": return <PaymentsPage />;
      case "deleted-users": return <DeletedUsersPage />;
      default: return <DashboardPage onNavigate={navigate} />;
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--color-bg)" }}>
        <div style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
          <div style={{ width: 28, height: 28, border: "2px solid var(--color-accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "lm-spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ fontSize: 13 }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (showLanding) {
      return <LandingPage onSignIn={() => setShowLanding(false)} />;
    }
    return <LoginPage onBack={() => setShowLanding(true)} />;
  }

  const pageLabel = NAV_ITEMS.find((n) => n.key === currentPage)?.label;

  function toggleSidebar() {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("lm_sidebar_collapsed", String(next));
      return next;
    });
  }

  const CollapseIcon = sidebarCollapsed ? ChevronRight : ChevronLeft;

  return (
    <div className={`app-layout${sidebarCollapsed ? " sidebar-collapsed" : ""}`}>
      <aside className={`sidebar${sidebarCollapsed ? " collapsed" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <KeyRound size={18} strokeWidth={2.5} />
          </div>
          <div className="sidebar-brand-text">
            <h1>ForgeKey</h1>
            <p>License Manager</p>
          </div>
          <button className="sidebar-collapse-btn" onClick={toggleSidebar} type="button" aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
            <CollapseIcon size={12} strokeWidth={2.5} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                className={`nav-link${currentPage === item.key ? " active" : ""}`}
                onClick={() => setCurrentPage(item.key)}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon size={18} strokeWidth={1.8} className="nav-icon" />
                <span>{item.label}</span>
                {item.key === "keys" && keyStats && keyStats.available > 0 && (
                  <span className="nav-badge">{keyStats.available}</span>
                )}
                {item.key === "verifications" && pendingVerificationsCount > 0 && (
                  <span className="nav-badge" style={{ background: "var(--color-warning)" }}>{pendingVerificationsCount}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          {admin && (
            <div className="sidebar-admin">
              <div className="sidebar-admin-avatar">{getInitials(admin.email)}</div>
              <div className="sidebar-admin-info">
                <div className="name">Admin</div>
                <div className="email">{admin.email}</div>
              </div>
            </div>
          )}
          <button className="nav-link" onClick={logout}>
            <LogOut size={18} strokeWidth={1.8} className="nav-icon" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="main-area">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-breadcrumb">
              <span>ForgeKey</span>
              <span>/</span>
              <span>{pageLabel}</span>
            </div>
          </div>
          <div className="topbar-right">
            <div className="topbar-status">
              <div className="topbar-status-dot" />
              <span>Connected</span>
            </div>
          </div>
        </div>
        <div className="page-content">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}
