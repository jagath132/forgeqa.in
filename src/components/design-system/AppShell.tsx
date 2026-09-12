import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import {
  LayoutGrid,
  PlugZap,
  Settings,
  Search,
  Bell,
  ChevronDown,
  Sparkles,
  FileCode2,
  BookOpen,
  FileText,
  LogOut,
  Menu,
  X,
  Plus,
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [toolsExpanded, setToolsExpanded] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  // Primary Figma Nav Menu
  const primaryNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutGrid },
    { label: 'Integrations', path: '/settings?tab=integrations', icon: PlugZap },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  // AI & Studio Tools (Preserves all existing ForgeQA capabilities)
  const secondaryStudioItems = [
    { label: 'AI Test Matrix', path: '/generator', icon: Sparkles, badge: 'AI' },
    { label: 'Automation Studio', path: '/test-scripts', icon: FileCode2 },
    { label: 'PRD Generator', path: '/prd-generator', icon: FileText },
    { label: 'Knowledge Base', path: '/knowledge', icon: BookOpen },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/generator?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-[#0F172A] font-['Instrument_Sans',sans-serif]">
      {/* Figma Navigation items */}
      <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {primaryNavItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path.startsWith('/settings') &&
              location.pathname.startsWith('/settings') &&
              item.label === 'Settings');
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#EEF2FF] text-[#4F46E5] font-semibold'
                  : 'text-[#0F172A] hover:bg-[#F8FAFC]'
              }`}
            >
              <Icon
                className={`w-[18px] h-[18px] shrink-0 ${
                  isActive ? 'text-[#4F46E5]' : 'text-[#64748B]'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}

        {/* AI & Studio Tools Toggle */}
        <div className="pt-5 mt-4 border-t border-[#E2E8F0]">
          <button
            type="button"
            onClick={() => setToolsExpanded(!toolsExpanded)}
            className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            <span>Studio Tools</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${toolsExpanded ? 'rotate-180' : ''}`}
            />
          </button>

          <div className={`mt-1.5 space-y-1 ${toolsExpanded ? 'block' : 'block'}`}>
            {secondaryStudioItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-[#EEF2FF] text-[#4F46E5] font-semibold'
                      : 'text-[#475569] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#4F46E5]' : 'text-[#64748B]'}`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Create Action in Sidebar bottom */}
      <div className="p-4 border-t border-[#E2E8F0] space-y-2">
        <button
          type="button"
          onClick={() => navigate('/generator')}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New AI Test Matrix</span>
        </button>

        <div className="flex items-center gap-1.5 pt-2 text-xs text-[#64748B]">
          <span className="w-2 h-2 rounded-full bg-[#10B981]" />
          <span>ForgeQA v2.4</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9FC] text-[#0F172A] font-['Instrument_Sans',sans-serif]">
      {/* ── Figma Topbar (64px) ── */}
      <header className="h-16 w-full bg-white border-b border-[#E2E8F0] px-4 sm:px-6 flex items-center justify-between shrink-0 z-30">
        {/* Brand Section */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-lg text-[#64748B] hover:bg-[#F1F5F9]"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#4F46E5] rounded-[6px] flex items-center justify-center text-white shadow-sm shrink-0">
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                <path
                  d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"
                  strokeWidth="1"
                />
              </svg>
            </div>
            <span className="font-['Instrument_Sans',sans-serif] font-bold text-lg text-[#0F172A] tracking-tight">
              ForgeQA
            </span>
          </Link>
        </div>

        {/* Search Bar (400px width in Figma) */}
        <div className="hidden sm:flex flex-1 max-w-[400px] mx-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <div className="flex items-center h-9 w-full bg-[#F1F5F9] rounded-lg px-3 gap-2 text-[#64748B] focus-within:ring-2 focus-within:ring-[#4F46E5]/20 focus-within:bg-white transition-all border border-transparent focus-within:border-[#E2E8F0]">
              <Search className="w-4 h-4 shrink-0 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search test suites, runs, defects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-[13px] text-[#0F172A] placeholder-[#64748B] w-full"
              />
            </div>
          </form>
        </div>

        {/* Topbar Actions (Notifications + User Profile) */}
        <div className="flex items-center gap-4">
          {/* Notification Bell with Red Dot */}
          <button
            type="button"
            className="relative w-8 h-8 rounded-lg flex items-center justify-center text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-white" />
          </button>

          {/* Vertical Separator */}
          <div className="h-5 w-[1px] bg-[#E2E8F0]" />

          {/* User Profile */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-[#F1F5F9] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#4F46E5] text-white font-semibold text-[13px] flex items-center justify-center shrink-0">
                {user?.name
                  ? user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()
                  : 'SJ'}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-[13px] font-semibold text-[#0F172A] leading-tight">
                  {user?.name || 'Sarah Jenkins'}
                </span>
                <span className="text-[11px] text-[#64748B] leading-tight">
                  {user?.role || 'QA Lead'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#0F172A] shrink-0" />
            </button>

            {/* Profile Dropdown */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-[#E2E8F0] rounded-xl shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-[#E2E8F0]">
                  <p className="text-xs font-semibold text-[#0F172A]">
                    {user?.name || 'Sarah Jenkins'}
                  </p>
                  <p className="text-[11px] text-[#64748B] truncate">
                    {user?.email || 'sarah.jenkins@forgeqa.in'}
                  </p>
                </div>
                <Link
                  to="/settings"
                  className="flex items-center gap-2 px-4 py-2 text-xs text-[#0F172A] hover:bg-[#F8FAFC]"
                >
                  <Settings className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>Account Settings</span>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-2 w-full px-4 py-2 text-xs text-[#EF4444] hover:bg-[#FEF2F2]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Figma Shell Body: 240px Sidebar + Main Content ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar (240px width in Figma) */}
        <aside className="hidden md:block w-60 shrink-0 border-r border-[#E2E8F0] bg-white h-[calc(100vh-64px)] overflow-y-auto">
          {sidebarContent}
        </aside>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative flex flex-col w-64 max-w-[85vw] h-full bg-white shadow-2xl z-10">
              <div className="h-16 flex items-center justify-between px-4 border-b border-[#E2E8F0]">
                <span className="font-bold text-base text-[#0F172A]">Menu</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded text-[#64748B] hover:bg-[#F1F5F9]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">{sidebarContent}</div>
            </div>
          </div>
        )}

        {/* Main Canvas Scroll Area (Background #F7F9FC) */}
        <main className="flex-1 overflow-y-auto bg-[#F7F9FC] p-4 sm:p-6 lg:p-8 min-w-0">
          <div className="max-w-[1360px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
