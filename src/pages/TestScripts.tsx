import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAppStore } from '../store/useAppStore';
import { generateTestScript } from '../lib/testScriptApi';
import type { TestingFramework, ScriptLanguage, TestScriptRequest } from '../lib/api';
import { Card } from '../components/ui/Card';
import { MobilePageHeader } from '../components/PageHeader';
import { DesktopOnlyGuard } from '../components/DesktopOnlyGuard';

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

export function TestScripts() {
  const qaResult = useAppStore((s) => s.qaResult);
  const provider = useAppStore((s) => s.provider);
  const scriptResult = useAppStore((s) => s.scriptResult);
  const setScriptResult = useAppStore((s) => s.setScriptResult);

  const testCases = useMemo(() => qaResult?.testCases ?? [], [qaResult]);

  const [framework, setFramework] = useState<string>('');
  const [language, setLanguage] = useState<string>('');
  const [targetUrl, setTargetUrl] = useState('https://example.com');
  const [headless, setHeadless] = useState(true);
  const [width, setWidth] = useState(1280);
  const [height, setHeight] = useState(720);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    setSelectedIds([]);
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setScriptResult(null);
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
      setScriptResult(response.data);
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
    const element = document.createElement('a');
    const blob = new Blob([scriptResult.script], { type: 'text/plain' });
    element.href = URL.createObjectURL(blob);
    element.download = scriptResult.fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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
    setScriptResult(null);
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

        {/* Main grid */}
        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          {/* Test case selector */}
          <Card className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                    Test Cases
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Select cases to automate.
                  </p>
                </div>
                <span className="badge badge-primary">{testCases.length} available</span>
              </div>

              {testCases.length ? (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>
                      {selectedIds.length > 0
                        ? `${selectedIds.length} selected`
                        : 'Selection required'}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn-ghost px-2.5 py-1 text-xs"
                        onClick={selectAllTestCases}
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        className="btn-ghost px-2.5 py-1 text-xs"
                        onClick={clearSelectedTestCases}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
                    {testCases.map((testCase) => (
                      <label
                        key={testCase.tcId}
                        className={`flex items-start gap-3 rounded-lg p-3.5 transition-colors cursor-pointer ${
                          selectedIds.includes(testCase.tcId) ? 'card-highlight' : ''
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
                  Generate test cases in the Test Cases workspace first.
                </div>
              )}
            </div>
          </Card>

          {/* Code viewer */}
          <div className="card p-0 overflow-hidden flex flex-col min-h-[400px]">
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{
                background: 'var(--bg-tertiary)',
                borderBottom: '1px solid var(--border-default)',
              }}
            >
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: 'var(--danger)' }}
                  />
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: 'var(--warning)' }}
                  />
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: 'var(--success)' }}
                  />
                </div>
                <span className="h-4 w-px mx-1" style={{ background: 'var(--border-default)' }} />
                <span
                  className="text-xs font-mono font-semibold truncate max-w-[200px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {scriptResult ? scriptResult.fileName : 'output.ts'}
                </span>
              </div>
              {scriptResult ? (
                <>
                  <button
                    type="button"
                    onClick={clearScript}
                    className="btn-ghost flex items-center gap-1 text-xs px-2 py-1"
                  >
                    <svg
                      className="h-3.5 w-3.5"
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
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="btn-ghost flex items-center gap-1 text-xs px-2 py-1"
                  >
                    {isCopied ? (
                      <>
                        <svg
                          className="h-3.5 w-3.5"
                          style={{ color: 'var(--success)' }}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-3.5 w-3.5"
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
                        Copy Code
                      </>
                    )}
                  </button>
                </>
              ) : null}
            </div>

            <div
              className="flex-1 p-4 font-mono text-sm leading-relaxed overflow-auto max-h-[460px]"
              style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
            >
              {scriptResult ? (
                <pre className="whitespace-pre-wrap">{scriptResult.script}</pre>
              ) : (
                <div
                  className="h-full flex flex-col items-center justify-center text-center py-20"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <svg
                    className="h-8 w-8 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="font-semibold">Terminal Buffer Empty</p>
                  <p className="text-xs mt-1">
                    Click &ldquo;Generate Automation Script&rdquo; above.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </DesktopOnlyGuard>
    </div>
  );
}
