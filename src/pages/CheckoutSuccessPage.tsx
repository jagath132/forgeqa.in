import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';

export function CheckoutSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [status, setStatus] = useState<'polling' | 'success' | 'timeout'>('polling');
  const [subscription, setSubscription] = useState<any>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let pollCount = 0;
    const maxPolls = 15; // 30 seconds max

    const checkSubscription = async () => {
      pollCount++;
      setAttempts(pollCount);
      try {
        const res = await api.get('/api/billing/subscription');
        const sub = res.data?.subscription;
        if (sub && (sub.status === 'active' || sub.plan_code !== 'free')) {
          setSubscription(sub);
          setStatus('success');
          return;
        }
      } catch {
        /* continue polling */
      }

      if (pollCount >= maxPolls) {
        setStatus('timeout');
      } else {
        timer = setTimeout(checkSubscription, 2000);
      }
    };

    checkSubscription();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/90 shadow-xl text-center space-y-6 animate-fade-in">
        {status === 'polling' && (
          <div className="space-y-4">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
              <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
              <span className="text-xl">💳</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Confirming Your Payment...</h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              We are waiting for the payment confirmation from the banking network. Your
              subscription will activate in just a moment.
            </p>
            <div className="text-[11px] font-mono text-slate-400">
              Verifying webhook confirmation ({attempts}/15)...
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-5 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl shadow-sm">
              ✓
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 font-mono">
                Payment Verified
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-1">Subscription Active!</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Welcome to ForgeQA Pro. All upgraded quotas and multi-framework export tools are now
                unlocked.
              </p>
            </div>

            {subscription && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Active Tier:</span>
                  <span className="font-bold text-slate-800 uppercase">
                    {subscription.plan_code}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-semibold text-emerald-600">● {subscription.status}</span>
                </div>
                {sessionId && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Reference:</span>
                    <span className="font-mono text-slate-600">{sessionId.slice(0, 16)}...</span>
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer"
              >
                Go to Dashboard
              </button>
              <button
                type="button"
                onClick={() => navigate('/billing')}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
              >
                View Billing Command Center
              </button>
            </div>
          </div>
        )}

        {status === 'timeout' && (
          <div className="space-y-4 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-xl">
              ⏱
            </div>
            <h2 className="text-xl font-bold text-slate-900">Payment In Progress</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your payment session was submitted. Provider webhooks can sometimes take up to a
              minute to finalize. Your plan will activate automatically.
            </p>
            <div className="pt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                Check Again
              </button>
              <button
                type="button"
                onClick={() => navigate('/billing')}
                className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs cursor-pointer"
              >
                Go to Billing Hub
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
