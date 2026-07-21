import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { api, type KeyStats } from '../lib/api';
import { useAdminStore } from '../store/useAdminStore';
import type { Page } from '../App';
import {
  KeyRound,
  CheckCircle2,
  Sparkles,
  Clock,
  AlertTriangle,
  Users,
  TrendingUp,
  TrendingDown,
  Check,
  X,
  ArrowUpRight,
} from 'lucide-react';

type Activity = {
  type: 'key_generated' | 'key_used' | 'registration' | 'approved' | 'rejected';
  desc: string;
  time: Date;
};

function useCountUp(end: number, duration = 900, delay = 0): number {
  const [value, setValue] = useState(0);
  const frameRef = useRef(0);
  const startRef = useRef(0);

  useEffect(() => {
    if (end === 0) {
      setValue(0);
      return;
    }
    const timeout = setTimeout(() => {
      startRef.current = performance.now();
      const step = (now: number) => {
        const elapsed = now - startRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(ease * end));
        if (progress < 1) frameRef.current = requestAnimationFrame(step);
      };
      frameRef.current = requestAnimationFrame(step);
    }, delay);
    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(frameRef.current);
    };
  }, [end, duration, delay]);

  return value;
}

type KpiMeta = {
  label: string;
  value: number;
  trend: number;
  trendLabel: string;
  icon: React.ElementType;
  colorClass: string;
  extra?: string;
};

const ICON_SIZE = 16;

