import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAppStore } from "../store/useAppStore";
import { Card } from "../components/ui/Card";

interface AdminUser {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

export function AdminPage() {
  const user = useAppStore((s) => s.user);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<{ userCount: number; keyCount: number; usedKeys: number; availableKeys: number; deletedCount?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([
      api.get<{ users: AdminUser[] }>("/api/admin/users").catch(() => ({ data: { users: [] } })),
      api.get<typeof stats>("/api/admin/stats").catch(() => ({ data: null })),
    ]).then(([usersRes, statsRes]) => {
      setUsers(usersRes.data.users);
      setStats(statsRes.data);
    }).finally(() => setLoading(false));
  }, []);

  if (user?.role !== "Admin") {
    return (
      <div className="text-center py-20" style={{ color: "var(--text-muted)" }}>
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p>You need admin privileges to access this page.</p>
      </div>
    );
  }

  async function handleRoleChange(userId: string, role: string) {
    setMessage("");
    try {
      await api.put(`/api/admin/users/${userId}`, { role });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
      setMessage("User role updated successfully.");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to update user.");
    }
  }

  if (loading) return <div className="text-center py-20" style={{ color: "var(--text-muted)" }}>Loading admin panel...</div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Admin Panel</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Manage users and view system statistics.</p>
      </div>

      {message && (
        <div className="px-4 py-3 rounded-lg text-sm" style={{ background: message.includes("error") ? "var(--danger-soft)" : "var(--success-soft)", color: message.includes("error") ? "var(--danger)" : "var(--success)" }}>
          {message}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Total Users</p><p className="text-2xl font-bold mt-1">{stats.userCount}</p></Card>
          <Card><p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Total Keys</p><p className="text-2xl font-bold mt-1">{stats.keyCount}</p></Card>
          <Card><p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Activated</p><p className="text-2xl font-bold mt-1">{stats.usedKeys}</p></Card>
          <Card><p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Available</p><p className="text-2xl font-bold mt-1">{stats.availableKeys}</p></Card>
          {stats.deletedCount !== undefined && (
            <Card><p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--danger)" }}>Deleted Accounts</p><p className="text-2xl font-bold mt-1" style={{ color: "var(--danger)" }}>{stats.deletedCount}</p></Card>
          )}
        </div>
      )}

      <div className="rounded-xl border" style={{ borderColor: "var(--border-default)", overflow: "hidden" }}>
        <div style={{ background: "var(--bg-card)" }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td><span className={`badge ${u.role === "Admin" ? "badge-used" : "badge-available"}`}>{u.role}</span></td>
                    <td style={{ fontSize: 12 }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <select
                        className="form-input"
                        style={{ width: 140, padding: "4px 8px", fontSize: 12 }}
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
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
