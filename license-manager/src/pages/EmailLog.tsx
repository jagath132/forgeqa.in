import { useEffect, useState } from "react";
import { api, type EmailLog, type ProductKey } from "../lib/api";
import { ProductKeyModal } from "../components/ProductKeyModal";

export function EmailLogPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<ProductKey | null>(null);
  const [loadingKey, setLoadingKey] = useState(false);

  useEffect(() => {
    api.get<{ logs: EmailLog[] }>("/api/admin/email/logs")
      .then((r) => setLogs(r.data.logs))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleKeyClick(keyStr: string) {
    setLoadingKey(true);
    try {
      const res = await api.get<{ keys: ProductKey[] }>(`/api/admin/keys?email=${encodeURIComponent(keyStr)}`);
      const found = res.data.keys.find((k) => k.key === keyStr);
      if (found) {
        setSelectedKey(found);
      } else {
        // If key not found in DB, show a minimal readonly version
        const fallback: ProductKey = {
          id: "", key: keyStr, status: "available",
          customerEmail: null, registeredEmail: null, usedBy: null, usedAt: null,
          createdAt: new Date().toISOString(), expiresAt: null, notes: null,
        };
        setSelectedKey(fallback);
      }
    } catch {
      // Fallback if API fails
      const fallback: ProductKey = {
        id: "", key: keyStr, status: "available",
        customerEmail: null, registeredEmail: null, usedBy: null, usedAt: null,
        createdAt: new Date().toISOString(), expiresAt: null, notes: null,
      };
      setSelectedKey(fallback);
    }
    setLoadingKey(false);
  }

  return (
    <div>
      <div className="section-header">
        <h3>Email Log</h3>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {logs.length > 0 ? `${logs.length} email${logs.length > 1 ? "s" : ""} sent` : ""}
        </span>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="empty-state"><p>Loading email logs...</p></div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3>No emails sent yet</h3>
            <p>Emails will appear here when you send product keys to customers.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>To</th>
                  <th>Subject</th>
                  <th>Product Key</th>
                  <th>Status</th>
                  <th>Sent At</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.to}</td>
                    <td className="truncate" style={{ maxWidth: 200 }}>{log.subject}</td>
                    <td>
                      <span className="text-mono" style={{ fontSize: 12, letterSpacing: 1, cursor: "pointer" }}
                        onClick={() => handleKeyClick(log.productKey)}
                        title="Click to manage this key"
                      >
                        {log.productKey}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${log.status === "sent" ? "badge-available" : "badge-expired"}`}>
                        {log.status === "sent" ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><polyline points="20 6 9 17 4 12" /></svg>
                        ) : null}
                        {log.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>{new Date(log.sentAt).toLocaleString()}</td>
                    <td style={{ color: "var(--danger)", fontSize: 12, maxWidth: 200 }} className="truncate">{log.error || <span style={{ color: "var(--text-muted)" }}>-</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {loadingKey && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-body" style={{ textAlign: "center", padding: 40 }}>
              <span className="h-5 w-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
              <p style={{ marginTop: 12, color: "var(--text-muted)" }}>Loading key details...</p>
            </div>
          </div>
        </div>
      )}

      {selectedKey && (
        <ProductKeyModal keyData={selectedKey} onClose={() => setSelectedKey(null)} onUpdated={() => setSelectedKey(null)} />
      )}
    </div>
  );
}
