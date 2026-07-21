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

  const renderCellContent = (content: string) => {
    if (content.includes('✅')) {
      const text = content.replace('✅ ', '').replace('✅', '');
      return (
        <span className="flex items-center justify-center gap-2 text-slate-200">
          <span className="bg-emerald-500 text-white rounded-full p-0.5 inline-flex shadow">
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
          {text && <span>{text}</span>}
        </span>
      );
    }
    if (content.includes('❌')) {
      return <span className="flex items-center justify-center text-slate-500 font-black">✕</span>;
    }
    return <span>{content}</span>;
  };

  return (
    <div className="overflow-x-auto rounded-xl bg-[#1e293b] shadow-md border border-slate-700">
      <table className="w-full text-left border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-slate-700/50">
            <th className="p-4 text-slate-400 font-semibold w-1/4 align-top">Features & Limits</th>
            <th className="p-4 text-center w-1/4 border-l border-slate-700/50 bg-[#1e293b] align-top">
              <div className="font-bold text-lg text-white">Free</div>
              <div className="text-[10px] text-slate-400 font-mono mt-1">₹0 / mo</div>
            </th>
            <th className="p-4 text-center w-1/4 border-l border-slate-700/50 bg-slate-800/80 align-top">
              <div className="font-bold text-lg text-blue-400">Pro</div>
              <div className="text-[10px] text-slate-400 font-mono mt-1">₹1,499 / seat / mo</div>
            </th>
            <th className="p-4 text-center w-1/4 border-l border-slate-700/50 bg-[#1e293b] align-top">
              <div className="font-bold text-lg text-amber-400">Enterprise</div>
              <div className="text-[10px] text-slate-400 font-mono mt-1">₹699–₹1,499 / seat</div>
            </th>
          </tr>
        </thead>
        <tbody className="text-xs">
          {rows.map((row, index) => (
            <tr
              key={row.name}
              className={`border-b border-slate-700/50 ${
                index % 2 === 0 ? 'bg-slate-800/30' : 'bg-transparent'
              }`}
            >
              <td className="p-4 font-medium text-slate-300">{row.name}</td>
              <td className="p-4 text-center text-slate-400 font-mono border-l border-slate-700/50">
                {renderCellContent(row.free)}
              </td>
              <td className="p-4 text-center text-blue-300 font-mono border-l border-slate-700/50 bg-slate-800/30 font-medium">
                {renderCellContent(row.pro)}
              </td>
              <td className="p-4 text-center text-amber-300 font-mono border-l border-slate-700/50 font-medium">
                {renderCellContent(row.enterprise)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
