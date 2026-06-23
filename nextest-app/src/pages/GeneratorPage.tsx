import { type FormEvent, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useAppStore } from "../store/useAppStore";
import { api, type KnowledgeChunk, type KnowledgeFile, type QaResponse } from "../lib/api";
import { Card } from "../components/ui/Card";
import { TestCaseTable } from "../components/TestCaseTable";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { MobilePageHeader } from "../components/PageHeader";
import { GeneratingLoader } from "../components/GeneratingLoader";
import { DesktopOnlyGuard } from "../components/DesktopOnlyGuard";

const testCaseColumns = [
  { key: "tcId", label: "TC_ID" },
  { key: "category", label: "Category" },
  { key: "summary", label: "Summary" },
  { key: "testDescription", label: "Test Description" },
  { key: "testSteps", label: "Test Steps" },
  { key: "expected", label: "Expected Result" },
] as const;

function KnowledgeContext({ chunks }: { chunks: KnowledgeChunk[] }) {
  if (!chunks.length) {
    return (
      <div className="rounded-lg px-4 py-3 text-sm flex items-start gap-2" style={{ background: "var(--warning-soft)", color: "var(--warning)", border: "1px solid color-mix(in srgb, var(--warning) 25%, transparent)" }}>
        <svg className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>No matching knowledge files found. Generation relied solely on user requirement input text.</span>
      </div>
    );
  }
  return (
    <Card>
      <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>RAG Context Files Sampled</h3>
      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Matched document chunks retrieved to align generation behavior</p>
      <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
        {chunks.map((chunk, index) => (
          <div key={`${chunk.fileName}-${index}`} className="rounded-lg p-4 flex flex-col justify-between" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="badge badge-primary text-xs">Doc</span>
                <p className="text-sm font-semibold truncate max-w-[200px]" style={{ color: "var(--text-primary)" }}>{chunk.fileName}</p>
              </div>
              <p className="text-xs leading-relaxed line-clamp-3 italic" style={{ color: "var(--text-muted)" }}>&ldquo;{chunk.chunkText}&rdquo;</p>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              <span>Slice #{index + 1}</span>
              <span style={{ color: "var(--accent)" }}>Relevance: {Math.round(chunk.score * 100)}%</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function formatHistoryTime(dateStr: string) {
  try {
    return new Intl.DateTimeFormat("en", {
      month: "short", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: true,
    }).format(new Date(dateStr));
  } catch { return dateStr; }
}

function GeneratingLoaderStatic() {
  const phaseColors = [
    { accent: "var(--accent-cyan)", soft: "var(--accent-cyan-soft)", border: "color-mix(in srgb, var(--accent-cyan) 25%, transparent)" },
    { accent: "var(--accent-violet)", soft: "var(--accent-violet-soft)", border: "color-mix(in srgb, var(--accent-violet) 25%, transparent)" },
    { accent: "var(--accent-rose)", soft: "var(--accent-rose-soft)", border: "color-mix(in srgb, var(--accent-rose) 25%, transparent)" },
  ];
  return (
    <Card className="p-8 text-center">
      <div className="flex flex-col items-center">
        <div className="relative flex h-14 w-14 items-center justify-center">
          <div className="absolute inset-0 rounded-full animate-spin" style={{ border: "3px solid var(--accent)", borderTopColor: "transparent" }} />
          <span className="text-xs font-bold gradient-text">AI</span>
        </div>
        <h2 className="mt-4 text-lg font-bold" style={{ color: "var(--text-primary)" }}>Generating Test Cases</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>Retrieving vectors, compiling prompt, and requesting the AI model.</p>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { step: "Knowledge Retrieval", text: "Vector search & scoring" },
          { step: "Prompt Assembly", text: "Context injection" },
          { step: "Matrix Synthesis", text: "LLM inference & parsing" },
        ].map((item, index) => {
          const c = phaseColors[index];
          return (
            <div key={item.step} className="rounded-lg p-4" style={{ background: c.soft, border: `1px solid ${c.border}` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase" style={{ color: c.accent }}>Phase {index + 1}</span>
                <span className="flex h-1.5 w-1.5 rounded-full animate-ping" style={{ background: c.accent }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{item.step}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{item.text}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function GeneratorPage() {
  const qaResult = useAppStore((s) => s.qaResult);
  const setQaResult = useAppStore((s) => s.setQaResult);
  const history = useAppStore((s) => s.history);
  const addToHistory = useAppStore((s) => s.addToHistory);
  const deleteHistoryItem = useAppStore((s) => s.deleteHistoryItem);
  const clearHistory = useAppStore((s) => s.clearHistory);
  const provider = useAppStore((s) => s.provider);


  const [requirement, setRequirement] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [knowledgeFileCount, setKnowledgeFileCount] = useState(0);

  useEffect(() => {
    api.get<{ files: KnowledgeFile[] }>("/api/knowledge/files").then((res) => {
      setKnowledgeFileCount(res.data.files.length);
    }).catch(() => {});
  }, []);
  const [historySearch, setHistorySearch] = useState("");
  const [useStreaming, setUseStreaming] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean; title: string; message: string; confirmLabel?: string; onConfirm: () => void;
  }>({ open: false, title: "", message: "", onConfirm: () => {} });

  const [streamingText, setStreamingText] = useState("");
  const [streamPhase, setStreamPhase] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  function openConfirm(title: string, message: string, onConfirm: () => void, confirmLabel?: string) {
    setConfirmDialog({ open: true, title, message, onConfirm, confirmLabel });
  }
  function closeConfirm() { setConfirmDialog((prev) => ({ ...prev, open: false })); }

  const filteredHistory = history.filter((item) => {
    const query = historySearch.trim().toLowerCase();
    if (!query) return true;
    return [item.result.summary, item.requirement, item.timestamp].some((v) => v.toLowerCase().includes(query));
  });

  async function handleStreamingGenerate(requirementText: string) {
    if (!provider) { setError("Select an AI provider in Settings before generating."); return; }

    const abortController = new AbortController();
    abortRef.current = abortController;

    setStreamingText("");
    setStreamPhase("connecting");

    try {
      const response = await fetch("/api/generate-test-cases/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          requirement: requirementText,
          provider,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        setError(errData?.error || `Server error: ${response.status}`);
        setIsLoading(false);
        setStreamPhase(null);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) { setError("Stream not supported."); setIsLoading(false); setStreamPhase(null); return; }

      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            const eventType = line.slice(7).trim();
            if (eventType === "phase") continue;
            if (eventType === "token") setStreamPhase("generating");
            if (eventType === "complete") setStreamPhase("complete");
            if (eventType === "error") setStreamPhase("error");
          } else if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            try {
              const data = JSON.parse(dataStr);
              if (data.phase) {
                setStreamPhase(data.phase);
              }
              if (data.token) {
                setStreamingText((prev) => prev + data.token);
              }
              if (data.error) {
                setError(data.error);
              }
              if (data.summary) {
                const result = data as QaResponse;
                setQaResult(result);
                addToHistory(requirementText, result);
                setIsLoading(false);
                setStreamPhase(null);
                setStreamingText("");
              }
            } catch {
              // skip unparseable data
            }
          }
        }
      }

      setStreamPhase(null);
      setStreamingText("");
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setIsLoading(false);
        setStreamPhase(null);
        return;
      }
      setError(err instanceof Error ? err.message : "Stream request failed.");
      setIsLoading(false);
      setStreamPhase(null);
    }
  }

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setQaResult(null);
    if (!provider) { setError("Select an AI provider in Settings before generating."); return; }
    if (requirement.trim().length < 10) { setError("Please enter at least 10 characters of requirement text."); return; }
    setIsLoading(true);

    if (useStreaming) {
      await handleStreamingGenerate(requirement);
      if (abortRef.current) abortRef.current = null;
      return;
    }

    try {
      const response = await api.post<QaResponse>("/api/generate-test-cases", {
        requirement,
        provider,
      });
      setQaResult(response.data);
      addToHistory(requirement, response.data);
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        setError(requestError.response?.data?.error || requestError.message || "Unable to generate test cases.");
      } else if (requestError instanceof Error) {
        setError(requestError.message);
      } else { setError("Unable to generate test cases."); }
    } finally { setIsLoading(false); }
  }

  function cancelStream() {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsLoading(false);
    setStreamPhase(null);
    setStreamingText("");
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <MobilePageHeader pageKey="generator" />

      <DesktopOnlyGuard>
      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <form className="card p-6 flex flex-col justify-between" onSubmit={handleGenerate}>
          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Requirement Input</h2>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Input a user story, feature specification, or business rules.</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: "var(--text-muted)" }}>
                  <input type="checkbox" checked={useStreaming} onChange={(e) => setUseStreaming(e.target.checked)} className="rounded accent-[var(--accent)]" />
                  Live stream
                </label>
                <div className="relative inline-flex items-center">
                  <div className="group relative flex items-center">
                    <svg className="h-3.5 w-3.5 cursor-help" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" /></svg>
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 p-3 rounded-lg text-xs leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[9999] shadow-xl" style={{ background: "#1e293b", color: "#f1f5f9", border: "1px solid #334155" }}>
                      When enabled, test case generation streams tokens in real time so you can watch the AI build each test case as it arrives. Disable for faster batch generation.
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent" style={{ borderBottomColor: "#1e293b" }} />
                    </div>
                  </div>
                </div>
                {requirement && (
                  <button type="button" onClick={() => setRequirement("")} className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    Clear
                  </button>
                )}
                {knowledgeFileCount > 0 && (
                  <span className="badge badge-success"><span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />RAG Active</span>
                )}
              </div>
            </div>
            <div className="relative">
              <textarea className="input-modern w-full min-h-[220px] resize-none p-4 text-sm leading-relaxed"
                placeholder="Paste details of the feature to test... (e.g. Account Registration Flow, checkout validation rule)"
                value={requirement} onChange={(event) => setRequirement(event.target.value)}
              />
              {requirement.length > 0 && (
                <button type="button" onClick={() => { setRequirement(""); setError(""); }}
                  className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-md btn-ghost"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
            {error ? (
              <p className="mt-3 rounded-lg px-4 py-3 text-sm font-medium" style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid color-mix(in srgb, var(--danger) 25%, transparent)" }}>
                {error}
              </p>
            ) : null}
          </div>
          <div className="flex gap-3 mt-5">
            <button className="btn-primary flex-1 py-3 text-sm font-semibold" disabled={isLoading} type="submit">
              {isLoading ? "Generating..." : "Generate Test Cases"}
            </button>
            {isLoading && streamPhase && (
              <button type="button" onClick={cancelStream} className="btn-secondary px-4 py-3 text-sm font-semibold">
                Cancel
              </button>
            )}
          </div>
        </form>

        <Card>
          <h2 className="text-base font-bold" style={{ color: "var(--accent-rose)" }}>AI Context Enrichment</h2>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>How the RAG pipeline is built for this query</p>
          <div className="mt-5 space-y-4">
            {[
              { title: "Vector Database Search", desc: "Search document chunks uploaded in your Knowledge Base that match your requirement text.", color: "var(--accent-cyan)", soft: "var(--accent-cyan-soft)" },
              { title: "Prompt Context Injection", desc: "Combine matched document chunks with standard QA templates into a secure LLM prompt context.", color: "var(--accent-violet)", soft: "var(--accent-violet-soft)" },
              { title: "Test Matrix Compilation", desc: "Produce organized positive, negative, and validation test cases.", color: "var(--accent-emerald)", soft: "var(--accent-emerald-soft)" },
            ].map((step, index) => (
              <div key={step.title} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold" style={{ background: step.soft, color: step.color }}>{index + 1}</div>
                  {index < 2 && <div className="w-px flex-1" style={{ background: "var(--border-default)" }} />}
                </div>
                <div className="pb-2">
                  <p className="text-sm font-semibold" style={{ color: step.color }}>{step.title}</p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t" style={{ borderColor: "var(--border-default)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Output Columns</p>
            <div className="flex flex-wrap gap-1.5">
              {testCaseColumns.map((column, i) => {
                const colColors = ["badge-violet", "badge-rose", "badge-amber", "badge-cyan", "badge-primary", "badge-success"];
                return <span key={column.key} className={`badge ${colColors[i % colColors.length]}`}>{column.label}</span>;
              })}
            </div>
          </div>
        </Card>
      </section>

      {isLoading && streamPhase ? (
        <GeneratingLoader phase={streamPhase} streamingText={streamingText} onCancel={cancelStream} />
      ) : isLoading ? (
        <GeneratingLoaderStatic />
      ) : qaResult ? (
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>Generated Test Matrix</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>{qaResult.summary}</h2>
            </div>
          </div>

          <KnowledgeContext chunks={qaResult.knowledgeContext ?? []} />

          {history.length > 0 ? (
            <Card className="p-0 overflow-hidden">
              <div className="p-5 border-b" style={{ borderColor: "var(--border-default)" }}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Generation History</h2>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Click a row to restore a previous generation.</p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative w-full sm:w-64">
                      <input className="input-modern w-full pl-9 pr-3 py-2 text-xs" onChange={(event) => setHistorySearch(event.target.value)} placeholder="Search..." type="search" value={historySearch} />
                      <svg className="absolute left-3 top-2.5 h-4 w-4" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <button onClick={() => openConfirm("Clear All History", "Delete all generation history? This cannot be undone.", clearHistory, "Clear All")} className="btn-danger px-3 py-2 text-xs" type="button">Clear All</button>
                  </div>
                </div>
              </div>

              {filteredHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead><tr style={{ borderBottom: "1px solid var(--border-default)", background: "var(--accent-soft)" }}>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>Summary</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: "var(--accent)" }}>Cases</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>Timestamp</th>
                      <th className="px-5 py-3 text-right" style={{ color: "var(--accent)" }}>Actions</th>
                    </tr></thead>
                    <tbody>
                      {filteredHistory.map((item) => {
                        const isSelected = qaResult?.summary === item.result.summary;
                        return (
                          <tr key={item.id} className="cursor-pointer transition-colors" style={{ borderBottom: "1px solid var(--border-subtle)", background: isSelected ? "var(--accent-soft)" : "transparent" }}
                            onClick={() => { setQaResult(item.result); window.scrollTo({ top: document.body.scrollHeight / 3, behavior: "smooth" }); }}
                          >
                            <td className="px-5 py-3.5">
                              <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{item.result.summary}</p>
                              <p className="text-xs mt-0.5 truncate max-w-xs" style={{ color: "var(--text-muted)" }}>{item.requirement}</p>
                            </td>
                            <td className="px-5 py-3.5 text-center font-semibold" style={{ color: "var(--text-primary)" }}>{item.result.testCases.length}</td>
                            <td className="px-5 py-3.5 text-sm" style={{ color: "var(--text-muted)" }}>{formatHistoryTime(item.timestamp)}</td>
                            <td className="px-5 py-3.5 text-right space-x-2">
                              <button onClick={(event) => { event.stopPropagation(); setQaResult(item.result); }} className="btn-ghost px-2 py-1 text-xs" type="button">View</button>
                              <button onClick={(event) => { event.stopPropagation(); openConfirm("Delete Entry", `Delete "${item.result.summary}"?`, () => deleteHistoryItem(item.id), "Delete"); }} className="btn-ghost px-2 py-1 text-xs" style={{ color: "var(--danger)" }} type="button">Delete</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                  <p className="font-medium">No test cases found.</p>
                  <p className="text-xs mt-1">Try a different search query.</p>
                </div>
              )}
            </Card>
          ) : null}

          <TestCaseTable title={qaResult.summary} testCases={qaResult.testCases} />
        </section>
      ) : (
        <section className="card p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--bg-tertiary)" }}>
            <svg className="h-6 w-6" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="mt-4 text-base font-bold" style={{ color: "var(--text-primary)" }}>Test Case Output</p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>Input requirement parameters above and trigger the generator.</p>
        </section>
      )}
      </DesktopOnlyGuard>

      <ConfirmDialog open={confirmDialog.open} title={confirmDialog.title} message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        onConfirm={() => { confirmDialog.onConfirm(); closeConfirm(); }} onCancel={closeConfirm}
      />
    </div>
  );
}
