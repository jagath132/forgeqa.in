import { useEffect, useState, useCallback } from "react";
import { api, type PendingRegistration } from "../lib/api";
import { RefreshCw, Info, ShieldCheck, Clock, Calendar, Layout, Check, X, XCircle } from "lucide-react";

const PLAN_LABELS: Record<string, string> = { free: "Free", pro: "Pro", enterprise: "Enterprise" };
const PLAN_COLORS: Record<string, string> = {
  free: "var(--color-text-muted)",
  pro: "var(--color-accent)",
  enterprise: "var(--color-warning)",
};

export function VerificationsPage() {
  const [items, setItems] = useState<PendingRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [filter, setFilter] = useState<"pending_verification" | "all">("pending_verification");
  const [selectedItem, setSelectedItem] = useState<PendingRegistration | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      const res = await api.get<{ registrations: PendingRegistration[] }>(`/api/admin/verifications?${params}`);
      setItems(res.data.registrations);
    } catch {
      showToast("error", "Failed to load registrations");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  async function handleApprove(item: PendingRegistration) {
    setActionLoading(item.pendingId);
    try {
      await api.post("/api/admin/verifications/approve", { pendingId: item.pendingId });
      showToast("success", `Approved — product key sent to ${item.email}`);
      await load();
    } catch (err: any) {
      showToast("error", err?.response?.data?.error || "Failed to approve");
    }
    setActionLoading(null);
  }

  async function handleReject(item: PendingRegistration, reason: string) {
    setActionLoading(item.pendingId);
    try {
      await api.post("/api/admin/verifications/reject", { pendingId: item.pendingId, reason });
      showToast("success", `Rejected registration for ${item.email}`);
      setSelectedItem(null);
      setRejectReason("");
      await load();
    } catch (err: any) {
      showToast("error", err?.response?.data?.error || "Failed to reject");
    }
    setActionLoading(null);
  }

  const pendingCount = items.filter((i) => i.status === "pending_verification").length;

  return (
    <div>
      <div className="section-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h3>Pending Verifications</h3>
          {pendingCount > 0 && (
            <span style={{
              background: "var(--color-warning-subtle)",
              color: "var(--color-warning)",
              borderRadius: 20,
              padding: "2px 10px",
              fontSize: 12,
              fontWeight: 600,
              border: "1px solid rgba(217,119,6,0.2)",
            }}>
              {pendingCount} pending
            </span>
          )}
        </div>
        <button className="btn btn-secondary" onClick={load}>
          <RefreshCw size={14} strokeWidth={2} />
          Refresh
        </button>
      </div>

      <div className="info-banner">
        <Info size={18} className="info-banner-icon" strokeWidth={2} />
        <div>
          <div className="info-banner-title">Manual Verification Required</div>
          <div className="info-banner-text">
            All new registrations require admin approval. <strong>Approve</strong> generates a key and emails it automatically. <strong>Reject</strong> sends a denial notice.
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="pill-group">
          <button className={`pill${filter === "pending_verification" ? " active" : ""}`} onClick={() => setFilter("pending_verification")}>
            Awaiting Review
          </button>
          <button className={`pill${filter === "all" ? " active" : ""}`} onClick={() => setFilter("all")}>
            All Registrations
          </button>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <div style={{ width: 24, height: 24, border: "2px solid var(--color-accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "lm-spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <p>Loading registrations...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <ShieldCheck size={40} strokeWidth={1.5} className="empty-state-icon" />
          <h3>{filter === "pending_verification" ? "All Clear!" : "No Registrations"}</h3>
          <p>{filter === "pending_verification" ? "No pending verifications at this time." : "No registration records found."}</p>
        </div>
      ) : (
        <div className="verification-queue">
          {items.map((item) => (
            <div key={item.pendingId} className="verification-card">
              <div className="verification-avatar" style={{
                background: item.plan ? PLAN_COLORS[item.plan] + "18" : "var(--color-elevated)",
                color: item.plan ? PLAN_COLORS[item.plan] : "var(--color-text-muted)",
              }}>
                {(item.name || item.email).charAt(0).toUpperCase()}
              </div>
              <div className="verification-info">
                <div className="name">{item.name || "—"}</div>
                <div className="email">{item.email}</div>
                <div className="verification-meta">
                  <div className="verification-meta-item">
                    <Clock size={14} strokeWidth={2} />
                    <span style={{ color: item.plan ? PLAN_COLORS[item.plan] : "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", fontSize: 11, letterSpacing: "0.05em" }}>
                      {item.plan ? PLAN_LABELS[item.plan] : "—"}
                    </span>
                  </div>
                  <div className="verification-meta-item">
                    <Calendar size={14} strokeWidth={2} />
                    {new Date(item.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                  <div className="verification-meta-item">
                    <Layout size={14} strokeWidth={2} />
                    <span className={`badge badge-${item.paymentStatus === "completed" ? "used" : "available"}`} style={{ fontSize: 10 }}>
                      {item.paymentStatus}
                    </span>
                  </div>
                  <div className="verification-meta-item">
                    <span className={`badge ${item.status === "pending_verification" ? "badge-warning" : item.status === "ready" ? "badge-used" : "badge-available"}`} style={{ fontSize: 10 }}>
                      {item.status === "pending_verification" ? "Awaiting" : item.status}
                    </span>
                  </div>
                </div>
              </div>
              {item.status === "pending_verification" ? (
                <div className="verification-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={actionLoading === item.pendingId}
                    onClick={() => handleApprove(item)}
                    title="Approve and send product key"
                  >
                    {actionLoading === item.pendingId ? (
                      <div style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "lm-spin 0.8s linear infinite" }} />
                    ) : (
                      <Check size={13} strokeWidth={2.5} />
                    )}
                    Approve
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    disabled={actionLoading === item.pendingId}
                    onClick={() => { setSelectedItem(item); setRejectReason(""); }}
                    title="Reject this registration"
                  >
                    <X size={13} strokeWidth={2.5} />
                    Reject
                  </button>
                </div>
              ) : (
                <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontStyle: "italic", flexShrink: 0, marginTop: 4 }}>
                  {item.status === "ready" ? "Approved" : item.status}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3>Reject Registration</h3>
              <button className="modal-close" onClick={() => setSelectedItem(null)}>
                <X size={18} strokeWidth={2} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 16, padding: "12px 16px", background: "var(--color-bg)", borderRadius: "var(--radius)", border: "1px solid var(--color-border)" }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, color: "var(--color-text-primary)" }}>{selectedItem.name}</div>
                <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{selectedItem.email}</div>
                {selectedItem.plan && (
                  <div style={{ fontSize: 11, color: PLAN_COLORS[selectedItem.plan], fontWeight: 600, marginTop: 4, textTransform: "uppercase" }}>
                    {PLAN_LABELS[selectedItem.plan]} Plan
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Reason for Rejection (optional)</label>
                <textarea
                  className="form-input"
                  placeholder="e.g. Unable to verify identity, suspicious activity..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                />
                <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 4 }}>
                  This reason will be included in the rejection email.
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setSelectedItem(null)}>Cancel</button>
              <button
                className="btn btn-danger"
                disabled={actionLoading === selectedItem.pendingId}
                onClick={() => handleReject(selectedItem, rejectReason)}
              >
                {actionLoading === selectedItem.pendingId ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === "success" ? (
              <Check size={18} strokeWidth={2} />
            ) : (
              <XCircle size={18} strokeWidth={2} />
            )}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
