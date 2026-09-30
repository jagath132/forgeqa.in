import React from 'react';
import { useNavigate } from 'react-router-dom';

export interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  metric?: string;
}

export function UpgradeModal({
  isOpen,
  onClose,
  title = 'Quota Limit Reached',
  message = 'You have reached the maximum allowance for your current plan tier.',
  metric,
}: UpgradeModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xl text-center space-y-5 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full cursor-pointer"
        >
          ✕
        </button>

        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-2xl shadow-sm">
          🚀
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 font-mono">
            {metric ? `${metric.toUpperCase()} LIMIT` : 'PLAN CAPACITY'}
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-2">{title}</h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{message}</p>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-left text-xs space-y-2">
          <div className="font-bold text-indigo-900 flex items-center gap-1.5">
            <span>✨ Unlock with ForgeQA Pro:</span>
          </div>
          <ul className="space-y-1.5 text-slate-600 text-[11px]">
            <li className="flex items-center gap-2">
              <span className="text-emerald-600 font-bold">✓</span> 2,500 Monthly AI Runs (200/day)
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-600 font-bold">✓</span> 5,000 Test Cases & Full POM
              Framework Export
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-600 font-bold">✓</span> Automated Regression Suites &
              CI/CD Runners
            </li>
          </ul>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
          >
            Not Now
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/billing');
            }}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            Upgrade Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
