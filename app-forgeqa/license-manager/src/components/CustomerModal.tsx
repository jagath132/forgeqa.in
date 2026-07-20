import { useEffect, useState, type FormEvent } from "react";
import { api, type Customer } from "../lib/api";
import { X, Check, AlertCircle, Loader2, PenSquare, Trash2 } from "lucide-react";

type Tab = "details" | "edit";

interface Props {
  customerId: string;
  onClose: () => void;
  onUpdated: () => void;
}

export function CustomerModal({ customerId, onClose, onUpdated }: Props) {
  const [tab, setTab] = useState<Tab>("details");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [role, setRole] = useState("");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    api.get<{ customer: Customer }>(`/api/admin/customers?id=${customerId}`)
      .then((r) => {
        setCustomer(r.data.customer);
        setRole(r.data.customer.role || "Member");
        setNotes(r.data.customer.notes || "");
      })
      .catch(() => showToast("error", "Failed to load customer"))
      .finally(() => setLoading(false));
  }, [customerId]);

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await api.put(`/api/admin/customers/${customerId}`, { role, notes });
      showToast("success", "Customer updated");
      setTimeout(onUpdated, 800);
    } catch (err: any) {
      showToast("error", err?.response?.data?.error || "Update failed");
    }
    setSending(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete customer ${customer?.email}? Their keys will be released. This cannot be undone.`)) return;
    setSending(true);
    try {
      await api.delete(`/api/admin/customers/${customerId}`);
      showToast("success", "Customer deleted");
      setTimeout(onUpdated, 800);
    } catch (err: any) {
      showToast("error", err?.response?.data?.error || "Delete failed");
    }
    setSending(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <h3>Customer</h3>
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

        {loading ? (
          <div className="modal-body" style={{ textAlign: "center", padding: "40px 24px" }}>
            <Loader2 size={24} className="lm-spin" strokeWidth={2} />
          </div>
        ) : !customer ? (
          <div className="modal-body" style={{ textAlign: "center", padding: "40px 24px", color: "var(--color-text-muted)" }}>
            Customer not found.
          </div>
        ) : (
          <>
            <div className="modal-tabs">
              {(["details", "edit"] as const).map((t) => (
                <button key={t} className={`modal-tab${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
                  {t === "details" ? "Customer Details" : "Edit Customer"}
                </button>
              ))}
            </div>

            <div className="modal-body">
              {tab === "details" && (
                <div className="details-section">
                  <div style={{ textAlign: "center", padding: "8px 0" }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center",
                      background: "var(--color-accent-subtle)", color: "var(--color-accent)", fontSize: 18, fontWeight: 700,
                    }}>
                      {customer.email.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>{customer.email}</div>
                    {customer.name && <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{customer.name}</div>}
                  </div>

                  <div className="modal-info-grid">
                    <span className="label">Role</span>
                    <span className="value"><span className={`badge ${customer.role === "admin" ? "badge-used" : "badge-available"}`}>{customer.role}</span></span>

                    <span className="label">Notes</span>
                    <span className={customer.notes ? "value" : "value muted"}>{customer.notes || "-"}</span>

                    <span className="label">Product Key</span>
                    <span className="text-mono" style={{ fontSize: 12, letterSpacing: 1, color: customer.productKey ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
                      {customer.productKey || "-"}
                    </span>

                    <span className="label">Key Status</span>
                    <span className="value">
                      {customer.keyStatus ? (
                        <span className={`badge badge-${customer.keyStatus}`} style={{ fontSize: 11 }}>{customer.keyStatus}</span>
                      ) : <span style={{ color: "var(--color-text-muted)", fontSize: 12 }}>-</span>}
                    </span>

                    <span className="label">Registered</span>
                    <span className="value">{new Date(customer.createdAt).toLocaleString()}</span>
                  </div>

                  {customer.keys.length > 1 && (
                    <div style={{ borderTop: "1px solid var(--color-border-light)", paddingTop: 12 }}>
                      <div className="section-title">All Keys ({customer.keys.length})</div>
                      {customer.keys.map((k) => (
                        <div key={k.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 12 }}>
                          <span className={`badge badge-${k.status}`} style={{ fontSize: 10, minWidth: 48, textAlign: "center" }}>{k.status}</span>
                          <span className="text-mono" style={{ letterSpacing: 1, color: "var(--color-text-primary)" }}>{k.key}</span>
                          <span style={{ color: "var(--color-text-muted)", marginLeft: "auto" }}>{new Date(k.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))}
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
              )}

              {tab === "edit" && (
                <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div className="form-group">
                    <label>Role</label>
                    <select className="form-input" value={role} onChange={(e) => setRole(e.target.value)}>
                      <option value="Member">Member</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Notes</label>
                    <textarea className="form-input" value={notes} onChange={(e) => setNotes(e.target.value)}
                      placeholder="Internal notes about this customer..."
                      rows={3}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", borderTop: "1px solid var(--color-border-light)", paddingTop: 16 }}>
                    <button type="submit" className="btn btn-primary" disabled={sending}>
                      {sending ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
