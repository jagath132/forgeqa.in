import { useEffect, useState } from "react";
import { api, type Customer, type EmailLog } from "../lib/api";
import { Search, X, Loader2 } from "lucide-react";

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "rejected">("all");
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [customerEmailLogs, setCustomerEmailLogs] = useState<EmailLog[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchCustomers = () => {
    api.get<{ customers: Customer[] }>("/api/admin/customers")
      .then((r) => setCustomers(r.data.customers))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCustomers();
    const interval = setInterval(fetchCustomers, 30000);
    return () => clearInterval(interval);
  }, []);

  async function openDetail(c: Customer) {
    setDetailCustomer(c);
    setLoadingDetail(true);
    setCustomerEmailLogs([]);
    try {
      const res = await api.get<{ logs: EmailLog[] }>("/api/admin/email/logs");
      setCustomerEmailLogs(res.data.logs.filter((l) => l.to === c.email));
    } catch { /* ignore */ }
    setLoadingDetail(false);
  }

  const statusCounts = {
    approved: customers.filter((c) => c.status === "approved").length,
    rejected: customers.filter((c) => c.status === "rejected").length,
  };

  const filtered = (search || statusFilter !== "all"
    ? customers.filter((c) => {
        if (statusFilter !== "all" && c.status !== statusFilter) return false;
        if (search && !c.email.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
    : customers);

  return (
    <div>
      <div className="section-header">
        <h3>Customers</h3>
        <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
          {customers.length > 0 ? `${customers.length} total` : ""}
        </span>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="form-search">
          <Search size={16} className="form-search-icon" strokeWidth={2} />
          <input
            className="form-input"
            placeholder="Search customers by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="pill-group">
          <button className={`pill${statusFilter === "all" ? " active" : ""}`} onClick={() => setStatusFilter("all")}>
            All <span className="pill-count">{customers.length}</span>
          </button>
          <button className={`pill${statusFilter === "approved" ? " active" : ""}`} onClick={() => setStatusFilter("approved")}>
            Approved <span className="pill-count">{statusCounts.approved}</span>
          </button>
          <button className={`pill${statusFilter === "rejected" ? " active" : ""}`} onClick={() => setStatusFilter("rejected")}>
            Rejected <span className="pill-count">{statusCounts.rejected}</span>
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="empty-state"><p>Loading customers...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
            </svg>
            <h3>{search ? "No customers match your search" : "No customers found"}</h3>
            <p>{search ? "Try a different search term." : "Customers will appear here when they register with a product key."}</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Product Key</th>
                    <th>Key Status</th>
                    <th>Registered</th>
                    <th style={{ width: 80 }}></th>
                  </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} style={{ cursor: "pointer", opacity: c.status === "rejected" ? 0.6 : 1 }} onClick={() => openDetail(c)}>
                    <td>{c.email}</td>
                    <td style={{ color: c.name ? "var(--color-text-primary)" : "var(--color-text-muted)", fontSize: 13 }}>
                      {c.name || "-"}
                    </td>
                    <td><span className={`badge ${c.role === "admin" ? "badge-used" : "badge-available"}`}>{c.role}</span></td>
                    <td><span className={`badge ${c.status === "rejected" ? "badge-expired" : "badge-used"}`} style={{ fontSize: 10 }}>{c.status}</span></td>
                    <td><span className="text-mono" style={{ fontSize: 12, letterSpacing: 1 }}>{c.productKey || <span style={{ color: "var(--color-text-muted)" }}>-</span>}</span></td>
                    <td>
                      {c.keyStatus ? (
                        <span className={`badge badge-${c.keyStatus}`}>{c.keyStatus}</span>
                      ) : <span style={{ color: "var(--color-text-muted)", fontSize: 12 }}>-</span>}
                    </td>
                    <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-secondary" style={{ fontSize: 11, padding: "4px 10px" }}
                        onClick={(e) => { e.stopPropagation(); openDetail(c); }}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detailCustomer && (
        <>
          <div className="drawer-overlay" onClick={() => setDetailCustomer(null)} />
          <div className="drawer-panel">
            <div className="drawer-header">
              <h3>Customer Profile</h3>
              <button className="modal-close" onClick={() => setDetailCustomer(null)}>
                <X size={18} strokeWidth={2} />
              </button>
            </div>
            <div className="drawer-body">
              <div className="customer-profile-header">
                <div className="customer-profile-avatar">
                  {detailCustomer.email.charAt(0).toUpperCase()}
                </div>
                <div className="customer-profile-info">
                  <div className="name">{detailCustomer.name || "—"}</div>
                  <div className="email">{detailCustomer.email}</div>
                </div>
              </div>

              <div className="customer-info-grid">
                <span className="lbl">Role / Status</span>
                <span className="val">
                  {detailCustomer.rejected ? (
                    <span className="badge badge-expired" style={{ fontSize: 10 }}>Rejected</span>
                  ) : (
                    <span className={`badge ${detailCustomer.role === "admin" ? "badge-used" : "badge-available"}`} style={{ fontSize: 10 }}>{detailCustomer.role}</span>
                  )}
                </span>

                <span className="lbl">Key</span>
                <span className="val text-mono" style={{ fontSize: 12, letterSpacing: 1 }}>{detailCustomer.productKey || "-"}</span>

                <span className="lbl">Key Status</span>
                <span className="val">{detailCustomer.keyStatus ? <span className={`badge ${detailCustomer.rejected ? "badge-expired" : `badge-${detailCustomer.keyStatus}`}`} style={{ fontSize: 10 }}>{detailCustomer.keyStatus}</span> : "-"}</span>

                <span className="lbl">Registered</span>
                <span className="val">{new Date(detailCustomer.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span>

                {detailCustomer.rejected && detailCustomer.rejectedAt && (
                  <>
                    <span className="lbl">Rejected</span>
                    <span className="val">{new Date(detailCustomer.rejectedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span>
                  </>
                )}

                {detailCustomer.rejected && detailCustomer.rejectedBy && (
                  <>
                    <span className="lbl">Rejected By</span>
                    <span className="val">{detailCustomer.rejectedBy}</span>
                  </>
                )}

                {detailCustomer.rejected && detailCustomer.rejectionReason && (
                  <>
                    <span className="lbl">Reason</span>
                    <span className="val">{detailCustomer.rejectionReason}</span>
                  </>
                )}

                <span className="lbl">Notes</span>
                <span className="val" style={{ color: detailCustomer.notes ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>{detailCustomer.notes || "-"}</span>
              </div>

              {detailCustomer.keys.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div className="section-title" style={{ marginBottom: 10 }}>All Keys ({detailCustomer.keys.length})</div>
                  <div className="customer-history">
                    {detailCustomer.keys.map((k) => (
                      <div key={k.id} className="customer-history-item">
                        <div className={`customer-history-dot ${k.status === "used" ? "success" : "accent"}`} />
                        <div className="customer-history-content">
                          <div className="desc">
                            <span className={`badge badge-${k.status}`} style={{ fontSize: 9, marginRight: 6 }}>{k.status}</span>
                            <span className="text-mono" style={{ fontSize: 12, letterSpacing: 1 }}>{k.key}</span>
                          </div>
                          <div className="time">{new Date(k.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {loadingDetail ? (
                <div style={{ textAlign: "center", padding: 20 }}>
                  <Loader2 size={20} className="lm-spin" strokeWidth={2} style={{ margin: "0 auto" }} />
                </div>
              ) : customerEmailLogs.length > 0 ? (
                <div>
                  <div className="section-title" style={{ marginBottom: 10 }}>Email History ({customerEmailLogs.length})</div>
                  <div className="customer-history">
                    {customerEmailLogs.map((log) => (
                      <div key={log.id} className="customer-history-item">
                        <div className={`customer-history-dot ${log.status === "sent" ? "success" : "accent"}`} />
                        <div className="customer-history-content">
                          <div className="desc">
                            <span className={`badge ${log.status === "sent" ? "badge-available" : "badge-expired"}`} style={{ fontSize: 9, marginRight: 6 }}>{log.status}</span>
                            {log.subject}
                          </div>
                          <div className="time">{new Date(log.sentAt).toLocaleString()}</div>
                          {log.error && <div className="time" style={{ color: "var(--color-danger)" }}>{log.error}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
