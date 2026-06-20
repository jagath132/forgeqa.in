import { useState, type FormEvent } from "react";
import { api, type Plan } from "../lib/api";

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
  free: { color: "var(--text-muted)", bg: "transparent" },
  pro: { color: "var(--accent)", bg: "var(--accent-soft)" },
  enterprise: { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" },
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

  const formatPrice = (cents: number) => {
    if (cents === 0) return "Free";
    return `$${(cents / 100).toFixed(2)}`;
  };

  const accent = ACCENT_RECIPE[form.id] || { color: "var(--accent)", bg: "var(--accent-soft)" };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{mode === "create" ? "Create Plan" : form.name}</h3>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {toast && (
          <div style={{ padding: "0 24px", marginTop: 8 }}>
            <div style={{
              padding: "10px 14px", borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", gap: 8,
              background: toast.type === "success" ? "var(--success-soft)" : "var(--danger-soft)",
              color: toast.type === "success" ? "var(--success)" : "var(--danger)",
              border: `1px solid ${toast.type === "success" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
            }}>
              {toast.type === "success" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="20 6 9 17 4 12" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
              )}
              {toast.message}
            </div>
          </div>
        )}

        {mode === "edit" && (
          <div style={{ display: "flex", gap: 0, padding: "16px 24px 0", borderBottom: "1px solid var(--border-default)" }}>
            {(["details", "edit"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                style={{
                  padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", background: "none",
                  color: tab === t ? "var(--accent)" : "var(--text-muted)", border: "none",
                  borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
                  transition: "color 0.15s, border-color 0.15s",
                }}
              >
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
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>Pricing</label>
                <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr", gap: 10 }}>
                  <div className="form-group">
                    <label style={{ fontSize: 11 }}>Price (cents)</label>
                    <input className="form-input" type="number" min={0} value={form.price} onChange={(e) => set("price", parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: 11 }}>Currency</label>
                    <select className="form-input" value={form.currency} onChange={(e) => set("currency", e.target.value)}>
                      <option value="usd">USD</option>
                      <option value="eur">EUR</option>
                      <option value="inr">INR</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: 11 }}>Period</label>
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
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>Limits</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div className="form-group">
                    <label style={{ fontSize: 11 }}>Max Users</label>
                    <input className="form-input" type="number" min={0} value={form.maxUsers ?? ""} onChange={(e) => set("maxUsers", e.target.value ? parseInt(e.target.value) : null)} placeholder="Unlimited" />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: 11 }}>Max Test Cases/mo</label>
                    <input className="form-input" type="number" min={0} value={form.maxTestCases ?? ""} onChange={(e) => set("maxTestCases", e.target.value ? parseInt(e.target.value) : null)} placeholder="Unlimited" />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: 11 }}>AI Providers</label>
                    <input className="form-input" type="number" min={0} value={form.aiProviders ?? ""} onChange={(e) => set("aiProviders", e.target.value ? parseInt(e.target.value) : null)} placeholder="Unlimited" />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>Settings</label>
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
                    <label key={key} style={{
                      display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer",
                      padding: "6px 12px", borderRadius: 8,
                      background: (form as any)[key] ? "var(--accent-soft)" : "var(--bg-secondary)",
                      border: `1px solid ${(form as any)[key] ? "var(--accent)" : "var(--border-default)"}`,
                      color: (form as any)[key] ? "var(--accent)" : "var(--text-muted)",
                      transition: "all 0.15s",
                    }}>
                      <input type="checkbox" checked={(form as any)[key]} onChange={(e) => set(key as any, e.target.checked)} style={{ display: "none" }} />
                      {(form as any)[key] ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12" /></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10" /></svg>
                      )}
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: "1px solid var(--border-default)", paddingTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={sending}>
                  {sending ? "Creating..." : "Create Plan"}
                </button>
              </div>
            </form>
          ) : tab === "details" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{
                borderRadius: 12, padding: "24px 20px", textAlign: "center",
                background: `linear-gradient(135deg, ${accent.bg || "var(--accent-soft)"}, transparent)`,
                border: `1px solid ${accent.bg || "var(--border-default)"}`,
                position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14, display: "inline-flex", alignItems: "center", justifyContent: "center",
                  background: accent.bg || "var(--accent-soft)", color: accent.color || "var(--accent)",
                  fontSize: 20, fontWeight: 700, marginBottom: 12,
                  border: `1px solid ${accent.color || "var(--accent)"}20`,
                }}>
                  {form.name.charAt(0)}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>{form.name}</div>
                <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 2 }}>{form.id}</div>
                <div style={{ fontSize: 32, fontWeight: 300, color: form.price === 0 ? "var(--text-muted)" : "var(--text-primary)", marginTop: 8 }}>
                  {formatPrice(form.price)}
                  <span style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 400, marginLeft: 2 }}>
                    {form.period === "forever" ? "" : `/${form.period === "yearly" ? "yr" : "mo"}`}
                  </span>
                </div>
                {form.description && (
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>{form.description}</div>
                )}
                <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
                  <span className={`badge ${form.active ? "badge-available" : "badge-expired"}`} style={{ fontSize: 11 }}>
                    {form.active ? "Active" : "Inactive"}
                  </span>
                  {form.popular && <span className="badge badge-available" style={{ fontSize: 11 }}>Popular</span>}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ padding: "12px 16px", borderRadius: 10, background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Pricing</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{form.currency.toUpperCase()} {formatPrice(form.price)}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>per {form.period}</div>
                </div>
                <div style={{ padding: "12px 16px", borderRadius: 10, background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Limits</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px", fontSize: 13 }}>
                    <span style={{ color: "var(--text-muted)" }}>Users:</span>
                    <span>{form.maxUsers !== null ? form.maxUsers : "Unlimited"}</span>
                    <span style={{ color: "var(--text-muted)" }}>Tests/mo:</span>
                    <span>{form.maxTestCases !== null ? form.maxTestCases.toLocaleString() : "Unlimited"}</span>
                    <span style={{ color: "var(--text-muted)" }}>AI Providers:</span>
                    <span>{form.aiProviders !== null ? form.aiProviders : "Unlimited"}</span>
                  </div>
                </div>
              </div>

              {form.features.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Features ({form.features.length})
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {form.features.map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, background: "var(--bg-secondary)", fontSize: 13 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth={2.5} style={{ flexShrink: 0 }}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {form.advancedExport || form.regressionTesting || form.prioritySupport || form.customIntegrations || form.onPremise ? (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Capabilities
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {form.advancedExport && <span className="badge badge-available" style={{ fontSize: 11 }}>Advanced Export</span>}
                    {form.regressionTesting && <span className="badge badge-available" style={{ fontSize: 11 }}>Regression Testing</span>}
                    {form.prioritySupport && <span className="badge badge-available" style={{ fontSize: 11 }}>Priority Support</span>}
                    {form.customIntegrations && <span className="badge badge-available" style={{ fontSize: 11 }}>Custom Integrations</span>}
                    {form.onPremise && <span className="badge badge-available" style={{ fontSize: 11 }}>On-Premise</span>}
                  </div>
                </div>
              ) : null}

              <div style={{ display: "flex", gap: 8, borderTop: "1px solid var(--border-default)", paddingTop: 16 }}>
                <button className="btn btn-primary" onClick={() => setTab("edit")} style={{ fontSize: 12 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  Edit
                </button>
                <button className="btn btn-danger" onClick={handleDelete} style={{ fontSize: 12 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
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
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>Pricing</label>
                <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr", gap: 10 }}>
                  <div className="form-group">
                    <label style={{ fontSize: 11 }}>Price (cents)</label>
                    <input className="form-input" type="number" min={0} value={form.price} onChange={(e) => set("price", parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: 11 }}>Currency</label>
                    <select className="form-input" value={form.currency} onChange={(e) => set("currency", e.target.value)}>
                      <option value="usd">USD</option>
                      <option value="eur">EUR</option>
                      <option value="inr">INR</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: 11 }}>Period</label>
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
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>Limits</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div className="form-group">
                    <label style={{ fontSize: 11 }}>Max Users</label>
                    <input className="form-input" type="number" min={0} value={form.maxUsers ?? ""} onChange={(e) => set("maxUsers", e.target.value ? parseInt(e.target.value) : null)} placeholder="Unlimited" />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: 11 }}>Max Test Cases/mo</label>
                    <input className="form-input" type="number" min={0} value={form.maxTestCases ?? ""} onChange={(e) => set("maxTestCases", e.target.value ? parseInt(e.target.value) : null)} placeholder="Unlimited" />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: 11 }}>AI Providers</label>
                    <input className="form-input" type="number" min={0} value={form.aiProviders ?? ""} onChange={(e) => set("aiProviders", e.target.value ? parseInt(e.target.value) : null)} placeholder="Unlimited" />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>Settings</label>
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
                    <label key={key} style={{
                      display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer",
                      padding: "6px 12px", borderRadius: 8,
                      background: (form as any)[key] ? "var(--accent-soft)" : "var(--bg-secondary)",
                      border: `1px solid ${(form as any)[key] ? "var(--accent)" : "var(--border-default)"}`,
                      color: (form as any)[key] ? "var(--accent)" : "var(--text-muted)",
                      transition: "all 0.15s",
                    }}>
                      <input type="checkbox" checked={(form as any)[key]} onChange={(e) => set(key as any, e.target.checked)} style={{ display: "none" }} />
                      {(form as any)[key] ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12" /></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10" /></svg>
                      )}
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: "1px solid var(--border-default)", paddingTop: 16 }}>
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
