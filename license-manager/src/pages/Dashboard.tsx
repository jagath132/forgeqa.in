import { useEffect, useState } from "react";
import { api, type KeyStats } from "../lib/api";
import { useAdminStore } from "../store/useAdminStore";

import type { Page } from "../App";

export function DashboardPage({ onNavigate }: { onNavigate?: (page: Page) => void }) {
  const { keyStats, setKeyStats } = useAdminStore();
  const [totalUsers, setTotalUsers] = useState(0);
  const [recentKeys, setRecentKeys] = useState(0);
  const [recentRegistrations, setRecentRegistrations] = useState(0);
  const [pendingVerifications, setPendingVerifications] = useState(0);

  useEffect(() => {
    api.get<KeyStats>("/api/admin/keys/stats").then((r) => setKeyStats(r.data)).catch(() => {});
    api.get<{ customers: any[] }>("/api/admin/customers").then((r) => {
      setTotalUsers(r.data.customers.length);
      const weekAgo = Date.now() - 7 * 86400000;
      setRecentRegistrations(r.data.customers.filter((c) => new Date(c.createdAt).getTime() > weekAgo).length);
    }).catch(() => {});
    api.get<{ keys: any[] }>("/api/admin/keys").then((r) => {
      const weekAgo = Date.now() - 7 * 86400000;
      setRecentKeys(r.data.keys.filter((k) => new Date(k.createdAt).getTime() > weekAgo).length);
    }).catch(() => {});
    api.get<{ registrations: any[] }>("/api/admin/verifications?status=pending_verification")
      .then((r) => setPendingVerifications(r.data.registrations.length))
      .catch(() => {});
  }, []);

  const stats = keyStats || { total: 0, used: 0, available: 0, expired: 0 };
  const activationRate = stats.total > 0 ? Math.round((stats.used / stats.total) * 100) : 0;

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card accent">
          <div className="stat-top">
            <div>
              <div className="label">Total Keys</div>
              <div className="value accent">{stats.total}</div>
            </div>
            <div className="stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
          </div>
          <div className="stat-footer">All product keys in the system</div>
        </div>

        <div className="stat-card success">
          <div className="stat-top">
            <div>
              <div className="label">Available</div>
              <div className="value success">{stats.available}</div>
            </div>
            <div className="stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
          <div className="stat-footer">{activationRate}% activation rate</div>
        </div>

        <div className="stat-card info">
          <div className="stat-top">
            <div>
              <div className="label">Activated</div>
              <div className="value accent">{stats.used}</div>
            </div>
            <div className="stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
          </div>
          <div className="stat-footer">{stats.used > 0 ? "Registered to users" : "No activations yet"}</div>
        </div>

        <div className="stat-card warning">
          <div className="stat-top">
            <div>
              <div className="label">Registered Users</div>
              <div className="value warning">{totalUsers}</div>
            </div>
            <div className="stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
          </div>
          <div className="stat-footer">{recentRegistrations > 0 ? `${recentRegistrations} new this week` : "No new users"}</div>
        </div>

        <div className="stat-card danger">
          <div className="stat-top">
            <div>
              <div className="label">Expired / Revoked</div>
              <div className="value danger">{stats.expired}</div>
            </div>
            <div className="stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
          </div>
          <div className="stat-footer">{stats.expired > 0 ? "Inactive keys" : "No expired keys"}</div>
        </div>

        <div className="stat-card accent">
          <div className="stat-top">
            <div>
              <div className="label">Keys (7 days)</div>
              <div className="value">{recentKeys}</div>
            </div>
            <div className="stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
          </div>
          <div className="stat-footer">{recentKeys > 0 ? "Generated in the last 7 days" : "No recent keys"}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Quick Actions</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={() => onNavigate?.("keys")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 4v16m8-8H4" /></svg>
            Generate Keys
          </button>
            <button className="btn btn-secondary" onClick={() => onNavigate?.("customers")}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
              View Customers
            </button>
            {pendingVerifications > 0 && (
              <button className="btn" onClick={() => onNavigate?.("verifications")}
                style={{ background: "linear-gradient(135deg, #f59e0b22, #ef444422)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                {pendingVerifications} Awaiting Approval
              </button>
            )}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Key Status Overview</h3>
          <div className="key-status-bar">
            {stats.total > 0 ? (
              <>
                <div className="key-status-bar-segment" style={{ flex: stats.available, background: "linear-gradient(135deg, var(--success), #4ade80)", minWidth: stats.available > 0 ? 4 : 0 }} title={`${stats.available} available (${Math.round((stats.available / stats.total) * 100)}%)`} />
                <div className="key-status-bar-segment" style={{ flex: stats.used, background: "linear-gradient(135deg, var(--accent), #a855f7)", minWidth: stats.used > 0 ? 4 : 0 }} title={`${stats.used} activated (${Math.round((stats.used / stats.total) * 100)}%)`} />
                <div className="key-status-bar-segment" style={{ flex: stats.expired, background: "linear-gradient(135deg, var(--danger), #f87171)", minWidth: stats.expired > 0 ? 4 : 0 }} title={`${stats.expired} expired (${Math.round((stats.expired / stats.total) * 100)}%)`} />
              </>
            ) : (
              <div className="key-status-bar-segment" style={{ flex: 1, background: "var(--bg-tertiary)" }} />
            )}
          </div>
          <div className="key-status-legend">
            <span className="key-status-legend-item">
              <span className="key-status-legend-dot" style={{ background: "var(--success)" }} />
              Available ({stats.available})
            </span>
            <span className="key-status-legend-item">
              <span className="key-status-legend-dot" style={{ background: "var(--accent)" }} />
              Activated ({stats.used})
            </span>
            <span className="key-status-legend-item">
              <span className="key-status-legend-dot" style={{ background: "var(--danger)" }} />
              Expired ({stats.expired})
            </span>
          </div>
        </div>
      </div>

      {stats.total === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "40px 24px" }}>
          <div className="empty-state-icon" style={{ margin: "0 auto 16px" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}>Welcome to License Manager</h3>
          <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 400, margin: "0 auto 20px" }}>
            Get started by generating your first batch of product keys. You can also configure payment integrations in the .env file.
          </p>
          <button className="btn btn-primary" onClick={() => onNavigate?.("keys")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 4v16m8-8H4" /></svg>
            Generate Keys
          </button>
        </div>
      )}
    </div>
  );
}
