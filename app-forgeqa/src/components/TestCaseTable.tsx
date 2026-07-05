import { useMemo, useState } from "react";
import type { TestCase, TestCaseCategory, TestCaseStatus } from "../lib/api";

const categoryStyles: Record<string, string> = {
  Positive: "badge-emerald",
  Negative: "badge-rose",
  Validation: "badge-cyan",
  "Validation checks": "badge-cyan",
  Edge: "badge-amber",
  "Edge cases": "badge-amber",
};

const testCaseColumns = [
  { key: "tcId" as const, label: "TC_ID", sortable: true },
  { key: "category" as const, label: "Category", sortable: true },
  { key: "summary" as const, label: "Summary", sortable: true },
  { key: "testDescription" as const, label: "Test Description", sortable: false },
  { key: "testSteps" as const, label: "Test Steps", sortable: false },
  { key: "expected" as const, label: "Expected Result", sortable: true },
];

type SortDir = "asc" | "desc" | null;

function buildExportRows(testCases: TestCase[]) {
  return testCases.map((tc) => ({
    TC_ID: tc.tcId,
    Category: tc.category,
    Summary: tc.summary,
    "Test Description": tc.testDescription,
    "Test Steps": tc.testSteps.map((step, i) => `${i + 1}. ${step}`).join("\n"),
    "Expected Result": tc.expected,
    Status: tc.status ?? "draft",
  }));
}

function getExportFileName(extension: "xlsx" | "pdf") {
  const date = new Date().toISOString().slice(0, 10);
  return `nextest-test-cases-${date}.${extension}`;
}

