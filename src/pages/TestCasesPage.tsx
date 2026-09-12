import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  ChevronDown,
  UploadCloud,
  PlayCircle,
  UserCheck,
  Trash2,
  X,
} from 'lucide-react';

interface TestCase {
  id: string;
  title: string;
  suite: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Active' | 'Draft' | 'Archived';
  assignee: {
    name: string;
    initials: string;
    avatarColor?: string;
  } | null;
}

export function TestCasesPage() {
  const navigate = useNavigate();

  // Initial Test Cases from Figma Specs
  const initialCases: TestCase[] = [
    {
      id: 'TC-1001',
      title: 'Valid user credentials authenticates cleanly',
      suite: 'Auth Flow',
      priority: 'Critical',
      status: 'Active',
      assignee: { name: 'Sarah', initials: 'SJ' },
    },
    {
      id: 'TC-1002',
      title: 'Password validation triggers proper special-character alert',
      suite: 'Auth Flow',
      priority: 'High',
      status: 'Active',
      assignee: { name: 'Sarah', initials: 'SJ' },
    },
    {
      id: 'TC-1003',
      title: 'Checkout pipeline with empty shopping-cart validation',
      suite: 'Checkout Pipeline',
      priority: 'Critical',
      status: 'Active',
      assignee: { name: 'Marcus', initials: 'MV' },
    },
    {
      id: 'TC-1004',
      title: 'Stripe multi-currency webhook rate-limiting tests',
      suite: 'Payment Integrations',
      priority: 'Medium',
      status: 'Active',
      assignee: { name: 'David', initials: 'DC' },
    },
    {
      id: 'TC-1005',
      title: 'Global search results debounce matching keys',
      suite: 'Search Functionality',
      priority: 'Medium',
      status: 'Draft',
      assignee: null,
    },
    {
      id: 'TC-1006',
      title: 'Invalid response codes throw proper intercept errors',
      suite: 'API Responses',
      priority: 'High',
      status: 'Draft',
      assignee: { name: 'Marcus', initials: 'MV' },
    },
    {
      id: 'TC-1007',
      title: 'Theme toggles safely across browser cache resets',
      suite: 'Preferences UX',
      priority: 'Low',
      status: 'Archived',
      assignee: null,
    },
    {
      id: 'TC-1008',
      title: 'Multi-tiered subscription updates instantly in workspace',
      suite: 'Billing Pipeline',
      priority: 'Critical',
      status: 'Active',
      assignee: { name: 'Sarah', initials: 'SJ' },
    },
  ];

  const [testCases, setTestCases] = useState<TestCase[]>(initialCases);
  const [selectedIds, setSelectedIds] = useState<string[]>(['TC-1003', 'TC-1004']); // Figma initial selection
  const [searchQuery, setSearchQuery] = useState('');
  const [suiteFilter, setSuiteFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activePage, setActivePage] = useState(1);
  const [newCaseModalOpen, setNewCaseModalOpen] = useState(false);

  // New Test Case Form State
  const [newTitle, setNewTitle] = useState('');
  const [newSuite, setNewSuite] = useState('Auth Flow');
  const [newPriority, setNewPriority] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('High');

  // Filter Logic
  const filteredCases = useMemo(() => {
    return testCases.filter((tc) => {
      const matchSearch =
        tc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tc.suite.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSuite = suiteFilter === 'All' || tc.suite === suiteFilter;
      const matchPriority = priorityFilter === 'All' || tc.priority === priorityFilter;
      const matchStatus = statusFilter === 'All' || tc.status === statusFilter;
      return matchSearch && matchSuite && matchPriority && matchStatus;
    });
  }, [testCases, searchQuery, suiteFilter, priorityFilter, statusFilter]);

  // Selection Logic
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCases.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCases.map((c) => c.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    setTestCases((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
    setSelectedIds([]);
  };

  const handleBulkRun = () => {
    navigate('/test-runs?action=new');
  };

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const nextId = `TC-${1000 + testCases.length + 1}`;
    const newCase: TestCase = {
      id: nextId,
      title: newTitle.trim(),
      suite: newSuite,
      priority: newPriority,
      status: 'Active',
      assignee: { name: 'Sarah', initials: 'SJ' },
    };

    setTestCases([newCase, ...testCases]);
    setNewTitle('');
    setNewCaseModalOpen(false);
  };

  const priorityBadgeStyle = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-[#FEF2F2] text-[#B91C1C]';
      case 'High':
        return 'bg-[#FEF3C7] text-[#B45309]';
      case 'Medium':
        return 'bg-[#EFF6FF] text-[#1D4ED8]';
      case 'Low':
      default:
        return 'bg-[#F1F5F9] text-[#475569]';
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'text-[#10B981]';
      case 'Draft':
        return 'text-[#F59E0B]';
      case 'Archived':
      default:
        return 'text-[#64748B]';
    }
  };

  return (
    <div className="relative space-y-5 font-['Instrument_Sans',sans-serif]">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Test Cases</h1>
          <span className="px-2 py-0.5 rounded-[6px] text-xs font-semibold bg-[#F1F5F9] text-[#475569] uppercase tracking-wider">
            1,247 Total
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setNewCaseModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Test Case</span>
          </button>
        </div>
      </div>

      {/* ── Filter Toolbar ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 shadow-[0px_4px_12px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Field */}
          <div className="flex items-center h-8 bg-[#F1F5F9] rounded-md px-3 gap-2 text-[#64748B] w-full sm:w-64 border border-transparent focus-within:border-[#CBD5E1] focus-within:bg-white transition-all">
            <Search className="w-3.5 h-3.5 shrink-0 text-[#64748B]" />
            <input
              type="text"
              placeholder="Filter by case title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-[#0F172A] placeholder-[#64748B] w-full"
            />
          </div>

          {/* Suite Dropdown */}
          <div className="relative">
            <select
              value={suiteFilter}
              onChange={(e) => setSuiteFilter(e.target.value)}
              className="h-8 pl-3 pr-8 rounded-md border border-[#E2E8F0] bg-white text-xs font-medium text-[#0F172A] outline-none appearance-none cursor-pointer hover:bg-[#F8FAFC]"
            >
              <option value="All">Suite: All</option>
              <option value="Auth Flow">Auth Flow</option>
              <option value="Checkout Pipeline">Checkout Pipeline</option>
              <option value="Payment Integrations">Payment Integrations</option>
              <option value="Search Functionality">Search Functionality</option>
              <option value="API Responses">API Responses</option>
              <option value="Preferences UX">Preferences UX</option>
              <option value="Billing Pipeline">Billing Pipeline</option>
            </select>
            <ChevronDown className="w-3 h-3 text-[#0F172A] absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Priority Dropdown */}
          <div className="relative">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-8 pl-3 pr-8 rounded-md border border-[#E2E8F0] bg-white text-xs font-medium text-[#0F172A] outline-none appearance-none cursor-pointer hover:bg-[#F8FAFC]"
            >
              <option value="All">Priority: All</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <ChevronDown className="w-3 h-3 text-[#0F172A] absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 pl-3 pr-8 rounded-md border border-[#E2E8F0] bg-white text-xs font-medium text-[#0F172A] outline-none appearance-none cursor-pointer hover:bg-[#F8FAFC]"
            >
              <option value="All">Status: All</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>
            <ChevronDown className="w-3 h-3 text-[#0F172A] absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Right Action: Export */}
        <button
          type="button"
          onClick={() => {
            const jsonStr = JSON.stringify(testCases, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `forgeqa-test-cases-${Date.now()}.json`;
            a.click();
          }}
          className="flex items-center gap-2 h-9 px-4 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-sm font-semibold text-[#0F172A] transition-colors"
        >
          <UploadCloud className="w-4 h-4 text-[#0F172A]" />
          <span>Export</span>
        </button>
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-[0px_4px_12px_rgba(0,0,0,0.02)]">
        {/* Table Header */}
        <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-4 py-3 flex items-center gap-3 text-xs font-semibold text-[#64748B]">
          <div className="w-6 flex items-center justify-center">
            <input
              type="checkbox"
              checked={selectedIds.length > 0 && selectedIds.length === filteredCases.length}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-[#E2E8F0] text-[#4F46E5] focus:ring-[#4F46E5] cursor-pointer"
            />
          </div>
          <div className="w-20">ID</div>
          <div className="flex-1 min-w-[200px]">TITLE</div>
          <div className="w-36 hidden md:block">SUITE</div>
          <div className="w-24">PRIORITY</div>
          <div className="w-24">STATUS</div>
          <div className="w-28 text-right hidden sm:block">ASSIGNED TO</div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-[#E2E8F0]">
          {filteredCases.map((tc) => {
            const isSelected = selectedIds.includes(tc.id);

            return (
              <div
                key={tc.id}
                onClick={() => toggleSelectOne(tc.id)}
                className={`px-4 py-3 flex items-center gap-3 text-sm transition-colors cursor-pointer ${
                  isSelected ? 'bg-[#EEF2FF]' : 'hover:bg-[#F8FAFC]'
                }`}
              >
                {/* Checkbox */}
                <div
                  className="w-6 flex items-center justify-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectOne(tc.id)}
                    className="w-4 h-4 rounded border-[#E2E8F0] text-[#4F46E5] focus:ring-[#4F46E5] cursor-pointer"
                  />
                </div>

                {/* ID */}
                <div className="w-20 font-semibold text-xs text-[#64748B]">{tc.id}</div>

                {/* Title */}
                <div className="flex-1 min-w-[200px] font-medium text-sm text-[#0F172A] truncate">
                  {tc.title}
                </div>

                {/* Suite */}
                <div className="w-36 text-xs text-[#64748B] truncate hidden md:block">
                  {tc.suite}
                </div>

                {/* Priority */}
                <div className="w-24">
                  <span
                    className={`px-2 py-0.5 rounded-[6px] text-xs font-semibold uppercase tracking-wider ${priorityBadgeStyle(
                      tc.priority
                    )}`}
                  >
                    {tc.priority}
                  </span>
                </div>

                {/* Status */}
                <div className={`w-24 text-xs font-medium ${statusColor(tc.status)}`}>
                  {tc.status}
                </div>

                {/* Assigned To */}
                <div className="w-28 flex items-center justify-end gap-2 hidden sm:flex">
                  {tc.assignee ? (
                    <>
                      <div className="w-5 h-5 rounded-full bg-[#4F46E5] text-white text-[9px] font-semibold flex items-center justify-center shrink-0">
                        {tc.assignee.initials}
                      </div>
                      <span className="text-xs text-[#0F172A] truncate">{tc.assignee.name}</span>
                    </>
                  ) : (
                    <span className="text-xs text-[#64748B]">Unassigned</span>
                  )}
                </div>
              </div>
            );
          })}

          {filteredCases.length === 0 && (
            <div className="py-12 text-center text-sm text-[#64748B]">
              No test cases match your current filters.
            </div>
          )}
        </div>
      </div>

      {/* ── Pagination ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <span className="text-xs text-[#64748B]">
          Showing 1-{filteredCases.length} of 1,247 test cases
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={activePage === 1}
            onClick={() => setActivePage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] disabled:opacity-50 transition-colors"
          >
            Previous
          </button>

          {[1, 2, 3].map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setActivePage(page)}
              className={`w-7 h-7 rounded text-xs font-semibold flex items-center justify-center transition-colors ${
                activePage === page
                  ? 'bg-[#4F46E5] text-white'
                  : 'text-[#0F172A] hover:bg-white border border-transparent hover:border-[#E2E8F0]'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setActivePage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      {/* ── Floating Bulk Action Bar (Figma Design) ── */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#0B0F19] border border-white/10 shadow-[0px_12px_24px_rgba(0,0,0,0.25)] rounded-xl px-5 py-3 flex items-center gap-5 text-white animate-in fade-in slide-in-from-bottom-4 duration-200">
          <span className="text-sm font-semibold tracking-tight whitespace-nowrap">
            {selectedIds.length} test cases selected
          </span>

          <div className="h-5 w-[1px] bg-white/20 shrink-0" />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBulkRun}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold transition-all shadow-sm"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Run Selected</span>
            </button>

            <button
              type="button"
              onClick={() => alert(`Reassigning ${selectedIds.length} test cases`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Change Owner</span>
            </button>

            <button
              type="button"
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="p-1 rounded text-white/60 hover:text-white transition-colors ml-1"
              title="Deselect all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── New Test Case Modal ── */}
      {newCaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h2 className="text-base font-bold text-[#0F172A]">Create New Test Case</h2>
              <button
                type="button"
                onClick={() => setNewCaseModalOpen(false)}
                className="p-1 rounded text-[#64748B] hover:bg-[#F1F5F9]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Test Case Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Multi-currency checkout throws invalid exchange rate alert"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Suite
                  </label>
                  <select
                    value={newSuite}
                    onChange={(e) => setNewSuite(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] bg-white outline-none"
                  >
                    <option value="Auth Flow">Auth Flow</option>
                    <option value="Checkout Pipeline">Checkout Pipeline</option>
                    <option value="Payment Integrations">Payment Integrations</option>
                    <option value="Search Functionality">Search Functionality</option>
                    <option value="Billing Pipeline">Billing Pipeline</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) =>
                      setNewPriority(e.target.value as 'Critical' | 'High' | 'Medium' | 'Low')
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] bg-white outline-none"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setNewCaseModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-xs font-semibold text-white shadow-sm"
                >
                  Save Test Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
