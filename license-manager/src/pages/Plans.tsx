import { useEffect, useState } from "react";
import { api, type Plan } from "../lib/api";
import { PlanModal } from "../components/PlanModal";
import { LayoutGrid, Table2, Plus, Settings, Package, Check } from "lucide-react";

export function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  async function loadPlans() {
    setLoading(true);
    try {
      const res = await api.get<{ plans: Plan[] }>("/api/admin/plans");
      setPlans(res.data.plans);
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => {
    loadPlans();
    const interval = setInterval(loadPlans, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (cents: number) => {
    if (cents === 0) return "Free";
    return `$${(cents / 100).toFixed(2)}`;
  };

  const ACCENT_RECIPE: Record<string, { color: string; bg: string }> = {
    free: { color: "var(--color-text-muted)", bg: "transparent" },
    pro: { color: "var(--color-accent)", bg: "var(--color-accent-subtle)" },
    enterprise: { color: "var(--color-warning)", bg: "var(--color-warning-subtle)" },
  };

  return (
    <div>
      <div className="section-header">
        <h3>Plans</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className={`plan-table-toggle${viewMode === "cards" ? " active" : ""}`} onClick={() => setViewMode("cards")}>
            <LayoutGrid size={14} strokeWidth={2} />
            Cards
          </button>
          <button className={`plan-table-toggle${viewMode === "table" ? " active" : ""}`} onClick={() => setViewMode("table")}>
            <Table2 size={14} strokeWidth={2} />
            Table
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={14} strokeWidth={2} />
            Create Plan
          </button>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading plans...</p></div>
      ) : plans.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "60px 24px" }}>
          <Package size={40} strokeWidth={1.5} className="empty-state-icon" />
          <h3>No plans defined</h3>
          <p>Create your first plan to define pricing tiers.</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ marginTop: 16 }}>
            Create Plan
          </button>
        </div>
      ) : viewMode === "cards" ? (
        <div className="plan-cards-grid">
          {plans.map((p) => {
            return (
              <div key={p.id} className={`plan-card-large${p.popular ? " popular" : ""}`}>
                <div className="plan-card-head">
                  <div className="plan-card-name">{p.name}</div>
                  <div className="plan-card-tier">{p.id}</div>
                  <div className={`plan-card-price${p.price === 0 ? " free" : ""}`}>
                    {formatPrice(p.price)}
                    <span className="plan-card-period">
                      {p.period === "forever" ? "" : `/${p.period === "yearly" ? "yr" : "mo"}`}
                    </span>
                  </div>
                  <div className="plan-card-badges">
                    <span className={`badge ${p.active ? "badge-available" : "badge-expired"}`} style={{ fontSize: 10 }}>
                      {p.active ? "Active" : "Inactive"}
                    </span>
                    {p.popular && <span className="badge badge-used" style={{ fontSize: 10 }}>Popular</span>}
                  </div>
                </div>
                <div className="plan-card-body">
                  {p.description && <div className="plan-card-desc">{p.description}</div>}
                  <div className="plan-card-features">
                    {p.features.slice(0, 5).map((f, i) => (
                      <div key={i} className="plan-card-feature">
                        <Check size={14} strokeWidth={2.5} />
                        {f}
                      </div>
                    ))}
                    {p.features.length > 5 && (
                      <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 4, textAlign: "center" }}>
                        +{p.features.length - 5} more features
                      </div>
                    )}
                  </div>
                </div>
                <div className="plan-card-footer">
                      <button className="btn btn-primary btn-sm" onClick={() => setEditPlan(p)}>
                    <Settings size={12} strokeWidth={2} />
                    Manage
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
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
                          width: 32, height: 32, borderRadius: "var(--radius)", display: "flex", alignItems: "center", justifyContent: "center",
                          background: ACCENT_RECIPE[p.id]?.bg || "var(--color-accent-subtle)",
                          color: ACCENT_RECIPE[p.id]?.color || "var(--color-accent)",
                          fontSize: 13, fontWeight: 700,
                        }}>
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: 14 }}>{p.name}</div>
                          <div style={{ fontSize: 11, fontFamily: "monospace", color: "var(--color-text-muted)" }}>{p.id}</div>
                        </div>
                        {p.popular && <span className="badge badge-available" style={{ fontSize: 10, padding: "1px 7px" }}>Popular</span>}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, fontSize: 15, color: p.price === 0 ? "var(--color-text-muted)" : "var(--color-text-primary)" }}>
                      {formatPrice(p.price)}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{p.period}</td>
                    <td>
                      <span className={`badge ${p.active ? "badge-available" : "badge-expired"}`} style={{ fontSize: 11 }}>
                        {p.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      <span style={{ color: "var(--color-text-primary)" }}>{p.features.length}</span>
                      <span style={{ color: "var(--color-text-muted)", marginLeft: 2 }}>features</span>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                      {p.maxUsers !== null ? `${p.maxUsers} users` : "Unlimited"}
                    </td>
                    <td style={{ fontSize: 12, whiteSpace: "nowrap", color: "var(--color-text-muted)" }}>
                      {new Date(p.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button className="btn btn-sm btn-secondary" onClick={() => setEditPlan(p)}>
                        <Settings size={12} strokeWidth={2} />
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreate && (
        <PlanModal onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); loadPlans(); }} />
      )}

      {editPlan && (
        <PlanModal plan={editPlan} onClose={() => setEditPlan(null)} onSaved={() => { setEditPlan(null); loadPlans(); }} />
      )}
    </div>
  );
}
