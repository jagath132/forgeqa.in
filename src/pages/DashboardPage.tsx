import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckSquare,
  FileText,
  History,
  Cpu,
  Sparkles,
  BookOpen,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { useAppStore, getProviderLabel } from '../store/useAppStore';
import { Card } from '../components/ui/Card';
import { MobilePageHeader } from '../components/PageHeader';
import { FeatureIcon3D } from '../components/ui/Icons3D';
import { WelcomePopup } from '../components/WelcomePopup';

function DashboardMetric({
  label,
  value,
  sublabel,
  icon: Icon,
  color,
  bg,
  border,
}: {
  label: string;
  value: number | string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
}) {
  return (
    <div
      className={`p-3.5 rounded-xl bg-white border ${border} shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between min-w-0 overflow-hidden`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className={`w-7 h-7 rounded-lg ${bg} ${color} flex items-center justify-center shrink-0`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
          {label}
        </span>
      </div>
      <div className="mt-2.5 min-w-0">
        <div
          className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight truncate"
          style={{ fontFamily: 'var(--font-display)' }}
          title={String(value)}
        >
          {value}
        </div>
        <div className="text-[11px] font-medium text-slate-400 truncate mt-0.5">
          {sublabel}
        </div>
      </div>
    </div>
  );
}

function DashboardCheck({ label, complete }: { label: string; complete: boolean }) {
  return (
    <div
      className="flex items-center justify-between rounded-xl px-4 py-3.5"
      style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}
    >
      <div className="flex items-center gap-3">
        <div
          className="h-5 w-5 rounded-full flex items-center justify-center"
          style={{
            background: complete ? 'var(--success)' : 'var(--accent-amber-soft)',
            border: `1.5px solid ${complete ? 'var(--success)' : 'var(--border-default)'}`,
          }}
        >
          {complete ? (
            <svg
              className="h-3 w-3"
              style={{ color: 'var(--color-surface)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          ) : (
            <svg
              className="h-3 w-3"
              style={{ color: 'var(--accent-amber)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </div>
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {label}
        </span>
      </div>
      <span className={`badge ${complete ? 'badge-success' : 'badge-warning'}`}>
        {complete ? 'Ready' : 'Pending'}
      </span>
    </div>
  );
}

function formatHistoryTime(dateStr: string) {
  try {
    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const history = useAppStore((s) => s.history);
  const qaResult = useAppStore((s) => s.qaResult);
  const provider = useAppStore((s) => s.provider);
  const savedProviderKeys = useAppStore((s) => s.savedProviderKeys);
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const [showWelcome, setShowWelcome] = useState(
    searchParams.get('welcome') === 'true' || (user !== null && !user.has_seen_welcome)
  );

  const providerLabel = getProviderLabel(provider);
  const hasConfiguredApiKey = provider ? !!savedProviderKeys[provider] : false;
  const lastRun = history[0];
  const testCaseCount = qaResult?.testCases.length ?? 0;
  const contextCount = qaResult?.knowledgeContext?.length ?? 0;

  const handleWelcomeDismiss = () => {
    setShowWelcome(false);
    setSearchParams({});
    if (user) {
      setUser({ ...user, has_seen_welcome: true });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <MobilePageHeader pageKey="dashboard" />
      {showWelcome && <WelcomePopup onDismiss={handleWelcomeDismiss} />}

      {/* Hero Card / Command Center */}
      <Card className="overflow-hidden !p-0 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
        <div className="grid lg:grid-cols-12 min-w-0">
          {/* Left Column: Command & Intent */}
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between min-w-0">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 mb-5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Enterprise QA Workspace</span>
              </div>
              <h1
                className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-[1.15] mb-2.5"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Ship with{' '}
                <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-emerald-500 bg-clip-text text-transparent">
                  confidence
                </span>
              </h1>
              <h2 className="text-base sm:text-lg font-semibold text-slate-700 mb-2 leading-snug">
                Turn requirements into test cases, scripts, and traceable QA output.
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xl">
                A focused command center for engineering and QA teams who need repeatable, automated
                test coverage without changing the working generation pipeline already in place.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-8">
              <button
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm hover:shadow transition-all cursor-pointer"
                onClick={() => navigate('/generator')}
                type="button"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start Test Case Generation</span>
              </button>
              <button
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-semibold shadow-xs transition-all cursor-pointer"
                onClick={() => navigate('/knowledge')}
                type="button"
              >
                <BookOpen className="w-4 h-4 text-slate-500" />
                <span>Manage Knowledge Base</span>
              </button>
            </div>
          </div>

          {/* Right Column: Active Run Telemetry HUD */}
          <div className="lg:col-span-5 p-6 sm:p-8 lg:p-9 border-t lg:border-t-0 lg:border-l border-slate-200/80 bg-slate-50/50 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between gap-3 mb-3.5 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
                    Active Run Telemetry
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold shrink-0 ${
                    hasConfiguredApiKey
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {hasConfiguredApiKey ? 'AI Ready' : 'Key Needed'}
                </span>
              </div>

              {/* Active Matrix Summary Box */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs mb-3.5 min-w-0">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1.5 min-w-0">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5 shrink-0">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    Active Matrix
                  </span>
                  {qaResult && (
                    <span className="text-[11px] font-medium text-slate-400 shrink-0">
                      {testCaseCount} {testCaseCount === 1 ? 'case' : 'cases'}
                    </span>
                  )}
                </div>
                <p
                  className="text-xs sm:text-[13px] font-medium text-slate-800 line-clamp-2 leading-relaxed break-words"
                  title={qaResult?.summary ?? 'No active matrix'}
                >
                  {qaResult?.summary ??
                    'No active matrix — start test case generation to populate telemetry.'}
                </p>
              </div>

              {/* 2x2 Telemetry Grid */}
              <div className="grid grid-cols-2 gap-3 min-w-0 w-full">
                <DashboardMetric
                  label="Test Cases"
                  value={testCaseCount}
                  sublabel="Generated matrix"
                  icon={CheckSquare}
                  color="text-indigo-600"
                  bg="bg-indigo-50"
                  border="border-indigo-100/80"
                />
                <DashboardMetric
                  label="Context Files"
                  value={contextCount}
                  sublabel="RAG knowledge"
                  icon={FileText}
                  color="text-cyan-600"
                  bg="bg-cyan-50"
                  border="border-cyan-100/80"
                />
                <DashboardMetric
                  label="History Runs"
                  value={history.length}
                  sublabel="Total executed"
                  icon={History}
                  color="text-violet-600"
                  bg="bg-violet-50"
                  border="border-violet-100/80"
                />
                <DashboardMetric
                  label="AI Provider"
                  value={providerLabel}
                  sublabel="Active engine"
                  icon={Cpu}
                  color="text-emerald-600"
                  bg="bg-emerald-50"
                  border="border-emerald-100/80"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Feature Cards */}
      <section className="grid gap-5 lg:grid-cols-3">
        {[
          {
            title: 'Test Case Generation',
            description:
              'Create positive, negative, edge, and validation cases from requirement text.',
            action: 'Open Generator',
            path: '/generator',
            color: 'var(--accent-rose)',
            soft: 'var(--accent-rose-soft)',
            iconType: 'sparkle' as const,
            tagline: 'Build Better. Test Smarter.',
          },
          {
            title: 'Automation Scripts',
            description:
              'Convert selected test cases into executable Playwright, Cypress, or Selenium code.',
            action: 'Open Automation',
            path: '/test-scripts',
            color: 'var(--accent-emerald)',
            soft: 'var(--accent-emerald-soft)',
            iconType: 'code' as const,
            tagline: 'Automate Every Critical Path.',
          },
          {
            title: 'AI Configuration',
            description: 'Select the model route and manage encrypted provider credentials.',
            action: 'Open Settings',
            path: '/ai-settings',
            color: 'var(--accent-amber)',
            soft: 'var(--accent-amber-soft)',
            iconType: 'ai' as const,
            tagline: 'Precision Engineering.',
          },
        ].map((item) => (
          <Card
            key={item.title}
            className="flex flex-col justify-between min-h-[220px] gradient-border card-3d"
            style={{ borderColor: 'transparent' }}
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="card-3d-icon flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: item.soft, color: item.color }}
                >
                  <FeatureIcon3D size={22} type={item.iconType} />
                </div>
                <div>
                  <h3
                    className="text-base font-bold"
                    style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
                  >
                    {item.title}
                  </h3>
                  <p className="text-[11px] font-semibold mt-0.5" style={{ color: item.color }}>
                    {item.tagline}
                  </p>
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {item.description}
              </p>
            </div>
            <button
              className="w-fit px-4 py-2 text-xs mt-5 card-3d"
              style={{
                background: item.soft,
                color: item.color,
                border: `1px solid color-mix(in srgb, ${item.color} 18%, var(--border-default))`,
                borderRadius: 'var(--radius-lg)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => navigate(item.path)}
              type="button"
            >
              <span className="flex items-center gap-1.5">
                {item.action}
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </span>
            </button>
          </Card>
        ))}
      </section>

      {/* Bottom Grid */}
      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--accent-soft)' }}
            >
              <svg
                className="h-4 w-4"
                style={{ color: 'var(--accent)' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3
                className="text-base font-bold"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
              >
                Readiness Checklist
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Ensure everything is configured.
              </p>
            </div>
          </div>
          <div className="space-y-2.5">
            <DashboardCheck label="AI provider selected" complete={!!provider} />
            <DashboardCheck label="API key available" complete={hasConfiguredApiKey} />
            <DashboardCheck label="Generated test cases available" complete={testCaseCount > 0} />
            <DashboardCheck label="Automation source selected" complete={testCaseCount > 0} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--accent-violet-soft)' }}
              >
                <svg
                  className="h-4 w-4"
                  style={{ color: 'var(--accent-violet)' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3
                  className="text-base font-bold"
                  style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
                >
                  Recent Generation
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Latest saved matrix from history.
                </p>
              </div>
            </div>
            <button
              className="btn-ghost px-4 py-2 text-xs font-semibold"
              onClick={() => navigate('/generator')}
              type="button"
            >
              View History
            </button>
          </div>
          {lastRun ? (
            <div
              className="p-4 rounded-xl"
              style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}
            >
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {lastRun.result.summary}
              </p>
              <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                {lastRun.requirement}
              </p>
              <div
                className="flex gap-2 mt-3 text-xs font-medium"
                style={{ color: 'var(--text-muted)' }}
              >
                <span className="badge badge-primary">{lastRun.result.testCases.length} cases</span>
                <span className="badge badge-violet">{formatHistoryTime(lastRun.timestamp)}</span>
              </div>
            </div>
          ) : (
            <div
              className="mt-2 p-10 text-center rounded-xl"
              style={{
                background: 'var(--bg-tertiary)',
                border: '1.5px dashed var(--border-default)',
              }}
            >
              <div
                className="h-12 w-12 mx-auto rounded-xl flex items-center justify-center mb-3"
                style={{ background: 'var(--accent-soft)' }}
              >
                <svg
                  className="h-6 w-6"
                  style={{ color: 'var(--accent)' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                No generation history yet
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Great software starts with great testing.
              </p>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
