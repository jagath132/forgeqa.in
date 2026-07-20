import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAppStore } from '../store/useAppStore';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  subscriptionTier?: string;
}

interface AuditLog {
  _id: string;
  adminEmail: string;
  action: string;
  resource: string;
  timestamp: string;
  ip: string;
}

export function AdminPage() {
  const user = useAppStore((s) => s.user);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<{
    userCount: number;
    keyCount: number;
    usedKeys: number;
    availableKeys: number;
    deletedCount?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'keys' | 'audit'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [unlockEmail, setUnlockEmail] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [usersRes, statsRes, logsRes] = await Promise.all([
        api.get<{ users: AdminUser[] }>('/api/admin/users').catch(() => ({ data: { users: [] } })),
        api.get<typeof stats>('/api/admin/stats').catch(() => ({ data: null })),
        api.get<{ logs: AuditLog[] }>('/api/admin/audit-logs').catch(() => ({ data: { logs: [] } })),
      ]);
      setUsers(usersRes.data.users);
      setStats(statsRes.data);
      setAuditLogs(logsRes.data.logs || []);
    } finally {
      setLoading(false);
    }
  }

  if (user?.role !== 'Admin') {
    return (
      <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
        <div className="inline-flex p-4 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Access Denied</h2>
        <p>You need administrator privileges to access the License & Admin Manager.</p>
      </div>
    );
  }

  async function handleRoleChange(userId: string, role: string) {
    setMessage('');
    try {
      await api.put(`/api/admin/users/${userId}`, { role });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
      setMessage('User role updated successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to update user.'
      );
    }
  }

  async function handleUnlockAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!unlockEmail.trim()) return;
    setUnlocking(true);
    setMessage('');
    try {
      await api.post('/api/admin/unlock', { email: unlockEmail.trim() });
      setMessage(`Successfully unlocked account for ${unlockEmail.trim()}`);
      setUnlockEmail('');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setMessage(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to unlock account.'
      );
    } finally {
      setUnlocking(false);
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p>Loading License & Admin Manager...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              License & Admin Manager
            </h1>
            <Badge variant="primary">ForgeKey Portal</Badge>
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Manage user accounts, product key licenses, security policies, and system audit logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="http://127.0.0.1:5174"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              color: '#ffffff',
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open Standalone Portal (Port 5174)
          </a>
        </div>
      </div>

      {message && (
        <div
          className="px-4 py-3 rounded-xl text-sm font-medium transition-all shadow-sm"
          style={{
            background: message.toLowerCase().includes('failed') || message.toLowerCase().includes('error') ? 'var(--color-danger-soft, #fee2e2)' : 'var(--color-success-soft, #dcfce7)',
            color: message.toLowerCase().includes('failed') || message.toLowerCase().includes('error') ? 'var(--color-danger, #dc2626)' : 'var(--color-success, #16a34a)',
          }}
        >
          {message}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Users
            </p>
            <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">{stats.userCount}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Keys
            </p>
            <p className="text-2xl font-bold mt-1 text-indigo-600 dark:text-indigo-400">{stats.keyCount}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Activated Licenses
            </p>
            <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{stats.usedKeys}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Available Keys
            </p>
            <p className="text-2xl font-bold mt-1 text-sky-600 dark:text-sky-400">{stats.availableKeys}</p>
          </Card>
          {stats.deletedCount !== undefined && (
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-500">
                Deleted Accounts
              </p>
              <p className="text-2xl font-bold mt-1 text-rose-600">{stats.deletedCount}</p>
            </Card>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: 'var(--color-border)' }}>
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Users & Roles ({users.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('keys')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'keys'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          License Keys & Management
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'audit'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* Tab: Users & Roles */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
            <input
              type="text"
              placeholder="Search users by email or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 text-sm rounded-xl border flex-1 max-w-md"
              style={{
                background: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            />

            <form onSubmit={handleUnlockAccount} className="flex gap-2 items-center">
              <input
                type="email"
                placeholder="User email to unlock..."
                value={unlockEmail}
                onChange={(e) => setUnlockEmail(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border"
                style={{
                  background: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              />
              <button
                type="submit"
                disabled={unlocking || !unlockEmail}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
              >
                {unlocking ? 'Unlocking...' : 'Unlock Account'}
              </button>
            </form>
          </div>

          <div
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs font-semibold uppercase tracking-wider" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Subscription</th>
                    <th className="px-5 py-3">Registered Date</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-medium" style={{ color: 'var(--color-text)' }}>
                        {u.email}
                        {u.id === user.id && (
                          <span className="ml-2 text-[10px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 px-2 py-0.5 rounded-full font-semibold">
                            You
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={u.role === 'Admin' ? 'primary' : 'muted'}>{u.role}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500 uppercase">
                        {u.subscriptionTier || 'Free'}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <select
                          className="px-2.5 py-1 text-xs rounded-lg border font-medium cursor-pointer"
                          style={{
                            background: 'var(--color-surface)',
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-text)',
                          }}
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={u.id === user.id}
                        >
                          <option value="Member">Member</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                        No users found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: License Keys & Management */}
      {activeTab === 'keys' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                ForgeKey License Management Portal
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate new product keys, track activations, manage verification logs, and review subscription tiers.
              </p>
            </div>
            <a
              href="http://127.0.0.1:5174"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              Launch License Manager App
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
            <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/40" style={{ borderColor: 'var(--color-border)' }}>
              <h4 className="text-xs font-bold uppercase text-slate-500">Active License Control</h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                Keys can be activated per user account or workstation. Each key stores activation date, plan tier, and device metadata.
              </p>
            </div>
            <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/40" style={{ borderColor: 'var(--color-border)' }}>
              <h4 className="text-xs font-bold uppercase text-slate-500">Verification Service</h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                Automatic license validation endpoint evaluates payload integrity and active subscription status in real-time.
              </p>
            </div>
            <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/40" style={{ borderColor: 'var(--color-border)' }}>
              <h4 className="text-xs font-bold uppercase text-slate-500">Standalone App Server</h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                The standalone License Manager module runs at <code className="text-indigo-600">http://127.0.0.1:5174</code> with dedicated endpoints.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Tab: Audit Logs */}
      {activeTab === 'audit' && (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs font-semibold uppercase tracking-wider" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Admin Email</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Resource</th>
                  <th className="px-5 py-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {auditLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3 text-xs text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 font-medium" style={{ color: 'var(--color-text)' }}>
                      {log.adminEmail}
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 text-xs rounded-full font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">{log.resource}</td>
                    <td className="px-5 py-3 text-xs font-mono text-slate-400">{log.ip}</td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                      No security audit logs recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
