import { useEffect, useState, useCallback } from "react";
import { api, type PendingRegistration } from "../lib/api";

const PLAN_LABELS: Record<string, string> = { free: "Free", pro: "Pro", enterprise: "Enterprise" };
const PLAN_COLORS: Record<string, string> = {
  free: "var(--text-muted)",
  pro: "var(--accent)",
  enterprise: "#f59e0b",
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
      showToast("error", "Failed to load pending registrations");
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  async function handleApprove(item: PendingRegistration) {
    setActionLoading(item.pendingId);
    try {
      await api.post("/api/admin/verifications/approve", { pendingId: item.pendingId });
      showToast("success", `Approved — product key sent to ${item.email}`);
      await load();
    } catch (err: any) {
      showToast("error", err?.response?.data?.error || "Failed to approve registration");
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
      showToast("error", err?.response?.data?.error || "Failed to reject registration");
    }
    setActionLoading(null);
  }

  const pendingCount = items.filter((i) => i.status === "pending_verification").length;

  return (
    <div>
      {/* Header */}
      <div className="section-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h3>Pending Verifications</h3>
          {pendingCount > 0 && (
            <span style={{
              background: "linear-gradient(135deg, #f59e0b, #ef4444)",
              color: "#fff",
              borderRadius: 20,
              padding: "2px 10px",
              fontSize: 12,
              fontWeight: 700,
            }}>
              {pendingCount} pending
            </span>
          )}
        </div>
        <button className="btn btn-secondary" onClick={load}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
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

      {/* Info Banner */}
      <div style={{
        background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.06))",
        border: "1px solid rgba(99,102,241,0.2)",
        borderRadius: 10,
        padding: "14px 18px",
        marginBottom: 20,
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinecap="round" style={{ marginTop: 1, flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", marginBottom: 3 }}>
            Manual Verification Required
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
            All new registrations require admin approval before a product key is issued. When you <strong>Approve</strong> a request, a key is generated and emailed automatically. <strong>Reject</strong> sends a denial notice.
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="empty-state">
            <div style={{ width: 28, height: 28, border: "3px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "lm-spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <p>Loading registrations...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3>{filter === "pending_verification" ? "All Clear!" : "No Registrations"}</h3>
            <p>{filter === "pending_verification" ? "No pending verifications at this time." : "No registration records found."}</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Plan</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.pendingId}>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{item.name || "—"}</span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.email}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        color: item.plan ? PLAN_COLORS[item.plan] : "var(--text-muted)",
                        fontWeight: 600,
                        fontSize: 12,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}>
                        {item.plan ? PLAN_LABELS[item.plan] : "—"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${item.paymentStatus === "completed" ? "used" : "available"}`}>
                        {item.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${item.status === "pending_verification" ? "badge-warning" : item.status === "ready" ? "badge-used" : "badge-available"}`}
                        style={item.status === "pending_verification" ? {
                          background: "rgba(245,158,11,0.15)",
                          color: "#f59e0b",
                          border: "1px solid rgba(245,158,11,0.3)",
                        } : {}}>
                        {item.status === "pending_verification" ? "⏳ Awaiting" : item.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, whiteSpace: "nowrap", color: "var(--text-muted)" }}>
                      {new Date(item.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                    </td>
                    <td>
                      {item.status === "pending_verification" ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="btn btn-sm btn-primary"
                            disabled={actionLoading === item.pendingId}
                            onClick={() => handleApprove(item)}
                            title="Approve and send product key"
                          >
                            {actionLoading === item.pendingId ? (
                              <div style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "lm-spin 0.8s linear infinite" }} />
                            ) : (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                            Approve
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            disabled={actionLoading === item.pendingId}
                            onClick={() => { setSelectedItem(item); setRejectReason(""); }}
                            title="Reject this registration"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
                          {item.status === "ready" ? "✓ Approved" : item.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3>Reject Registration</h3>
              <button className="modal-close" onClick={() => setSelectedItem(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 16, padding: "12px 16px", background: "var(--bg-tertiary)", borderRadius: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{selectedItem.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{selectedItem.email}</div>
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
                  placeholder="e.g. Unable to verify identity, suspicious activity, duplicate account..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  style={{ resize: "vertical", fontFamily: "inherit" }}
                />
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                  This reason will be included in the rejection email sent to the user.
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

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === "success" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="20 6 9 17 4 12" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
            )}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
