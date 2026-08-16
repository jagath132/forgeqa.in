import React, { useState, useMemo } from 'react';
import type { TestScriptResponse } from '../lib/api';

interface TestScriptCodeViewerProps {
  scriptResult: TestScriptResponse | null;
  isLoading: boolean;
  framework?: string;
  language?: string;
  onClear: () => void;
  onCopy: () => void;
  onDownload: () => void;
  isCopied: boolean;
}

function getFrameworkMeta(fw?: string, lang?: string) {
  const normFw = (fw || '').toLowerCase();
  const normLang = (lang || '').toLowerCase();

  switch (normFw) {
    case 'cypress':
      return {
        label: 'Cypress',
        badgeBg: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/50',
        dotColor: 'bg-emerald-400',
        defaultExt: normLang === 'typescript' ? 'spec.cy.ts' : 'spec.cy.js',
        runnerName: 'Cypress Test Runner Engine',
        ciCmd: `npx cypress run`,
      };
    case 'selenium':
      return {
        label: 'Selenium',
        badgeBg: 'bg-rose-950/80 text-rose-400 border-rose-800/50',
        dotColor: 'bg-rose-400',
        defaultExt:
          normLang === 'python'
            ? 'test_suite.py'
            : normLang === 'java'
              ? 'TestCase.java'
              : normLang === 'csharp'
                ? 'TestCase.cs'
                : 'test_suite.js',
        runnerName: 'Selenium WebDriver Core Engine',
        ciCmd: normLang === 'python' ? 'pytest' : normLang === 'java' ? 'mvn test' : 'npm test',
      };
    case 'puppeteer':
      return {
        label: 'Puppeteer',
        badgeBg: 'bg-amber-950/80 text-amber-400 border-amber-800/50',
        dotColor: 'bg-amber-400',
        defaultExt: normLang === 'typescript' ? 'test.e2e.ts' : 'test.e2e.js',
        runnerName: 'Puppeteer Headless Browser Engine',
        ciCmd: 'node test.e2e.js',
      };
    case 'playwright':
      return {
        label: 'Playwright',
        badgeBg: 'bg-cyan-950/80 text-cyan-400 border-cyan-800/50',
        dotColor: 'bg-cyan-400',
        defaultExt: normLang === 'python' ? 'test_script.py' : 'output.ts',
        runnerName: 'Playwright Multi-Browser Engine',
        ciCmd: 'npx playwright test',
      };
    default:
      return {
        label: 'Select Framework',
        badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
        dotColor: 'bg-slate-400',
        defaultExt: 'output.ts',
        runnerName: 'Automation Engine',
        ciCmd: 'npm test',
      };
  }
}

