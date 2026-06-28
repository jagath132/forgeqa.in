import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Search, UserX } from "lucide-react";

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
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (cancelled) return;
      try {
        const r = await api.get<{ deletedUsers: DeletedUser[] }>("/api/admin/deleted-users");
        if (!cancelled) setDeletedUsers(r.data.deletedUsers);
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    }
    load();
    const interval = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const filtered = search
    ? deletedUsers.filter((u) =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.name && u.name.toLowerCase().includes(search.toLowerCase()))
      )
    : deletedUsers;

  return (
    <div>
      <div className="section-header">
        <h3>Deleted Users</h3>
        <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
          {deletedUsers.length > 0 ? `${deletedUsers.length} total` : ""}
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
          <div className="empty-state"><p>Loading deleted users...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <UserX size={40} strokeWidth={1.5} className="empty-state-icon" />
            <h3>{search ? "No deleted users match your search" : "No deleted users found"}</h3>
            <p>{search ? "Try a different search term." : "Deleted users will appear here when accounts are removed."}</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Deleted At</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td><span className="text-mono">{u.email}</span></td>
                    <td>{u.name || "—"}</td>
                    <td><span className="text-muted">{new Date(u.deletedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
