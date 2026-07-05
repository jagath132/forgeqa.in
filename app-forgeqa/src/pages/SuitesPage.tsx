import { useState, useMemo, useEffect } from "react";
import { useAppStore } from "../store/useAppStore";
import { Card } from "../components/ui/Card";
import { TestCaseTable } from "../components/TestCaseTable";
import { getSuites, saveSuites, type Suite } from "../lib/api";

export function SuitesPage() {
  const qaResult = useAppStore((s) => s.qaResult);
  const [suites, setSuites] = useState<Suite[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSuite, setSelectedSuite] = useState<string>("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => {
    getSuites().then((data) => {
      const loaded = data.length > 0 ? data : [
        { id: "smoke", name: "Smoke Tests", description: "Critical path validation for core functionality", color: "var(--accent-rose)", caseIds: [] },
        { id: "regression", name: "Regression Suite", description: "Full regression covering all features", color: "var(--accent-violet)", caseIds: [] },
        { id: "edge", name: "Edge Cases", description: "Boundary and error-handling scenarios", color: "var(--accent-amber)", caseIds: [] },
      ];
      setSuites(loaded);
      setSelectedSuite(loaded[0]?.id ?? "");
      setLoading(false);
      if (data.length === 0) void saveSuites(loaded);
    });
  }, []);

  const activeSuite = useMemo(() => suites.find((s) => s.id === selectedSuite), [suites, selectedSuite]);

  function persistSuites(updated: Suite[]) {
    setSuites(updated);
    void saveSuites(updated);
  }

  function createSuite() {
    if (!newName.trim()) return;
    const id = newName.toLowerCase().replace(/\s+/g, "-");
    persistSuites([...suites, { id, name: newName.trim(), description: newDesc.trim(), color: "var(--accent-cyan)", caseIds: [] }]);
    setSelectedSuite(id);
    setNewName("");
    setNewDesc("");
    setShowCreate(false);
  }

  function deleteSuite(id: string) {
    const updated = suites.filter((s) => s.id !== id);
    persistSuites(updated);
    if (selectedSuite === id) setSelectedSuite(updated[0]?.id ?? "");
  }

  const availableCases = useMemo(() => qaResult?.testCases ?? [], [qaResult]);
  const suiteCases = useMemo(
    () => (qaResult?.testCases ?? []).filter((tc) => activeSuite?.caseIds.includes(tc.tcId)),
    [qaResult, activeSuite]
  );

  function toggleCaseInSuite(tcId: string) {
    if (!activeSuite) return;
    const has = activeSuite.caseIds.includes(tcId);
    const updated = suites.map((s) =>
      s.id === activeSuite.id
        ? { ...s, caseIds: has ? s.caseIds.filter((id) => id !== tcId) : [...s.caseIds, tcId] }
        : s
    );
    persistSuites(updated);
  }

  function addAllCases() {
    if (!activeSuite) return;
    const existing = new Set(activeSuite.caseIds);
    const toAdd = availableCases.filter((tc) => !existing.has(tc.tcId)).map((tc) => tc.tcId);
    if (toAdd.length === 0) return;
    const updated = suites.map((s) =>
      s.id === activeSuite.id ? { ...s, caseIds: [...s.caseIds, ...toAdd] } : s
    );
    persistSuites(updated);
  }

  if (loading) return <div className="p-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>Loading suites...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap gap-3">
        {suites.map((suite) => (
          <button key={suite.id} onClick={() => setSelectedSuite(suite.id)} type="button"
            className="relative rounded-lg px-4 py-3 text-left transition-all cursor-pointer flex-1 min-w-[180px]"
            style={{
              background: selectedSuite === suite.id ? "var(--accent-soft)" : "var(--bg-secondary)",
              border: `1px solid ${selectedSuite === suite.id ? suite.color : "var(--border-subtle)"}`,
            }}
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 rounded-full" style={{ background: suite.color }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{suite.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{suite.caseIds.length} cases — {suite.description}</p>
              </div>
            </div>
          </button>
        ))}
        <button onClick={() => setShowCreate(true)} type="button"
          className="rounded-lg px-5 py-3 border-2 border-dashed text-sm font-semibold transition-colors cursor-pointer"
          style={{ borderColor: "var(--border-default)", color: "var(--text-muted)" }}
        >
          + New Suite
        </button>
      </div>

      {showCreate && (
        <Card>
          <h3 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>Create Test Suite</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <input className="input-modern px-4 py-2.5 text-sm" placeholder="Suite name (e.g. Smoke Tests)" value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <input className="input-modern px-4 py-2.5 text-sm" placeholder="Description (optional)" value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={createSuite} className="btn-primary px-4 py-2.5 text-sm font-semibold cursor-pointer" type="button">Create</button>
              <button onClick={() => setShowCreate(false)} className="btn-secondary px-4 py-2.5 text-sm cursor-pointer" type="button">Cancel</button>
            </div>
          </div>
        </Card>
      )}

      {activeSuite && (
        <Card>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-2.5 w-2.5 rounded-full" style={{ background: activeSuite.color }} />
                <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{activeSuite.name}</h2>
                <span className="badge badge-primary">{activeSuite.caseIds.length} cases</span>
              </div>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{activeSuite.description}</p>
            </div>
            <div className="flex gap-2">
              {availableCases.length > 0 && (
                <button onClick={addAllCases} className="btn-ghost px-3 py-1.5 text-xs cursor-pointer" type="button">
                  Add All Cases
                </button>
              )}
              <button onClick={() => deleteSuite(activeSuite.id)} className="btn-ghost px-3 py-1.5 text-xs cursor-pointer" style={{ color: "var(--danger)" }} type="button">
                Delete Suite
              </button>
            </div>
          </div>

          {availableCases.length > 0 ? (
            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
              {availableCases.map((tc) => {
                const included = activeSuite.caseIds.includes(tc.tcId);
                return (
                  <label key={tc.tcId}
                    className={`flex items-center gap-3 rounded-lg p-3 transition-colors cursor-pointer ${
                      included ? "card-highlight" : ""
                    }`}
                    style={{
                      background: included ? "var(--accent-soft)" : "var(--bg-secondary)",
                      border: `1px solid ${included ? "color-mix(in srgb, var(--accent) 25%, transparent)" : "var(--border-subtle)"}`,
                    }}
                  >
                    <input type="checkbox" checked={included} onChange={() => toggleCaseInSuite(tc.tcId)}
                      className="h-4 w-4 rounded accent-[var(--accent)]"
                    />
                    <div className="flex-1 text-sm">
                      <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{tc.tcId}</span>
                      <span className="ml-2 text-xs" style={{ color: "var(--text-muted)" }}>{tc.summary}</span>
                    </div>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      tc.category === "Positive" ? "border-emerald-500/20 text-emerald-500" :
                      tc.category === "Negative" ? "border-rose-500/20 text-rose-500" :
                      "border-amber-500/20 text-amber-500"
                    }`} style={{ background: "var(--bg-tertiary)" }}>
                      {tc.category}
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-sm rounded-lg border border-dashed" style={{ color: "var(--text-muted)", borderColor: "var(--border-default)" }}>
              Generate test cases first, then assign them to this suite.
            </div>
          )}
        </Card>
      )}

      {suiteCases.length > 0 && (
        <TestCaseTable title={activeSuite?.name ?? "Suite Cases"} testCases={suiteCases} />
      )}
    </div>
  );
}
