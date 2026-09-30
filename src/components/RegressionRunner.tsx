import { useState, useMemo } from 'react';
import { useRegressionStore } from '../store/useRegressionStore';
import { AiDiagnosticsModal } from './AiDiagnosticsModal';
import type { RegressionResult } from '../lib/api';

export function RegressionRunner() {
  const { currentRun } = useRegressionStore();
  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [sortByRisk, setSortByRisk] = useState(true);

  // AI Diagnostics state
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [activeErrorLog, setActiveErrorLog] = useState('');
  const [activeLocator, setActiveLocator] = useState('');
  const [activeSummary, setActiveSummary] = useState('');

  function statusBadgeClass(status: string) {
    return status === 'passed'
      ? 'badge-success'
      : status === 'failed'
        ? 'badge-danger'
        : status === 'running'
          ? 'badge-warning'
          : 'badge';
  }

  const sortedResults = useMemo(() => {
    if (!currentRun?.results?.length) return [];
    if (!sortByRisk) return currentRun.results;

    const riskWeight: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    return [...currentRun.results].sort((a, b) => {
      // First sort by failed status, then by risk
      if (a.passed !== b.passed) return a.passed ? 1 : -1;
      const weightA = riskWeight[a.riskLevel || 'LOW'] || 1;
      const weightB = riskWeight[b.riskLevel || 'LOW'] || 1;
      return weightB - weightA;
    });
  }, [currentRun?.results, sortByRisk]);

  async function handleExecute() {
    if (!currentRun) return;
    setIsExecuting(true);
    setProgress([]);
    try {
      const res = await fetch(`/api/regression/runs/${currentRun.id}/execute`, { method: 'POST' });
      const data = await res.json();
      setProgress((p) => [
        ...p,
        `Run completed: ${data.status} (${data.results.filter((r: { passed: boolean }) => r.passed).length}/${data.results.length} passed)`,
      ]);
    } catch (err) {
      setProgress((p) => [
        ...p,
        `Error: ${err instanceof Error ? err.message : 'Execution failed'}`,
      ]);
    } finally {
      setIsExecuting(false);
    }
  }

  const handleOpenDiagnostics = (r: RegressionResult) => {
    const testCase = currentRun?.testCases.find((tc) => tc.tcId === r.testCaseId);
    setActiveErrorLog(
      r.errorLog ||
        `Playwright Error in ${r.testCaseId}:\n${r.errorMessage || r.actualOutput || 'Execution timed out waiting for element.'}`
    );
    setActiveLocator(r.failedLocator || "page.locator('button#action-submit')");
    setActiveSummary(testCase ? `${testCase.tcId}: ${testCase.summary}` : r.testCaseId);
    setDiagnosticsOpen(true);
  };

  if (!currentRun) {
    return (
      <div className="rounded-lg p-8 text-center" style={{ background: 'var(--bg-secondary)' }}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Generate test cases and create a run to execute regression tests.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--accent)' }}
            >
              Execution Runner
            </p>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/40">
              ⚡ Playwright Engine
            </span>
          </div>
          <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
            {currentRun.suiteName || 'Regression Run'} — {currentRun.platform}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* AI Diagnostics Studio button */}
          <button
            type="button"
            onClick={() => {
              setActiveErrorLog('');
              setActiveLocator('');
              setActiveSummary('');
              setDiagnosticsOpen(true);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-purple-500/40 bg-purple-950/30 text-purple-300 hover:bg-purple-900/40 transition-colors flex items-center gap-1.5"
          >
            <svg
              className="w-3.5 h-3.5 text-purple-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span>AI Triage Studio</span>
          </button>

          {currentRun.status !== 'running' && (
            <span className={`badge text-xs ${statusBadgeClass(currentRun.status)}`}>
              {currentRun.status}
            </span>
          )}

          <button
            onClick={handleExecute}
            disabled={isExecuting || currentRun.status === 'running'}
            className="btn-primary px-4 py-2 text-xs font-semibold cursor-pointer"
            type="button"
          >
            {isExecuting
              ? 'Running...'
              : currentRun.status === 'passed'
                ? 'Re-run'
                : 'Execute Suite'}
          </button>
        </div>
      </div>

      {/* Running State Banner */}
      {currentRun.status === 'running' && (
        <div
          className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm"
          style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}
        >
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span>Executing test cases across Playwright headless workers...</span>
        </div>
      )}

      {/* Progress logs */}
      {progress.length > 0 && (
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {progress.map((msg, i) => (
            <p
              key={i}
              className="text-xs"
              style={{ color: msg.startsWith('Error') ? 'var(--danger)' : 'var(--text-muted)' }}
            >
              {msg}
            </p>
          ))}
        </div>
      )}

      {/* Results Table & Risk Sort Controls */}
      {currentRun.results.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-slate-400 font-medium">
              Execution Telemetry & Artifacts ({currentRun.results.length} tests)
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 select-none">
              <input
                type="checkbox"
                checked={sortByRisk}
                onChange={(e) => setSortByRisk(e.target.checked)}
                className="rounded accent-purple-500"
              />
              <span className="text-xs font-semibold">Prioritize by Risk & Failures</span>
            </label>
          </div>

          <div
            className="overflow-x-auto rounded-lg border"
            style={{ borderColor: 'var(--border-default)' }}
          >
            <table className="w-full text-left text-sm">
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  <th
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    TC ID
                  </th>
                  <th
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Risk Level
                  </th>
                  <th
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Result
                  </th>
                  <th
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Duration
                  </th>
                  <th
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Output / Diagnostics
                  </th>
                  <th
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedResults.map((r) => {
                  const risk = r.riskLevel || 'MEDIUM';
                  return (
                    <tr
                      key={r.testCaseId}
                      className={`border-t transition-colors ${!r.passed ? 'bg-rose-950/10' : ''}`}
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <td
                        className="px-4 py-3 font-medium"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {r.testCaseId}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            risk === 'HIGH'
                              ? 'bg-rose-950/80 text-rose-300 border-rose-800/60'
                              : risk === 'MEDIUM'
                                ? 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                                : 'bg-cyan-950/80 text-cyan-300 border-cyan-800/60'
                          }`}
                        >
                          {risk} RISK
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                            r.passed ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        >
                          {r.passed ? (
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          )}
                          {r.passed ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-400">
                        {r.durationMs ? `${r.durationMs}ms` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <p className="truncate max-w-xs">
                          {r.actualOutput || r.errorMessage || '-'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!r.passed ? (
                          <button
                            type="button"
                            onClick={() => handleOpenDiagnostics(r)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow transition-all flex items-center gap-1 ml-auto"
                            title="Diagnose failure using AI root cause analyzer"
                          >
                            <span>🩺 AI Triage</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500">✓ Healthy</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div
        className="flex items-center gap-2 text-xs font-medium"
        style={{ color: 'var(--text-muted)' }}
      >
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

      {/* AI Failure Diagnostics Modal */}
      <AiDiagnosticsModal
        isOpen={diagnosticsOpen}
        onClose={() => setDiagnosticsOpen(false)}
        initialErrorLog={activeErrorLog}
        failedLocator={activeLocator}
        testCaseSummary={activeSummary}
      />
    </div>
  );
}
