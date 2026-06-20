import { useEffect, useState } from "react";
import { api, type Customer } from "../lib/api";
import { CustomerModal } from "../components/CustomerModal";

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchCustomers = () => {
    api.get<{ customers: Customer[] }>("/api/admin/customers")
      .then((r) => setCustomers(r.data.customers))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCustomers(); }, []);

  const filtered = search
    ? customers.filter((c) => c.email.toLowerCase().includes(search.toLowerCase()))
    : customers;

  return (
    <div>
      <div className="section-header">
        <h3>Customers</h3>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {customers.length > 0 ? `${customers.length} total` : ""}
        </span>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="form-search">
          <svg className="form-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            className="form-input"
            placeholder="Search customers by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
                  <th>Product Key</th>
                  <th>Key Status</th>
                  <th>Registered</th>
                  <th style={{ width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => setSelectedId(c.id)}>
                    <td>{c.email}</td>
                    <td style={{ color: c.name ? "var(--text-primary)" : "var(--text-muted)", fontSize: 13 }}>
                      {c.name || "-"}
                    </td>
                    <td><span className={`badge ${c.role === "admin" ? "badge-used" : "badge-available"}`}>{c.role}</span></td>
                    <td><span className="text-mono" style={{ fontSize: 12, letterSpacing: 1 }}>{c.productKey || <span style={{ color: "var(--text-muted)" }}>-</span>}</span></td>
                    <td>
                      {c.keyStatus ? (
                        <span className={`badge badge-${c.keyStatus}`}>{c.keyStatus}</span>
                      ) : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>-</span>}
                    </td>
                    <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-secondary" style={{ fontSize: 11, padding: "4px 10px" }}
                        onClick={(e) => { e.stopPropagation(); setSelectedId(c.id); }}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedId && (
        <CustomerModal
          customerId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdated={() => { setSelectedId(null); fetchCustomers(); }}
        />
      )}
    </div>
  );
}