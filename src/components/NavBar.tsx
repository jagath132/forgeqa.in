'use client';

import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore, getProviderLabel } from '../store/useAppStore';
import { ForgeQAIcon } from './ui/ForgeQALogo';
import { UserDropdown } from './UserDropdown';
import { UserProfile } from './UserProfile';
import { GlobalSearch } from './GlobalSearch';
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

const navBarTokens = {
  colors: {
    primary: 'var(--color-accent)',
    secondary: 'var(--color-cyan)',
    accent: 'var(--color-success)',
    highlight: 'var(--color-warning)',
    danger: 'var(--color-danger)',
    background: {
      primary: 'rgba(255, 255, 255, 0.95)',
      elevated: 'rgba(255, 255, 255, 0.98)',
      backdrop: 'var(--color-muted-soft)',
    },
    text: {
      primary: 'var(--color-text)',
      secondary: 'var(--color-text-secondary)',
      muted: 'var(--color-text-muted)',
    },
    border: {
      default: 'var(--color-border)',
      strong: 'var(--color-border-strong)',
      accent: 'var(--color-accent)',
    },
  },
  elevation: {
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
  },
  radius: {
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    xl: 'var(--radius-xl)',
    full: 'var(--radius-full)',
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

const NAV_ITEMS_BUILD: NavItem[] = [
  {
    key: 'dashboard',
    label: 'Command Center',
    path: '/dashboard',
    icon: <DashboardIcon3D size={18} />,
    color: 'violet',
  },
  {
    key: 'generator',
    label: 'Automation Studio',
    path: '/generator',
    icon: <GeneratorIcon3D size={18} />,
    color: 'rose',
  },
  {
    key: 'test-scripts',
    label: 'Execution Library',
    path: '/test-scripts',
    icon: <ScriptsIcon3D size={18} />,
    color: 'emerald',
  },
  {
    key: 'knowledge',
    label: 'Quality Knowledge Hub',
    path: '/knowledge',
    icon: <KnowledgeIcon3D size={18} />,
    color: 'cyan',
  },
];

const NAV_ITEMS_MONITOR: NavItem[] = [
  {
    key: 'regression',
    label: 'Regression Monitor',
    path: '/regression',
    icon: <ShieldIcon3D size={18} />,
    color: 'violet',
  },
  {
    key: 'analytics',
    label: 'Quality Insights',
    path: '/analytics',
    icon: <BarChartIcon3D size={18} />,
    color: 'amber',
  },
  {
    key: 'suites',
    label: 'Test Collections',
    path: '/suites',
    icon: <LayersIcon3D size={18} />,
    color: 'cyan',
  },
];

const NAV_ITEMS_SYSTEM: NavItem[] = [
  {
    key: 'settings',
    label: 'Workspace Settings',
    path: '/settings',
    icon: <SettingsIcon3D size={18} />,
    color: 'amber',
  },
];

const allNavItems = [...NAV_ITEMS_BUILD, ...NAV_ITEMS_MONITOR, ...NAV_ITEMS_SYSTEM];

function MobileNavButton() {
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const setSearchOpen = useAppStore((s) => s.setSearchOpen);

  return (
    <div className="flex items-center gap-1.5 md:hidden">
      <button
        onClick={() => setSidebarOpen(true)}
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-lg cursor-pointer"
        style={{
          background: 'transparent',
          border: 'none',
          color: navBarTokens.colors.text.secondary,
        }}
        title="Open navigation"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
      </button>
      <button
        onClick={() => setSearchOpen(true)}
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-lg cursor-pointer"
        style={{
          background: 'transparent',
          border: 'none',
          color: navBarTokens.colors.text.secondary,
        }}
        title="Open search"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </button>
    </div>
  );
}

function DesktopNavItem({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md cursor-pointer transition-all duration-200 whitespace-nowrap shrink-0"
      style={{
        background: active ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
        color: active ? navBarTokens.colors.primary : navBarTokens.colors.text.secondary,
        fontWeight: active ? 600 : 500,
        fontSize: '0.8125rem',
        border: 'none',
        fontFamily: 'inherit',
        borderLeft: active ? '3px solid var(--color-accent)' : '3px solid transparent',
        paddingLeft: active ? '0.5rem' : '0.625rem',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = navBarTokens.colors.background.backdrop;
          e.currentTarget.style.color = navBarTokens.colors.text.primary;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = navBarTokens.colors.text.secondary;
        }
      }}
    >
      <span
        style={{
          width: 16,
          height: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          opacity: active ? 1 : 0.6,
        }}
      >
        {item.icon}
      </span>
      <span>{item.label}</span>
    </button>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: '0.75rem 1.25rem',
        marginTop: '1.25rem',
        marginBottom: '0.5rem',
        position: 'relative',
      }}
    >
      <span
        style={{
          fontSize: '0.6875rem',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--color-text-muted)',
          whiteSpace: 'nowrap',
          position: 'relative',
          paddingLeft: '1.25rem',
          display: 'block',
        }}
      >
        {label}
      </span>
      <div
        style={{
          position: 'absolute',
          left: '1.25rem',
          top: '50%',
          width: '0.25rem',
          height: '0.25rem',
          background: 'var(--color-border)',
          borderRadius: '50%',
          transform: 'translateY(-50%)',
        }}
      />
    </div>
  );
}