function KpiTile({ meta, index }: { meta: KpiMeta; index: number }) {
  const count = useCountUp(meta.value, 800, index * 80);
  const Icon = meta.icon;
  const TrendIcon = meta.trend >= 0 ? TrendingUp : TrendingDown;
  return (
    <div
      className={`db-kpi db-kpi-${meta.colorClass}`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="db-kpi-top">
        <span className="db-kpi-label">{meta.label}</span>
        <Icon size={ICON_SIZE} strokeWidth={1.5} className="db-kpi-icon" />
      </div>
      <div className="db-kpi-row">
        <span className="db-kpi-value">{count.toLocaleString()}</span>
        {meta.value > 0 && (
          <span className={`db-kpi-trend ${meta.trend >= 0 ? 'up' : 'down'}`}>
            <TrendIcon size={12} strokeWidth={2.5} />
            {Math.abs(meta.trend)}%
          </span>
        )}
      </div>
      <span className="db-kpi-extra">{meta.extra || meta.trendLabel}</span>
    </div>
  );
}

function KeyStatusDonut({ stats, animate }: { stats: KeyStats; animate: boolean }) {
  const total = stats.total || 1;
  const data = [
    { label: 'Activated', count: stats.used, color: 'var(--color-accent)' },
    { label: 'Available', count: stats.available, color: 'var(--color-success)' },
    { label: 'Expired', count: stats.expired, color: 'var(--color-danger)' },
  ];

  const circumference = 2 * Math.PI * 40;
  let offset = 0;
  const segments = data.map((d) => {
    const pct = d.count / total;
    const len = pct * circumference;
    const seg = { ...d, len, offset: -offset, pct: Math.round(pct * 100) };
    offset += len;
    return seg;
  });

  const activationCount = useCountUp(activationPct(stats), 900, 200);

  return (
    <div className="db-widget-card db-donut-widget">
      <h3 className="db-card-title">Key Status</h3>
      <div className="db-donut-layout">
        <div className="db-donut-chart">
          <svg width="110" height="110" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="var(--color-elevated)"
              strokeWidth="10"
            />
            {segments
              .filter((s) => s.count > 0)
              .map((s, i) => (
                <circle
                  key={i}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={s.color}
                  strokeWidth="10"
                  strokeDasharray={`${s.len} ${circumference - s.len}`}
                  strokeDashoffset={s.offset}
                  transform="rotate(-90 50 50)"
                  style={{
                    transition: animate
                      ? 'stroke-dasharray 0.8s ease 0.3s, stroke-dashoffset 0.8s ease 0.3s'
                      : 'none',
                  }}
                />
              ))}
          </svg>
          <div className="db-donut-center">
            <span className="db-donut-pct">{activationCount}%</span>
            <span className="db-donut-lbl">Activated</span>
          </div>
        </div>
        <div className="db-donut-legend">
          {segments.map((s, i) => (
            <div key={i} className="db-donut-item">
              <div className="db-donut-dot" style={{ background: s.color }} />
              <div className="db-donut-info">
                <span className="db-donut-label">{s.label}</span>
                <span className="db-donut-count">{s.count.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function activationPct(stats: KeyStats): number {
  return stats.total > 0 ? Math.round((stats.used / stats.total) * 100) : 0;
}

function PlanDistribution({ data }: { data: { plan: string; count: number; color: string }[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="db-widget-card db-plan-widget">
      <h3 className="db-card-title">Plan Distribution</h3>
      {data.length === 0 ? (
        <div className="db-empty-small">No plan data yet</div>
      ) : (
        <div className="db-plan-bars">
          {data.map((d, i) => (
            <div key={d.plan} className="db-plan-row" style={{ animationDelay: `${i * 60}ms` }}>
              <span className="db-plan-name">{d.plan}</span>
              <div className="db-plan-bar-track">
                <div
                  className="db-plan-bar-fill"
                  style={{ width: `${(d.count / maxCount) * 100}%`, background: d.color }}
                />
              </div>
              <span className="db-plan-count">{d.count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PendingApprovalsWidget({
  items,
  onNavigate,
  onApprove,
  onReject,
  loading,
}: {
  items: any[];
  onNavigate?: (page: Page) => void;
  onApprove: (id: string) => void;
  onReject: (item: any) => void;
  loading: boolean;
}) {
  return (
    <div className="db-widget-card db-pending-widget">
      <div className="db-pending-header">
        <h3 className="db-card-title">Pending Approvals</h3>
        <button className="db-ghost-btn" onClick={() => onNavigate?.('verifications')}>
          View all
          <ArrowUpRight size={12} strokeWidth={2} style={{ marginLeft: 2 }} />
        </button>
      </div>
      {items.length === 0 ? (
        <div className="db-empty-small">All clear — no pending approvals</div>
      ) : (
        <div className="db-pending-list">
          {items.slice(0, 3).map((item, i) => (
            <div
              key={item.pendingId}
              className="db-pending-item"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="db-pending-avatar">
                {item.name ? item.name.charAt(0).toUpperCase() : '?'}
              </div>
              <div className="db-pending-info">
                <span className="db-pending-name">{item.name || '—'}</span>
                <span className="db-pending-email">{item.email}</span>
                {item.plan && <span className="db-pending-plan">{item.plan}</span>}
              </div>
              <div className="db-pending-actions">
                <button
                  className="db-btn-icon approve"
                  disabled={loading}
                  onClick={() => onApprove(item.pendingId)}
                  title="Approve"
                >
                  <Check size={14} strokeWidth={2.5} />
                </button>
                <button
                  className="db-btn-icon reject"
                  disabled={loading}
                  onClick={() => onReject(item)}
                  title="Reject"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          ))}
          {items.length > 3 && (
            <button className="db-pending-more" onClick={() => onNavigate?.('verifications')}>
              +{items.length - 3} more pending
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ActivityTimeline({
  items,
  filter,
  onFilterChange,
}: {
  items: Activity[];
  filter: string;
  onFilterChange: (f: string) => void;
}) {
  const filters = [
    { key: 'all', label: 'All' },
    { key: 'key_generated', label: 'Generated' },
    { key: 'key_used', label: 'Activated' },
    { key: 'approved', label: 'Approved' },
  ];

  const filtered = filter === 'all' ? items : items.filter((a) => a.type === filter);

  return (
    <div className="db-card db-activity-card">
      <div className="db-activity-header">
        <div>
          <h3 className="db-card-title">Recent Activity</h3>
          <p className="db-card-sub">Latest key events and registrations</p>
        </div>
      </div>
      <div className="db-pill-group" style={{ marginBottom: 16 }}>
        {filters.map((f) => (
          <button
            key={f.key}
            className={`db-pill${filter === f.key ? ' active' : ''}`}
            onClick={() => onFilterChange(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="db-empty-small">No activity found</div>
      ) : (
        <div className="db-timeline">
          {filtered.slice(0, 10).map((a, i) => (
            <div key={i} className="db-timeline-item" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="db-timeline-dot-col">
                <div
                  className={`db-timeline-dot ${a.type === 'key_generated' ? 'accent' : a.type === 'key_used' || a.type === 'approved' ? 'success' : a.type === 'registration' ? 'warning' : 'danger'}`}
                />
                <div className="db-timeline-line" />
              </div>
              <div className="db-timeline-content">
                <span className="db-timeline-text" dangerouslySetInnerHTML={{ __html: a.desc }} />
                <span className="db-timeline-time">
                  {new Date(a.time).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DashboardPage({ onNavigate }: { onNavigate?: (page: Page) => void }) {
  const { keyStats, setKeyStats } = useAdminStore();
  const [totalUsers, setTotalUsers] = useState(0);
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [activityFilter, setActivityFilter] = useState('all');
  const [prevWeekKeys, setPrevWeekKeys] = useState(0);
  const [prevWeekRegs, setPrevWeekRegs] = useState(0);
  const [recentKeys, setRecentKeys] = useState(0);
  const [recentRegistrations, setRecentRegistrations] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setAnimate(false), 2000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [statsRes, keysRes, customersRes, pendingRes, allRegsRes] = await Promise.all([
          api.get<KeyStats>('/api/admin/keys/stats'),
          api.get<{ keys: any[] }>('/api/admin/keys'),
          api.get<{ customers: any[] }>('/api/admin/customers'),
          api.get<{ registrations: any[] }>('/api/admin/verifications?status=pending_verification'),
          api.get<{ registrations: any[] }>('/api/admin/verifications'),
        ]);
        if (cancelled) return;

        setKeyStats(statsRes.data);
        setTotalUsers(customersRes.data.customers.length);
        setPendingVerifications(pendingRes.data.registrations);
        setPendingCount(pendingRes.data.registrations.length);
        setRegistrations(allRegsRes.data.registrations);

        const now = Date.now();
        const weekAgo = now - 7 * 86400000;
        const twoWeeks = now - 14 * 86400000;

        const rk = keysRes.data.keys.filter(
          (k) => new Date(k.createdAt).getTime() > weekAgo
        ).length;
        setRecentKeys(rk);
        setPrevWeekKeys(
          keysRes.data.keys.filter((k) => {
            const t = new Date(k.createdAt).getTime();
            return t > twoWeeks && t <= weekAgo;
          }).length
        );

        const rr = customersRes.data.customers.filter(
          (c) => new Date(c.createdAt).getTime() > weekAgo
        ).length;
        setRecentRegistrations(rr);
        setPrevWeekRegs(
          customersRes.data.customers.filter((c) => {
            const t = new Date(c.createdAt).getTime();
            return t > twoWeeks && t <= weekAgo;
          }).length
        );

        const acts: Activity[] = [];
        for (const k of keysRes.data.keys.slice(0, 15)) {
          acts.push({
            type: 'key_generated',
            desc: `Key <strong>${k.key.slice(0, 8)}...</strong> generated`,
            time: new Date(k.createdAt),
          });
          if (k.usedAt)
            acts.push({
              type: 'key_used',
              desc: `Key <strong>${k.key.slice(0, 8)}...</strong> activated`,
              time: new Date(k.usedAt),
            });
        }
        for (const reg of allRegsRes.data.registrations.slice(0, 15)) {
          if (reg.status === 'pending_verification') {
            acts.push({
              type: 'registration',
              desc: `<strong>${reg.email}</strong> registered for ${reg.plan || 'a plan'}`,
              time: new Date(reg.createdAt),
            });
          } else if (reg.status === 'ready') {
            acts.push({
              type: 'approved',
              desc: `<strong>${reg.email}</strong> approved`,
              time: new Date(reg.createdAt),
            });
          }
        }
        acts.sort((a, b) => b.time.getTime() - a.time.getTime());
        setActivity(acts.slice(0, 20));
      } catch {
        /* ignore */
      }
    }
    load();
    const interval = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const planData = useMemo(() => {
    const counts: Record<string, number> = { Free: 0, Pro: 0, Enterprise: 0 };
    for (const r of registrations) {
      if (!r.plan) continue;
      if (r.status !== 'ready' && r.status !== 'completed') continue;
      const plan = r.plan.charAt(0).toUpperCase() + r.plan.slice(1);
      if (counts[plan] !== undefined) counts[plan]++;
      else counts[plan] = 1;
    }
    const colors: Record<string, string> = {
      Free: 'var(--color-text-muted)',
      Pro: 'var(--color-accent)',
      Enterprise: 'var(--color-warning)',
    };
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([plan, count]) => ({ plan, count, color: colors[plan] || 'var(--color-text-muted)' }));
  }, [registrations]);

  const stats = keyStats || { total: 0, used: 0, available: 0, expired: 0 };
  const genTrend =
    prevWeekKeys > 0
      ? Math.round(((recentKeys - prevWeekKeys) / prevWeekKeys) * 100)
      : recentKeys > 0
        ? 100
        : 0;
  const regTrend =
    prevWeekRegs > 0
      ? Math.round(((recentRegistrations - prevWeekRegs) / prevWeekRegs) * 100)
      : recentRegistrations > 0
        ? 100
        : 0;

  const kpiItems: KpiMeta[] = [
    {
      label: 'Total Keys',
      value: stats.total,
      trend: genTrend,
      trendLabel: 'vs last week',
      icon: KeyRound,
      colorClass: 'accent',
      extra: `${recentKeys} new this week`,
    },
    {
      label: 'Activated',
      value: stats.used,
      trend: 0,
      trendLabel: `of ${stats.total} total`,
      icon: CheckCircle2,
      colorClass: 'success',
      extra: `${activationPct(stats)}% activation rate`,
    },
    {
      label: 'Available',
      value: stats.available,
      trend: 0,
      trendLabel: 'ready to assign',
      icon: Sparkles,
      colorClass: 'info',
      extra: stats.available > 0 ? 'Ready to assign' : 'None available',
    },
    {
      label: 'Pending',
      value: pendingCount,
      trend: 0,
      trendLabel: 'awaiting review',
      icon: Clock,
      colorClass: 'warning',
      extra: pendingCount > 0 ? 'Awaiting review' : 'All clear',
    },
    {
      label: 'Expired',
      value: stats.expired,
      trend: 0,
      trendLabel: 'inactive keys',
      icon: AlertTriangle,
      colorClass: 'danger',
      extra: stats.expired > 0 ? 'Inactive keys' : 'No expired keys',
    },
    {
      label: 'Registered Users',
      value: totalUsers,
      trend: regTrend,
      trendLabel: 'vs last week',
      icon: Users,
      colorClass: 'primary',
      extra: `${recentRegistrations} new this week`,
    },
  ];

  const handleApprove = useCallback(async (pendingId: string) => {
    setActionLoading(pendingId);
    try {
      await api.post('/api/admin/verifications/approve', { pendingId });
      const res = await api.get<{ registrations: any[] }>(
        '/api/admin/verifications?status=pending_verification'
      );
      setPendingVerifications(res.data.registrations);
      setPendingCount(res.data.registrations.length);
    } catch {
      /* ignore */
    }
    setActionLoading(null);
  }, []);

  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleReject = useCallback(async () => {
    if (!rejectTarget) return;
    setActionLoading(rejectTarget.pendingId);
    try {
      await api.post('/api/admin/verifications/reject', {
        pendingId: rejectTarget.pendingId,
        reason: rejectReason,
      });
      const res = await api.get<{ registrations: any[] }>(
        '/api/admin/verifications?status=pending_verification'
      );
      setPendingVerifications(res.data.registrations);
      setPendingCount(res.data.registrations.length);
      setRejectTarget(null);
      setRejectReason('');
    } catch {
      /* ignore */
    }
    setActionLoading(null);
  }, [rejectTarget, rejectReason]);

  return (
    <div className="db-root">
      <div className="db-kpi-strip">
        {kpiItems.map((meta, i) => (
          <KpiTile key={meta.label} meta={meta} index={i} />
        ))}
      </div>

      <div className="db-widget-row">
        <KeyStatusDonut stats={stats} animate={animate} />
        <PlanDistribution data={planData} />
        <PendingApprovalsWidget
          items={pendingVerifications}
          onNavigate={onNavigate}
          onApprove={handleApprove}
          onReject={(item) => setRejectTarget(item)}
          loading={!!actionLoading}
        />
      </div>

      <ActivityTimeline
        items={activity}
        filter={activityFilter}
        onFilterChange={setActivityFilter}
      />

      {stats.total === 0 && (
        <div className="db-empty-state">
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            style={{ opacity: 0.35 }}
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          <h3>Welcome to ForgeQA License Manager</h3>
          <p>Get started by generating your first batch of product keys.</p>
          <button className="btn btn-primary" onClick={() => onNavigate?.('keys')}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M12 4v16m8-8H4" />
            </svg>
            Generate Keys
          </button>
        </div>
      )}

      {rejectTarget && (
        <div className="modal-overlay" onClick={() => setRejectTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3>Reject Registration</h3>
              <button className="modal-close" onClick={() => setRejectTarget(null)}>
                <X size={16} strokeWidth={2} />
              </button>
            </div>
            <div className="modal-body">
              <div
                style={{
                  marginBottom: 16,
                  padding: '12px 16px',
                  background: 'var(--color-elevated)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 2,
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {rejectTarget.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  {rejectTarget.email}
                </div>
              </div>
              <div className="form-group">
                <label>Reason (optional)</label>
                <textarea
                  className="form-input"
                  placeholder="e.g. Unable to verify identity..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setRejectTarget(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" disabled={!!actionLoading} onClick={handleReject}>
                {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
