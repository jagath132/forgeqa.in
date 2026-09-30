import React from 'react';

export interface PlanComparisonProps {
  currentTier?: string;
  onSelectPlan?: (tier: 'free' | 'pro' | 'enterprise') => void;
}

export function PlanComparison({ currentTier = 'free', onSelectPlan }: PlanComparisonProps) {
  const rows = [
    {
      name: 'Monthly Base Price',
      free: '₹0',
      pro: '₹1,499 / seat',
      enterprise: '₹1,499 → ₹699 / seat',
    },
    {
      name: 'Workspace Members',
      free: '1 member',
      pro: 'Up to 60 seats',
      enterprise: 'Unlimited seats',
    },
    {
      name: 'Daily AI Generations',
      free: '20 / day',
      pro: '200 / day',
      enterprise: '2,000+ / day',
    },
    {
      name: 'Max Test Case Storage',
      free: '500 test cases',
      pro: '5,000 test cases',
      enterprise: '50,000+ test cases',
    },
    {
      name: 'Knowledge Base Uploads',
      free: '3 documents',
      pro: '20 documents',
      enterprise: 'Unlimited documents',
    },
    {
      name: 'Multi-AI Provider Selection',
      free: 'Standard',
      pro: 'All 6 Providers',
      enterprise: 'All 6 Providers + Custom LLM',
    },
    {
      name: 'Automation Script Generator',
      free: '❌',
      pro: '✅ Playwright, Cypress, Selenium, Robot',
      enterprise: '✅ Full Multi-Framework Engine',
    },
    {
      name: 'Regression Testing Suites',
      free: '❌',
      pro: '✅ Full Suite Runner',
      enterprise: '✅ Unlimited Suites + Webhooks',
    },
    {
      name: 'CI/CD Webhooks & GitHub Actions',
      free: '❌',
      pro: '✅ Included',
      enterprise: '✅ Included',
    },
    {
      name: 'Volume Seat Discounts',
      free: 'N/A',
      pro: 'Up to 40% Off',
      enterprise: '✅ Custom Contract',
    },
    {
      name: 'SSO & SAML Authentication',
      free: '❌',
      pro: '❌',
      enterprise: '✅ Okta, Azure AD, Google',
    },
    {
      name: 'Audit Logs & Governance',
      free: '❌',
      pro: '✅ Basic Audit Log',
      enterprise: '✅ Comprehensive SOC2 Trail',
    },
    {
      name: 'Support Level',
      free: 'Community Forums',
      pro: 'Priority Email (< 4h)',
      enterprise: 'Dedicated TAM & 99.9% SLA',
    },
  ];

  const renderCellContent = (content: string) => {
    if (content.includes('✅')) {
      const text = content.replace('✅ ', '').replace('✅', '').trim();
      return (
        <span className="inline-flex items-center justify-center gap-1.5 text-slate-800 text-xs font-medium">
          <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <svg
              className="w-2.5 h-2.5"
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
      return (
        <span className="inline-flex items-center justify-center text-slate-300 font-bold text-sm">
          —
        </span>
      );
    }
    return <span className="font-mono text-xs text-slate-700">{content}</span>;
  };

  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm border border-slate-200/90">
      <table className="w-full text-left border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            <th className="p-4.5 text-slate-600 font-bold text-xs uppercase tracking-wider w-1/4">
              Features & Limits
            </th>
            <th className="p-4.5 text-center w-1/4 border-l border-slate-200">
              <div className="font-bold text-base text-slate-800">Free Starter</div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">₹0 / month</div>
            </th>
            <th className="p-4.5 text-center w-1/4 border-l border-slate-200 bg-indigo-50/40 relative">
              <div className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white uppercase tracking-wider mb-1">
                Featured
              </div>
              <div className="font-bold text-base text-indigo-700">ForgeQA Pro</div>
              <div className="text-xs text-indigo-600 font-mono mt-0.5">₹1,499 / seat / mo</div>
            </th>
            <th className="p-4.5 text-center w-1/4 border-l border-slate-200 bg-amber-50/30">
              <div className="font-bold text-base text-amber-900">Enterprise</div>
              <div className="text-xs text-amber-700 font-mono mt-0.5">Volume Custom</div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs">
          {rows.map((row, index) => (
            <tr
              key={row.name}
              className={`transition-colors hover:bg-slate-50/70 ${
                index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
              }`}
            >
              <td className="p-4 font-semibold text-slate-800 text-xs">{row.name}</td>
              <td className="p-4 text-center border-l border-slate-100">
                {renderCellContent(row.free)}
              </td>
              <td className="p-4 text-center border-l border-slate-100 bg-indigo-50/20 font-medium">
                {renderCellContent(row.pro)}
              </td>
              <td className="p-4 text-center border-l border-slate-100 bg-amber-50/10 font-medium">
                {renderCellContent(row.enterprise)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
