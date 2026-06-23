import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppStore, getProviderLabel } from "../store/useAppStore";
import { Card } from "../components/ui/Card";
import { MobilePageHeader } from "../components/PageHeader";
import { FeatureIcon3D } from "../components/ui/Icons3D";
import { WelcomePopup } from "../components/WelcomePopup";

const metricColors = [
  { accent: "var(--accent-rose)", soft: "var(--accent-rose-soft)", border: "color-mix(in srgb, var(--accent-rose) 20%, transparent)" },
  { accent: "var(--accent-cyan)", soft: "var(--accent-cyan-soft)", border: "color-mix(in srgb, var(--accent-cyan) 20%, transparent)" },
  { accent: "var(--accent-violet)", soft: "var(--accent-violet-soft)", border: "color-mix(in srgb, var(--accent-violet) 20%, transparent)" },
  { accent: "var(--accent-emerald)", soft: "var(--accent-emerald-soft)", border: "color-mix(in srgb, var(--accent-emerald) 20%, transparent)" },
];

function DashboardMetric({ label, value, compact = false, index = 0 }: { label: string; value: number | string; compact?: boolean; index?: number }) {
  const c = metricColors[index % metricColors.length];
  return (
    <div className="rounded-lg p-4" style={{ background: c.soft, border: `1px solid ${c.border}` }}>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: c.accent }}>{label}</p>
      <p className={`font-bold mt-1 ${compact ? "text-lg truncate" : "text-2xl"}`} style={{ color: "var(--text-primary)" }}>{value}</p>
    </div>
  );
}

function DashboardCheck({ label, complete }: { label: string; complete: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg px-4 py-3" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{label}</span>
      <span className={`badge ${complete ? "badge-success" : "badge-warning"}`}>{complete ? "Ready" : "Pending"}</span>
    </div>
  );
}

function formatHistoryTime(dateStr: string) {
  try {
    return new Intl.DateTimeFormat("en", {
      month: "short", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: true,
    }).format(new Date(dateStr));
  } catch { return dateStr; }
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const history = useAppStore((s) => s.history);
  const qaResult = useAppStore((s) => s.qaResult);
  const provider = useAppStore((s) => s.provider);
  const savedProviderKeys = useAppStore((s) => s.savedProviderKeys);
  const [showWelcome, setShowWelcome] = useState(searchParams.get("welcome") === "true");

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



      <Card className="overflow-hidden !p-0 card-highlight">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
          <div className="p-6 sm:p-8 lg:p-10">
            <span className="badge badge-primary">Professional QA Workspace</span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-4 mb-1">
              Ship with <span className="gradient-shift">confidence</span>
            </h1>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-3" style={{ color: "var(--text-primary)" }}>
              Turn requirements into test cases, scripts, and traceable QA output.
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              A focused command center for product teams who need repeatable QA coverage without changing the working generation pipeline already in place.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <button className="btn-primary px-5 py-2.5 text-sm" onClick={() => navigate("/generator")} type="button">
                Start Test Case Generation
              </button>
              <button className="btn-secondary px-5 py-2.5 text-sm" onClick={() => navigate("/knowledge")} type="button">
                Manage Knowledge Base
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10 border-t lg:border-t-0 lg:border-l" style={{ background: "var(--bg-secondary)", borderColor: "var(--border-default)" }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Active Run</p>
                <p className="text-xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>{qaResult?.summary ?? "No active matrix"}</p>
              </div>
              <span className={`badge ${hasConfiguredApiKey ? "badge-success" : "badge-warning"}`}>
                {hasConfiguredApiKey ? "AI Ready" : "Key Needed"}
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

      <section className="grid gap-5 lg:grid-cols-3">
        {[
          { title: "Test Case Generation", description: "Create positive, negative, edge, and validation cases from requirement text.", action: "Open Generator", path: "/generator", color: "var(--accent-rose)", soft: "var(--accent-rose-soft)", iconType: "sparkle" as const },
          { title: "Automation Scripts", description: "Convert selected test cases into executable Playwright, Cypress, or Selenium code.", action: "Open Automation", path: "/test-scripts", color: "var(--accent-emerald)", soft: "var(--accent-emerald-soft)", iconType: "code" as const },
          { title: "AI Configuration", description: "Select the model route and manage encrypted provider credentials.", action: "Open Settings", path: "/ai-settings", color: "var(--accent-amber)", soft: "var(--accent-amber-soft)", iconType: "ai" as const },
        ].map((item) => (
          <Card key={item.title} className="flex flex-col justify-between min-h-[200px] gradient-border card-3d" style={{ borderColor: "transparent" }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="card-3d-icon flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: item.soft, color: item.color }}>
                  <FeatureIcon3D size={18} type={item.iconType} />
                </div>
                <h3 className="text-base font-bold" style={{ color: item.color }}>{item.title}</h3>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item.description}</p>
            </div>
            <button className="w-fit px-4 py-2 text-xs mt-5 card-3d" style={{ background: item.soft, color: item.color, border: `1px solid color-mix(in srgb, ${item.color} 25%, transparent)`, borderRadius: "var(--radius-md)", fontWeight: 600, cursor: "pointer" }} onClick={() => navigate(item.path)} type="button">
              {item.action}
            </button>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Readiness Checklist</h3>
          <div className="mt-4 space-y-3">
            <DashboardCheck label="AI provider selected" complete={!!provider} />
            <DashboardCheck label="API key available" complete={hasConfiguredApiKey} />
            <DashboardCheck label="Generated test cases available" complete={testCaseCount > 0} />
            <DashboardCheck label="Automation source selected" complete={testCaseCount > 0} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Recent Generation</h3>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Latest saved matrix from history.</p>
            </div>
            <button className="btn-ghost px-4 py-2 text-xs font-semibold" onClick={() => navigate("/generator")} type="button">
              View History
            </button>
          </div>
          {lastRun ? (
            <div className="mt-5 p-4 rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-default)" }}>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{lastRun.result.summary}</p>
              <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-muted)" }}>{lastRun.requirement}</p>
              <div className="flex gap-2 mt-3 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                <span className="badge badge-primary">{lastRun.result.testCases.length} cases</span>
                <span className="badge badge-primary">{formatHistoryTime(lastRun.timestamp)}</span>
              </div>
            </div>
          ) : (
            <div className="mt-5 p-8 text-center text-sm rounded-lg border border-dashed" style={{ color: "var(--text-muted)", borderColor: "var(--border-default)" }}>
              No generation history yet.
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
