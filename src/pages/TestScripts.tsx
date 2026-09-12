import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useAppStore } from '../store/useAppStore';
import { generateTestScript } from '../lib/testScriptApi';
import type { TestingFramework, ScriptLanguage, TestScriptRequest } from '../lib/api';
import { Card } from '../components/ui/Card';
import { MobilePageHeader } from '../components/PageHeader';
import { DesktopOnlyGuard } from '../components/DesktopOnlyGuard';
import { TestScriptCodeViewer } from '../components/TestScriptCodeViewer';

const frameworkOptions: TestingFramework[] = ['playwright', 'cypress', 'selenium', 'puppeteer'];

const languageOptions: Record<TestingFramework, ScriptLanguage[]> = {
  playwright: ['javascript', 'typescript', 'python', 'java', 'csharp'],
  cypress: ['javascript', 'typescript'],
  selenium: ['javascript', 'python', 'java', 'csharp'],
  puppeteer: ['javascript', 'typescript'],
};

function getFrameworkLabel(framework: TestingFramework) {
  return framework.charAt(0).toUpperCase() + framework.slice(1);
}

function getLanguageLabel(language: ScriptLanguage) {
  switch (language) {
    case 'javascript':
      return 'JavaScript';
    case 'typescript':
      return 'TypeScript';
    case 'python':
      return 'Python';
    case 'java':
      return 'Java';
    case 'csharp':
      return 'C#';
    default:
      return language;
  }
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

export function TestScripts() {
  const qaResult = useAppStore((s) => s.qaResult);
  const provider = useAppStore((s) => s.provider);
  const scriptResult = useAppStore((s) => s.scriptResult);
  const setScriptResult = useAppStore((s) => s.setScriptResult);
  const savedScripts = useAppStore((s) => s.savedScripts);
  const activeScriptId = useAppStore((s) => s.activeScriptId);
  const addSavedScript = useAppStore((s) => s.addSavedScript);
  const selectSavedScript = useAppStore((s) => s.selectSavedScript);
  const deleteSavedScript = useAppStore((s) => s.deleteSavedScript);
  const clearSavedScripts = useAppStore((s) => s.clearSavedScripts);

  const testCases = useMemo(() => qaResult?.testCases ?? [], [qaResult]);

  // Restore framework and language from cached scriptResult or active saved script
  const [framework, setFramework] = useState<string>(
    () => scriptResult?.framework ?? savedScripts[0]?.framework ?? 'playwright'
  );
  const [language, setLanguage] = useState<string>(
    () => scriptResult?.language ?? savedScripts[0]?.language ?? 'typescript'
  );
  const [targetUrl, setTargetUrl] = useState('https://example.com');
  const [headless, setHeadless] = useState(true);
  const [width, setWidth] = useState(1280);
  const [height, setHeight] = useState(720);
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (scriptResult?.testCases?.length) {
      return scriptResult.testCases.map((tc) => tc.tcId);
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const scriptSectionRef = useRef<HTMLDivElement>(null);

  // Sync framework & language when scriptResult changes
  useEffect(() => {
    if (scriptResult) {
      if (scriptResult.framework) setFramework(scriptResult.framework);
      if (scriptResult.language) setLanguage(scriptResult.language);
    }
  }, [scriptResult]);

  // Keep test cases selection alive across reloads
  useEffect(() => {
    if (testCases.length > 0 && selectedIds.length === 0) {
      if (scriptResult?.testCases?.length) {
        setSelectedIds(scriptResult.testCases.map((tc) => tc.tcId));
      } else {
        setSelectedIds(testCases.map((tc) => tc.tcId));
      }
    }
  }, [testCases]);

  const selectedTestCases = useMemo(
    () => testCases.filter((testCase) => selectedIds.includes(testCase.tcId)),
    [selectedIds, testCases]
  );

  const isReadyToGenerate =
    !!provider &&
    !!framework &&
    !!language &&
    testCases.length > 0 &&
    selectedIds.length > 0 &&
    targetUrl.trim().length > 0;

  async function handleGenerate() {
    if (!isReadyToGenerate) {
      if (!provider) {
        setError('Select an AI provider in Settings before generating.');
        return;
      }
      setError('Please select at least one generated test case and provide a target URL.');
      return;
    }
    setError('');
    setIsLoading(true);
    if (!framework || !language) return;
    const payload: TestScriptRequest = {
      testCaseIds: selectedTestCases.map((tc) => tc.tcId),
      testCases: selectedTestCases,
      framework: framework as TestingFramework,
      language: language as ScriptLanguage,
      provider,
      targetUrl,
      options: { headless, viewport: { width, height } },
    };
    try {
      const response = await generateTestScript(payload);
      addSavedScript(response.data, targetUrl);
      setTimeout(() => {
        scriptSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        setError(
          requestError.response?.data?.error ||
          requestError.message ||
          'Unable to generate test script.'
        );
      } else if (requestError instanceof Error) {
        setError(requestError.message);
      } else {
        setError('Unable to generate test script.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleSelectScript(savedId: string) {
    selectSavedScript(savedId);
    const found = savedScripts.find((s) => s.id === savedId);
    if (found) {
      setFramework(found.framework);
      setLanguage(found.language);
      if (found.testCaseIds?.length) {
        setSelectedIds(found.testCaseIds);
      }
    }
  }

  function downloadSpecificScript(scriptItem: { fileName: string; script: string }) {
    const element = document.createElement('a');
    const blob = new Blob([scriptItem.script], { type: 'text/plain' });
    element.href = URL.createObjectURL(blob);
    element.download = scriptItem.fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  function toggleTestCase(testCaseId: string) {
    setSelectedIds((current) =>
      current.includes(testCaseId)
        ? current.filter((id) => id !== testCaseId)
        : [...current, testCaseId]
    );
  }

  function selectAllTestCases() {
    setSelectedIds(testCases.map((tc) => tc.tcId));
  }
  function clearSelectedTestCases() {
    setSelectedIds([]);
  }

  function downloadScript() {
    if (!scriptResult) return;
    downloadSpecificScript(scriptResult);
  }

  async function copyToClipboard() {
    if (!scriptResult) return;
    try {
      await navigator.clipboard.writeText(scriptResult.script);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  function clearScript() {
    if (activeScriptId) {
      deleteSavedScript(activeScriptId);
    } else {
      setScriptResult(null);
    }
    setIsCopied(false);
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <MobilePageHeader pageKey="test-scripts" />

      <DesktopOnlyGuard>
        {/* Config Card */}
        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                Automation Settings
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Configure the generated automation script.
              </p>
            </div>
            <span className="badge badge-success">Engine Configured</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label
              className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Testing Framework
              <select
                className="input-modern px-3.5 py-2.5 text-sm"
                value={framework}
                onChange={(event) => {
                  const fw = event.target.value as TestingFramework;
                  if (!fw) return;
                  setFramework(fw);
                  setLanguage('');
                }}
              >
                <option value="" disabled>
                  Choose a testing framework
                </option>
                {frameworkOptions.map((option) => (
                  <option key={option} value={option}>
                    {getFrameworkLabel(option)}
                  </option>
                ))}
              </select>
            </label>

            <label
              className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Language
              <select
                className="input-modern px-3.5 py-2.5 text-sm"
                value={language}
                onChange={(event) => setLanguage(event.target.value as ScriptLanguage)}
              >
                {!framework ? (
                  <option value="" disabled>
                    Select framework first
                  </option>
                ) : (
                  <>
                    <option value="" disabled>
                      Choose a language
                    </option>
                    {languageOptions[framework as TestingFramework].map((option) => (
                      <option key={option} value={option}>
                        {getLanguageLabel(option)}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </label>

            <label
              className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Target URL
              <input
                className="input-modern px-3.5 py-2.5 text-sm"
                type="url"
                value={targetUrl}
                onChange={(event) => setTargetUrl(event.target.value)}
                placeholder="e.g. https://example.com"
              />
            </label>

            <label
              className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Browser Mode
              <select
                className="input-modern px-3.5 py-2.5 text-sm"
                value={headless ? 'true' : 'false'}
                onChange={(event) => setHeadless(event.target.value === 'true')}
              >
                <option value="true">Headless (No GUI)</option>
                <option value="false">Headed (Show Browser)</option>
              </select>
            </label>

            <label
              className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Viewport Width
              <input
                className="input-modern px-3.5 py-2.5 text-sm"
                type="number"
                value={width}
                onChange={(event) => setWidth(Number(event.target.value))}
                min={600}
              />
            </label>

            <label
              className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Viewport Height
              <input
                className="input-modern px-3.5 py-2.5 text-sm"
                type="number"
                value={height}
                onChange={(event) => setHeight(Number(event.target.value))}
                min={400}
              />
            </label>
          </div>

          <div
            className="mt-5 rounded-lg px-4 py-3 text-sm"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                Selected Scope
              </span>
              <span style={{ color: 'var(--text-muted)' }}>
                {testCases.length > 0
                  ? selectedIds.length > 0
                    ? `${selectedIds.length} of ${testCases.length} selected`
                    : 'Select test cases below'
                  : 'No source test cases'}
              </span>
            </div>
          </div>

          {error ? (
            <p
              className="mt-4 rounded-lg px-4 py-3 text-sm font-medium"
              style={{
                background: 'var(--danger-soft)',
                color: 'var(--danger)',
                border: '1px solid color-mix(in srgb, var(--danger) 25%, transparent)',
              }}
            >
              {error}
            </p>
          ) : null}

          <div
            className="mt-6 pt-5 flex flex-col gap-3 sm:flex-row sm:justify-between"
            style={{ borderTop: '1px solid var(--border-default)' }}
          >
            <button
              className="btn-primary px-5 py-2.5 text-sm font-semibold"
              disabled={!isReadyToGenerate || isLoading}
              onClick={handleGenerate}
              type="button"
            >
              {isLoading ? 'Generating Script...' : 'Generate Automation Script'}
            </button>
            {scriptResult ? (
              <>
                <button
                  className="btn-secondary flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold"
                  onClick={downloadScript}
                  type="button"
                >
                  <svg
                    className="h-4 w-4"
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
                  Download {scriptResult.fileName}
                </button>
                <button
                  className="btn-secondary flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold"
                  onClick={clearScript}
                  type="button"
                >
                  <svg
                    className="h-4 w-4"
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
                  Clear
                </button>
              </>
            ) : null}
          </div>
        </Card>

        {/* Main section: Test case selector */}
        <Card>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                Target Test Cases
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Select generated test cases to synthesize into automation scripts.
              </p>
            </div>
            <span className="badge badge-primary">{testCases.length} available</span>
          </div>

          {testCases.length ? (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--text-muted)' }}>
                  {selectedIds.length > 0
                    ? `${selectedIds.length} of ${testCases.length} selected for script generation`
                    : 'Selection required'}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-ghost px-2.5 py-1 text-xs font-semibold"
                    onClick={selectAllTestCases}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    className="btn-ghost px-2.5 py-1 text-xs font-semibold"
                    onClick={clearSelectedTestCases}
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                {testCases.map((testCase) => (
                  <label
                    key={testCase.tcId}
                    className={`flex items-start gap-3 rounded-lg p-3.5 transition-colors cursor-pointer ${selectedIds.includes(testCase.tcId) ? 'card-highlight' : ''
                      }`}
                    style={{
                      background: selectedIds.includes(testCase.tcId)
                        ? 'var(--accent-soft)'
                        : 'var(--bg-secondary)',
                      border: `1px solid ${selectedIds.includes(testCase.tcId) ? 'color-mix(in srgb, var(--accent) 30%, transparent)' : 'var(--border-subtle)'}`,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(testCase.tcId)}
                      onChange={() => toggleTestCase(testCase.tcId)}
                      className="mt-1 h-4 w-4 rounded accent-[var(--accent)]"
                    />
                    <div className="text-sm leading-relaxed">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="font-semibold"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {testCase.tcId}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          ({testCase.category})
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {testCase.summary}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div
              className="p-6 text-center text-sm rounded-lg border border-dashed"
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-muted)',
              }}
            >
              Generate test cases in the AI Test Matrix workspace first.
            </div>
          )}
        </Card>

        {/* Dedicated Section to See Generated Script & Multi-Script History */}
        <section id="generated-script-section" ref={scriptSectionRef} className="space-y-4 pt-2">
          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border shadow-sm transition-all"
            style={{
              background: 'var(--bg-card)',
              borderColor: savedScripts.length > 0 ? 'var(--color-accent)' : 'var(--border-default)',
            }}
          >
            <div>
              <div className="flex items-center gap-2.5">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${savedScripts.length > 0
                      ? 'bg-emerald-500 animate-pulse'
                      : isLoading
                        ? 'bg-blue-500 animate-ping'
                        : 'bg-slate-400'
                    }`}
                />
                <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  Generated Scripts Library
                </h2>
                <span className="badge badge-primary text-xs font-semibold">
                  {savedScripts.length} {savedScripts.length === 1 ? 'Suite' : 'Suites'} Saved
                </span>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {savedScripts.length > 0
                  ? `You have ${savedScripts.length} generated test suite${savedScripts.length > 1 ? 's' : ''}. Select any suite to view, run, or export without losing previous scripts.`
                  : isLoading
                    ? 'Synthesizing framework automation code from selected test cases...'
                    : 'Configure options above and click "Generate Automation Script" to synthesize test code.'}
              </p>
            </div>

            {savedScripts.length > 1 && (
              <button
                onClick={clearSavedScripts}
                className="btn-ghost px-3 py-1.5 text-xs text-red-500 hover:text-red-600 font-semibold self-start sm:self-auto"
                type="button"
              >
                Clear All Suites
              </button>
            )}
          </div>

          {/* Multi-Script Switcher Cards */}
          {savedScripts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Select Generated Suite to View
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {savedScripts.length} {savedScripts.length === 1 ? 'suite available' : 'suites available (switch anytime)'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {savedScripts.map((saved, idx) => {
                  const isActive = activeScriptId === saved.id || (!activeScriptId && idx === 0);
                  return (
                    <div
                      key={saved.id}
                      onClick={() => handleSelectScript(saved.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${isActive ? 'card-highlight ring-2 ring-[var(--accent)]' : ''
                        }`}
                      style={{
                        background: isActive ? 'var(--accent-soft)' : 'var(--bg-secondary)',
                        borderColor: isActive ? 'var(--accent)' : 'var(--border-subtle)',
                      }}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="badge badge-primary text-[11px] uppercase">
                            {saved.framework} • {saved.language}
                          </span>
                          {isActive && (
                            <span className="flex items-center gap-1 text-[11px] font-bold" style={{ color: 'var(--accent)' }}>
                              <span className="h-1.5 w-1.5 rounded-full animate-ping" style={{ background: 'var(--accent)' }} />
                              Active in Studio
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                          {saved.fileName}
                        </h4>
                        <p className="text-xs mt-1 font-medium" style={{ color: 'var(--text-secondary)' }}>
                          {saved.testCaseCount} automated {saved.testCaseCount === 1 ? 'test case' : 'test cases'}
                        </p>
                      </div>

                      <div
                        className="flex items-center justify-between pt-2.5 text-xs"
                        style={{ borderTop: '1px solid var(--border-subtle)' }}
                      >
                        <span style={{ color: 'var(--text-muted)' }}>
                          {formatHistoryTime(saved.timestamp)}
                        </span>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => downloadSpecificScript(saved)}
                            className="font-semibold hover:underline"
                            style={{ color: 'var(--accent)' }}
                            title="Download this script file"
                          >
                            Download
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSavedScript(saved.id)}
                            className="text-slate-400 hover:text-red-500 font-bold px-1"
                            title="Delete this saved suite"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Redesigned IDE-Grade Code Viewer in full-width glory */}
          <TestScriptCodeViewer
            scriptResult={scriptResult}
            isLoading={isLoading}
            framework={framework}
            language={language}
            onClear={clearScript}
            onCopy={copyToClipboard}
            onDownload={downloadScript}
            isCopied={isCopied}
          />
        </section>
      </DesktopOnlyGuard>
    </div>
  );
}
