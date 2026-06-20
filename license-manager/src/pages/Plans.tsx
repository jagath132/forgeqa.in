import { useEffect, useState } from "react";
import { api, type Plan } from "../lib/api";
import { PlanModal } from "../components/PlanModal";

const PLAN_COLORS: Record<string, string> = {
  free: "var(--text-muted)",
  pro: "var(--accent)",
  enterprise: "#f59e0b",
};

const PLAN_BG: Record<string, string> = {
  free: "transparent",
  pro: "var(--accent-soft)",
  enterprise: "rgba(245, 158, 11, 0.1)",
};

export function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);

  async function loadPlans() {
    setLoading(true);
    try {
      const res = await api.get<{ plans: Plan[] }>("/api/admin/plans");
      setPlans(res.data.plans);
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { loadPlans(); }, []);

  const formatPrice = (cents: number) => {
    if (cents === 0) return "Free";
    return `$${(cents / 100).toFixed(2)}`;
  };

  const activePlans = plans.filter((p) => p.active).length;
  const inactivePlans = plans.length - activePlans;

  return (
    <div>
      <div className="section-header">
        <h3>Plans</h3>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M12 4v16m8-8H4" /></svg>
          Create Plan
        </button>
      </div>

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card accent">
          <div className="stat-top">
            <div>
              <div className="label">Total Plans</div>
              <div className="value accent">{plans.length}</div>
            </div>
            <div className="stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="stat-footer">Pricing tiers defined</div>
        </div>

        <div className="stat-card success">
          <div className="stat-top">
            <div>
              <div className="label">Active</div>
              <div className="value success">{activePlans}</div>
            </div>
            <div className="stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
          <div className="stat-footer">Available for new sign-ups</div>
        </div>

        <div className="stat-card" style={{ borderTopColor: "var(--warning)" }}>
          <div className="stat-top">
            <div>
              <div className="label">Inactive</div>
              <div className="value" style={{ color: "var(--warning)" }}>{inactivePlans}</div>
            </div>
            <div className="stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
          </div>
          <div className="stat-footer">Hidden from registration</div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="empty-state"><p>Loading plans...</p></div>
        ) : plans.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3>No plans defined</h3>
            <p>Create your first plan to define pricing tiers.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Price</th>
                  <th>Period</th>
                  <th>Status</th>
                  <th>Features</th>
                  <th>Limits</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.id} style={{ cursor: "pointer" }} onClick={() => setEditPlan(p)}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                          background: PLAN_BG[p.id] || "var(--bg-tertiary)",
                          color: PLAN_COLORS[p.id] || "var(--text-primary)",
                          fontSize: 13, fontWeight: 700,
                        }}>
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>{p.name}</div>
                          <div style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-muted)" }}>{p.id}</div>
                        </div>
                        {p.popular && (
                          <span className="badge badge-available" style={{ fontSize: 10, padding: "2px 8px" }}>Popular</span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, fontSize: 15, color: p.price === 0 ? "var(--text-muted)" : "var(--text-primary)" }}>
                      {formatPrice(p.price)}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{p.period}</td>
                    <td>
                      <span className={`badge ${p.active ? "badge-available" : "badge-expired"}`} style={{ fontSize: 11 }}>
                        <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", marginRight: 4, background: p.active ? "var(--success)" : "var(--text-muted)" }} />
                        {p.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      <span style={{ color: "var(--text-primary)" }}>{p.features.length}</span>
                      <span style={{ color: "var(--text-muted)", marginLeft: 2 }}>features</span>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {p.maxUsers !== null ? `${p.maxUsers} users` : "Unlimited"}
                    </td>
                    <td style={{ fontSize: 12, whiteSpace: "nowrap", color: "var(--text-muted)" }}>
                      {new Date(p.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => setEditPlan(p)} title="Manage plan">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
                          Manage
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <PlanModal onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); loadPlans(); }} />
      )}

      {editPlan && (
        <PlanModal plan={editPlan} onClose={() => setEditPlan(null)} onSaved={() => { setEditPlan(null); loadPlans(); }} />
      )}
    </div>
  );
}