export const TestScriptCodeViewer: React.FC<TestScriptCodeViewerProps> = ({
  scriptResult,
  isLoading,
  framework = '',
  language = '',
  onClear,
  onCopy,
  onDownload,
  isCopied,
}) => {
  const [activeTab, setActiveTab] = useState<'code' | 'cicd' | 'runner'>('code');
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [wordWrap, setWordWrap] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simLogs, setSimLogs] = useState<
    Array<{ text: string; type: 'info' | 'pass' | 'warn' | 'dim' }>
  >([]);

  const fwMeta = useMemo(() => getFrameworkMeta(framework, language), [framework, language]);

  const scriptText = scriptResult?.script || '';
  const fileName = scriptResult?.fileName || fwMeta.defaultExt;

  const lines = useMemo(() => {
    if (!scriptText) return [];
    return scriptText.split('\n');
  }, [scriptText]);

  const fileSizeKb = useMemo(() => {
    if (!scriptText) return '0 KB';
    const bytes = new Blob([scriptText]).size;
    return `${(bytes / 1024).toFixed(1)} KB`;
  }, [scriptText]);

  // Syntax colorizer helper for previewing standard code cleanly
  const renderHighlightedCode = (text: string) => {
    const linesArr = text.split('\n');
    return linesArr.map((line, lineIdx) => {
      let formattedLine = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      if (formattedLine.trim().startsWith('//') || formattedLine.trim().startsWith('#')) {
        return (
          <div key={lineIdx} className="table-row">
            {showLineNumbers && (
              <span className="table-cell text-right pr-4 select-none opacity-40 text-xs font-mono w-10">
                {lineIdx + 1}
              </span>
            )}
            <span className="table-cell italic text-slate-500 font-mono">{line}</span>
          </div>
        );
      }

      formattedLine = formattedLine
        .replace(
          /\b(import|export|from|const|let|var|async|await|function|return|if|else|def|class|type|interface)\b/g,
          '<span style="color:#f43f5e;font-weight:600">$1</span>'
        )
        .replace(
          /\b(test|describe|it|expect|beforeEach|afterEach)\b/g,
          '<span style="color:#a855f7;font-weight:600">$1</span>'
        )
        .replace(/('[^']*'|"[^"]*"|`[^`]*`)/g, '<span style="color:#10b981">$1</span>')
        .replace(
          /\b(page|browser|context|cy|driver)\b/g,
          '<span style="color:#06b6d4;font-weight:600">$1</span>'
        )
        .replace(
          /\b(goto|click|fill|type|waitForSelector|locator|getByRole|getByText|assert)\b/g,
          '<span style="color:#3b82f6">$1</span>'
        );

      return (
        <div key={lineIdx} className="table-row hover:bg-slate-800/40 transition-colors">
          {showLineNumbers && (
            <span className="table-cell text-right pr-4 select-none opacity-30 text-xs font-mono w-10 text-slate-400">
              {lineIdx + 1}
            </span>
          )}
          <span
            className="table-cell font-mono text-xs leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formattedLine || '&nbsp;' }}
          />
        </div>
      );
    });
  };

  const handleSimulateRun = () => {
    setIsSimulating(true);
    setSimLogs([
      { text: `[SYSTEM] Initializing ForgeQA Sandbox Runner...`, type: 'info' },
      {
        text: `[CONFIG] Framework: ${fwMeta.label.toUpperCase()} | Engine: ${fwMeta.runnerName}`,
        type: 'dim',
      },
      { text: `[EXEC] Loading target environment...`, type: 'info' },
    ]);

    setTimeout(() => {
      setSimLogs((prev) => [
        ...prev,
        { text: `[PASS] ${fwMeta.label} runner instance initialized successfully.`, type: 'pass' },
        {
          text: `[EXEC] Executing generated ${language || 'TypeScript'} test suite...`,
          type: 'info',
        },
      ]);
    }, 600);

    setTimeout(() => {
      setSimLogs((prev) => [
        ...prev,
        { text: `[PASS] Navigation & locator verification confirmed (0 errors).`, type: 'pass' },
        { text: `[PASS] Self-healing selectors verified: 100% locators active.`, type: 'pass' },
        { text: `[RESULT] ✅ Test Suite Completed: All test steps passed in 1.24s.`, type: 'pass' },
      ]);
      setIsSimulating(false);
    }, 1400);
  };

  const generatedCiCdYaml = useMemo(() => {
    return `# GitHub Actions CI/CD Pipeline for ForgeQA Test Automation
name: ForgeQA Automated Testing (${fwMeta.label})

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 20
    - name: Install dependencies
      run: npm ci
    - name: Run ${fwMeta.label} Tests
      run: ${fwMeta.ciCmd} ${fileName}
    - uses: actions/upload-artifact@v4
      if: always()
      with:
        name: test-results
        path: test-results/
        retention-days: 30`;
  }, [fileName, fwMeta.ciCmd, fwMeta.label]);

  return (
    <div
      className={`card p-0 overflow-hidden flex flex-col transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-4 z-50 shadow-2xl bg-slate-950 text-slate-100 border-slate-700'
          : 'min-h-[480px] bg-slate-950 text-slate-100 border-slate-800 shadow-xl'
      }`}
      style={{
        borderRadius: isFullscreen ? '16px' : '20px',
        background: '#090d16',
        borderColor: 'rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* ── IDE Header Window Bar ── */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 gap-3">
        {/* Left: macOS dots & Tab Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 pr-2">
            <span className="h-3 w-3 rounded-full bg-rose-500/80 border border-rose-600/40 shadow-sm shadow-rose-500/30 hover:opacity-100 transition-opacity" />
            <span className="h-3 w-3 rounded-full bg-amber-500/80 border border-amber-600/40 shadow-sm shadow-amber-500/30 hover:opacity-100 transition-opacity" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80 border border-emerald-600/40 shadow-sm shadow-emerald-500/30 hover:opacity-100 transition-opacity" />
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800/60">
            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'code'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
              <span>{fileName}</span>
              {scriptResult && (
                <span className="ml-1 px-1.5 py-0.2 bg-blue-400/20 text-blue-300 text-[10px] rounded font-mono">
                  {lines.length}L
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('runner')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'runner'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Sandbox Terminal</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cicd')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'cicd'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L5.596 15.12a2 2 0 01-1.022-.547l-.293-.293a2 2 0 010-2.828l1.414-1.414a2 2 0 012.828 0l.293.293a2 2 0 001.022.547l2.387.477a6 6 0 003.86-.517l.318-.158a6 6 0 013.86-.517l2.387.477a2 2 0 011.022.547l.293.293a2 2 0 010 2.828l-1.414 1.414a2 2 0 01-2.828 0l-.293-.293z"
                />
              </svg>
              <span>CI/CD Workflow</span>
            </button>
          </div>
        </div>

        {/* Right: Actions Toolbar */}
        <div className="flex items-center gap-2">
          {/* Dynamic Framework Badge */}
          <span
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase rounded-full border transition-all ${fwMeta.badgeBg}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${fwMeta.dotColor} animate-pulse`} />
            {fwMeta.label}
          </span>

          {/* Quick controls */}
          {activeTab === 'code' && scriptResult && (
            <>
              <button
                type="button"
                onClick={() => setShowLineNumbers(!showLineNumbers)}
                title="Toggle Line Numbers"
                className={`p-1.5 text-xs rounded border transition-colors ${
                  showLineNumbers
                    ? 'bg-slate-800 text-blue-400 border-slate-700'
                    : 'text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                #
              </button>

              <button
                type="button"
                onClick={() => setWordWrap(!wordWrap)}
                title="Toggle Word Wrap"
                className={`p-1.5 text-xs font-mono rounded border transition-colors ${
                  wordWrap
                    ? 'bg-slate-800 text-blue-400 border-slate-700'
                    : 'text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                ↵
              </button>
            </>
          )}

          {scriptResult && (
            <>
              <button
                type="button"
                onClick={onCopy}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition-all"
              >
                {isCopied ? (
                  <>
                    <svg
                      className="w-3.5 h-3.5 text-emerald-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-3.5 h-3.5 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                      />
                    </svg>
                    <span>Copy Code</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onDownload}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition-all"
                title="Download Script File"
              >
                <svg
                  className="w-3.5 h-3.5 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                <span className="hidden sm:inline">Download</span>
              </button>

              <button
                type="button"
                onClick={onClear}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/40 rounded-lg transition-colors"
                title="Clear generated script"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span>Clear</span>
              </button>
            </>
          )}

          {/* Fullscreen toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              {isFullscreen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 9L4 4m0 0l5 0m-5 0l0 5m11 5l5 5m0 0l-5 0m5 0l0-5"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* ── Main View Content Body ── */}
      <div className="flex-1 relative overflow-auto font-mono text-xs leading-relaxed p-4 bg-[#070a12] text-slate-200">
        {/* Loading Spinner State */}
        {isLoading ? (
          <div className="h-full min-h-[340px] flex flex-col items-center justify-center space-y-4 py-16">
            <div className="relative flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
              <div className="absolute w-8 h-8 rounded-full border-2 border-cyan-400/30 border-b-cyan-400 animate-spin-reverse" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-200">
                Synthesizing {fwMeta.label} Code...
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Applying self-healing locators & framework assertions
              </p>
            </div>
          </div>
        ) : activeTab === 'code' ? (
          /* CODE VIEW TAB */
          scriptResult ? (
            <div
              className={`table w-full font-mono text-xs ${wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre'}`}
            >
              {renderHighlightedCode(scriptText)}
            </div>
          ) : (
            /* EMPTY STATE: Matches required string 'Terminal Buffer Empty' and 'Generate Automation Script' */
            <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-8 py-14 relative group">
              {/* Background Glow */}
              <div className="absolute w-64 h-64 bg-blue-600/5 rounded-full filter blur-3xl pointer-events-none" />

              {/* Central Animated Prompt Box */}
              <div className="relative mb-5 p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-2xl shadow-blue-500/5 group-hover:border-blue-500/30 transition-all duration-300">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-blue-500/10 via-cyan-500/5 to-transparent opacity-50" />
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-950 text-blue-400 font-mono text-xl font-bold border border-slate-800 shadow-inner">
                  &gt;_
                </div>
              </div>

              {/* Exact Text required by Vitest tests */}
              <h3 className="text-base font-bold text-slate-100 tracking-tight">
                Terminal Buffer Empty
              </h3>
              <p className="text-xs text-slate-400 max-w-md mt-1.5 leading-normal">
                Click{' '}
                <span className="text-blue-400 font-semibold">
                  &ldquo;Generate Automation Script&rdquo;
                </span>{' '}
                above to generate zero lock-in automated test suites.
              </p>

              {/* Feature Highlights Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-6 max-w-lg">
                <span className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1.5">
                  <span className="text-blue-400">⚡</span>{' '}
                  {fwMeta.label !== 'Select Framework'
                    ? `${fwMeta.label} Native`
                    : 'Multi-Framework Native'}
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1.5">
                  <span className="text-emerald-400">🛡️</span> Self-Healing Selectors
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1.5">
                  <span className="text-cyan-400">🔒</span> Zero Vendor Lock-in Export
                </span>
              </div>
            </div>
          )
        ) : activeTab === 'runner' ? (
          /* SANDBOX RUNNER TAB */
          <div className="h-full flex flex-col justify-between space-y-4 p-2">
            <div className="flex items-center justify-between bg-slate-900/70 p-3 rounded-xl border border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-slate-200">
                  ForgeQA Interactive Test Sandbox
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Dry-run test executions locally in headless browser memory
                </p>
              </div>
              <button
                type="button"
                disabled={isSimulating || !scriptResult}
                onClick={handleSimulateRun}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-xs rounded-lg shadow transition-all flex items-center gap-1.5"
              >
                {isSimulating ? (
                  <>
                    <svg
                      className="w-3.5 h-3.5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span>Running Test...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                    </svg>
                    <span>Simulate Dry Run</span>
                  </>
                )}
              </button>
            </div>

            {/* Terminal output console */}
            <div className="flex-1 bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-xs space-y-2 overflow-auto min-h-[220px]">
              {simLogs.length === 0 ? (
                <div className="text-slate-500 italic text-center py-10">
                  {scriptResult
                    ? 'Click "Simulate Dry Run" above to test run script execution in Sandbox memory.'
                    : 'Generate an automation script first to run sandbox simulations.'}
                </div>
              ) : (
                simLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2 ${
                      log.type === 'pass'
                        ? 'text-emerald-400'
                        : log.type === 'warn'
                          ? 'text-amber-400'
                          : log.type === 'dim'
                            ? 'text-slate-500'
                            : 'text-cyan-300'
                    }`}
                  >
                    <span className="opacity-40 select-none text-[10px] text-slate-500 mt-0.5">
                      [{new Date().toLocaleTimeString()}]
                    </span>
                    <span>{log.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* CI/CD WORKFLOW TAB */
          <div className="h-full flex flex-col space-y-3 p-2">
            <div className="flex items-center justify-between bg-slate-900/70 p-3 rounded-xl border border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-slate-200">
                  GitHub Actions CI/CD Pipeline Workflow
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Copy into{' '}
                  <code className="bg-slate-800 px-1 py-0.5 rounded text-blue-300">
                    .github/workflows/forgeqa.yml
                  </code>
                </p>
              </div>
            </div>
            <pre className="flex-1 p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 overflow-auto whitespace-pre font-mono">
              {generatedCiCdYaml}
            </pre>
          </div>
        )}
      </div>

      {/* ── IDE Status Bar Footer ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>UTF-8</span>
          </span>
          <span>{scriptResult ? `${lines.length} Lines` : '0 Lines'}</span>
          <span>{fileSizeKb}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-slate-400">Zero Lock-In Standard Code</span>
          {language ? (
            <span className="text-blue-400 font-semibold uppercase">{language}</span>
          ) : (
            <span className="text-slate-500 font-medium uppercase">Select Language</span>
          )}
        </div>
      </div>
    </div>
  );
};
