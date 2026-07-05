import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Area, AreaChart,
} from "recharts";
import { useAppStore } from "../store/useAppStore";
import { Card } from "../components/ui/Card";

const COLORS = ["var(--accent-rose)", "var(--accent-cyan)", "var(--accent-violet)", "var(--accent-emerald)", "var(--accent-amber)"];

export function AnalyticsPage() {
  const history = useAppStore((s) => s.history);
  const qaResult = useAppStore((s) => s.qaResult);

  const generationTrend = useMemo(() => {
    const days: Record<string, number> = {};
    history.forEach((item) => {
      const day = item.timestamp.slice(0, 10);
      days[day] = (days[day] ?? 0) + 1;
    });
    return Object.entries(days).slice(-14).map(([date, count]) => ({
      date: date.slice(5),
      count,
    }));
  }, [history]);

  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    (qaResult?.testCases ?? []).forEach((tc) => {
      cats[tc.category] = (cats[tc.category] ?? 0) + 1;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [qaResult]);

  const providerData = useMemo(() => {
    if (!history.length) return [];
    const providers: Record<string, number> = {};
    const stored = window.localStorage.getItem("qacopilot_ai_settings");
    const current = stored ? JSON.parse(stored).provider ?? "Not Set" : "Not Set";
    providers[current] = history.length;
    return Object.entries(providers).map(([name, value]) => ({ name, value }));
  }, [history]);

  const totalCases = qaResult?.testCases.length ?? 0;
  const totalRuns = history.length;
  const totalKnowledge = qaResult?.knowledgeContext?.length ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Test Runs", value: totalRuns, color: "var(--accent-violet)" },
          { label: "Active Test Cases", value: totalCases, color: "var(--accent-rose)" },
          { label: "Context Sources", value: totalKnowledge, color: "var(--accent-cyan)" },
        ].map((stat) => (
          <Card key={stat.label} className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{stat.label}</p>
              <p className="text-3xl font-bold mt-1" style={{ color: stat.color }}>{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Generation Trend (14 days)</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Number of test generations per day</p>
          <div className="mt-5 h-64">
            {generationTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={generationTrend}>
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="count" stroke="var(--accent)" fill="url(#trendGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
                No generation data yet. Run a test case generation to see trends.
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Test Cases by Category</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Breakdown of active test matrix</p>
          <div className="mt-5 h-64">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
                No test cases generated yet.
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Provider Usage</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Active AI provider distribution</p>
          <div className="mt-5 h-64">
            {providerData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={providerData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "var(--text-primary)" }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="var(--accent)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
                Configure an AI provider to see usage data.
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Status Overview</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Test case status distribution</p>
          <div className="mt-5 h-64">
            {qaResult && qaResult.testCases.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(() => {
                  const statuses: Record<string, number> = { draft: 0, reviewed: 0, approved: 0 };
                  qaResult.testCases.forEach((tc) => {
                    statuses[tc.status ?? "draft"]++;
                  });
                  return Object.entries(statuses).map(([name, value]) => ({ name, value }));
                })()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--text-primary)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {[{ fill: "var(--accent-amber)" }, { fill: "var(--accent-cyan)" }, { fill: "var(--accent-emerald)" }].map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
                Generate test cases to see status distribution.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