export function TestCaseTable({ title, testCases: rawTestCases }: { title: string; testCases: TestCase[] }) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [filterCategory, setFilterCategory] = useState<TestCaseCategory | "all">("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<TestCaseStatus | "all">("all");
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const localTestCases = useMemo(() => {
    return rawTestCases.map((tc) => ({ ...tc, status: tc.status ?? "draft" as TestCaseStatus }));
  }, [rawTestCases]);

  const allCategories = useMemo(() => {
    const cats = new Set<TestCaseCategory>();
    localTestCases.forEach((tc) => cats.add(tc.category));
    return Array.from(cats);
  }, [localTestCases]);

  const filteredAndSorted = useMemo(() => {
    let result = [...localTestCases];

    if (filterCategory !== "all") {
      result = result.filter((tc) => tc.category === filterCategory);
    }
    if (statusFilter !== "all") {
      result = result.filter((tc) => tc.status === statusFilter);
    }

    if (sortKey && sortDir) {
      result.sort((a, b) => {
        const aVal = String(a[sortKey as keyof TestCase] ?? "");
        const bVal = String(b[sortKey as keyof TestCase] ?? "");
        const cmp = aVal.localeCompare(bVal);
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [localTestCases, filterCategory, statusFilter, sortKey, sortDir]);

  function handleSort(key: string) {
    if (sortKey === key) {
      if (sortDir === "asc") setSortDir("desc");
      else if (sortDir === "desc") { setSortKey(null); setSortDir(null); }
      else { setSortKey(key); setSortDir("asc"); }
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function toggleRowExpansion(tcId: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(tcId)) next.delete(tcId);
      else next.add(tcId);
      return next;
    });
  }

  function toggleRowSelection(tcId: string) {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(tcId)) next.delete(tcId);
      else next.add(tcId);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedRows.size === filteredAndSorted.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredAndSorted.map((tc) => tc.tcId)));
    }
  }

  async function exportExcel() {
    setIsExportingExcel(true);
    try {
      const XLSX = await import("xlsx");
      const worksheet = XLSX.utils.json_to_sheet(buildExportRows(filteredAndSorted));
      worksheet["!cols"] = [{ wch: 12 }, { wch: 18 }, { wch: 34 }, { wch: 48 }, { wch: 64 }, { wch: 48 }];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "ForgeQA");
      XLSX.writeFile(workbook, getExportFileName("xlsx"));
    } finally { setIsExportingExcel(false); }
  }

  async function exportPdf() {
    setIsExportingPdf(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 32;
      const usableWidth = pageWidth - margin * 2;
      const columnWidths = [58, 76, 124, 168, 210, 168];
      let y = 44;
      doc.setFont("helvetica", "bold"); doc.setFontSize(16);
      doc.text("ForgeQA Test Cases", margin, y); y += 24;
      doc.setFontSize(8); doc.setFillColor(49, 88, 255); doc.setTextColor(255, 255, 255);
      doc.rect(margin, y, usableWidth, 22, "F");
      let x = margin;
      testCaseColumns.forEach((col, i) => {
        const label = col.key === "tcId" ? "TC_ID" : col.key === "expected" ? "Expected Result" : col.key === "testDescription" ? "Test Description" : col.key === "testSteps" ? "Test Steps" : col.key.charAt(0).toUpperCase() + col.key.slice(1);
        doc.text(label, x + 4, y + 14, { maxWidth: columnWidths[i] - 8 }); x += columnWidths[i];
      });
      y += 22; doc.setFont("helvetica", "normal"); doc.setTextColor(30, 41, 59);
      filteredAndSorted.forEach((tc, rowIdx) => {
        const vals = [tc.tcId, tc.category, tc.summary, tc.testDescription, tc.testSteps.map((s, i) => `${i + 1}. ${s}`).join("\n"), tc.expected];
        const splitCells = vals.map((v, i) => doc.splitTextToSize(v, columnWidths[i] - 8));
        const rowH = Math.max(34, ...splitCells.map((c) => c.length * 10 + 12));
        if (y + rowH > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); y = margin; }
        if (rowIdx % 2 === 0) { doc.setFillColor(247, 249, 252); doc.rect(margin, y, usableWidth, rowH, "F"); }
        x = margin;
        splitCells.forEach((cell, i) => { doc.text(cell, x + 4, y + 12, { maxWidth: columnWidths[i] - 8 }); x += columnWidths[i]; });
        y += rowH;
      });
      doc.save(getExportFileName("pdf"));
    } finally { setIsExportingPdf(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--accent)" }}>Test Case Table</p>
            <h3 className="mt-1 text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <select className="input-modern px-3 py-2 text-xs" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as TestCaseCategory | "all")}>
              <option value="all">All Categories</option>
              {allCategories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select className="input-modern px-3 py-2 text-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TestCaseStatus | "all")}>
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="reviewed">Reviewed</option>
              <option value="approved">Approved</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {selectedRows.size > 0 && (
            <span className="text-xs font-semibold self-center" style={{ color: "var(--text-muted)" }}>
              {selectedRows.size} selected
            </span>
          )}
          <button className="btn-primary flex items-center gap-2 px-4 py-2.5 text-xs" onClick={exportExcel} disabled={isExportingExcel} type="button">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {isExportingExcel ? "Exporting..." : "Export Excel"}
          </button>
          <button className="btn-primary flex items-center gap-2 px-4 py-2.5 text-xs" style={{ background: "var(--gradient-warm)" }} onClick={exportPdf} disabled={isExportingPdf} type="button">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {isExportingPdf ? "Exporting..." : "Export PDF"}
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm table-enterprise">
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-default)", background: "var(--bg-tertiary)" }}>
                <th className="px-4 py-3.5 w-10">
                  <input type="checkbox" className="rounded accent-[var(--accent)]"
                    checked={selectedRows.size === filteredAndSorted.length && filteredAndSorted.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-1 py-3.5 w-8" />
                {testCaseColumns.map((col) => (
                  <th key={col.key} className={`px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider ${col.sortable ? "cursor-pointer select-none" : ""}`}
                    style={{ color: "var(--text-muted)" }}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <span className="flex items-center gap-1.5">
                      {col.label}
                      {sortKey === col.key && sortDir && (
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          {sortDir === "asc" ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          )}
                        </svg>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.map((testCase, rowIndex) => {
                const isExpanded = expandedRows.has(testCase.tcId);
                const isSelected = selectedRows.has(testCase.tcId);
                return (
                  <tr key={testCase.tcId} className="transition-colors"
                    style={{ background: rowIndex % 2 === 0 ? "var(--bg-secondary)" : "rgba(247,249,252,0.5)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--accent-soft)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = rowIndex % 2 === 0 ? "var(--bg-secondary)" : "rgba(247,249,252,0.5)"; }}
                  >
                    <td className="px-4 py-4">
                      <input type="checkbox" className="rounded accent-[var(--accent)]"
                        checked={isSelected}
                        onChange={() => toggleRowSelection(testCase.tcId)}
                      />
                    </td>
                    <td className="px-1 py-4">
                      <button onClick={() => toggleRowExpansion(testCase.tcId)} type="button" className="btn-ghost p-1">
                        <svg className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </td>
                    <td className="px-5 py-4 font-semibold" style={{ color: "var(--text-primary)" }}>{testCase.tcId}</td>
                    <td className="px-5 py-4">
                      <span className={`badge ${categoryStyles[testCase.category] ?? categoryStyles.Positive}`}>
                        {testCase.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-medium" style={{ color: "var(--text-primary)" }}>{testCase.summary}</td>
                    <td className="px-5 py-4 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {isExpanded ? testCase.testDescription : (
                        <span className="line-clamp-2">{testCase.testDescription}</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {isExpanded ? (
                        <ol className="list-decimal space-y-1 pl-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                          {testCase.testSteps.map((step, sIdx) => (
                            <li key={`${testCase.tcId}-step-${sIdx}`}>{step}</li>
                          ))}
                        </ol>
                      ) : (
                        <span className="line-clamp-2" style={{ color: "var(--text-muted)" }}>
                          {testCase.testSteps.length} step{testCase.testSteps.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-medium" style={{ color: "var(--accent)" }}>{testCase.expected}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredAndSorted.length === 0 && (
            <div className="p-10 text-center" style={{ background: "var(--bg-tertiary)" }}>
              <div className="h-12 w-12 mx-auto rounded-xl flex items-center justify-center mb-3" style={{ background: "var(--accent-rose-soft)" }}>
                <svg className="h-6 w-6" style={{ color: "var(--accent-rose)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>No test cases match the current filters.</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Try adjusting your filter criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
