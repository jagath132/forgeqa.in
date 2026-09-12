import React, { useState } from 'react';
import { Copy, Check, Download, Terminal, Code2 } from 'lucide-react';
import type { TestingFramework, ScriptLanguage } from '../../contracts';

interface CodeStudioProps {
  code: string;
  framework: TestingFramework;
  language: ScriptLanguage;
  fileName?: string;
  onCopy?: () => void;
  onDownload?: () => void;
  className?: string;
}

export function CodeStudio({
  code,
  framework,
  language,
  fileName,
  onCopy,
  onDownload,
  className = '',
}: CodeStudioProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (onCopy) {
      onCopy();
    } else {
      navigator.clipboard.writeText(code);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code ? code.split('\n') : [];

  return (
    <div
      className={`rounded-xl overflow-hidden shadow-sm flex flex-col font-mono text-xs border ${className}`}
      style={{
        background: '#0d1117',
        borderColor: '#30363d',
      }}
    >
      {/* Studio Header */}
      <div
        className="px-4 py-2.5 flex items-center justify-between border-b"
        style={{ background: '#161b22', borderColor: '#30363d' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
            <Code2 className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-slate-300 font-semibold tracking-wide">
              {fileName || `test.${framework}.${language}`}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold bg-blue-500/20 text-blue-400">
            {framework}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold bg-slate-800 text-slate-400">
            {language}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors"
              title="Download Script"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition-colors font-semibold"
            title="Copy to Clipboard"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-300" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Code Area with Line Numbers */}
      <div className="p-4 overflow-x-auto max-h-[550px] overflow-y-auto leading-relaxed select-text">
        {lines.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <Terminal className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p>No automation script generated yet.</p>
            <p className="text-[11px] text-slate-600 mt-1">
              Select test cases and click Generate Automation Script to synthesize code.
            </p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="pr-4 py-0.5 text-right text-slate-600 select-none w-10 text-[11px]">
                    {idx + 1}
                  </td>
                  <td className="py-0.5 pl-2 text-slate-200 whitespace-pre">{line || ' '}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
