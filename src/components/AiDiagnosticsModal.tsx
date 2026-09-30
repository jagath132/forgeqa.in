import React, { useState, useEffect } from 'react';
import { diagnoseTestFailure } from '../lib/testScriptApi';
import { useAppStore } from '../store/useAppStore';
import type { AiDiagnosisResponse } from '../lib/api';

interface AiDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialErrorLog?: string;
  failedLocator?: string;
  testCaseSummary?: string;
  targetUrl?: string;
}

export const AiDiagnosticsModal: React.FC<AiDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  initialErrorLog = '',
  failedLocator = '',
  testCaseSummary = '',
  targetUrl = '',
}) => {
  const provider = useAppStore((s) => s.provider);
  const [errorLog, setErrorLog] = useState(initialErrorLog);
  const [locator, setLocator] = useState(failedLocator);
  const [summary, setSummary] = useState(testCaseSummary);
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<AiDiagnosisResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedLocator, setCopiedLocator] = useState(false);

  useEffect(() => {
    setErrorLog(initialErrorLog);
    setLocator(failedLocator);
    setSummary(testCaseSummary);
    setDiagnosis(null);
    setErrorMessage('');
  }, [initialErrorLog, failedLocator, testCaseSummary, isOpen]);

  if (!isOpen) return null;

  const handleRunDiagnosis = async () => {
    if (!errorLog.trim()) {
      setErrorMessage('Please provide an execution error log or stack trace.');
      return;
    }
    if (!provider) {
      setErrorMessage('Please select an AI provider in Settings first.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await diagnoseTestFailure({
        errorLog,
        failedLocator: locator,
        testCaseSummary: summary,
        targetUrl,
        provider,
      });
      setDiagnosis(res.data);
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { error?: string } }; message?: string };
      setErrorMessage(
        errObj.response?.data?.error || errObj.message || 'Failed to perform AI diagnostic triage.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLocator = () => {
    if (!diagnosis?.healedLocator) return;
    navigator.clipboard.writeText(diagnosis.healedLocator);
    setCopiedLocator(true);
    setTimeout(() => setCopiedLocator(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden text-slate-100"
        style={{
          background: '#090d18',
          borderColor: 'rgba(255, 255, 255, 0.12)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0d1222]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                AI Failure Triage & Self-Healing Engine
              </h3>
              <p className="text-xs text-slate-400">
                Root-cause triage, flakiness scoring, and Playwright resilient locators
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Input details */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Test Case Context / Summary
              </label>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="e.g. TC_001 - Verify Checkout Payment Submission"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Suspect / Failed Locator (Optional)
              </label>
              <input
                type="text"
                value={locator}
                onChange={(e) => setLocator(e.target.value)}
                placeholder="e.g. page.locator('button#action-submit') or #btn-checkout"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Playwright Failure Log / Stack Trace
              </label>
              <textarea
                rows={4}
                value={errorLog}
                onChange={(e) => setErrorLog(e.target.value)}
                placeholder="Paste Playwright error logs, timeout traces, or exception details..."
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500 leading-relaxed"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300">
              {errorMessage}
            </div>
          )}

          {/* Action Trigger */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              disabled={isLoading || !errorLog.trim()}
              onClick={handleRunDiagnosis}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-xs shadow-lg transition-all flex items-center gap-2 disabled:opacity-40"
            >
              {isLoading ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <span>Diagnosing Failure...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                    />
                  </svg>
                  <span>Analyze Failure with AI</span>
                </>
              )}
            </button>
          </div>

          {/* Diagnosis Results Card */}
          {diagnosis && (
            <div className="mt-4 p-4 rounded-xl bg-slate-900/80 border border-slate-700/80 space-y-3.5 animate-fade-in">
              {/* Badges row */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-rose-950/80 text-rose-300 border border-rose-800">
                    {diagnosis.category}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${
                      diagnosis.isFlaky
                        ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                        : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                    }`}
                  >
                    {diagnosis.isFlaky ? '⚡ Flaky Test Pattern' : '🛡️ Deterministic Failure'}
                  </span>
                </div>
                <span className="text-[11px] text-cyan-400 font-semibold">
                  AI Confidence: {diagnosis.confidenceScore}%
                </span>
              </div>

              {/* Root Cause */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Root Cause Analysis
                </h4>
                <p className="text-slate-200 leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  {diagnosis.rootCause}
                </p>
              </div>

              {/* Healed Locator (if available) */}
              {diagnosis.healedLocator && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                      ✨ Self-Healed Resilient Playwright Locator
                    </h4>
                    <button
                      type="button"
                      onClick={handleCopyLocator}
                      className="text-[10px] text-slate-400 hover:text-emerald-400 flex items-center gap-1"
                    >
                      {copiedLocator ? '✓ Copied' : 'Copy Locator'}
                    </button>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#040810] border border-emerald-800/60 font-mono text-emerald-300 text-xs flex items-center justify-between">
                    <code>{diagnosis.healedLocator}</code>
                  </div>
                </div>
              )}

              {/* Suggested Fix */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Suggested Action & Code Diff
                </h4>
                <pre className="text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] whitespace-pre-wrap">
                  {diagnosis.suggestedFix}
                </pre>
              </div>

              {/* Prevention Advice */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  CI/CD Pipeline Best Practice
                </h4>
                <p className="text-slate-400 italic bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                  💡 {diagnosis.preventionAdvice}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#0d1222] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
