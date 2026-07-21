import React from 'react';

export interface PlanComparisonProps {
  currentTier?: string;
  onSelectPlan?: (tier: 'free' | 'pro' | 'enterprise') => void;
}

export function PlanComparison({ currentTier = 'free', onSelectPlan }: PlanComparisonProps) {
  const rows = [
    { name: 'Monthly Price', free: '₹0', pro: '₹1,499 / seat', enterprise: '₹1,499 → ₹699 / seat' },
    {
      name: 'Workspace Members',
      free: '1 member',
      pro: 'Up to 10 seats',
      enterprise: 'Up to 999 seats',
    },
    { name: 'Daily AI Generations', free: '20 / day', pro: '200 / day', enterprise: '2,000 / day' },
    {
      name: 'Max Test Case Storage',
      free: '500 test cases',
      pro: '5,000 test cases',
      enterprise: '50,000 test cases',
    },
    {
      name: 'Knowledge Base Uploads',
      free: '3 files',
      pro: '20 files',
      enterprise: 'Unlimited files',
    },
    {
      name: 'Multi-AI Provider Selection',
      free: 'Basic',
      pro: 'All 6 Providers',
      enterprise: 'All 6 Providers',
    },
    {
      name: 'Automation Script Generator',
      free: '❌',
      pro: '✅ Playwright, Cypress, Selenium',
      enterprise: '✅ Full Automation Engine',
    },
    {
      name: 'Regression Testing Suites',
      free: '❌',
      pro: '✅ Full Access',
      enterprise: '✅ Unlimited Suites',
    },
    { name: 'CI/CD Webhooks & Jenkins', free: '❌', pro: '✅ Included', enterprise: '✅ Included' },
    { name: 'Volume Seat Discounts', free: 'N/A', pro: 'Standard', enterprise: '✅ Up to 53% Off' },
    { name: 'SSO & SAML Authentication', free: '❌', pro: '❌', enterprise: '✅ Enterprise SSO' },
    {
      name: 'Audit Logs & Governance',
      free: '❌',
      pro: '✅ Basic Audit',
      enterprise: '✅ Full Audit Trail',
    },
    {
      name: 'Support',
      free: 'Community',
      pro: 'Priority Email',
      enterprise: 'Dedicated Manager & SLA',
    },
  ];

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <table className="w-full text-left border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-slate-800">
            <th className="p-3 text-slate-400 font-semibold w-1/4">Features & Limits</th>
            <th className="p-3 text-center w-1/4">
              <div className="font-bold text-base text-white">Free</div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">₹0 / mo</div>
              {onSelectPlan && (
                <button
                  type="button"
                  disabled={currentTier === 'free'}
                  onClick={() => onSelectPlan('free')}
                  className={`mt-2 px-3 py-1 rounded-lg text-xs font-semibold w-full transition ${
                    currentTier === 'free'
                      ? 'bg-slate-800 text-slate-400 cursor-default'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  {currentTier === 'free' ? 'Current Plan' : 'Downgrade'}
                </button>
              )}
            </th>
            <th className="p-3 text-center w-1/4 bg-blue-950/30 border-x border-blue-900/50">
              <div className="font-bold text-base text-blue-400">Pro</div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">₹1,499 / seat / mo</div>
              {onSelectPlan && (
                <button
                  type="button"
                  onClick={() => onSelectPlan('pro')}
                  className={`mt-2 px-3 py-1 rounded-lg text-xs font-semibold w-full transition ${
                    currentTier === 'pro'
                      ? 'bg-blue-600 text-white cursor-default'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow'
                  }`}
                >
                  {currentTier === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
                </button>
              )}
            </th>
            <th className="p-3 text-center w-1/4">
              <div className="font-bold text-base text-emerald-400">Enterprise</div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">₹699–₹1,499 / seat</div>
              {onSelectPlan && (
                <button
                  type="button"
                  onClick={() => onSelectPlan('enterprise')}
                  className={`mt-2 px-3 py-1 rounded-lg text-xs font-semibold w-full transition ${
                    currentTier === 'enterprise'
                      ? 'bg-emerald-600 text-white cursor-default'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                  }`}
                >
                  {currentTier === 'enterprise' ? 'Current Plan' : 'Upgrade to Enterprise'}
                </button>
              )}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.name}
              className={`border-b border-slate-900 ${
                index % 2 === 0 ? 'bg-slate-900/20' : 'bg-transparent'
              }`}
            >
              <td className="p-3 font-medium text-slate-300">{row.name}</td>
              <td className="p-3 text-center text-slate-400 font-mono text-xs">{row.free}</td>
              <td className="p-3 text-center text-blue-300 font-mono text-xs bg-blue-950/20 border-x border-blue-900/40 font-medium">
                {row.pro}
              </td>
              <td className="p-3 text-center text-emerald-300 font-mono text-xs font-medium">
                {row.enterprise}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
