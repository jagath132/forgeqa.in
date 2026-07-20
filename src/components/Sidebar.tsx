import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore, getProviderLabel } from '../store/useAppStore';
import { UserProfile } from './UserProfile';
import {
  DashboardIcon3D,
  GeneratorIcon3D,
  ScriptsIcon3D,
  KnowledgeIcon3D,
  SettingsIcon3D,
  ShieldIcon3D,
  BarChartIcon3D,
  LayersIcon3D,
} from './ui/Icons3D';

/**
 * Nav button design tokens
 * --nav-accent-primary: Main navigation accent color
 * --nav-accent-secondary: Secondary accent for hover states
 * --nav-text: Primary text color
 * --nav-text-muted: Muted text color
 * --nav-bg-hover: Background color for hover states
 * --nav-border-focus: Focus ring border color
 */
const navTokens = {
  accent: {
    violet: '#7C3AED',
    rose: '#F31260',
    emerald: '#10B981',
    cyan: '#38BDF8',
    amber: '#F59E0B',
  },
  text: {
    primary: '#1E293B',
    secondary: '#64748B',
    muted: '#94A3B8',
  },
  bg: {
    hover: 'rgba(37, 99, 235, 0.04)',
    active: {},
  },
};

type NavColor = 'violet' | 'rose' | 'emerald' | 'cyan' | 'amber';

interface NavItem {
  key: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  color: NavColor;
}

/**
 * Original ForgeQA menu items preserved for enterprise QA software
 * Menu titles are NOT modified per requirements
 */
const NAV_ITEMS_BUILD: NavItem[] = [
  {
    key: 'dashboard',
    label: 'Command Center',
    path: '/dashboard',
    icon: <DashboardIcon3D size={20} />,
    color: 'violet',
  },
  {
    key: 'generator',
    label: 'Automation Studio',
    path: '/generator',
    icon: <GeneratorIcon3D size={20} />,
    color: 'rose',
  },
  {
    key: 'test-scripts',
    label: 'Execution Library',
    path: '/test-scripts',
    icon: <ScriptsIcon3D size={20} />,
    color: 'emerald',
  },
  {
    key: 'knowledge',
    label: 'Quality Knowledge Hub',
    path: '/knowledge',
    icon: <KnowledgeIcon3D size={20} />,
    color: 'cyan',
  },
];

const NAV_ITEMS_MONITOR: NavItem[] = [
  {
    key: 'regression',
    label: 'Regression Monitor',
    path: '/regression',
    icon: <ShieldIcon3D size={20} />,
    color: 'violet',
  },
  {
    key: 'analytics',
    label: 'Quality Insights',
    path: '/analytics',
    icon: <BarChartIcon3D size={20} />,
    color: 'amber',
  },
  {
    key: 'suites',
    label: 'Test Collections',
    path: '/suites',
    icon: <LayersIcon3D size={20} />,
    color: 'cyan',
  },
];

const NAV_ITEMS_SYSTEM: NavItem[] = [
  {
    key: 'settings',
    label: 'Workspace Settings',
    path: '/settings',
    icon: <SettingsIcon3D size={20} />,
    color: 'amber',
  },
  {
    key: 'admin',
    label: 'License & Admin Manager',
    path: '/admin',
    icon: <ShieldIcon3D size={20} />,
    color: 'violet',
  },
];