function MobileNavItem({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  const getGradient = (color: NavColor) => {
    const gradients: Record<NavColor, string> = {
      violet: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
      rose: 'linear-gradient(135deg, #F31260, #E5484D)',
      emerald: 'linear-gradient(135deg, #10B981, #059669)',
      cyan: 'linear-gradient(135deg, #38BDF8, #0EA5E9)',
      amber: 'linear-gradient(135deg, #F59E0B, #D97706)',
    };
    return gradients[color];
  };

  const iconColor: Record<NavColor, string> = {
    violet: '#7C3AED',
    rose: '#F31260',
    emerald: '#10B981',
    cyan: '#38BDF8',
    amber: '#F59E0B',
  };

  return (
    <button
      onClick={onClick}
      type="button"
      className="w-full cursor-pointer"
      style={{
        padding: '0.875rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.875rem',
        borderRadius: '12px',
        border: 'none',
        fontFamily: 'inherit',
        fontSize: '0.9375rem',
        background: active ? getGradient(item.color) : 'transparent',
        boxShadow: active ? '0 4px 16px rgba(37, 99, 235, 0.15)' : 'none',
        textAlign: 'left',
        position: 'relative',
        overflow: 'hidden',
        color: active ? 'var(--color-surface)' : 'var(--color-text-secondary)',
        fontWeight: active ? '600' : '500',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        isolation: 'isolate',
      }}
    >
      {active && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: '3px',
            height: '20px',
            background: 'var(--gradient-primary)',
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
          color: active ? '#fff' : iconColor[item.color],
        }}
      >
        {item.icon}
      </span>
      <span>{item.label}</span>
    </button>
  );
}

