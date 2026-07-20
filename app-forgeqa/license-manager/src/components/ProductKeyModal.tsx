import { useState, type FormEvent } from "react";
import { api, type ProductKey } from "../lib/api";
import { X, Check, AlertCircle, PenSquare, Mail, Ban, Trash2 } from "lucide-react";

type Tab = "details" | "edit";

interface Props {
  keyData: ProductKey;
  onClose: () => void;
  onUpdated: () => void;
}

export function ProductKeyModal({ keyData, onClose, onUpdated }: Props) {
  const [tab, setTab] = useState<Tab>("details");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [notes, setNotes] = useState(keyData.notes || "");
  const [customerEmail, setCustomerEmail] = useState(keyData.customerEmail || "");
  const [sending, setSending] = useState(false);
  const [sendEmail, setSendEmail] = useState(keyData.customerEmail || "");

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await api.put(`/api/admin/keys/${keyData.id}`, { notes, customerEmail });
      showToast("success", "Key updated");
      setTimeout(onUpdated, 800);
    } catch (err: any) {
      showToast("error", err?.response?.data?.error || "Update failed");
    }
    setSending(false);
  }

  async function handleRevoke() {
    if (!confirm(`Revoke key ${keyData.key}?`)) return;
    setSending(true);
    try {
      await api.post("/api/admin/keys/revoke", { key: keyData.key });
      showToast("success", "Key revoked");
      setTimeout(onUpdated, 800);
    } catch (err: any) {
      showToast("error", err?.response?.data?.error || "Revoke failed");
    }
    setSending(false);
  }

  async function handleDelete() {
    if (!confirm(`Permanently delete key ${keyData.key}? This cannot be undone.`)) return;
    setSending(true);
    try {
      await api.delete(`/api/admin/keys/${keyData.id}`);
      showToast("success", "Key deleted");
      setTimeout(onUpdated, 800);
    } catch (err: any) {
      showToast("error", err?.response?.data?.error || "Delete failed");
    }
    setSending(false);
  }

  async function handleSendEmail() {
    const email = sendEmail || prompt("Send product key to email:", keyData.customerEmail || "");
    if (!email) return;
    setSending(true);
    try {
      await api.post("/api/admin/email/send", { to: email, productKey: keyData.key, customerName: email.split("@")[0] });
      showToast("success", `Email sent to ${email}`);
    } catch (err: any) {
      showToast("error", err?.response?.data?.error || "Failed to send email");
    }
    setSending(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h3>Product Key</h3>
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

        <div className="modal-tabs">
          {(["details", "edit"] as const).map((t) => (
            <button key={t} className={`modal-tab${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
              {t === "details" ? "Key Details" : "Edit Key"}
            </button>
          ))}
        </div>

        <div className="modal-body">
          {tab === "details" && (
            <div className="details-section">
              <div style={{ textAlign: "center", padding: "12px 0" }}>
                <div className="text-mono" style={{
                  fontSize: 17, fontWeight: 700, letterSpacing: 3,
                  color: "var(--color-accent)", background: "var(--color-accent-subtle)", borderRadius: "var(--radius)",
                  padding: "10px 16px", display: "inline-block",
                }}>
                  {keyData.key}
                </div>
              </div>

              <div className="modal-info-grid">
                <span className="label">Status</span>
                <span className="value"><span className={`badge badge-${keyData.status}`} style={{ fontSize: 11 }}>{keyData.status}</span></span>

                <span className="label">Customer Email</span>
                <span className={keyData.customerEmail ? "value" : "value muted"}>{keyData.customerEmail || "-"}</span>

                <span className="label">Registered Email</span>
                <span className={keyData.registeredEmail ? "value" : "value muted"}>{keyData.registeredEmail || "-"}</span>

                <span className="label">Notes</span>
                <span className={keyData.notes ? "value" : "value muted"}>{keyData.notes || "-"}</span>

                <span className="label">Created</span>
                <span className="value">{new Date(keyData.createdAt).toLocaleString()}</span>

                {keyData.usedAt && (
                  <>
                    <span className="label">Used At</span>
                    <span className="value">{new Date(keyData.usedAt).toLocaleString()}</span>
                  </>
                )}

                {keyData.expiresAt && (
                  <>
                    <span className="label">Expires</span>
                    <span className="value">{new Date(keyData.expiresAt).toLocaleString()}</span>
                  </>
                )}
              </div>

              <div className="action-row">
                {keyData.status === "available" && (
                  <>
                    <button className="btn btn-primary btn-sm" onClick={() => setTab("edit")}>
                      <PenSquare size={12} strokeWidth={2} />
                      Edit
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={handleSendEmail}>
                      <Mail size={12} strokeWidth={2} />
                      Send Email
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={handleRevoke}>
                      <Ban size={12} strokeWidth={2} />
                      Revoke
                    </button>
                  </>
                )}
                <button className="btn btn-danger btn-sm" onClick={handleDelete} style={{ opacity: 0.8 }}>
                  <Trash2 size={12} strokeWidth={2} />
                  Delete
                </button>
              </div>
            </div>
          )}

          {tab === "edit" && (
            <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="form-group">
                <label>Notes</label>
                <input className="form-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Purchase order, campaign, etc." />
              </div>
              <div className="form-group">
                <label>Customer Email</label>
                <input className="form-input" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="customer@example.com" />
              </div>
              <div className="form-group">
                <label>Send Key To (email)</label>
                <input className="form-input" type="email" value={sendEmail} onChange={(e) => setSendEmail(e.target.value)} placeholder="recipient@example.com" />
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleSendEmail} style={{ marginTop: 8 }}>
                  Send Email
                </button>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", borderTop: "1px solid var(--color-border-light)", paddingTop: 16 }}>
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
