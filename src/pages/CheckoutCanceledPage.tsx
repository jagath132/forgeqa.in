import React from 'react';
import { useNavigate } from 'react-router-dom';

export function CheckoutCanceledPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/90 shadow-xl text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto text-2xl">
          ✕
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Checkout Incomplete
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">Upgrade Cancelled</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            No charges were incurred. You can review pricing tiers, test quotas, or try checking out
            again whenever you are ready.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/billing')}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            Return to Billing Hub
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
