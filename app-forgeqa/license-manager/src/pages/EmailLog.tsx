import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { api } from "../lib/api";
import { Download, Search, Mail, Check, X, AlertCircle, Copy, Repeat, ChevronDown, ChevronRight, ChevronLeft, XCircle } from "lucide-react";

type EmailEntry = {
  id: string; to: string; subject: string; productKey: string;
  status: string; error: string | null; sentAt: string;
};

type EmailGroup = {
  to: string; productKey: string; subject: string;
  entries: EmailEntry[]; latestSentAt: string;
};

type LogsResponse = {
  logs: EmailEntry[]; total: number; page: number; pageSize: number; totalPages: number;
};

function groupEntries(logs: EmailEntry[]): EmailGroup[] {
  const groups: EmailGroup[] = [];
  for (const entry of logs) {
    const last = groups[groups.length - 1];
    if (last && last.to === entry.to && last.productKey === entry.productKey) {
      last.entries.push(entry);
      if (entry.sentAt > last.latestSentAt) last.latestSentAt = entry.sentAt;
    } else {
      groups.push({ to: entry.to, productKey: entry.productKey, subject: entry.subject, entries: [entry], latestSentAt: entry.sentAt });
    }
  }
  return groups;
}

function formatTime(date: Date) {
  const diff = Date.now() - date.getTime();
  if (diff < 60000) return "Just now";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function EmailLogPage() {
  const [logs, setLogs] = useState<EmailEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [resending, setResending] = useState<string | null>(null);
  const [drawerEntry, setDrawerEntry] = useState<EmailEntry | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const buildParams = useCallback((p: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (dateFilter !== "all") {
      const now = Date.now();
      const map: Record<string, number> = { "today": 1, "7d": 7, "30d": 30 };
      const days = map[dateFilter];
      if (days) {
        params.set("dateFrom", new Date(now - days * 86400000).toISOString());
        params.set("dateTo", new Date(now + 86400000).toISOString());
      }
    }
    params.set("page", String(p));
    params.set("pageSize", "50");
    return params;
  }, [search, statusFilter, dateFilter]);

  const loadLogs = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await api.get<LogsResponse>(`/api/admin/email/logs?${buildParams(p)}`);
      setLogs(res.data.logs);
      setTotal(res.data.total);
      setPage(res.data.page);
    } catch { showToast("error", "Failed to load email logs"); }
    setLoading(false);
  }, [buildParams, showToast]);

  useEffect(() => {
    loadLogs(1);
    const interval = setInterval(() => loadLogs(page), 30000);
    return () => clearInterval(interval);
  }, [loadLogs, page]);

  const groups = useMemo(() => groupEntries(logs), [logs]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleCopyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(key);
      showToast("success", "Product key copied");
      setTimeout(() => setCopiedKey(null), 2000);
    } catch { showToast("error", "Failed to copy"); }
  };

  const handleResend = async (entry: EmailEntry) => {
    setResending(entry.id);
    try {
      await api.post("/api/admin/email/resend", { logId: entry.id });
      showToast("success", `Resend triggered for ${entry.to}`);
      await loadLogs(page);
    } catch (err: any) {
      showToast("error", err?.response?.data?.error || "Resend failed");
    }
    setResending(null);
  };

  const handleExport = () => {
    const header = "Recipient,Subject,Product Key,Status,Error,Sent At\n";
    const rows = logs.map((e) =>
      `"${e.to}","${e.subject}","${e.productKey}","${e.status}","${e.error || ""}","${e.sentAt}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "email-log.csv"; a.click();
    URL.revokeObjectURL(url);
    showToast("success", "CSV exported");
  };

  const dateRangeChips = [
    { key: "all", label: "All" },
    { key: "today", label: "Today" },
    { key: "7d", label: "7 days" },
    { key: "30d", label: "30 days" },
  ];

  const statusChips = [
    { key: "all", label: "All" },
    { key: "sent", label: "Sent" },
    { key: "failed", label: "Failed" },
  ];

  const groupStatus = (entries: EmailEntry[]): string => {
    if (entries.some((e) => e.status === "pending")) return "pending";
    if (entries.some((e) => e.status === "failed")) return "failed";
    return "sent";
  };

  const statusIcon = (status: string) => {
    if (status === "sent") return <Check size={14} strokeWidth={2.5} />;
    if (status === "failed") return <X size={14} strokeWidth={2.5} />;
    return <AlertCircle size={14} strokeWidth={2.5} />;
  };

  return (
    <div className="el-root">
      {/* Header */}
      <div className="section-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h3>Email Log</h3>
          {total > 0 && (
            <span className="el-count-badge">{total} email{total !== 1 ? "s" : ""}</span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={handleExport} disabled={logs.length === 0}>
            <Download size={14} strokeWidth={2} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="el-toolbar">
        <div className="el-search-wrap">
          <Search size={16} className="el-search-icon" strokeWidth={2} />
          <input ref={searchRef} className="el-search-input" type="text" placeholder="Search by email or product key..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="el-filter-chips">
          {statusChips.map((c) => (
            <button key={c.key} className={`el-chip${statusFilter === c.key ? " active" : ""}`} onClick={() => setStatusFilter(c.key)}>{c.label}</button>
          ))}
          <span className="el-chip-divider" />
          {dateRangeChips.map((c) => (
            <button key={c.key} className={`el-chip${dateFilter === c.key ? " active" : ""}`} onClick={() => setDateFilter(c.key)}>{c.label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="card" style={{ padding: loading || logs.length === 0 ? undefined : "16px 0" }}>
        {loading ? (
          <div className="empty-state"><p>Loading email logs...</p></div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <Mail size={40} strokeWidth={1.5} className="empty-state-icon" />
            <h3>No emails found</h3>
            <p>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <div className="el-timeline">
              {groups.map((g, gi) => {
                const gkey = `${g.to}|${g.productKey}`;
                const isExpanded = expandedGroups.has(gkey);
                const status = groupStatus(g.entries);
                const failedCount = g.entries.filter((e) => e.status === "failed").length;
                return (
                  <div key={gkey} className="el-group" style={{ animationDelay: `${gi * 40}ms` }}>
                    <div className={`el-group-head ${status}`} onClick={() => toggleGroup(gkey)}>
                      <div className="el-group-icon-col">
                        <div className={`el-group-dot ${status}`}>
                          {statusIcon(status)}
                        </div>
                        <div className="el-group-line" />
                      </div>
                      <div className="el-group-info">
                        <div className="el-group-to">{g.to}</div>
                        <div className="el-group-meta">
                          <span className="el-group-key">{g.productKey}</span>
                          <span className="el-group-count">
                            Sent {g.entries.length} time{g.entries.length > 1 ? "s" : ""}
                            {failedCount > 0 && ` (${failedCount} failed)`}
                          </span>
                        </div>
                      </div>
                      <div className="el-group-actions">
                        <button className="el-copy-btn" onClick={(e) => { e.stopPropagation(); handleCopyKey(g.productKey); }}
                          title="Copy product key">
                          {copiedKey === g.productKey ? (
                            <Check size={14} strokeWidth={2.5} style={{ color: "var(--color-success)" }} />
                          ) : (
                            <Copy size={14} strokeWidth={2} />
                          )}
                        </button>
                        <ChevronDown size={16} className={`el-chevron${isExpanded ? " open" : ""}`} strokeWidth={2} />
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="el-group-body">
                        {g.entries.map((entry) => (
                          <div key={entry.id} className={`el-entry ${entry.status}`} onClick={() => setDrawerEntry(entry)}>
                            <div className="el-entry-dot-col">
                              <div className={`el-entry-dot ${entry.status}`} />
                              {g.entries.length > 1 && <div className="el-entry-line" />}
                            </div>
                            <div className="el-entry-info">
                              <div className="el-entry-row">
                                <span className="el-entry-subject">{entry.subject}</span>
                                <span className={`el-entry-badge ${entry.status}`}>{entry.status}</span>
                              </div>
                              <div className="el-entry-time">{formatTime(new Date(entry.sentAt))}</div>
                              {entry.error && <div className="el-entry-error">{entry.error}</div>}
                            </div>
                            <div className="el-entry-actions">
                              {entry.status === "failed" && (
                                <button className="el-resend-btn" disabled={resending === entry.id}
                                  onClick={(e) => { e.stopPropagation(); handleResend(entry); }} title="Resend">
                                  {resending === entry.id ? (
                                    <span className="el-spinner" />
                                  ) : (
                                    <Repeat size={14} strokeWidth={2} />
                                  )}
                                  Resend
                                </button>
                              )}
                              <ChevronRight size={14} className="el-entry-arrow" strokeWidth={2} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {total > 0 && (
              <div className="el-pagination">
                <span className="el-page-info">{total} total entries</span>
                <div className="el-page-controls">
                  <button className="el-page-btn" disabled={page <= 1} onClick={() => loadLogs(page - 1)}>
                    <ChevronLeft size={14} strokeWidth={2} />
                    Previous
                  </button>
                  <span className="el-page-num">Page {page}</span>
                  <button className="el-page-btn" onClick={() => loadLogs(page + 1)}>
                    Next
                    <ChevronRight size={14} strokeWidth={2} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="toast-container" style={{ position: "fixed", bottom: 24, right: 24, zIndex: 500 }}>
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

      {/* Detail drawer */}
      {drawerEntry && (
        <div className="drawer-overlay" onClick={() => setDrawerEntry(null)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Email Details</h3>
              <button className="modal-close" onClick={() => setDrawerEntry(null)}>
                <X size={18} strokeWidth={2} />
              </button>
            </div>
            <div className="drawer-body">
              <div className="el-drawer-section">
                <div className="el-drawer-label">Recipient</div>
                <div className="el-drawer-value">{drawerEntry.to}</div>
              </div>
              <div className="el-drawer-section">
                <div className="el-drawer-label">Subject</div>
                <div className="el-drawer-value">{drawerEntry.subject}</div>
              </div>
              <div className="el-drawer-section">
                <div className="el-drawer-label">Product Key</div>
                <div className="el-drawer-key-row">
                  <span className="el-drawer-key">{drawerEntry.productKey}</span>
                  <button className="el-copy-btn" onClick={() => handleCopyKey(drawerEntry.productKey)} title="Copy">
                    {copiedKey === drawerEntry.productKey ? (
                      <Check size={14} strokeWidth={2.5} style={{ color: "var(--color-success)" }} />
                    ) : (
                      <Copy size={14} strokeWidth={2} />
                    )}
                  </button>
                </div>
              </div>
              <div className="el-drawer-section">
                <div className="el-drawer-label">Status</div>
                <span className={`el-entry-badge ${drawerEntry.status}`}>{drawerEntry.status}</span>
              </div>
              <div className="el-drawer-section">
                <div className="el-drawer-label">Sent At</div>
                <div className="el-drawer-value">{new Date(drawerEntry.sentAt).toLocaleString()}</div>
              </div>
              {drawerEntry.error && (
                <div className="el-drawer-section">
                  <div className="el-drawer-label">Error Detail</div>
                  <div className="el-drawer-error">{drawerEntry.error}</div>
                </div>
              )}
              <div className="el-drawer-section">
                <div className="el-drawer-label">Entry ID</div>
                <div className="el-drawer-value" style={{ fontSize: 12, fontFamily: "var(--font-mono, monospace)", color: "var(--color-text-muted)" }}>{drawerEntry.id}</div>
              </div>
              {drawerEntry.status === "failed" && (
                <div style={{ marginTop: 24 }}>
                  <button className="btn btn-primary" disabled={resending === drawerEntry.id}
                    onClick={() => handleResend(drawerEntry)} style={{ width: "100%", justifyContent: "center" }}>
                    {resending === drawerEntry.id ? "Resending..." : "Resend Email"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
