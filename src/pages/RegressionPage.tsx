import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { RegressionBuildManager } from "../components/RegressionBuildManager";
import { RegressionRunner } from "../components/RegressionRunner";
import { RegressionResultsTable } from "../components/RegressionResultsTable";
import { WebhookTestPanel } from "../components/WebhookTestPanel";
import { useRegressionStore } from "../store/useRegressionStore";
import { useAppStore } from "../store/useAppStore";
import { regressionGenerate, regressionGenerateScripts, createRegressionRun, getBuildWebhooks, TestCase, TestScriptResponse } from "../lib/api";

export function RegressionPage() {
  const navigate = useNavigate();
  const { loadRuns } = useRegressionStore();
  const provider = useAppStore((s) => s.provider);
  const [activeStep, setActiveStep] = useState<"generate" | "scripts" | "execute">("generate");

  const [requirement, setRequirement] = useState("");
  const [platform, setPlatform] = useState<"web" | "mobile">("web");
  const [suiteName, setSuiteName] = useState("");

  const [generatedTestCases, setGeneratedTestCases] = useState<TestCase[]>([]);
  const [generatedSummary, setGeneratedSummary] = useState("");
  const [generatedScripts, setGeneratedScripts] = useState<TestScriptResponse[]>([]);

  const [framework, setFramework] = useState<string>("playwright");
  const [language, setLanguage] = useState<string>("typescript");
  const [targetUrl, setTargetUrl] = useState("http://localhost:3000");

  const [isGenerating, setIsGenerating] = useState(false);
  const [isScripting, setIsScripting] = useState(false);
  const [error, setError] = useState("");
  const [savedWebhooks, setSavedWebhooks] = useState<{ platform: string; url: string }[]>([]);
  const [showWebhookTest, setShowWebhookTest] = useState(false);

  const frameworkOptions = useMemo(() => {
    if (platform === "mobile") return ["appium"];
    return ["playwright", "cypress", "selenium", "puppeteer"];
  }, [platform]);

  useEffect(() => {
    if (frameworkOptions.length && !frameworkOptions.includes(framework)) {
      setFramework(frameworkOptions[0]);
    }
  }, [frameworkOptions, framework]);

  useEffect(() => { void loadRuns(); }, [loadRuns]);

  useEffect(() => {
    getBuildWebhooks().then(setSavedWebhooks).catch(() => {});
  }, []);

  function resetStep(step: "generate" | "scripts" | "execute") {
    setActiveStep(step);
    setError("");
  }

  async function handleGenerate() {
    if (!provider) { navigate("/ai-settings"); setError("Select an AI provider to continue."); return; }
    if (requirement.trim().length < 10) { setError("Requirement text must be at least 10 characters."); return; }
    setIsGenerating(true);
    setError("");
    try {
      const result = await regressionGenerate({
        requirement: requirement.trim(),
        platform,
        provider,
      });
      if (result.testCases?.length) {
        setGeneratedTestCases(result.testCases);
        setGeneratedSummary(result.summary || "Regression Suite");
        resetStep("scripts");
      } else {
        setError("No test cases were generated. Try a more detailed requirement.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleGenerateScripts() {
    if (!provider) { navigate("/ai-settings"); setError("Select an AI provider to continue."); return; }
    if (!generatedTestCases.length) return;
    setIsScripting(true);
    setError("");
    try {
      const result = await regressionGenerateScripts({
        testCases: generatedTestCases,
        platform,
        framework,
        language,
        targetUrl: platform === "web" ? targetUrl : undefined,
        provider,
      });
      setGeneratedScripts(result.scripts || []);
      resetStep("execute");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Script generation failed.");
    } finally {
      setIsScripting(false);
    }
  }

  async function handleCreateRun() {
    if (!generatedTestCases.length) return;
    try {
      await createRegressionRun({
        platform,
        testCases: generatedTestCases,
        suiteName: suiteName.trim() || generatedSummary || "Regression Run",
      });
      await loadRuns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create run.");
    }
  }

  const steps = [
    { key: "generate" as const, label: "Generate Test Cases", done: generatedTestCases.length > 0 },
    { key: "scripts" as const, label: "Generate Scripts", done: generatedScripts.length > 0 },
    { key: "execute" as const, label: "Execute & Review", done: false },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <RegressionBuildManager />

      {savedWebhooks.length > 0 && (
        <button
          onClick={() => setShowWebhookTest(!showWebhookTest)}
          className="btn-ghost px-4 py-2 text-xs font-semibold cursor-pointer"
          type="button"
        >
          {showWebhookTest ? "Hide" : "Test"} Webhooks ({savedWebhooks.length})
        </button>
      )}
      {showWebhookTest && <WebhookTestPanel webhooks={savedWebhooks} />}

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((step, i) => (
          <div key={step.key} className="flex items-center gap-2">
            <button type="button" onClick={() => resetStep(step.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeStep === step.key ? "btn-primary" : step.done ? "opacity-60 hover:opacity-100" : "btn-ghost opacity-40"
              }`}
              disabled={!step.done && step.key !== "generate"}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                step.done ? "bg-emerald-500 text-white" : activeStep === step.key ? "bg-white/20" : "bg-[var(--bg-tertiary)]"
              }`}>
                {step.done ? (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                ) : i + 1}
              </span>
              {step.label}
            </button>
            {i < steps.length - 1 && (
              <svg className="h-4 w-4" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-lg px-4 py-3 text-sm font-medium" style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid color-mix(in srgb, var(--danger) 25%, transparent)" }}>
          {error}
        </div>
      )}

      {/* Step 1: Generate Regression Test Cases */}
      {activeStep === "generate" && (
        <Card>
          <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>1. Describe the Change</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Describe the new feature or change that requires regression testing.</p>
          <div className="mt-4 space-y-3">
            <textarea className="input-modern w-full min-h-[160px] resize-none p-4 text-sm leading-relaxed"
              placeholder="Describe the change, e.g. 'Added a new checkout coupon feature that modifies the discount calculation logic shared across the cart and invoice modules.'"
              value={requirement} onChange={(e) => setRequirement(e.target.value)}
            />
            <div className="flex items-center gap-3">
              <select className="input-modern px-3 py-2 text-xs" value={platform} onChange={(e) => setPlatform(e.target.value as "web" | "mobile")}>
                <option value="web">Web Application</option>
                <option value="mobile">Mobile (Android APK)</option>
              </select>
              <input className="input-modern flex-1 px-3 py-2 text-xs" placeholder="Suite name (optional)" value={suiteName} onChange={(e) => setSuiteName(e.target.value)} />
              <button onClick={handleGenerate} disabled={isGenerating} className="btn-primary px-5 py-2 text-xs font-semibold cursor-pointer" type="button">
                {isGenerating ? "Generating..." : "Generate Regression Cases"}
              </button>
            </div>
          </div>

          {generatedTestCases.length > 0 && (
            <div className="mt-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm" style={{ background: "var(--success-soft)", color: "var(--success)" }}>
              <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{generatedTestCases.length} regression test cases generated. Proceed to Step 2.</span>
            </div>
          )}
        </Card>
      )}

      {/* Step 2: Generate Scripts */}
      {activeStep === "scripts" && (
        <Card>
          <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>2. Generate Automation Scripts</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Configure script generation for the regression test cases.</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <select className="input-modern px-3 py-2 text-xs" value={framework} onChange={(e) => setFramework(e.target.value)}>
                {frameworkOptions.map((fw) => <option key={fw} value={fw}>{fw.charAt(0).toUpperCase() + fw.slice(1)}</option>)}
              </select>
              <select className="input-modern px-3 py-2 text-xs" value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="typescript">TypeScript</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
              </select>
              {platform === "web" && (
                <input className="input-modern flex-1 px-3 py-2 text-xs" placeholder="Target URL" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} />
              )}
              <button onClick={handleGenerateScripts} disabled={isScripting} className="btn-primary px-5 py-2 text-xs font-semibold cursor-pointer" type="button">
                {isScripting ? "Generating..." : "Generate Scripts"}
              </button>
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{generatedTestCases.length} test case(s) selected for scripting.</p>
          </div>

          {generatedScripts.map((script, i) => (
            <div key={i} className="mt-4 rounded-lg overflow-hidden border" style={{ borderColor: "var(--border-default)" }}>
              <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "var(--bg-secondary)" }}>
                <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{script.fileName}</span>
                <button onClick={() => navigator.clipboard.writeText(script.script)}
                  className="btn-ghost px-3 py-1 text-xs cursor-pointer" type="button"
                >Copy</button>
              </div>
              <pre className="p-4 text-xs leading-relaxed overflow-x-auto max-h-96" style={{ color: "var(--text-secondary)", background: "var(--bg-primary)" }}>
                <code>{script.script}</code>
              </pre>
            </div>
          ))}
        </Card>
      )}

      {/* Step 3: Execute & Review */}
      {activeStep === "execute" && (
        <Card>
          <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>3. Execute & Review</h2>
          <p className="text-xs mt-0.5 mb-4" style={{ color: "var(--text-muted)" }}>Run the regression suite and review results.</p>

          {generatedTestCases.length > 0 && (
            <div className="mb-4">
              <button onClick={handleCreateRun} className="btn-primary px-5 py-2 text-xs font-semibold cursor-pointer" type="button">
                Create Run & Execute
              </button>
            </div>
          )}

          <RegressionRunner />
        </Card>
      )}

      {/* Test Cases Preview */}
      {generatedTestCases.length > 0 && (
        <Card>
          <h2 className="text-base font-bold mb-3" style={{ color: "var(--text-primary)" }}>
            Regression Test Cases {generatedSummary && <span style={{ color: "var(--text-muted)" }}>— {generatedSummary}</span>}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-default)", background: "var(--accent-soft)" }}>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>ID</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>Category</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>Summary</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>Expected</th>
                </tr>
              </thead>
              <tbody>
                {generatedTestCases.map((tc) => (
                  <tr key={tc.tcId} className="border-t" style={{ borderColor: "var(--border-subtle)" }}>
                    <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>{tc.tcId}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold" style={{
                        color: tc.category === "Positive" ? "var(--accent-emerald)" : tc.category === "Negative" ? "var(--accent-rose)" : tc.category === "Edge" || tc.category === "Edge cases" ? "var(--accent-amber)" : "var(--accent-cyan)",
                        borderColor: "currentColor",
                        background: "transparent",
                      }}>
                        {tc.category}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--text-primary)" }}>{tc.summary}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{tc.expected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* History */}
      <Card>
        <h2 className="text-base font-bold mb-3" style={{ color: "var(--text-primary)" }}>Run History</h2>
        <RegressionResultsTable />
      </Card>
    </div>
  );
}
