import React, { useState } from 'react';
import type { TestCase, TestCaseCategory } from '../../contracts';
import { StatusBadge } from './StatusBadge';
import { ChevronDown, ChevronRight, Download, Edit2, Trash2, Search } from 'lucide-react';

interface DataTableProps {
  testCases: TestCase[];
  filter: string;
  onFilterChange: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  categoryCounts: {
    all: number;
    positive: number;
    negative: number;
    edge: number;
    validation: number;
  };
  onUpdateTestCase?: (index: number, updated: TestCase) => void;
  onDeleteTestCase?: (index: number) => void;
  onExportExcel?: () => void;
  onExportCsv?: () => void;
  onExportJson?: () => void;
  className?: string;
}

export function DataTable({
  testCases,
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  categoryCounts,
  onUpdateTestCase,
  onDeleteTestCase,
  onExportExcel,
  onExportCsv,
  onExportJson: _onExportJson,
  className = '',
}: DataTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getCategoryBadgeVariant = (cat: TestCaseCategory) => {
    const c = (cat || '').toLowerCase();
    if (c.includes('positive')) return 'success';
    if (c.includes('negative')) return 'danger';
    if (c.includes('edge')) return 'warning';
    return 'violet';
  };

  return (
    <div
      className={`rounded-xl overflow-hidden shadow-sm flex flex-col ${className}`}
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {/* Top Filter Bar */}
      <div
        className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Cases', count: categoryCounts.all },
            { id: 'positive', label: 'Positive', count: categoryCounts.positive },
            { id: 'negative', label: 'Negative', count: categoryCounts.negative },
            { id: 'edge', label: 'Edge', count: categoryCounts.edge },
            { id: 'validation', label: 'Validation', count: categoryCounts.validation },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onFilterChange(tab.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium font-mono whitespace-nowrap transition-all ${
                filter.toLowerCase() === tab.id.toLowerCase()
                  ? 'shadow-sm font-semibold'
                  : 'hover:opacity-80'
              }`}
              style={{
                background:
                  filter.toLowerCase() === tab.id.toLowerCase()
                    ? 'var(--color-accent)'
                    : 'var(--bg-tertiary)',
                color:
                  filter.toLowerCase() === tab.id.toLowerCase()
                    ? '#ffffff'
                    : 'var(--text-secondary)',
              }}
            >
              {tab.label} <span className="opacity-75">({tab.count})</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter matrix..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full sm:w-44 pl-8 pr-3 py-1 text-xs rounded-lg font-mono focus:outline-none border bg-[var(--bg-tertiary)] text-foreground"
              style={{ borderColor: 'var(--border-subtle)' }}
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onExportExcel && (
              <button
                type="button"
                onClick={onExportExcel}
                className="px-2.5 py-1 text-xs rounded-lg font-medium flex items-center gap-1.5 transition-colors border bg-[var(--bg-tertiary)] text-foreground"
                style={{ borderColor: 'var(--border-subtle)' }}
                title="Export to Excel"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Excel</span>
              </button>
            )}

            {onExportCsv && (
              <button
                type="button"
                onClick={onExportCsv}
                className="px-2.5 py-1 text-xs rounded-lg font-medium flex items-center gap-1.5 transition-colors border bg-[var(--bg-tertiary)] text-foreground"
                style={{ borderColor: 'var(--border-subtle)' }}
                title="Export to CSV"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">CSV</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* DESKTOP VIEW: High-Density Data Grid (Hidden on Mobile) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr
              className="border-b font-mono uppercase tracking-wider text-[11px] bg-[var(--bg-tertiary)] text-muted-foreground"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <th className="px-4 py-2.5 w-10"></th>
              <th className="px-4 py-2.5 w-24">TC_ID</th>
              <th className="px-4 py-2.5 w-28">Category</th>
              <th className="px-4 py-2.5">Summary</th>
              <th className="px-4 py-2.5">Expected Result</th>
              <th className="px-4 py-2.5 w-24">Status</th>
              <th className="px-4 py-2.5 w-20 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {testCases.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                  No test cases found matching current criteria.
                </td>
              </tr>
            ) : (
              testCases.map((tc, idx) => {
                const isExpanded = expandedId === tc.tcId;

                return (
                  <React.Fragment key={tc.tcId || idx}>
                    <tr
                      className="hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : tc.tcId)}
                    >
                      <td className="px-4 py-3 text-center text-muted-foreground">
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                      </td>
                      <td
                        className="px-4 py-3 font-mono font-semibold"
                        style={{ color: 'var(--color-accent)' }}
                      >
                        {tc.tcId}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          label={tc.category}
                          variant={getCategoryBadgeVariant(tc.category)}
                          size="sm"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium max-w-xs truncate text-foreground">
                        {tc.summary}
                      </td>
                      <td className="px-4 py-3 max-w-sm truncate text-muted-foreground">
                        {tc.expected}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                          {tc.status || 'draft'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {onUpdateTestCase && (
                            <button
                              type="button"
                              onClick={() => onUpdateTestCase(idx, tc)}
                              className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-muted-foreground"
                              title="Edit test case"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {onDeleteTestCase && (
                            <button
                              type="button"
                              onClick={() => onDeleteTestCase(idx)}
                              className="p-1 rounded hover:bg-rose-500/10 text-rose-500"
                              title="Delete test case"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Details Drawer */}
                    {isExpanded && (
                      <tr className="border-b bg-[var(--bg-tertiary)]">
                        <td colSpan={7} className="px-8 py-4">
                          <div className="space-y-3">
                            <div>
                              <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Description
                              </p>
                              <p className="mt-0.5 text-xs text-foreground leading-relaxed">
                                {tc.testDescription}
                              </p>
                            </div>
                            <div>
                              <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Execution Steps
                              </p>
                              <ol className="mt-1 list-decimal list-inside space-y-1 font-mono text-xs text-secondary-foreground">
                                {Array.isArray(tc.testSteps) ? (
                                  tc.testSteps.map((step, sIdx) => <li key={sIdx}>{step}</li>)
                                ) : (
                                  <li>{tc.testSteps}</li>
                                )}
                              </ol>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE VIEW: High-Density Scenario Cards (Hidden on Desktop) */}
      <div className="block md:hidden divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
        {testCases.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-muted-foreground">
            No test cases found in current filter.
          </div>
        ) : (
          testCases.map((tc, idx) => {
            const isExpanded = expandedId === tc.tcId;

            return (
              <div
                key={tc.tcId || idx}
                className="p-4 space-y-2.5 hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : tc.tcId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-mono font-bold text-xs"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      {tc.tcId}
                    </span>
                    <StatusBadge
                      label={tc.category}
                      variant={getCategoryBadgeVariant(tc.category)}
                      size="sm"
                    />
                  </div>
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {tc.status || 'draft'}
                    </span>
                    {onDeleteTestCase && (
                      <button
                        type="button"
                        onClick={() => onDeleteTestCase(idx)}
                        className="p-1 text-muted-foreground hover:text-rose-500"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs font-semibold text-foreground leading-snug">{tc.summary}</p>

                <div
                  className="p-2 rounded text-[11px] font-mono"
                  style={{ background: 'var(--bg-tertiary)' }}
                >
                  <span className="text-muted-foreground uppercase text-[9px] block">
                    Expected:
                  </span>
                  <span className="text-foreground">{tc.expected}</span>
                </div>

                {isExpanded && (
                  <div className="pt-2 border-t border-border/30 space-y-2 text-xs">
                    <div>
                      <p className="text-[10px] font-mono uppercase text-muted-foreground font-semibold">
                        Description
                      </p>
                      <p className="text-foreground mt-0.5 leading-relaxed">{tc.testDescription}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono uppercase text-muted-foreground font-semibold">
                        Steps
                      </p>
                      <ol className="list-decimal list-inside space-y-1 font-mono text-[11px] text-muted-foreground mt-0.5">
                        {Array.isArray(tc.testSteps) ? (
                          tc.testSteps.map((step, sIdx) => <li key={sIdx}>{step}</li>)
                        ) : (
                          <li>{tc.testSteps}</li>
                        )}
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
