import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore, getProviderLabel } from '../store/useAppStore';
import { Card } from '../components/ui/Card';
import { MobilePageHeader } from '../components/PageHeader';
import { FeatureIcon3D } from '../components/ui/Icons3D';
import { WelcomePopup } from '../components/WelcomePopup';

const metricColors = [
  {
    accent: 'var(--color-accent)',
    soft: 'var(--color-accent-soft)',
    border: 'color-mix(in srgb, var(--color-accent) 12%, var(--color-border))',
    icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128H5.228A2 2 0 015 17.119V5a2 2 0 012-2h6',
  },
  {
    accent: 'var(--color-cyan)',
    soft: 'var(--color-cyan-soft)',
    border: 'color-mix(in srgb, var(--color-cyan) 12%, var(--color-border))',
    icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
  },
  {
    accent: 'var(--color-violet)',
    soft: 'var(--color-violet-soft)',
    border: 'color-mix(in srgb, var(--color-violet) 12%, var(--color-border))',
    icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    accent: 'var(--color-success)',
    soft: 'var(--color-success-soft)',
    border: 'color-mix(in srgb, var(--color-success) 12%, var(--color-border))',
    icon: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z',
  },
];

function DashboardMetric({
  label,
  value,
  compact = false,
  index = 0,
}: {
  label: string;
  value: number | string;
  compact?: boolean;
  index?: number;
}) {
  const c = metricColors[index % metricColors.length];
  return (
    <div
      className="rounded-xl p-4 transition-all duration-200"
      style={{ background: c.soft, border: `1px solid ${c.border}` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center"
          style={{ background: `color-mix(in srgb, ${c.accent} 10%, transparent)` }}
        >
          <svg
            className="h-4 w-4"
            style={{ color: c.accent }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d={c.icon} />
          </svg>
        </div>
        <p
          className="text-[11px] font-bold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </p>
      </div>
      <p
        className={`font-bold ${compact ? 'text-base truncate' : 'text-2xl'}`}
        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
      >
        {value}
      </p>
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
  const [showWelcome, setShowWelcome] = useState(searchParams.get('welcome') === 'true');

  const providerLabel = getProviderLabel(provider);
  const hasConfiguredApiKey = provider ? !!savedProviderKeys[provider] : false;
  const lastRun = history[0];
  const testCaseCount = qaResult?.testCases.length ?? 0;
  const contextCount = qaResult?.knowledgeContext?.length ?? 0;

  const handleWelcomeDismiss = () => {
    setShowWelcome(false);
    setSearchParams({});
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <MobilePageHeader pageKey="dashboard" />
      {showWelcome && <WelcomePopup onDismiss={handleWelcomeDismiss} />}

      {/* Hero Card */}
      <Card className="overflow-hidden !p-0 card-highlight">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
          <div className="p-6 sm:p-8 lg:p-10">
            <span className="badge badge-primary">
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
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Enterprise QA Workspace
            </span>
            <h1
              className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-5 mb-2"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--text-primary)',
                lineHeight: 1.1,
              }}
            >
              Ship with <span className="gradient-shift">confidence</span>
            </h1>
            <h2
              className="text-lg sm:text-xl font-semibold tracking-tight mb-3"
              style={{ color: 'var(--text-secondary)' }}
            >
              Turn requirements into test cases, scripts, and traceable QA output.
            </h2>
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'var(--text-muted)', maxWidth: 480 }}
            >
              A focused command center for product teams who need repeatable QA coverage without
              changing the working generation pipeline already in place.
            </p>
            <div className="flex flex-wrap gap-3 mt-7">
              <button
                className="btn-primary px-6 py-2.5 text-sm"
                onClick={() => navigate('/generator')}
                type="button"
              >
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Start Test Case Generation
                </span>
              </button>
              <button
                className="btn-secondary px-6 py-2.5 text-sm"
                onClick={() => navigate('/knowledge')}
                type="button"
              >
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                    />
                  </svg>
                  Manage Knowledge Base
                </span>
              </button>
            </div>
          </div>

          <div
            className="p-6 sm:p-8 lg:p-10 border-t lg:border-t-0 lg:border-l"
            style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-default)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Active Run
                </p>
                <p
                  className="text-lg font-bold mt-1 truncate"
                  style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
                >
                  {qaResult?.summary ?? 'No active matrix'}
                </p>
              </div>
              <span className={`badge ${hasConfiguredApiKey ? 'badge-success' : 'badge-warning'}`}>
                {hasConfiguredApiKey ? 'AI Ready' : 'Key Needed'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <DashboardMetric label="Test Cases" value={testCaseCount} index={0} />
              <DashboardMetric label="Context Files" value={contextCount} index={1} />
              <DashboardMetric label="History Runs" value={history.length} index={2} />
              <DashboardMetric label="Provider" value={providerLabel} compact index={3} />
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