function NavButton({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  const getGradient = (color: NavColor) => {
    const gradients = {
      violet: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
      rose: 'linear-gradient(135deg, #F31260, #E5484D)',
      emerald: 'linear-gradient(135deg, #10B981, #059669)',
      cyan: 'linear-gradient(135deg, #38BDF8, #0EA5E9)',
      amber: 'linear-gradient(135deg, #F59E0B, #D97706)',
    };
    return gradients[color];
  };

  return (
    <button
      onClick={onClick}
      type="button"
      className="enterprise-nav-item"
      style={{
        padding: '0.875rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.875rem',
        borderRadius: '12px',
        border: 'none',
        background: active ? getGradient(item.color) : 'transparent',
        boxShadow: active
          ? '0 4px 16px rgba(37, 99, 235, 0.15), 0 0 0 1px rgba(37, 99, 235, 0.1)'
          : 'none',
        transform: active ? 'translateY(-1px)' : 'none',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        position: 'relative',
        overflow: 'hidden',
        color: active ? '#ffffff' : '#64748B',
        fontWeight: active ? '600' : '500',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        isolation: 'isolate',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = navTokens.bg.hover;
          e.currentTarget.style.color = navTokens.text.primary;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = navTokens.text.secondary;
        }
      }}
    >
      {/* Left accent indicator */}
      {active && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: '3px',
            height: '20px',
            background: 'linear-gradient(180deg, #60A5FA, #2563EB)',
            borderRadius: '0 2px 2px 0',
          }}
        />
      )}

      <span
        style={{
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: active
            ? '#fff'
            : item.color === 'violet'
              ? navTokens.accent.violet
              : item.color === 'rose'
                ? navTokens.accent.rose
                : item.color === 'emerald'
                  ? navTokens.accent.emerald
                  : item.color === 'cyan'
                    ? navTokens.accent.cyan
                    : navTokens.accent.amber,
          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), color 0.25s',
        }}
      >
        {item.icon}
      </span>
      <span
        style={{
          fontSize: '0.9375rem',
          fontWeight: active ? '600' : '500',
          color: active ? '#fff' : 'inherit',
          whiteSpace: 'nowrap',
          transition: 'color 0.25s',
        }}
      >
        {item.label}
      </span>
    </button>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div
      className="sidebar-section-header"
      style={{
        padding: '0.75rem 1.25rem',
        marginTop: '1.25rem',
        marginBottom: '0.5rem',
        position: 'relative',
      }}
    >
      <span
        className="sidebar-section-label"
        style={{
          fontSize: '0.6875rem',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#94A3B8',
          whiteSpace: 'nowrap',
          position: 'relative',
          paddingLeft: '1.25rem',
        }}
      >
        {label}
      </span>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: '50%',
          width: '0.25rem',
          height: '0.25rem',
          background: '#E2E8F0',
          borderRadius: '50%',
          transform: 'translateY(-50%)',
        }}
      ></div>
    </div>
  );
}

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const user = useAppStore((s) => s.user);
  const provider = useAppStore((s) => s.provider);
  const savedProviderKeys = useAppStore((s) => s.savedProviderKeys);
  const openConfirm = useAppStore((s) => s.openConfirm);
  const logout = useAppStore((s) => s.logout);

  const allNavItems = [...NAV_ITEMS_BUILD, ...NAV_ITEMS_MONITOR, ...NAV_ITEMS_SYSTEM];
  const activeKey =
    allNavItems.find((i) => location.pathname === i.path)?.key ??
    location.pathname.split('/')[1] ??
    'dashboard';
  const hasSavedApiKeyForProvider = provider ? !!savedProviderKeys[provider] : false;

  function navigateToPage(path: string) {
    navigate(path);
    setSidebarOpen(false);
  }

  const selectedProviderLabel = getProviderLabel(provider);

  function handleLogout() {
    openConfirm(
      'Sign Out',
      'Are you sure you want to sign out?',
      () => {
        logout();
        navigate('/');
      },
      'Sign Out'
    );
  }

  const platformOk = hasSavedApiKeyForProvider;

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 lg:hidden"
          style={{ background: 'rgba(30, 41, 59, 0.3)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 lg:top-16 left-0 z-30 flex flex-col h-screen lg:h-full shrink-0 transition-all duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: 280, padding: '12px 8px 12px 12px' }}
      >
        <div
          className="flex flex-col h-full overflow-hidden"
          style={{
            background: '#fff',
            borderRadius: '24px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 32px rgba(30, 41, 59, 0.04), 0 2px 8px rgba(30, 41, 59, 0.02)',
          }}
        >
          {/* Brand Header */}
          <div
            className="flex items-center justify-between shrink-0"
            style={{ padding: '20px 16px 16px' }}
          >
            <button
              onClick={() => navigate('/dashboard')}
              type="button"
              className="cursor-pointer flex items-center gap-3"
              style={{ background: 'none', border: 'none', padding: 0 }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  background: 'linear-gradient(135deg, #2563EB, #38BDF8)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path
                    d="M12 2l8 3v7c0 4-3.5 7.5-8 9-4.5-1.5-8-5-8-9V5l8-3z"
                    fill="rgba(255,255,255,0.2)"
                  />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <div style={{ marginLeft: '0.5rem' }}>
                <h1
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.125rem',
                    fontWeight: '800',
                    color: '#1E293B',
                    letterSpacing: '-0.02em',
                    margin: 0,
                  }}
                >
                  ForgeQA
                </h1>
                <p
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: '600',
                    color: '#64748B',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    margin: 0,
                    marginTop: '0.125rem',
                  }}
                >
                  Enterprise Quality Engineering
                </p>
              </div>
            </button>
            <button
              className="flex lg:hidden h-8 w-8 items-center justify-center rounded-lg btn-ghost"
              onClick={() => setSidebarOpen(false)}
              type="button"
              aria-label="Close sidebar"
              style={{
                background: 'transparent',
                border: '1px solid var(--border-default)',
                color: 'var(--text-muted)',
              }}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: '0 8px 8px' }}>
            {/* Build Workspace section */}
            <SectionHeader label="Build Workspace" />
            <div className="space-y-0.5" style={{ paddingBottom: 4 }}>
              {NAV_ITEMS_BUILD.map((item) => (
                <NavButton
                  key={item.key}
                  item={item}
                  active={activeKey === item.key}
                  onClick={() => navigateToPage(item.path)}
                />
              ))}
            </div>

            {/* Quality Insights section */}
            <SectionHeader label="Quality Insights" />
            <div className="space-y-0.5" style={{ paddingBottom: 4 }}>
              {NAV_ITEMS_MONITOR.map((item) => (
                <NavButton
                  key={item.key}
                  item={item}
                  active={activeKey === item.key}
                  onClick={() => navigateToPage(item.path)}
                />
              ))}
            </div>

            {/* Configuration section */}
            <SectionHeader label="Configuration" />
            <div className="space-y-0.5">
              {NAV_ITEMS_SYSTEM.map((item) => (
                <NavButton
                  key={item.key}
                  item={item}
                  active={activeKey === item.key}
                  onClick={() => navigateToPage(item.path)}
                />
              ))}
            </div>
          </nav>

          {/* Platform Health Card */}
          <div className="shrink-0" style={{ padding: '4px 12px 4px' }}>
            <div
              className={`platform-card ${platformOk ? 'platform-card-ok' : 'platform-card-warn'}`}
              style={{
                borderRadius: 'var(--radius-xl)',
                padding: '0.875rem',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                className="platform-card-header"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                }}
              >
                <div
                  className="platform-card-dot"
                  style={{
                    width: '8px',
                    height: '8px',
                    position: 'relative',
                  }}
                >
                  <span
                    className={`platform-card-dot-pulse ${platformOk ? 'opacity-40' : 'opacity-30'}`}
                    style={{
                      background: platformOk ? '#10B981' : '#F59E0B',
                      borderRadius: '50%',
                      animation: 'platform-pulse 2s ease-in-out infinite',
                      position: 'absolute',
                      inset: '0',
                    }}
                  />
                  <span
                    className="platform-card-dot-core"
                    style={{
                      background: platformOk ? '#10B981' : '#F59E0B',
                      borderRadius: '50%',
                      width: '100%',
                      height: '100%',
                      position: 'relative',
                    }}
                  />
                </div>
                <span
                  className="platform-card-title"
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: platformOk ? '#10B981' : '#F59E0B',
                  }}
                >
                  Platform Health
                </span>
              </div>
              <div
                className="platform-card-status"
                style={{
                  color: '#1E293B',
                  fontSize: '0.8125rem',
                  fontWeight: '700',
                }}
              >
                {platformOk ? 'System Ready' : 'Attention Required'}
              </div>
              <div
                className="platform-card-sub"
                style={{
                  color: '#64748B',
                  fontSize: '0.6875rem',
                  fontWeight: '500',
                  marginTop: '0.125rem',
                }}
              >
                {platformOk
                  ? `${selectedProviderLabel} · All services operational`
                  : 'No API key configured. Open Settings to configure.'}
              </div>
              {platformOk && (
                <div
                  className="platform-card-progress"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginTop: '0.5rem',
                  }}
                >
                  <div
                    className="platform-card-bar"
                    style={{
                      flex: 1,
                      height: '3px',
                      borderRadius: '999px',
                      background: '#E2E8F0',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      className="platform-card-bar-fill ok"
                      style={{
                        height: '100%',
                        borderRadius: '999px',
                        background: 'linear-gradient(90deg, #10B981, #38BDF8)',
                        width: '96%',
                        transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    />
                  </div>
                  <span
                    className="platform-card-pct"
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: '700',
                      color: '#94A3B8',
                      minWidth: '2rem',
                      textAlign: 'right',
                    }}
                  >
                    96%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* User Profile */}
          {user && <UserProfile user={user} onRequestLogout={handleLogout} />}
        </div>
      </aside>
    </>
  );
}
