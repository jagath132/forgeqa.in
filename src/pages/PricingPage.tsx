import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAppStore } from '../store/useAppStore';
import { PlanComparison } from '../components/PlanComparison';

export function PricingPage() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get('/api/billing/plans')
      .then((res) => {
        if (res.data?.plans) setPlans(res.data.plans);
      })
      .catch(() => {
        /* fallback to defaults */
      });
  }, []);

  const handleSelectPlan = async (planCode: string) => {
    if (!user) {
      navigate('/login?redirect=/pricing');
      return;
    }

    if (planCode === 'free') {
      navigate('/dashboard');
      return;
    }

    if (planCode === 'enterprise') {
      navigate('/billing');
      return;
    }

    setCheckoutLoading(planCode);
    setError(null);

    try {
      const res = await api.post('/api/billing/checkout', {
        planCode,
        interval: billingCycle === 'yearly' ? 'year' : 'month',
      });
      if (res.data?.url) {
        if (res.data.url.startsWith('http')) {
          window.location.href = res.data.url;
        } else {
          navigate(res.data.url);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start checkout. Please try again.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const proPrice = billingCycle === 'yearly' ? 1249 : 1499;

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-6 px-4 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <span className="text-xs px-3 py-1 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider font-mono">
          Transparent Pricing
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Scale QA Automation Without Limits
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          From solo test engineers to high-velocity QA engineering teams. Generate production test
          frameworks, manage locators, and automate regression matrices.
        </p>

        {/* Toggle */}
        <div className="pt-2 flex items-center justify-center">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                billingCycle === 'yearly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-400 text-slate-950 uppercase">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-md mx-auto p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium text-center">
          {error}
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {/* Free Starter */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold font-mono uppercase text-slate-400">STARTER</span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                Free Forever
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Free Starter</h3>
            <p className="text-xs text-slate-500 mt-2 min-h-[36px]">
              For developers and individual QA engineers verifying basic test scenarios.
            </p>

            <div className="my-6">
              <span className="text-4xl font-black font-mono text-slate-900">₹0</span>
              <span className="text-xs text-slate-500 ml-1">/ month</span>
            </div>

            <ul className="space-y-3 text-xs text-slate-600 border-t border-slate-100 pt-6">
              {[
                '100 Monthly AI Runs (20/day)',
                '500 Test Cases storage',
                '5 Knowledge Base documents',
                '1 Workspace Member seat',
                'Single Spec Script Export',
              ].map((feat, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <span className="text-slate-400 font-bold">✓</span>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={() => handleSelectPlan('free')}
            className="mt-8 w-full py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            Start Free
          </button>
        </div>

        {/* Pro Plan (Featured) */}
        <div className="bg-gradient-to-b from-indigo-50/50 via-white to-white rounded-3xl p-8 border-2 border-indigo-600 shadow-xl shadow-indigo-600/10 flex flex-col justify-between relative ring-4 ring-indigo-50">
          <div className="absolute top-0 right-0 p-4">
            <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm">
              ★ MOST POPULAR
            </span>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold font-mono uppercase text-indigo-600">
                PRO TEAM
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">ForgeQA Pro</h3>
            <p className="text-xs text-slate-600 mt-2 min-h-[36px]">
              Full production test automation framework with multi-language export and CI/CD
              pipelines.
            </p>

            <div className="my-6">
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-black font-mono text-slate-900">
                  ₹{proPrice.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 font-sans">/ seat / month</span>
              </div>
              <p className="text-[11px] text-indigo-600 font-mono mt-1 font-semibold">
                Billed {billingCycle} {billingCycle === 'yearly' ? '(Save ₹3,000/yr)' : ''}
              </p>
            </div>

            <ul className="space-y-3 text-xs text-slate-700 border-t border-indigo-100 pt-6">
              {[
                '2,500 Monthly AI Runs (200/day)',
                'Up to 5,000 Test Cases storage',
                '20 Knowledge Base uploads',
                '🚀 Playwright, Cypress, Selenium, Robot POM suites',
                'GitHub Actions CI/CD workflows & ZIP exports',
                'Automated Regression Suites & Webhooks',
                'Priority Email Support',
              ].map((feat, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <span className="text-indigo-600 font-bold">✓</span>
                  <span className={i === 3 || i === 4 ? 'font-bold text-indigo-900' : ''}>
                    {feat}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            disabled={checkoutLoading === 'pro'}
            onClick={() => handleSelectPlan('pro')}
            className="mt-8 w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition cursor-pointer disabled:opacity-50"
          >
            {checkoutLoading === 'pro' ? 'Preparing Checkout...' : 'Upgrade to Pro'}
          </button>
        </div>

        {/* Enterprise */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold font-mono uppercase text-slate-400">
                ENTERPRISE
              </span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                Custom SLA
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Enterprise</h3>
            <p className="text-xs text-slate-500 mt-2 min-h-[36px]">
              For large engineering organizations requiring custom security, SSO, and dedicated
              resources.
            </p>

            <div className="my-6">
              <span className="text-4xl font-black font-mono text-slate-900">Custom</span>
              <span className="text-xs text-slate-500 ml-1">/ annual contract</span>
            </div>

            <ul className="space-y-3 text-xs text-slate-600 border-t border-slate-100 pt-6">
              {[
                '100,000+ Monthly AI Runs',
                'Unlimited Test Cases & Knowledge Hub',
                'Okta, Azure AD, SAML SSO',
                'Dedicated Private VPC & Fine-Tuned Models',
                'Dedicated Technical Account Manager',
                '99.9% Uptime SLA Guarantee',
              ].map((feat, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <span className="text-amber-600 font-bold">✓</span>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={() => handleSelectPlan('enterprise')}
            className="mt-8 w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
          >
            Contact Sales
          </button>
        </div>
      </div>

      {/* Feature Matrix */}
      <div className="pt-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
          Detailed Feature Comparison
        </h2>
        <PlanComparison onSelectPlan={(tier) => handleSelectPlan(tier)} />
      </div>
    </div>
  );
}
