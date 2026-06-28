import { useEffect, useState, useCallback } from "react";
import { api, type ProductKey } from "../lib/api";
import { Plus, X, Search, Check, Copy, Mail, AlertCircle, Eye, Edit3, Ban, KeyRound } from "lucide-react";

export function KeysPage() {
  const [keys, setKeys] = useState<ProductKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [genCount, setGenCount] = useState(10);
  const [genEmail, setGenEmail] = useState("");
  const [genNotes, setGenNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [selectedKey, setSelectedKey] = useState<ProductKey | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [detailKey, setDetailKey] = useState<ProductKey | null>(null);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  async function loadKeys() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (emailFilter) params.set("email", emailFilter);
      const res = await api.get<{ keys: ProductKey[] }>(`/api/admin/keys?${params}`);
      setKeys(res.data.keys);
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => {
    loadKeys();
    const interval = setInterval(loadKeys, 30000);
    return () => clearInterval(interval);
  }, [statusFilter, emailFilter]);

  async function handleGenerate() {
    try {
      const payload: any = { count: genCount };
      if (genEmail.trim()) payload.customerEmail = genEmail.trim();
      if (genNotes.trim()) payload.notes = genNotes.trim();
      await api.post("/api/admin/keys/generate", payload);
      setShowGenerate(false);
      setGenCount(10);
      setGenEmail("");
      setGenNotes("");
      await loadKeys();
      showToast("success", `Generated ${genCount} product key${genCount > 1 ? "s" : ""}`);
    } catch (err: any) {
      showToast("error", err?.response?.data?.error || "Failed to generate keys");
    }
  }

  async function handleRevoke(key: string) {
    if (!confirm(`Revoke key ${key}?`)) return;
    try {
      await api.post("/api/admin/keys/revoke", { key });
      await loadKeys();
      showToast("success", "Key revoked");
    } catch (err: any) {
      showToast("error", err?.response?.data?.error || "Failed to revoke key");
    }
  }

  async function handleSendEmail(key: ProductKey) {
    const email = prompt("Send product key to email:", key.customerEmail || "");
    if (!email) return;
    try {
      await api.post("/api/admin/email/send", { to: email, productKey: key.key, customerName: email.split("@")[0] });
      showToast("success", "Email sent");
    } catch (err: any) {
      showToast("error", err?.response?.data?.error || "Failed to send email");
    }
  }

  async function handleCopy(keyStr: string) {
    try {
      await navigator.clipboard.writeText(keyStr);
      setCopiedKey(keyStr);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch { /* fallback */ }
  }

  const FILTERS = [
    { label: "All", value: "" },
    { label: "Available", value: "available" },
    { label: "Used", value: "used" },
    { label: "Expired", value: "expired" },
  ];

  return (
    <div>
      <div className="section-header">
        <h3>Product Keys</h3>
        <button className="btn btn-primary" onClick={() => setShowGenerate(true)}>
          <Plus size={14} strokeWidth={2.5} />
          Generate Keys
        </button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <div className="pill-group">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  className={`pill${statusFilter === f.value ? " active" : ""}`}
                  onClick={() => setStatusFilter(f.value)}
                >
                  {f.label}
                  {f.value && keys.length > 0 && statusFilter === f.value && ` (${keys.length})`}
                </button>
              ))}
            </div>
          </div>
          <div className="table-toolbar-right">
            <div className="form-search">
              <Search size={16} className="form-search-icon" strokeWidth={2} />
              <input
                className="form-input"
                placeholder="Search email..."
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
                style={{ width: 200 }}
              />
            </div>
          </div>
        </div>
      </div>

      {showGenerate && (
        <div className="modal-overlay" onClick={() => setShowGenerate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Generate Product Keys</h3>
              <button className="modal-close" onClick={() => setShowGenerate(false)}>
                <X size={16} strokeWidth={2} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Number of Keys</label>
                <input className="form-input" type="number" min={1} max={1000} value={genCount} onChange={(e) => setGenCount(parseInt(e.target.value) || 1)} />
              </div>
              <div className="form-group">
                <label>Assign to Email (optional)</label>
                <input className="form-input" type="email" placeholder="customer@example.com" value={genEmail} onChange={(e) => setGenEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Notes (optional)</label>
                <input className="form-input" placeholder="Purchase order, campaign, etc." value={genNotes} onChange={(e) => setGenNotes(e.target.value)} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowGenerate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleGenerate}>Generate</button>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="empty-state"><p>Loading keys...</p></div>
        ) : keys.length === 0 ? (
          <div className="empty-state">
            <KeyRound size={40} strokeWidth={1.5} className="empty-state-icon" />
            <h3>No product keys yet</h3>
            <p>Generate your first batch of keys to get started.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product Key</th>
                  <th>Status</th>
                  <th>Customer</th>
                  <th>Registered</th>
                  <th>Created</th>
                  <th>Used At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id} style={{ cursor: "pointer" }} onClick={() => setDetailKey(k)}>
                    <td>
                      <div className="key-cell">
                        <button className={`key-copy-btn${copiedKey === k.key ? " copied" : ""}`}
                          onClick={(e) => { e.stopPropagation(); handleCopy(k.key); }}
                          title={copiedKey === k.key ? "Copied!" : "Copy to clipboard"}>
                          {copiedKey === k.key ? (
                            <Check size={12} strokeWidth={2.5} />
                          ) : (
                            <Copy size={12} strokeWidth={2} />
                          )}
                        </button>
                        <span className="key-value">{k.key}</span>
                      </div>
                    </td>
                    <td><span className={`badge badge-${k.status}`}>{k.status}</span></td>
                    <td>{k.customerEmail || <span style={{ color: "var(--color-text-muted)" }}>-</span>}</td>
                    <td>{k.registeredEmail || <span style={{ color: "var(--color-text-muted)" }}>-</span>}</td>
                    <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>{new Date(k.createdAt).toLocaleDateString()}</td>
                    <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>{k.usedAt ? new Date(k.usedAt).toLocaleDateString() : <span style={{ color: "var(--color-text-muted)" }}>-</span>}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: 4 }}>
                        {k.status === "available" && (
                          <>
                            <button className="btn btn-sm btn-secondary" onClick={() => handleSendEmail(k)} title="Send via email">
                              <Mail size={12} strokeWidth={2} />
                              Email
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleRevoke(k.key)} title="Revoke this key">
                              <Ban size={12} strokeWidth={2} />
                              Revoke
                            </button>
                          </>
                        )}
                        <button className="btn btn-sm btn-secondary" onClick={() => setDetailKey(k)} title="View details">
                          <Eye size={12} strokeWidth={2} />
                          Details
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

      {detailKey && (
        <>
          <div className="drawer-overlay" onClick={() => setDetailKey(null)} />
          <div className="drawer-panel">
            <div className="drawer-header">
              <h3>Key Details</h3>
              <button className="modal-close" onClick={() => setDetailKey(null)}>
                <X size={16} strokeWidth={2} />
              </button>
            </div>
            <div className="drawer-body">
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div className="text-mono" style={{
                  fontSize: 16, fontWeight: 700, letterSpacing: 3,
                  color: "var(--color-accent)", background: "var(--color-accent-subtle)", borderRadius: "var(--radius)",
                  padding: "10px 16px", display: "inline-block", wordBreak: "break-all",
                }}>
                  {detailKey.key}
                </div>
                <div style={{ marginTop: 8 }}>
                  <button className="key-copy-btn" onClick={() => handleCopy(detailKey.key)} title="Copy key" style={{ width: "auto", padding: "4px 12px", gap: 6 }}>
                    {copiedKey === detailKey.key ? (
                      <><Check size={12} strokeWidth={2.5} /> Copied</>
                    ) : (
                      <><Copy size={12} strokeWidth={2} /> Copy</>
                    )}
                  </button>
                </div>
              </div>

              <div className="modal-info-grid">
                <span className="label">Status</span>
                <span className="value"><span className={`badge badge-${detailKey.status}`} style={{ fontSize: 11 }}>{detailKey.status}</span></span>

                <span className="label">Customer Email</span>
                <span className={detailKey.customerEmail ? "value" : "value muted"}>{detailKey.customerEmail || "-"}</span>

                <span className="label">Registered Email</span>
                <span className={detailKey.registeredEmail ? "value" : "value muted"}>{detailKey.registeredEmail || "-"}</span>

                <span className="label">Notes</span>
                <span className={detailKey.notes ? "value" : "value muted"}>{detailKey.notes || "-"}</span>

                <span className="label">Created</span>
                <span className="value">{new Date(detailKey.createdAt).toLocaleString()}</span>

                {detailKey.usedAt && (
                  <>
                    <span className="label">Used At</span>
                    <span className="value">{new Date(detailKey.usedAt).toLocaleString()}</span>
                  </>
                )}

                {detailKey.expiresAt && (
                  <>
                    <span className="label">Expires</span>
                    <span className="value">{new Date(detailKey.expiresAt).toLocaleString()}</span>
                  </>
                )}
              </div>

              <div className="action-row" style={{ marginTop: 24 }}>
                <button className="btn btn-primary btn-sm" onClick={() => { setSelectedKey(detailKey); setDetailKey(null); }}>
                  <Edit3 size={12} strokeWidth={2} />
                  Edit Key
                </button>
                {detailKey.status === "available" && (
                  <>
                    <button className="btn btn-primary btn-sm" onClick={() => handleSendEmail(detailKey)}>
                      <Mail size={12} strokeWidth={2} />
                      Send Email
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleRevoke(detailKey.key)}>
                      <Ban size={12} strokeWidth={2} />
                      Revoke
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {selectedKey && (
        <div className="modal-overlay" onClick={() => setSelectedKey(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3>Edit Key</h3>
              <button className="modal-close" onClick={() => setSelectedKey(null)}>
                <X size={16} strokeWidth={2} />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={async (e) => { e.preventDefault(); }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="form-group">
                  <label>Notes</label>
                  <input className="form-input" defaultValue={selectedKey.notes || ""} id="key-notes" placeholder="Purchase order, campaign, etc." />
                </div>
                <div className="form-group">
                  <label>Customer Email</label>
                  <input className="form-input" type="email" defaultValue={selectedKey.customerEmail || ""} id="key-email" placeholder="customer@example.com" />
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", borderTop: "1px solid var(--color-border-light)", paddingTop: 16 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setSelectedKey(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" onClick={async () => {
                    const notes = (document.getElementById("key-notes") as HTMLInputElement).value;
                    const customerEmail = (document.getElementById("key-email") as HTMLInputElement).value;
                    try {
                      await api.put(`/api/admin/keys/${selectedKey.id}`, { notes, customerEmail });
                      showToast("success", "Key updated");
                      setSelectedKey(null);
                      await loadKeys();
                    } catch (err: any) {
                      showToast("error", err?.response?.data?.error || "Update failed");
                    }
                  }}>
                    Save Changes
                  </button>
                </div>
              </form>
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
              <AlertCircle size={18} strokeWidth={2} />
            )}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}

