import { useEffect, useState } from 'react';
import { api, type Transaction } from '../lib/api';
import { useConfirm } from '../components/ConfirmDialog';
import {
  CreditCard,
  DollarSign,
  CheckCircle,
  Layers,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';

const EMPTY_FORM = {
  email: '',
  amount: '',
  currency: 'usd',
  status: 'completed',
  productKey: '',
  notes: '',
};

export function PaymentsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const confirm = useConfirm();

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  async function load() {
    try {
      const r = await api.get<{ transactions: Transaction[] }>('/api/admin/transactions');
      setTransactions(r.data.transactions);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(tx: Transaction) {
    setEditId(tx.id);
    setForm({
      email: tx.email || '',
      amount: tx.amount != null ? String(tx.amount) : '',
      currency: tx.currency || 'usd',
      status: tx.status || 'completed',
      productKey: tx.productKey || '',
      notes: (tx as any).notes || '',
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.email.trim() || !form.email.includes('@')) {
      showToast('error', 'A valid email is required');
      return;
    }
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount < 0) {
      showToast('error', 'Amount must be a non-negative number');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        email: form.email.trim(),
        amount,
        currency: form.currency,
        status: form.status,
        productKey: form.productKey.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };
      if (editId) {
        await api.put(`/api/admin/transactions/${editId}`, payload);
        showToast('success', 'Transaction updated');
      } else {
        await api.post('/api/admin/transactions', payload);
        showToast('success', 'Transaction created');
      }
      setShowModal(false);
      await load();
    } catch (err: any) {
      showToast('error', err?.response?.data?.error || 'Save failed');
    }
    setSaving(false);
  }

  async function handleDelete(tx: Transaction) {
    if (
      !(await confirm({
        title: 'Delete transaction',
        message: `Delete transaction ${tx.transactionId}? This cannot be undone.`,
        confirmLabel: 'Delete',
      }))
    )
      return;
    try {
      await api.delete(`/api/admin/transactions/${tx.id}`);
      showToast('success', 'Transaction deleted');
      await load();
    } catch (err: any) {
      showToast('error', err?.response?.data?.error || 'Delete failed');
    }
  }

  const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const successfulTx = transactions.filter(
    (t) => t.status === 'completed' || t.status === 'succeeded'
  ).length;

  return (
    <div>
      <div className="section-header">
        <h3>Payment Transactions</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {transactions.length > 0 && (
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              {transactions.length} transaction{transactions.length > 1 ? 's' : ''}
            </span>
          )}
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <Plus size={14} strokeWidth={2.5} />
            Add Transaction
          </button>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <p>Loading transactions...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <CreditCard size={40} strokeWidth={1.5} className="empty-state-icon" />
          <h3>No transactions yet</h3>
          <p style={{ marginBottom: 24 }}>
            Payment transactions will appear here when customers purchase via Stripe or Razorpay.
          </p>
          <button className="btn btn-primary" onClick={openCreate} style={{ margin: '0 auto' }}>
            <Plus size={14} strokeWidth={2.5} />
            Add Transaction
          </button>
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16,
              marginBottom: 24,
            }}
          >
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
              <div className="sub">
                {transactions.length > 0
                  ? Math.round((successfulTx / transactions.length) * 100)
                  : 0}
                % success rate
              </div>
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
              <div className="sub">
                {[...new Set(transactions.map((t) => t.provider))].join(', ') || '—'}
              </div>
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
                    <th style={{ width: 110 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>
                        <span className="text-mono" style={{ fontSize: 12 }}>
                          {tx.transactionId}
                        </span>
                        {tx.manualEntry && (
                          <span
                            className="badge badge-available"
                            style={{ fontSize: 9, marginLeft: 6 }}
                          >
                            manual
                          </span>
                        )}
                      </td>
                      <td>{tx.email}</td>
                      <td style={{ fontWeight: 600 }}>
                        {tx.amount != null ? (
                          `${tx.currency?.toUpperCase()} ${tx.amount.toFixed(2)}`
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)' }}>-</span>
                        )}
                      </td>
                      <td>
                        <span className={`payment-provider-badge ${tx.provider}`}>
                          {tx.provider === 'stripe' ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M13.5 3c-5.2 0-9.5 3.3-9.5 7.4 0 2.2 1.2 4.2 3.1 5.5l-1.3 2.5 3.9-2.1c1 .3 2 .5 3.1.5 5.2 0 9.5-3.3 9.5-7.4S18.7 3 13.5 3zm0 12.2c-3.1 0-5.7-1.9-5.7-4.3s2.6-4.3 5.7-4.3 5.7 1.9 5.7 4.3-2.6 4.3-5.7 4.3z" />
                            </svg>
                          ) : tx.provider === 'manual' ? (
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </svg>
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z" />
                            </svg>
                          )}
                          {tx.provider}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 13 }}>
                          <span
                            className={`status-dot ${tx.status === 'completed' || tx.status === 'succeeded' ? 'success' : tx.status === 'pending' || tx.status === 'processing' ? 'warning' : 'danger'}`}
                          />
                          {tx.status}
                        </span>
                      </td>
                      <td>
                        <span className="text-mono" style={{ fontSize: 12, letterSpacing: 1 }}>
                          {tx.productKey || (
                            <span style={{ color: 'var(--color-text-muted)' }}>-</span>
                          )}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => openEdit(tx)}
                            title="Edit transaction"
                          >
                            <Pencil size={12} strokeWidth={2} />
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(tx)}
                            title="Delete transaction"
                          >
                            <Trash2 size={12} strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3>{editId ? 'Edit Transaction' : 'Add Transaction'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={18} strokeWidth={2} />
              </button>
            </div>
            <div
              className="modal-body"
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <div className="form-group">
                <label>Customer Email *</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="customer@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Amount *</label>
                  <input
                    className="form-input"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="29.00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Currency</label>
                  <select
                    className="form-input"
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  >
                    <option value="usd">USD</option>
                    <option value="inr">INR</option>
                    <option value="eur">EUR</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  className="form-input"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <div className="form-group">
                <label>Product Key (optional)</label>
                <input
                  className="form-input"
                  placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
                  value={form.productKey}
                  onChange={(e) => setForm({ ...form, productKey: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Notes (optional)</label>
                <textarea
                  className="form-input"
                  placeholder="Internal notes about this transaction..."
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editId ? 'Save Changes' : 'Create Transaction'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === 'success' ? (
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
