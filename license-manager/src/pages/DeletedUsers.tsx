import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Search, UserX, Undo2, Trash2, Check, AlertCircle } from 'lucide-react';

interface DeletedUser {
  id: string;
  originalId: string;
  email: string;
  name: string | null;
  deletedAt: string;
}

export function DeletedUsersPage() {
  const [deletedUsers, setDeletedUsers] = useState<DeletedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  async function load() {
    try {
      const r = await api.get<{ deletedUsers: DeletedUser[] }>('/api/admin/deleted-users');
      setDeletedUsers(r.data.deletedUsers);
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

  async function handleRestore(u: DeletedUser) {
    if (
      !confirm(
        `Restore ${u.email}? The account will be recreated — they'll need to use "Forgot password" to set a new password.`
      )
    )
      return;
    setBusyId(u.id);
    try {
      await api.post(`/api/admin/deleted-users/${u.id}/restore`);
      showToast('success', `${u.email} restored`);
      await load();
    } catch (err: any) {
      showToast('error', err?.response?.data?.error || 'Restore failed');
    }
    setBusyId(null);
  }

  async function handlePurge(u: DeletedUser) {
    if (!confirm(`Permanently purge the record for ${u.email}? This cannot be undone.`)) return;
    setBusyId(u.id);
    try {
      await api.delete(`/api/admin/deleted-users/${u.id}`);
      showToast('success', 'Record purged');
      await load();
    } catch (err: any) {
      showToast('error', err?.response?.data?.error || 'Purge failed');
    }
    setBusyId(null);
  }

  const filtered = search
    ? deletedUsers.filter(
        (u) =>
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          (u.name && u.name.toLowerCase().includes(search.toLowerCase()))
      )
    : deletedUsers;

  return (
    <div>
      <div className="section-header">
        <h3>Deleted Users</h3>
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          {deletedUsers.length > 0 ? `${deletedUsers.length} total` : ''}
        </span>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="form-search">
          <Search size={16} className="form-search-icon" strokeWidth={2} />
          <input
            className="form-input"
            placeholder="Search deleted users by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="empty-state">
            <p>Loading deleted users...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <UserX size={40} strokeWidth={1.5} className="empty-state-icon" />
            <h3>{search ? 'No deleted users match your search' : 'No deleted users found'}</h3>
            <p>
              {search
                ? 'Try a different search term.'
                : 'Deleted users will appear here when accounts are removed.'}
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Deleted At</th>
                  <th style={{ width: 160 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <span className="text-mono">{u.email}</span>
                    </td>
                    <td>{u.name || '—'}</td>
                    <td>
                      <span className="text-muted">
                        {new Date(u.deletedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          className="btn btn-sm btn-secondary"
                          disabled={busyId === u.id}
                          onClick={() => handleRestore(u)}
                          title="Restore this account"
                        >
                          <Undo2 size={12} strokeWidth={2} />
                          Restore
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          disabled={busyId === u.id}
                          onClick={() => handlePurge(u)}
                          title="Permanently purge this record"
                        >
                          <Trash2 size={12} strokeWidth={2} />
                          Purge
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
