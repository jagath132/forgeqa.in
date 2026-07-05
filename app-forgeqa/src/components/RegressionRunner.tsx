import { useState } from "react";
import { useRegressionStore } from "../store/useRegressionStore";

export function RegressionRunner() {
  const { currentRun } = useRegressionStore();
  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);

  function statusBadgeClass(status: string) {
    return status === "passed" ? "badge-success" : status === "failed" ? "badge-danger" : status === "running" ? "badge-warning" : "badge";
  }

  async function handleExecute() {
    if (!currentRun) return;
    setIsExecuting(true);
    setProgress([]);
    try {
      const res = await fetch(`/api/regression/runs/${currentRun.id}/execute`, { method: "POST" });
      const data = await res.json();
      setProgress((p) => [...p, `Run completed: ${data.status} (${data.results.filter((r: { passed: boolean }) => r.passed).length}/${data.results.length} passed)`]);
    } catch (err) {
      setProgress((p) => [...p, `Error: ${err instanceof Error ? err.message : "Execution failed"}`]);
    } finally {
      setIsExecuting(false);
    }
  }

  if (!currentRun) {
    return (
      <div className="rounded-lg p-8 text-center" style={{ background: "var(--bg-secondary)" }}>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Generate test cases and create a run to execute regression tests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>Execution Runner</p>
          <p className="text-sm font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>
            {currentRun.suiteName || "Regression Run"} — {currentRun.platform}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {currentRun.status !== "running" && (
            <span className={`badge text-xs ${statusBadgeClass(currentRun.status)}`}>{currentRun.status}</span>
          )}
          <button onClick={handleExecute} disabled={isExecuting || currentRun.status === "running"}
            className="btn-primary px-4 py-2 text-xs font-semibold cursor-pointer"
            type="button"
          >
            {isExecuting ? "Running..." : currentRun.status === "passed" ? "Re-run" : "Execute"}
          </button>
        </div>
      </div>

      {currentRun.status === "running" && (
        <div className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm" style={{ background: "var(--warning-soft)", color: "var(--warning)" }}>
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          <span>Tests are running...</span>
        </div>
      )}

      {progress.length > 0 && (
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {progress.map((msg, i) => (
            <p key={i} className="text-xs" style={{ color: msg.startsWith("Error") ? "var(--danger)" : "var(--text-muted)" }}>{msg}</p>
          ))}
        </div>
      )}

      {currentRun.results.length > 0 && (
        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border-default)" }}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr style={{ background: "var(--bg-secondary)" }}>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>TC ID</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Result</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Output</th>
              </tr>
            </thead>
            <tbody>
              {currentRun.results.map((r) => (
                <tr key={r.testCaseId} className="border-t" style={{ borderColor: "var(--border-subtle)" }}>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>{r.testCaseId}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${r.passed ? "text-emerald-500" : "text-rose-500"}`}>
                      {r.passed ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      )}
                      {r.passed ? "Passed" : "Failed"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{r.actualOutput || r.errorMessage || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
        <span>{currentRun.testCases.length} test cases</span>
        <span>·</span>
        <span>Started {new Date(currentRun.startedAt).toLocaleString()}</span>
        {currentRun.completedAt && (
          <>
            <span>·</span>
            <span>Completed {new Date(currentRun.completedAt).toLocaleString()}</span>
          </>
        )}
      </div>
    </div>
  );
}
