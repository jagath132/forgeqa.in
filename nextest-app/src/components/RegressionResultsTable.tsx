import { useRegressionStore } from "../store/useRegressionStore";

export function RegressionResultsTable() {
  const { runs, selectRun, currentRun } = useRegressionStore();

  if (runs.length === 0) {
    return (
      <div className="rounded-lg p-8 text-center" style={{ background: "var(--bg-secondary)" }}>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>No regression runs yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border-default)" }}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr style={{ background: "var(--bg-secondary)" }}>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Suite</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Platform</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Status</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Cases</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Results</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Date</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => {
            const passed = run.results.filter((r) => r.passed).length;
            const total = run.results.length;
            const isSelected = currentRun?.id === run.id;
            return (
              <tr key={run.id} onClick={() => selectRun(run)}
                className="cursor-pointer transition-colors hover:bg-[var(--accent-soft)] border-t"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: isSelected ? "var(--accent-soft)" : undefined,
                }}
              >
                <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>{run.suiteName || "Regression"}</td>
                <td className="px-4 py-3">
                  <span className="badge text-xs" style={{ background: run.platform === "mobile" ? "var(--accent-violet-soft)" : "var(--accent-cyan-soft)", color: run.platform === "mobile" ? "var(--accent-violet)" : "var(--accent-cyan)" }}>
                    {run.platform}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`badge text-xs ${
                    run.status === "passed" ? "badge-success" : run.status === "failed" ? "badge-danger" : run.status === "running" ? "badge-warning" : "badge"
                  }`}>
                    {run.status}
                  </span>
                </td>
                <td className="px-4 py-3" style={{ color: "var(--text-primary)" }}>{run.testCases.length}</td>
                <td className="px-4 py-3">
                  {total > 0 ? (
                    <span style={{ color: passed === total ? "var(--success)" : "var(--danger)" }}>
                      {passed}/{total} passed
                    </span>
                  ) : (
                    <span style={{ color: "var(--text-muted)" }}>-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                  {new Date(run.startedAt).toLocaleDateString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
