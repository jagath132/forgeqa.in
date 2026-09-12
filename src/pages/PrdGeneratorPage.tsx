import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Globe,
  Sparkles,
  Download,
  Copy,
  Check,
  Database,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCw,
  Layers,
  CheckCircle2,
  Lock,
  History,
  Trash2,
  Clock,
  Search,
  ArrowUpRight,
} from 'lucide-react';
import { useAppStore, type PrdHistoryItem } from '../store/useAppStore';
import { savePrdToKnowledge, exportPrdAsDocx, type KnowledgeFile } from '../lib/api';
import { Card } from '../components/ui/Card';
import { MobilePageHeader } from '../components/PageHeader';

type GenerationMode = 'text' | 'url';
type ExportFormat = 'md' | 'pdf' | 'docx';

interface PhaseState {
  phase: string;
  message: string;
}

export function PrdGeneratorPage() {
  const navigate = useNavigate();
  const provider = useAppStore((s) => s.activeProvider || s.provider || 'gemini');
  const prdHistory = useAppStore((s) => s.prdHistory);
  const addToPrdHistory = useAppStore((s) => s.addToPrdHistory);
  const deletePrdHistoryItem = useAppStore((s) => s.deletePrdHistoryItem);
  const clearPrdHistory = useAppStore((s) => s.clearPrdHistory);
  const openConfirm = useAppStore((s) => s.openConfirm);

  // Mode & Form States
  const [mode, setMode] = useState<GenerationMode>('text');

  // Mode 1 State
  const [productName, setProductName] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [details, setDetails] = useState('');

  // Mode 2 State
  const [appUrl, setAppUrl] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusArea, setFocusArea] = useState('');

  // Output & Execution State
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<PhaseState | null>(null);
  const [prdText, setPrdText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Export & Action States
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('md');
  const [isExporting, setIsExporting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSavingToKb, setIsSavingToKb] = useState(false);
  const [savedKbFile, setSavedKbFile] = useState<{
    file: KnowledgeFile;
    chunkCount: number;
  } | null>(null);

  // History Filter & State
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilterMode, setHistoryFilterMode] = useState<'all' | 'text' | 'url'>('all');
  const [copiedHistoryId, setCopiedHistoryId] = useState<string | null>(null);

  const prdEndRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleRestorePrd = (item: PrdHistoryItem) => {
    setPrdText(item.prdText);
    setMode(item.mode);
    if (item.mode === 'text') {
      if (item.productName) setProductName(item.productName);
      if (item.moduleName) setModuleName(item.moduleName);
      if (item.details) setDetails(item.details);
    } else {
      if (item.appUrl) setAppUrl(item.appUrl);
      if (item.focusArea) setFocusArea(item.focusArea);
    }
    setErrorMsg(null);
    setSavedKbFile(null);
    setCurrentPhase({ phase: 'complete', message: `Loaded: ${item.title}` });
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleCopyHistoryPrd = (item: PrdHistoryItem) => {
    navigator.clipboard.writeText(item.prdText);
    setCopiedHistoryId(item.id);
    setTimeout(() => setCopiedHistoryId(null), 2000);
  };

  const handleDownloadHistoryPrd = (item: PrdHistoryItem) => {
    const safeTitle = item.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50) || 'PRD';
    const blob = new Blob([item.prdText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeTitle}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredPrdHistory = prdHistory.filter((item) => {
    const matchesMode = historyFilterMode === 'all' || item.mode === historyFilterMode;
    if (!matchesMode) return false;
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.productName && item.productName.toLowerCase().includes(q)) ||
      (item.moduleName && item.moduleName.toLowerCase().includes(q)) ||
      (item.appUrl && item.appUrl.toLowerCase().includes(q)) ||
      (item.focusArea && item.focusArea.toLowerCase().includes(q)) ||
      item.prdText.toLowerCase().includes(q)
    );
  });

  // Auto-scroll as tokens stream in
  useEffect(() => {
    if (isGenerating && prdEndRef.current) {
      prdEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [prdText, isGenerating]);

  // Clean up SSE reader if unmounting
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleGenerateFromText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim() || details.trim().length < 15) {
      setErrorMsg('Please enter at least 15 characters of product details.');
      return;
    }

    setIsGenerating(true);
    setPrdText('');
    setErrorMsg(null);
    setSavedKbFile(null);
    setCurrentPhase({ phase: 'analyzing', message: 'Analyzing product context...' });

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/prd/generate-from-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          productName,
          moduleName,
          details,
          provider,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Generation failed (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Streaming response body unavailable.');

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedPrd = '';

      let isStreaming = true;
      while (isStreaming) {
        const { done, value } = await reader.read();
        if (done) {
          isStreaming = false;
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const eventBlock of events) {
          const lines = eventBlock.split('\n');
          let eventType = 'message';
          let dataStr = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              dataStr = line.slice(6).trim();
            }
          }

          if (!dataStr) continue;

          try {
            const data = JSON.parse(dataStr);
            if (eventType === 'phase') {
              setCurrentPhase(data);
            } else if (eventType === 'token') {
              const token = data.token || '';
              accumulatedPrd += token;
              setPrdText((prev) => prev + token);
            } else if (eventType === 'complete') {
              if (data.prdText) {
                accumulatedPrd = data.prdText;
                setPrdText(data.prdText);
              }
              setCurrentPhase({ phase: 'complete', message: 'PRD synthesis complete' });
            } else if (eventType === 'error') {
              setErrorMsg(data.error || 'Generation error encountered.');
            }
          } catch {
            // Ignore parse errors on partial frames
          }
        }
      }

      if (accumulatedPrd.trim()) {
        const title =
          productName.trim() && moduleName.trim()
            ? `${productName.trim()} - ${moduleName.trim()}`
            : productName.trim() ||
              moduleName.trim() ||
              `PRD (${accumulatedPrd
                .replace(/^[#\s*_-]+/, '')
                .slice(0, 36)
                .trim()}...)`;

        addToPrdHistory({
          title,
          mode: 'text',
          productName: productName.trim() || undefined,
          moduleName: moduleName.trim() || undefined,
          details,
          prdText: accumulatedPrd,
          wordCount: accumulatedPrd.trim().split(/\s+/).filter(Boolean).length,
          provider: typeof provider === 'string' ? provider : undefined,
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setErrorMsg(err.message || 'PRD generation failed.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateFromUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUrl.trim() || appUrl.trim().length < 4) {
      setErrorMsg('Please enter a valid application URL.');
      return;
    }

    setIsGenerating(true);
    setPrdText('');
    setErrorMsg(null);
    setSavedKbFile(null);
    setCurrentPhase({ phase: 'crawling', message: 'Initializing browser crawl session...' });

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/prd/generate-from-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          url: appUrl,
          email: email || undefined,
          password: password || undefined,
          focus: focusArea || undefined,
          provider,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Crawl generation failed (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Streaming response body unavailable.');

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedPrd = '';

      let isStreaming = true;
      while (isStreaming) {
        const { done, value } = await reader.read();
        if (done) {
          isStreaming = false;
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const eventBlock of events) {
          const lines = eventBlock.split('\n');
          let eventType = 'message';
          let dataStr = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              dataStr = line.slice(6).trim();
            }
          }

          if (!dataStr) continue;

          try {
            const data = JSON.parse(dataStr);
            if (eventType === 'phase') {
              setCurrentPhase(data);
            } else if (eventType === 'token') {
              const token = data.token || '';
              accumulatedPrd += token;
              setPrdText((prev) => prev + token);
            } else if (eventType === 'complete') {
              if (data.prdText) {
                accumulatedPrd = data.prdText;
                setPrdText(data.prdText);
              }
              setCurrentPhase({ phase: 'complete', message: 'PRD synthesis complete' });
            } else if (eventType === 'error') {
              setErrorMsg(data.error || 'Generation error encountered.');
            }
          } catch {
            // Ignore parse errors
          }
        }
      }

      if (accumulatedPrd.trim()) {
        let urlHost = appUrl.trim();
        try {
          urlHost = new URL(appUrl.startsWith('http') ? appUrl : `https://${appUrl}`).hostname;
        } catch {
          // fallback
        }
        const title = focusArea.trim() ? `${urlHost} - ${focusArea.trim()}` : `PRD for ${urlHost}`;

        addToPrdHistory({
          title,
          mode: 'url',
          appUrl: appUrl.trim(),
          focusArea: focusArea.trim() || undefined,
          prdText: accumulatedPrd,
          wordCount: accumulatedPrd.trim().split(/\s+/).filter(Boolean).length,
          provider: typeof provider === 'string' ? provider : undefined,
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setErrorMsg(err.message || 'URL exploration failed.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const getPrdFileNameBase = () => {
    if (productName.trim()) {
      return `PRD-${productName.trim().replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    }
    if (appUrl.trim()) {
      try {
        const hostname = new URL(appUrl.startsWith('http') ? appUrl : `https://${appUrl}`).hostname;
        return `PRD-${hostname.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      } catch {
        // fallback
      }
    }
    return `PRD-${new Date().toISOString().slice(0, 10)}`;
  };

  const handleDownload = async () => {
    if (!prdText) return;
    const baseName = getPrdFileNameBase();

    if (selectedFormat === 'md') {
      const blob = new Blob([prdText], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseName}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }

    if (selectedFormat === 'docx') {
      setIsExporting(true);
      try {
        const blob = await exportPrdAsDocx(prdText, baseName);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseName}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'DOCX export failed.');
      } finally {
        setIsExporting(false);
      }
      return;
    }

    if (selectedFormat === 'pdf') {
      setIsExporting(true);
      try {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 40;
        const maxLineWidth = pageWidth - margin * 2;
        let y = 50;

        // Header Title Bar
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(margin, y, maxLineWidth, 32, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.text('ForgeQA — Product Requirements Document', margin + 12, y + 21);
        y += 48;

        const lines = prdText.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const rawLine = lines[i].trim();
          if (!rawLine) {
            y += 8;
            continue;
          }

          if (y > pageHeight - 50) {
            doc.addPage();
            y = 50;
          }

          if (rawLine.startsWith('# ')) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.setTextColor(15, 23, 42);
            y += 12;
            const split = doc.splitTextToSize(rawLine.replace(/^#\s+/, ''), maxLineWidth);
            doc.text(split, margin, y);
            y += split.length * 18 + 4;
          } else if (rawLine.startsWith('## ')) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(13);
            doc.setTextColor(30, 41, 59);
            y += 10;
            const split = doc.splitTextToSize(rawLine.replace(/^##\s+/, ''), maxLineWidth);
            doc.text(split, margin, y);
            y += split.length * 15 + 4;
          } else if (rawLine.startsWith('### ')) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(51, 65, 85);
            y += 8;
            const split = doc.splitTextToSize(rawLine.replace(/^###\s+/, ''), maxLineWidth);
            doc.text(split, margin, y);
            y += split.length * 14 + 2;
          } else {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(71, 85, 105);
            const clean = rawLine.replace(/\*\*/g, '').replace(/`/g, '');
            const split = doc.splitTextToSize(clean, maxLineWidth);
            doc.text(split, margin, y);
            y += split.length * 13 + 2;
          }
        }

        doc.save(`${baseName}.pdf`);
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'PDF export failed.');
      } finally {
        setIsExporting(false);
      }
    }
  };

  const handleCopy = () => {
    if (!prdText) return;
    navigator.clipboard.writeText(prdText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveToKnowledge = async () => {
    if (!prdText) return;
    setIsSavingToKb(true);
    setErrorMsg(null);
    try {
      const fileName = `${getPrdFileNameBase()}.md`;
      const res = await savePrdToKnowledge({
        prdText,
        fileName,
      });
      setSavedKbFile({ file: res.file, chunkCount: res.chunkCount });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save PRD to Knowledge Base.');
    } finally {
      setIsSavingToKb(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <MobilePageHeader pageKey="prd-generator" />

      {/* Hero / Mode Selector Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] backdrop-blur-md">
        <div className="flex items-center gap-1 p-1 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-subtle)] w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setMode('text')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              mode === 'text'
                ? 'bg-[var(--accent)] text-white shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Describe Product</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('url')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              mode === 'url'
                ? 'bg-[var(--accent)] text-white shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
            }`}
          >
            <Globe className="h-4 w-4" />
            <span>Explore from URL</span>
          </button>
        </div>

        {prdHistory.length > 0 && (
          <button
            type="button"
            onClick={() => {
              historyRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-primary)] hover:bg-[var(--bg-card)] border border-[var(--border-subtle)] transition-all cursor-pointer self-stretch sm:self-auto"
          >
            <History className="h-4 w-4 text-[var(--accent)]" />
            <span>PRD History</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--accent)]/15 text-[var(--accent)]">
              {prdHistory.length}
            </span>
          </button>
        )}
      </div>

      {errorMsg && (
        <div
          className="rounded-xl px-4 py-3 text-sm flex items-start gap-3 border animate-in fade-in"
          style={{
            background: 'var(--danger-soft, rgba(239, 68, 68, 0.1))',
            color: 'var(--color-danger, #ef4444)',
            borderColor: 'color-mix(in srgb, var(--color-danger, #ef4444) 30%, transparent)',
          }}
        >
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Generation Error</p>
            <p className="text-xs mt-0.5 opacity-90">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Main Grid: Input Form vs PRD Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            {mode === 'text' ? (
              <form onSubmit={handleGenerateFromText} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                      Product Name
                    </label>
                    <span className="text-[11px] text-[var(--text-muted)]">Optional</span>
                  </div>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g. Acme Cloud Dashboard"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                      Module / Feature
                    </label>
                    <span className="text-[11px] text-[var(--text-muted)]">Optional</span>
                  </div>
                  <input
                    type="text"
                    value={moduleName}
                    onChange={(e) => setModuleName(e.target.value)}
                    placeholder="e.g. User Authentication & Multi-Tenant RBAC"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                      Product Details & Specs *
                    </label>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {details.length} chars (min 15)
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    required
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Paste feature specs, user stories, acceptance criteria, workflows, business rules, or API details..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all resize-y"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isGenerating || details.trim().length < 15}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Synthesizing PRD...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Generate PRD</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form
                onSubmit={handleGenerateFromUrl}
                className="space-y-4"
                autoComplete="off"
                autoCapitalize="off"
              >
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-1">
                    Application URL *
                  </label>
                  <input
                    type="url"
                    name="explore_app_url"
                    autoComplete="off"
                    required
                    value={appUrl}
                    onChange={(e) => setAppUrl(e.target.value)}
                    placeholder="https://myapp.com or http://localhost:3000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-1">
                      Login Email{' '}
                      <span className="text-[10px] lowercase font-normal text-[var(--text-muted)]">
                        (optional)
                      </span>
                    </label>
                    <input
                      type="text"
                      name="explore_test_user_identity"
                      id="explore_test_user_identity"
                      autoComplete="new-password"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="test@example.com"
                      className="w-full px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-1">
                      Password{' '}
                      <span className="text-[10px] lowercase font-normal text-[var(--text-muted)]">
                        (optional)
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="explore_test_user_secret"
                        id="explore_test_user_secret"
                        autoComplete="new-password"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 pr-9 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-1">
                    Module / Focus Area{' '}
                    <span className="text-[10px] lowercase font-normal text-[var(--text-muted)]">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={focusArea}
                    onChange={(e) => setFocusArea(e.target.value)}
                    placeholder="e.g. Focus on billing and team settings"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all"
                  />
                </div>

                <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] space-y-1">
                  <div className="flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
                    <Lock className="h-3.5 w-3.5 text-cyan-500" />
                    <span>Safe Headless Exploration</span>
                  </div>
                  <p>
                    ForgeQA navigates up to 20 internal pages, maps form elements, buttons, and user
                    flows. Credentials are used only in memory and never persisted.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isGenerating || appUrl.trim().length < 4}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Exploring App & Formulating PRD...</span>
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4" />
                      <span>Explore & Generate PRD</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </Card>

          {/* Quick Guidance Card */}
          <Card>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-[var(--accent)]" />
              <span>Next Steps After PRD Generation</span>
            </h4>
            <ol className="text-xs text-[var(--text-muted)] space-y-2 list-decimal list-inside leading-relaxed">
              <li>
                <strong className="text-[var(--text-primary)]">Review & Export</strong>: Download in
                Markdown (.md), PDF, or Word (.docx).
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">Send to Knowledge Base</strong>:
                Indexes the PRD into vector chunks automatically.
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">Automation Studio</strong>: Go to{' '}
                <Link to="/generator" className="text-[var(--accent)] underline font-medium">
                  Generator
                </Link>{' '}
                to create app-aware test suites referencing this PRD.
              </li>
            </ol>
          </Card>
        </div>

        {/* Right Column: Live Output & Actions */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[var(--accent)]" />
                  <span>PRD Document Preview</span>
                </h3>
                {currentPhase && (
                  <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-muted)]">
                    {isGenerating && (
                      <span className="inline-block w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
                    )}
                    <span className="font-medium text-[var(--accent)]">{currentPhase.message}</span>
                  </div>
                )}
              </div>

              {/* Format Selector + Actions */}
              {prdText && (
                <div className="flex flex-wrap items-center gap-2">
                  {/* Segmented Format Toggle */}
                  <div className="flex items-center p-0.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                    <button
                      type="button"
                      onClick={() => setSelectedFormat('md')}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                        selectedFormat === 'md'
                          ? 'bg-[var(--accent)] text-white'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      .MD
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedFormat('pdf')}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                        selectedFormat === 'pdf'
                          ? 'bg-[var(--accent)] text-white'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedFormat('docx')}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                        selectedFormat === 'docx'
                          ? 'bg-[var(--accent)] text-white'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      DOCX
                    </button>
                  </div>

                  {/* Download Button */}
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={isExporting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--accent)] transition-all cursor-pointer"
                    title={`Download as .${selectedFormat}`}
                  >
                    {isExporting ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5 text-[var(--accent)]" />
                    )}
                    <span>Download</span>
                  </button>

                  {/* Copy Button */}
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-subtle)] transition-all cursor-pointer"
                    title="Copy Markdown"
                  >
                    {isCopied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Knowledge Base Save Banner */}
            {savedKbFile && (
              <div className="mt-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-2.5 text-xs">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                  <div>
                    <p className="font-bold">Successfully saved to Knowledge Base!</p>
                    <p className="text-[11px] opacity-90">
                      Created document <strong>{savedKbFile.file.file_name}</strong> (
                      {savedKbFile.chunkCount} searchable vector chunks).
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/knowledge')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-all cursor-pointer"
                  >
                    View in Knowledge Hub
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/generator')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--bg-primary)] border border-emerald-500/40 text-xs font-semibold hover:border-emerald-500 transition-all cursor-pointer"
                  >
                    <span>Generate Tests</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Markdown Display Area */}
            <div className="mt-4 min-h-[420px] max-h-[640px] overflow-y-auto rounded-xl p-5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] font-sans text-sm leading-relaxed text-[var(--text-primary)] select-text">
              {prdText ? (
                <div className="prose dark:prose-invert max-w-none space-y-3">
                  {prdText.split('\n').map((line, idx) => {
                    const trimmed = line.trim();
                    if (!trimmed) return <div key={idx} className="h-2" />;

                    if (trimmed.startsWith('# ')) {
                      return (
                        <h1
                          key={idx}
                          className="text-xl font-extrabold text-[var(--text-primary)] pt-3 pb-1 border-b border-[var(--border-subtle)]"
                        >
                          {trimmed.replace(/^#\s+/, '')}
                        </h1>
                      );
                    }
                    if (trimmed.startsWith('## ')) {
                      return (
                        <h2
                          key={idx}
                          className="text-base font-bold text-[var(--accent)] pt-4 pb-1 border-b border-[var(--border-subtle)]/50"
                        >
                          {trimmed.replace(/^##\s+/, '')}
                        </h2>
                      );
                    }
                    if (trimmed.startsWith('### ')) {
                      return (
                        <h3
                          key={idx}
                          className="text-sm font-semibold text-[var(--text-primary)] pt-2"
                        >
                          {trimmed.replace(/^###\s+/, '')}
                        </h3>
                      );
                    }
                    if (trimmed.startsWith('#### ')) {
                      return (
                        <h4
                          key={idx}
                          className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] pt-2"
                        >
                          {trimmed.replace(/^####\s+/, '')}
                        </h4>
                      );
                    }
                    if (/^[-*+]\s+/.test(trimmed)) {
                      return (
                        <li
                          key={idx}
                          className="ml-4 list-disc text-xs sm:text-sm text-[var(--text-secondary)]"
                        >
                          {renderFormattedText(trimmed.replace(/^[-*+]\s+/, ''))}
                        </li>
                      );
                    }
                    if (/^\d+\.\s+/.test(trimmed)) {
                      return (
                        <li
                          key={idx}
                          className="ml-4 list-decimal text-xs sm:text-sm text-[var(--text-secondary)]"
                        >
                          {renderFormattedText(trimmed.replace(/^\d+\.\s+/, ''))}
                        </li>
                      );
                    }
                    if (trimmed.startsWith('> ')) {
                      return (
                        <blockquote
                          key={idx}
                          className="pl-3 py-1 border-l-2 border-[var(--accent)] text-xs italic text-[var(--text-muted)] bg-[var(--bg-secondary)] rounded-r"
                        >
                          {renderFormattedText(trimmed.replace(/^>\s+/, ''))}
                        </blockquote>
                      );
                    }
                    return (
                      <p key={idx} className="text-xs sm:text-sm text-[var(--text-secondary)]">
                        {renderFormattedText(trimmed)}
                      </p>
                    );
                  })}
                  <div ref={prdEndRef} />
                </div>
              ) : (
                <div className="h-full min-h-[380px] flex flex-col items-center justify-center text-center p-8 text-[var(--text-muted)] space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent)] shadow-sm">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">No PRD Generated Yet</p>
                    <p className="text-xs max-w-sm mt-1">
                      Choose <strong>Describe Product</strong> to paste requirements or{' '}
                      <strong>Explore from URL</strong> to let ForgeQA crawl your live web
                      application.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions: Save to Knowledge Base & Quick Nav */}
            {prdText && !isGenerating && (
              <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleSaveToKnowledge}
                  disabled={isSavingToKb}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs md:text-sm text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 shadow-md disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSavingToKb ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Indexing into Knowledge Hub...</span>
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4" />
                      <span>Send to Knowledge Base</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/generator')}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-xs md:text-sm text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--accent)] transition-all cursor-pointer"
                >
                  <span>Go to Automation Studio</span>
                  <ArrowRight className="h-4 w-4 text-[var(--accent)]" />
                </button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* PRD Generation History Section */}
      <section ref={historyRef} id="prd-history-section" className="pt-4">
        <Card className="p-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center font-bold">
                <History className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                    Generated PRD History
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                    {prdHistory.length} {prdHistory.length === 1 ? 'document' : 'documents'}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Browse, preview, download, or restore previously synthesized PRD specifications
                </p>
              </div>
            </div>

            {prdHistory.length > 0 && (
              <div className="flex items-center gap-2 self-end md:self-auto">
                <button
                  type="button"
                  onClick={() =>
                    openConfirm(
                      'Clear All PRD History',
                      'Are you sure you want to delete all saved PRD generation history? This action cannot be undone.',
                      clearPrdHistory,
                      'Clear All'
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--danger,#ef4444)] hover:bg-[var(--danger,#ef4444)]/10 transition-all cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Clear All</span>
                </button>
              </div>
            )}
          </div>

          {/* Filters & Search Toolbar */}
          {prdHistory.length > 0 && (
            <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1 p-1 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)] overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setHistoryFilterMode('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    historyFilterMode === 'all'
                      ? 'bg-[var(--bg-primary)] text-[var(--accent)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  All ({prdHistory.length})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilterMode('text')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    historyFilterMode === 'text'
                      ? 'bg-[var(--bg-primary)] text-[var(--accent)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <FileText className="h-3 w-3" />
                  <span>Text Specs ({prdHistory.filter((h) => h.mode === 'text').length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilterMode('url')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    historyFilterMode === 'url'
                      ? 'bg-[var(--bg-primary)] text-[var(--accent)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Globe className="h-3 w-3" />
                  <span>URL Crawl ({prdHistory.filter((h) => h.mode === 'url').length})</span>
                </button>
              </div>

              <div className="relative min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search PRD history..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all"
                />
              </div>
            </div>
          )}

          {/* History List or Empty States */}
          <div className="mt-4">
            {prdHistory.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center text-[var(--text-muted)] space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent)]">
                  <History className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-[var(--text-primary)]">
                    No PRD History Yet
                  </p>
                  <p className="text-xs max-w-sm mt-1 text-[var(--text-muted)]">
                    When you generate PRDs using product details or web crawling, ForgeQA
                    automatically archives them here for instant restoration, downloading, and
                    reuse.
                  </p>
                </div>
              </div>
            ) : filteredPrdHistory.length === 0 ? (
              <div className="py-8 text-center text-[var(--text-muted)]">
                <p className="font-medium text-xs">No PRD entries match your filter.</p>
                <p className="text-[11px] mt-0.5">
                  Try clearing the search query or switching tabs.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPrdHistory.map((item) => {
                  const isCopiedThis = copiedHistoryId === item.id;
                  const previewSnippet = item.prdText
                    .replace(/^[#\s*_-]+/gm, '')
                    .replace(/\n+/g, ' ')
                    .slice(0, 160);

                  return (
                    <div
                      key={item.id}
                      className="group rounded-xl p-4 border border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--accent)]/50 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div>
                        {/* Card Header: Mode Badge + Time */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              item.mode === 'text'
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {item.mode === 'text' ? (
                              <>
                                <FileText className="h-2.5 w-2.5" />
                                <span>Text Specs</span>
                              </>
                            ) : (
                              <>
                                <Globe className="h-2.5 w-2.5" />
                                <span>URL Crawl</span>
                              </>
                            )}
                          </span>

                          <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                            <Clock className="h-3 w-3" />
                            <span>{formatHistoryTime(item.createdAt)}</span>
                          </div>
                        </div>

                        {/* Title & Target Details */}
                        <h3 className="font-semibold text-sm text-[var(--text-primary)] line-clamp-1 group-hover:text-[var(--accent)] transition-colors">
                          {item.title}
                        </h3>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)]">
                          {item.productName && (
                            <span className="truncate max-w-[140px]">
                              App:{' '}
                              <strong className="text-[var(--text-secondary)]">
                                {item.productName}
                              </strong>
                            </span>
                          )}
                          {item.appUrl && (
                            <span className="truncate max-w-[180px] font-mono text-[10px]">
                              {item.appUrl}
                            </span>
                          )}
                          <span>• {item.wordCount} words</span>
                          {item.provider && <span className="capitalize">• {item.provider}</span>}
                        </div>

                        {/* Snippet Preview */}
                        <p className="mt-2 text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed bg-[var(--bg-secondary)] p-2 rounded-lg border border-[var(--border-subtle)]">
                          {previewSnippet}...
                        </p>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleRestorePrd(item)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all cursor-pointer"
                          title="Load this PRD into the editor and preview"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" />
                          <span>Load & View</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleCopyHistoryPrd(item)}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all cursor-pointer"
                            title="Copy Markdown"
                          >
                            {isCopiedThis ? (
                              <Check className="h-3.5 w-3.5 text-[var(--success,#10b981)]" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadHistoryPrd(item)}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all cursor-pointer"
                            title="Download (.md)"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openConfirm(
                                'Delete PRD History Entry',
                                `Delete "${item.title}" from your saved PRD history?`,
                                () => deletePrdHistoryItem(item.id),
                                'Delete'
                              )
                            }
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--danger,#ef4444)] hover:bg-[var(--danger,#ef4444)]/10 transition-all cursor-pointer"
                            title="Delete Entry"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}

function formatHistoryTime(dateStr: string) {
  try {
    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function renderFormattedText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-bold text-[var(--text-primary)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded font-mono text-xs bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--accent)]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
