import { useState, type FormEvent } from "react";
import { api, type Plan } from "../lib/api";
import { X, Check, Circle, PenSquare, Trash2, AlertCircle } from "lucide-react";

type Tab = "details" | "edit";
type Mode = "create" | "edit";

interface Props {
  plan?: Plan;
  onClose: () => void;
  onSaved: () => void;
}

const EMPTY_PLAN = {
  id: "", name: "", price: 0, currency: "usd", period: "monthly",
  description: "", features: [] as string[], popular: false, active: true,
  maxUsers: null as number | null, maxTestCases: null as number | null,
  aiProviders: null as number | null,
  advancedExport: false, regressionTesting: false, prioritySupport: false,
  customIntegrations: false, onPremise: false,
};

const ACCENT_RECIPE: Record<string, { color: string; bg: string }> = {
  free: { color: "var(--color-text-muted)", bg: "transparent" },
  pro: { color: "var(--color-accent)", bg: "var(--color-accent-subtle)" },
  enterprise: { color: "var(--color-warning)", bg: "var(--color-warning-subtle)" },
};

export function PlanModal({ plan, onClose, onSaved }: Props) {
  const mode: Mode = plan ? "edit" : "create";
  const [tab, setTab] = useState<Tab>("details");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState(plan || EMPTY_PLAN);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setFeature(idx: number, value: string) {
    const next = [...form.features];
    next[idx] = value;
    set("features", next);
  }

  function removeFeature(idx: number) {
    set("features", form.features.filter((_, i) => i !== idx));
  }

  function addFeature() {
    set("features", [...form.features, ""]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.id.trim() || !form.name.trim()) {
      showToast("error", "Plan ID and name are required.");
      return;
    }
    setSending(true);
    try {
      if (mode === "create") {
        await api.post("/api/admin/plans", form);
      } else {
        const payload: Record<string, any> = {};
        const allowed = ["name", "price", "currency", "period", "description", "features", "popular", "active", "maxUsers", "maxTestCases", "aiProviders", "advancedExport", "regressionTesting", "prioritySupport", "customIntegrations", "onPremise"];
        for (const key of allowed) payload[key] = (form as any)[key];
        await api.put(`/api/admin/plans/${plan!.id}`, payload);
      }
      showToast("success", mode === "create" ? "Plan created" : "Plan updated");
      setTimeout(onSaved, 800);
    } catch (err: any) {
      showToast("error", err?.response?.data?.error || "Operation failed");
    }
    setSending(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete plan "${form.name}"? This cannot be undone.`)) return;
    setSending(true);
    try {
      await api.delete(`/api/admin/plans/${plan!.id}`);
      showToast("success", "Plan deleted");
      setTimeout(onSaved, 800);
    } catch (err: any) {
      showToast("error", err?.response?.data?.error || "Delete failed");
    }
    setSending(false);
  }

  const formatPrice = (cents: number, currency = "usd") => {
    if (cents === 0) return "Free";
    if (currency === "inr") return `₹${(cents / 100).toLocaleString("en-IN")}`;
    return `$${(cents / 100).toFixed(2)}`;
  };

  const accent = ACCENT_RECIPE[form.id] || { color: "var(--color-accent)", bg: "var(--color-accent-subtle)" };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{mode === "create" ? "Create Plan" : form.name}</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {toast && (
          <div style={{ padding: "0 24px", marginTop: 8 }}>
            <div style={{
              padding: "10px 14px", borderRadius: 6, fontSize: 13, display: "flex", alignItems: "center", gap: 8,
              background: toast.type === "success" ? "var(--color-success-subtle)" : "var(--color-danger-subtle)",
              color: toast.type === "success" ? "var(--color-success)" : "var(--color-danger)",
              border: `1px solid ${toast.type === "success" ? "rgba(22,163,74,0.25)" : "rgba(220,38,38,0.25)"}`,
            }}>
              {toast.type === "success" ? (
                <Check size={16} strokeWidth={2} />
              ) : (
                <AlertCircle size={16} strokeWidth={2} />
              )}
              {toast.message}
            </div>
          </div>
        )}

        {mode === "edit" && (
          <div className="modal-tabs">
            {(["details", "edit"] as const).map((t) => (
              <button key={t} className={`modal-tab${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
                {t === "details" ? "Plan Details" : "Edit Plan"}
              </button>
            ))}
          </div>
        )}

        <div className="modal-body">
          {mode === "create" ? (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label>Plan ID *</label>
                  <input className="form-input" value={form.id} onChange={(e) => set("id", e.target.value.toLowerCase().replace(/\s/g, "-"))}
                    placeholder="e.g. pro, basic, team" style={{ fontFamily: "monospace" }} />
                </div>
                <div className="form-group">
                  <label>Plan Name *</label>
                  <input className="form-input" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Professional" />
                </div>
              </div>

              <div>
                <div className="section-title" style={{ marginBottom: 6 }}>Pricing</div>
                <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr", gap: 10 }}>
                  <div className="form-group">
                    <label>Price (cents)</label>
                    <input className="form-input" type="number" min={0} value={form.price} onChange={(e) => set("price", parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="form-group">
                    <label>Currency</label>
                    <select className="form-input" value={form.currency} onChange={(e) => set("currency", e.target.value)}>
                      <option value="usd">USD</option>
                      <option value="eur">EUR</option>
                      <option value="inr">INR</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Period</label>
                    <select className="form-input" value={form.period} onChange={(e) => set("period", e.target.value)}>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="forever">Forever</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <input className="form-input" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Short description of this plan" />
              </div>

              <div className="form-group">
                <label>Features</label>
                {form.features.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                    <input className="form-input" value={f} onChange={(e) => setFeature(i, e.target.value)} placeholder="Feature description" />
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => removeFeature(i)} style={{ padding: "6px 10px", fontSize: 14, lineHeight: 1 }}>&times;</button>
                  </div>
                ))}
                <button type="button" className="btn btn-sm btn-secondary" onClick={addFeature} style={{ marginTop: 4 }}>+ Add Feature</button>
              </div>

              <div>
                <div className="section-title" style={{ marginBottom: 6 }}>Limits</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div className="form-group">
                    <label>Max Users</label>
                    <input className="form-input" type="number" min={0} value={form.maxUsers ?? ""} onChange={(e) => set("maxUsers", e.target.value ? parseInt(e.target.value) : null)} placeholder="Unlimited" />
                  </div>
                  <div className="form-group">
                    <label>Max Test Cases/mo</label>
                    <input className="form-input" type="number" min={0} value={form.maxTestCases ?? ""} onChange={(e) => set("maxTestCases", e.target.value ? parseInt(e.target.value) : null)} placeholder="Unlimited" />
                  </div>
                  <div className="form-group">
                    <label>AI Providers</label>
                    <input className="form-input" type="number" min={0} value={form.aiProviders ?? ""} onChange={(e) => set("aiProviders", e.target.value ? parseInt(e.target.value) : null)} placeholder="Unlimited" />
                  </div>
                </div>
              </div>

              <div>
                <div className="section-title" style={{ marginBottom: 6 }}>Settings</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[
                    { key: "popular", label: "Popular" },
                    { key: "active", label: "Active" },
                    { key: "advancedExport", label: "Advanced Export" },
                    { key: "regressionTesting", label: "Regression Testing" },
                    { key: "prioritySupport", label: "Priority Support" },
                    { key: "customIntegrations", label: "Custom Integrations" },
                    { key: "onPremise", label: "On-Premise" },
                  ].map(({ key, label }) => (
                    <label key={key} className="toggle-chip" style={{
                      background: (form as any)[key] ? "var(--color-accent-subtle)" : "var(--color-bg)",
                      borderColor: (form as any)[key] ? "var(--color-accent)" : "var(--color-border)",
                      color: (form as any)[key] ? "var(--color-accent)" : "var(--color-text-muted)",
                    }}>
                      <input type="checkbox" checked={(form as any)[key]} onChange={(e) => set(key as any, e.target.checked)} />
                      {(form as any)[key] ? (
                        <Check size={14} strokeWidth={2.5} />
                      ) : (
                        <Circle size={14} strokeWidth={1.5} />
                      )}
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: "1px solid var(--color-border-light)", paddingTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={sending}>
                  {sending ? "Creating..." : "Create Plan"}
                </button>
              </div>
            </form>
          ) : tab === "details" ? (
            <div className="details-section">
              <div className="plan-card">
                <div className="plan-card-icon" style={{ background: accent.bg, color: accent.color, border: `1px solid ${accent.color}20` }}>
                  {form.name.charAt(0)}
                </div>
                <div className="plan-card-name">{form.name}</div>
                <div className="plan-card-id">{form.id}</div>
                <div className={`plan-card-price${form.price === 0 ? " free" : ""}`}>
                  {formatPrice(form.price, form.currency)}
                  <span className="plan-card-period">
                    {form.period === "forever" ? "" : `/${form.period === "yearly" ? "yr" : "mo"}`}
                  </span>
                </div>
                {form.description && <div className="plan-card-description">{form.description}</div>}
                <div className="plan-card-badges">
                  <span className={`badge ${form.active ? "badge-available" : "badge-expired"}`} style={{ fontSize: 11 }}>
                    {form.active ? "Active" : "Inactive"}
                  </span>
                  {form.popular && <span className="badge badge-available" style={{ fontSize: 11 }}>Popular</span>}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="plan-info-card">
                  <div className="header">Pricing</div>
                  <div className="main">{formatPrice(form.price, form.currency)}</div>
                  <div className="sub">per {form.period}</div>
                </div>
                <div className="plan-info-card">
                  <div className="header">Limits</div>
                  <div className="plan-limits-grid">
                    <span className="label">Users:</span>
                    <span className="value">{form.maxUsers !== null ? form.maxUsers : "Unlimited"}</span>
                    <span className="label">Tests/mo:</span>
                    <span className="value">{form.maxTestCases !== null ? form.maxTestCases.toLocaleString() : "Unlimited"}</span>
                    <span className="label">AI Providers:</span>
                    <span className="value">{form.aiProviders !== null ? form.aiProviders : "Unlimited"}</span>
                  </div>
                </div>
              </div>

              {form.features.length > 0 && (
                <div>
                  <div className="section-title">Features ({form.features.length})</div>
                  <div className="feature-grid">
                    {form.features.map((f, i) => (
                      <div key={i} className="feature-item">
                        <Check size={14} strokeWidth={2.5} className="feature-check" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(form.advancedExport || form.regressionTesting || form.prioritySupport || form.customIntegrations || form.onPremise) && (
                <div>
                  <div className="section-title">Capabilities</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {form.advancedExport && <span className="badge badge-available" style={{ fontSize: 11 }}>Advanced Export</span>}
                    {form.regressionTesting && <span className="badge badge-available" style={{ fontSize: 11 }}>Regression Testing</span>}
                    {form.prioritySupport && <span className="badge badge-available" style={{ fontSize: 11 }}>Priority Support</span>}
                    {form.customIntegrations && <span className="badge badge-available" style={{ fontSize: 11 }}>Custom Integrations</span>}
                    {form.onPremise && <span className="badge badge-available" style={{ fontSize: 11 }}>On-Premise</span>}
                  </div>
                </div>
              )}

              <div className="action-row">
                <button className="btn btn-primary btn-sm" onClick={() => setTab("edit")}>
                  <PenSquare size={12} strokeWidth={2} />
                  Edit
                </button>
                <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                  <Trash2 size={12} strokeWidth={2} />
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label>Plan Name *</label>
                  <input className="form-input" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Professional" />
                </div>
                <div className="form-group" style={{ opacity: 0.5 }}>
                  <label>Plan ID</label>
                  <input className="form-input" value={form.id} disabled style={{ fontFamily: "monospace" }} />
                </div>
              </div>

              <div>
                <div className="section-title" style={{ marginBottom: 6 }}>Pricing</div>
                <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr", gap: 10 }}>
                  <div className="form-group">
                    <label>Price (cents)</label>
                    <input className="form-input" type="number" min={0} value={form.price} onChange={(e) => set("price", parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="form-group">
                    <label>Currency</label>
                    <select className="form-input" value={form.currency} onChange={(e) => set("currency", e.target.value)}>
                      <option value="usd">USD</option>
                      <option value="eur">EUR</option>
                      <option value="inr">INR</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Period</label>
                    <select className="form-input" value={form.period} onChange={(e) => set("period", e.target.value)}>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="forever">Forever</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <input className="form-input" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Short description" />
              </div>

              <div className="form-group">
                <label>Features</label>
                {form.features.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                    <input className="form-input" value={f} onChange={(e) => setFeature(i, e.target.value)} placeholder="Feature description" />
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => removeFeature(i)} style={{ padding: "6px 10px", fontSize: 14, lineHeight: 1 }}>&times;</button>
                  </div>
                ))}
                <button type="button" className="btn btn-sm btn-secondary" onClick={addFeature} style={{ marginTop: 4 }}>+ Add Feature</button>
              </div>

              <div>
                <div className="section-title" style={{ marginBottom: 6 }}>Limits</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div className="form-group">
                    <label>Max Users</label>
                    <input className="form-input" type="number" min={0} value={form.maxUsers ?? ""} onChange={(e) => set("maxUsers", e.target.value ? parseInt(e.target.value) : null)} placeholder="Unlimited" />
                  </div>
                  <div className="form-group">
                    <label>Max Test Cases/mo</label>
                    <input className="form-input" type="number" min={0} value={form.maxTestCases ?? ""} onChange={(e) => set("maxTestCases", e.target.value ? parseInt(e.target.value) : null)} placeholder="Unlimited" />
                  </div>
                  <div className="form-group">
                    <label>AI Providers</label>
                    <input className="form-input" type="number" min={0} value={form.aiProviders ?? ""} onChange={(e) => set("aiProviders", e.target.value ? parseInt(e.target.value) : null)} placeholder="Unlimited" />
                  </div>
                </div>
              </div>

              <div>
                <div className="section-title" style={{ marginBottom: 6 }}>Settings</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[
                    { key: "popular", label: "Popular" },
                    { key: "active", label: "Active" },
                    { key: "advancedExport", label: "Advanced Export" },
                    { key: "regressionTesting", label: "Regression Testing" },
                    { key: "prioritySupport", label: "Priority Support" },
                    { key: "customIntegrations", label: "Custom Integrations" },
                    { key: "onPremise", label: "On-Premise" },
                  ].map(({ key, label }) => (
                    <label key={key} className="toggle-chip" style={{
                      background: (form as any)[key] ? "var(--color-accent-subtle)" : "var(--color-bg)",
                      borderColor: (form as any)[key] ? "var(--color-accent)" : "var(--color-border)",
                      color: (form as any)[key] ? "var(--color-accent)" : "var(--color-text-muted)",
                    }}>
                      <input type="checkbox" checked={(form as any)[key]} onChange={(e) => set(key as any, e.target.checked)} />
                      {(form as any)[key] ? (
                        <Check size={14} strokeWidth={2.5} />
                      ) : (
                        <Circle size={14} strokeWidth={1.5} />
                      )}
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: "1px solid var(--color-border-light)", paddingTop: 16 }}>
                <button type="submit" className="btn btn-primary" disabled={sending}>
                  {sending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
