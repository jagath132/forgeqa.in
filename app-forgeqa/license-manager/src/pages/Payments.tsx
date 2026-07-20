import { useEffect, useState } from "react";
import { api, type Transaction } from "../lib/api";
import { CreditCard, DollarSign, CheckCircle, Layers } from "lucide-react";

export function PaymentsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (cancelled) return;
      try {
        const r = await api.get<{ transactions: Transaction[] }>("/api/admin/transactions");
        if (!cancelled) setTransactions(r.data.transactions);
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    }
    load();
    const interval = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const successfulTx = transactions.filter((t) => t.status === "completed" || t.status === "succeeded").length;

  return (
    <div>
      <div className="section-header">
        <h3>Payment Transactions</h3>
        {transactions.length > 0 && (
          <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
            {transactions.length} transaction{transactions.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading transactions...</p></div>
      ) : transactions.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "60px 24px" }}>
          <CreditCard size={40} strokeWidth={1.5} className="empty-state-icon" />
          <h3>No transactions yet</h3>
          <p style={{ marginBottom: 24 }}>Payment transactions will appear here when customers purchase via Stripe or Razorpay.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <div style={{ padding: "12px 20px", borderRadius: "var(--radius-lg)", background: "var(--color-bg)", border: "1px solid var(--color-border)", textAlign: "center", minWidth: 140 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Total Revenue</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text-primary)" }}>$0.00</div>
            </div>
            <div style={{ padding: "12px 20px", borderRadius: "var(--radius-lg)", background: "var(--color-bg)", border: "1px solid var(--color-border)", textAlign: "center", minWidth: 140 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Transactions</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text-primary)" }}>0</div>
            </div>
            <div style={{ padding: "12px 20px", borderRadius: "var(--radius-lg)", background: "var(--color-bg)", border: "1px solid var(--color-border)", textAlign: "center", minWidth: 140 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Payment Providers</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text-primary)" }}>2</div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            <div className="dashboard-secondary-card accent">
              <div className="top">
                <span className="label">Total Revenue</span>
                <div className="icon">
                  <DollarSign size={14} strokeWidth={2} />
                </div>
              </div>
              <div className="value">${totalRevenue.toFixed(2)}</div>
              <div className="sub">Across {transactions.length} transactions</div>
            </div>
            <div className="dashboard-secondary-card success">
              <div className="top">
                <span className="label">Successful</span>
                <div className="icon">
                  <CheckCircle size={14} strokeWidth={2} />
                </div>
              </div>
              <div className="value">{successfulTx}</div>
              <div className="sub">{transactions.length > 0 ? Math.round((successfulTx / transactions.length) * 100) : 0}% success rate</div>
            </div>
            <div className="dashboard-secondary-card warning">
              <div className="top">
                <span className="label">Providers</span>
                <div className="icon">
                  <Layers size={14} strokeWidth={2} />
                </div>
              </div>
              <div className="value">
                {[...new Set(transactions.map((t) => t.provider))].length}
              </div>
              <div className="sub">{[...new Set(transactions.map((t) => t.provider))].join(", ") || "—"}</div>
            </div>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Provider</th>
                    <th>Status</th>
                    <th>Product Key</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td><span className="text-mono" style={{ fontSize: 12 }}>{tx.transactionId}</span></td>
                      <td>{tx.email}</td>
                      <td style={{ fontWeight: 600 }}>
                        {tx.amount != null
                          ? `${tx.currency?.toUpperCase()} ${tx.amount.toFixed(2)}`
                          : <span style={{ color: "var(--color-text-muted)" }}>-</span>}
                      </td>
                      <td>
                        <span className={`payment-provider-badge ${tx.provider}`}>
                          {tx.provider === "stripe" ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 3c-5.2 0-9.5 3.3-9.5 7.4 0 2.2 1.2 4.2 3.1 5.5l-1.3 2.5 3.9-2.1c1 .3 2 .5 3.1.5 5.2 0 9.5-3.3 9.5-7.4S18.7 3 13.5 3zm0 12.2c-3.1 0-5.7-1.9-5.7-4.3s2.6-4.3 5.7-4.3 5.7 1.9 5.7 4.3-2.6 4.3-5.7 4.3z" /></svg>
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z" /></svg>
                          )}
                          {tx.provider}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 13 }}>
                          <span className={`status-dot ${tx.status === "completed" || tx.status === "succeeded" ? "success" : tx.status === "pending" || tx.status === "processing" ? "warning" : "danger"}`} />
                          {tx.status}
                        </span>
                      </td>
                      <td><span className="text-mono" style={{ fontSize: 12, letterSpacing: 1 }}>{tx.productKey || <span style={{ color: "var(--color-text-muted)" }}>-</span>}</span></td>
                      <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>{new Date(tx.timestamp).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
