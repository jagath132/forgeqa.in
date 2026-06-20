import { useEffect, useState, type FormEvent } from "react";
import { api, type Customer } from "../lib/api";

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

        {loading ? (
          <div className="modal-body" style={{ textAlign: "center", padding: "40px 24px" }}>
            <span className="h-5 w-5 rounded-full border-2 border-transparent border-t-current animate-spin" style={{ display: "inline-block", color: "var(--text-muted)" }} />
          </div>
        ) : !customer ? (
          <div className="modal-body" style={{ textAlign: "center", padding: "40px 24px", color: "var(--text-muted)" }}>
            Customer not found.
          </div>
        ) : (
          <>
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
                  {t === "details" ? "Customer Details" : "Edit Customer"}
                </button>
              ))}
            </div>

            <div className="modal-body">
              {tab === "details" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ textAlign: "center", padding: "12px 0" }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center",
                      background: "var(--accent-soft)", color: "var(--accent)", fontSize: 20, fontWeight: 700,
                    }}>
                      {customer.email.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{customer.email}</div>
                    {customer.name && <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{customer.name}</div>}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "8px 12px", fontSize: 13 }}>
                    <span style={{ color: "var(--text-muted)" }}>Role</span>
                    <span><span className={`badge ${customer.role === "admin" ? "badge-used" : "badge-available"}`}>{customer.role}</span></span>

                    <span style={{ color: "var(--text-muted)" }}>Notes</span>
                    <span style={{ color: customer.notes ? "var(--text-primary)" : "var(--text-muted)" }}>
                      {customer.notes || "-"}
                    </span>

                    <span style={{ color: "var(--text-muted)" }}>Product Key</span>
                    <span style={{ fontFamily: "monospace", fontSize: 12, letterSpacing: 1 }}>
                      {customer.productKey || <span style={{ color: "var(--text-muted)" }}>-</span>}
                    </span>

                    <span style={{ color: "var(--text-muted)" }}>Key Status</span>
                    <span>
                      {customer.keyStatus ? (
                        <span className={`badge badge-${customer.keyStatus}`} style={{ fontSize: 11 }}>{customer.keyStatus}</span>
                      ) : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>-</span>}
                    </span>

                    <span style={{ color: "var(--text-muted)" }}>Registered</span>
                    <span>{new Date(customer.createdAt).toLocaleString()}</span>
                  </div>

                  {customer.keys.length > 1 && (
                    <div style={{ borderTop: "1px solid var(--border-default)", paddingTop: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8 }}>All Keys ({customer.keys.length})</div>
                      {customer.keys.map((k) => (
                        <div key={k.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 12 }}>
                          <span className={`badge badge-${k.status}`} style={{ fontSize: 10, minWidth: 50, textAlign: "center" }}>{k.status}</span>
                          <span style={{ fontFamily: "monospace", letterSpacing: 1, color: "var(--text-primary)" }}>{k.key}</span>
                          <span style={{ color: "var(--text-muted)", marginLeft: "auto" }}>{new Date(k.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8, borderTop: "1px solid var(--border-default)", paddingTop: 16, marginTop: 8 }}>
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
                      rows={3} style={{ resize: "vertical" }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", borderTop: "1px solid var(--border-default)", paddingTop: 16 }}>
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