function MobileNavDrawer({
  onClose,
  onNavigate,
  activeKey,
  user,
  onLogout,
  platformOk,
  providerLabel,
}: {
  onClose: () => void;
  onNavigate: (path: string) => void;
  activeKey: string;
  user: any;
  onLogout: () => void;
  platformOk: boolean;
  providerLabel: string;
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-30 md:hidden"
        style={{ background: 'rgba(30, 41, 59, 0.3)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      <aside className="fixed top-16 left-0 bottom-0 z-30 flex flex-col" style={{ width: 280 }}>
        <div
          className="flex flex-col h-full overflow-hidden"
          style={{
            background: 'var(--color-surface)',
            borderRadius: '0 24px 0 0',
            border: '1px solid var(--color-border)',
            borderLeft: 'none',
            borderBottom: 'none',
            boxShadow: '0 4px 32px rgba(30, 41, 59, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 12px 0' }}>
            <button
              onClick={onClose}
              type="button"
              aria-label="Close navigation"
              style={{
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                background: 'transparent',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
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
          <nav style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
            <SectionHeader label="Build Workspace" />
            <div>
              {NAV_ITEMS_BUILD.map((item) => (
                <MobileNavItem
                  key={item.key}
                  item={item}
                  active={activeKey === item.key}
                  onClick={() => onNavigate(item.path)}
                />
              ))}
            </div>
            <SectionHeader label="Quality Insights" />
            <div>
              {NAV_ITEMS_MONITOR.map((item) => (
                <MobileNavItem
                  key={item.key}
                  item={item}
                  active={activeKey === item.key}
                  onClick={() => onNavigate(item.path)}
                />
              ))}
            </div>
            <SectionHeader label="Configuration" />
            <div>
              {NAV_ITEMS_SYSTEM.map((item) => (
                <MobileNavItem
                  key={item.key}
                  item={item}
                  active={activeKey === item.key}
                  onClick={() => onNavigate(item.path)}
                />
              ))}
            </div>
          </nav>
          {user && <UserProfile user={user} onRequestLogout={onLogout} />}
        </div>
      </aside>
    </>
  );
}

export function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppStore((s) => s.user);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const setSearchOpen = useAppStore((s) => s.setSearchOpen);
  const provider = useAppStore((s) => s.provider);
  const savedProviderKeys = useAppStore((s) => s.savedProviderKeys);
  const openConfirm = useAppStore((s) => s.openConfirm);
  const logout = useAppStore((s) => s.logout);

  const activeKey = allNavItems.find((i) => location.pathname === i.path)?.key ?? 'dashboard';
  const hasSavedApiKeyForProvider = provider ? !!savedProviderKeys[provider] : false;
  const platformOk = hasSavedApiKeyForProvider;
  const selectedProviderLabel = getProviderLabel(provider);

  function navigateToPage(path: string) {
    navigate(path);
    setSidebarOpen(false);
  }

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

  return (
    <>
      <GlobalSearch />

      <header
        className="sticky top-0 z-40 w-full"
        style={{
          height: 64,
          background: navBarTokens.colors.background.primary,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${navBarTokens.colors.border.default}`,
          boxShadow: navBarTokens.elevation.md,
        }}
      >
        <div className="flex items-center h-full px-3 md:px-4 gap-1.5">
          <MobileNavButton />

          <button
            onClick={() => navigate('/dashboard')}
            type="button"
            className="flex items-center gap-2 cursor-pointer shrink-0 mr-1"
            style={{
              padding: '6px 8px',
              borderRadius: navBarTokens.radius.md,
              background: 'transparent',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = navBarTokens.colors.background.backdrop;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <ForgeQAIcon size="sm" />
            <span
              className="hidden sm:block text-sm font-bold"
              style={{ color: navBarTokens.colors.text.primary }}
            >
              ForgeQA
            </span>
          </button>

          <div
            className="hidden md:flex items-center gap-0.5 flex-1 overflow-x-auto min-w-0 mx-1 nav-scrollbar"
            style={{ paddingBottom: '4px' }}
          >
            {allNavItems.map((item) => (
              <DesktopNavItem
                key={item.key}
                item={item}
                active={activeKey === item.key}
                onClick={() => navigateToPage(item.path)}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setSearchOpen(true)}
              type="button"
              className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg cursor-pointer transition-all duration-200"
              style={{
                background: 'transparent',
                border: 'none',
                color: navBarTokens.colors.text.secondary,
              }}
              title="Search (⌘K)"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = navBarTokens.colors.background.backdrop;
                e.currentTarget.style.color = navBarTokens.colors.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = navBarTokens.colors.text.secondary;
              }}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>

            <UserDropdown />
          </div>
        </div>
      </header>

      {sidebarOpen && (
        <MobileNavDrawer
          onClose={() => setSidebarOpen(false)}
          onNavigate={navigateToPage}
          activeKey={activeKey}
          user={user}
          onLogout={handleLogout}
          platformOk={platformOk}
          providerLabel={selectedProviderLabel}
        />
      )}
    </>
  );
}
