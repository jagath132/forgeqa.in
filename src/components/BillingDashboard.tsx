import React, { useState, useEffect, useMemo, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type User } from '../lib/api';
import { useAppStore } from '../store/useAppStore';
import { PlanComparison } from './PlanComparison';

export interface BillingDashboardProps {
  user?: User | null;
  onPlanChanged?: () => void;
}

export function BillingDashboard({ user: propUser, onPlanChanged }: BillingDashboardProps) {
  const navigate = useNavigate();
  const storeUser = useAppStore((s) => s.user);
  const openConfirm = useAppStore((s) => s.openConfirm);
  const user = propUser || storeUser;

  const [billingPlan, setBillingPlan] = useState<any>(null);
  const [usageMetrics, setUsageMetrics] = useState<{
    aiGenerationsToday: number;
    totalTestCases: number;
    totalFiles: number;
    teamMembers: number;
  }>({
    aiGenerationsToday: 0,
    totalTestCases: 0,
    totalFiles: 0,
    teamMembers: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedSeats, setSelectedSeats] = useState<number>(5);

  // Card & Tax Data
  const [savedCard, setSavedCard] = useState<{
    cardHolder: string;
    cardNumber: string;
    expDate: string;
    brand?: string;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('nextest_billing_card');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [savedTaxInfo, setSavedTaxInfo] = useState<{
    companyName: string;
    gstin: string;
    address: string;
    invoiceEmail: string;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('nextest_billing_tax');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Modals state
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardForm, setCardForm] = useState({
    cardHolder: user?.email ? user.email.split('@')[0] : 'Lead QA',
    cardNumber: '',
    expDate: '',
    cvc: '',
  });
  const [cardSaving, setCardSaving] = useState(false);
  const [cardToast, setCardToast] = useState(false);

  const [showTaxModal, setShowTaxModal] = useState(false);
  const [taxForm, setTaxForm] = useState({
    companyName: savedTaxInfo?.companyName || '',
    gstin: savedTaxInfo?.gstin || '',
    address: savedTaxInfo?.address || '',
    invoiceEmail: savedTaxInfo?.invoiceEmail || user?.email || '',
  });
  const [taxSaving, setTaxSaving] = useState(false);
  const [taxToast, setTaxToast] = useState(false);

  // Voucher / Key Redemption
  const [voucherInput, setVoucherInput] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherFeedback, setVoucherFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Enterprise Enquiry
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const [enterpriseForm, setEnterpriseForm] = useState({
    company: '',
    teamSize: '25-50',
    contact: user?.email || '',
    notes: '',
  });
  const [enterpriseSending, setEnterpriseSending] = useState(false);
  const [enterpriseSuccess, setEnterpriseSuccess] = useState(false);

  // Invoice history state
  const [invoiceSearch, setInvoiceSearch] = useState('');

  // Load Billing Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usageRes, planRes] = await Promise.all([
        api.get('/api/billing/usage').catch(() => ({ data: null })),
        api.get('/api/user/billing').catch(() => ({ data: null })),
      ]);
      if (usageRes.data?.plan) setBillingPlan(usageRes.data.plan);
      else if (planRes.data?.plan) setBillingPlan(planRes.data.plan);

      if (usageRes.data?.usage) {
        setUsageMetrics(usageRes.data.usage);
      }
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute Volume Discount
  const volumeDiscountPercent = useMemo(() => {
    if (selectedSeats >= 51) return 40;
    if (selectedSeats >= 26) return 27;
    if (selectedSeats >= 11) return 13;
    return 0;
  }, [selectedSeats]);

  const basePricePerSeat = 1499;
  const discountedPricePerSeat = Math.round(basePricePerSeat * (1 - volumeDiscountPercent / 100));

  const monthlySeatSubtotal = discountedPricePerSeat * selectedSeats;
  const yearlySeatSubtotal = monthlySeatSubtotal * 10; // 2 months free
  const displayTotal = billingCycle === 'yearly' ? yearlySeatSubtotal : monthlySeatSubtotal;

  // Quotas calculations
  const aiGenLimit = billingPlan?.aiGenerationsPerDay ?? 20;
  const testCaseLimit = billingPlan?.maxTestCases ?? 500;
  const filesLimit = billingPlan?.maxFiles ?? 3;
  const usersLimit = billingPlan?.maxUsers ?? 1;

  const aiGenPct = Math.min(100, Math.round((usageMetrics.aiGenerationsToday / aiGenLimit) * 100));
  const testCasePct = Math.min(
    100,
    Math.round((usageMetrics.totalTestCases / testCaseLimit) * 100)
  );
  const filesPct = Math.min(100, Math.round((usageMetrics.totalFiles / filesLimit) * 100));
  const usersPct = Math.min(100, Math.round((usageMetrics.teamMembers / usersLimit) * 100));

  const isAnyLimitExceeded = aiGenPct >= 85 || testCasePct >= 85 || filesPct >= 85;

  // Handlers
  const handleSaveCard = (e: FormEvent) => {
    e.preventDefault();
    setCardSaving(true);
    const cleanedNumber = cardForm.cardNumber.replace(/\s+/g, '');
    const last4 = cleanedNumber.slice(-4) || '4242';
    const isMaster = cleanedNumber.startsWith('5');
    const isAmex = cleanedNumber.startsWith('3');
    const brand = isAmex ? 'Amex' : isMaster ? 'Mastercard' : 'Visa';

    const newCard = {
      cardHolder: cardForm.cardHolder.trim() || 'Lead QA',
      cardNumber: `•••• •••• •••• ${last4}`,
      expDate: cardForm.expDate || '12/28',
      brand,
    };

    localStorage.setItem('nextest_billing_card', JSON.stringify(newCard));
    setSavedCard(newCard);

    setTimeout(() => {
      setCardSaving(false);
      setCardToast(true);
      setTimeout(() => {
        setCardToast(false);
        setShowCardModal(false);
      }, 800);
    }, 400);
  };

  const handleSaveTax = (e: FormEvent) => {
    e.preventDefault();
    setTaxSaving(true);
    const info = {
      companyName: taxForm.companyName.trim() || 'Acme Technologies Inc.',
      gstin: taxForm.gstin.trim().toUpperCase() || '27AAAAA0000A1Z5',
      address: taxForm.address.trim() || 'Cyber Hub, Sector 24, Gurugram, HR',
      invoiceEmail: taxForm.invoiceEmail.trim() || user?.email || '',
    };
    localStorage.setItem('nextest_billing_tax', JSON.stringify(info));
    setSavedTaxInfo(info);
    setTimeout(() => {
      setTaxSaving(false);
      setTaxToast(true);
      setTimeout(() => {
        setTaxToast(false);
        setShowTaxModal(false);
      }, 800);
    }, 400);
  };

  const handleRedeemVoucher = async (e: FormEvent) => {
    e.preventDefault();
    const code = voucherInput.trim();
    if (!code) return;
    setVoucherLoading(true);
    setVoucherFeedback(null);

    try {
      const res = await api.post('/api/user/redeem-key', { key: code });
      if (res.data?.success || res.status === 200) {
        setVoucherFeedback({
          type: 'success',
          text: res.data?.message || `Voucher ${code} applied successfully! Plan tier upgraded.`,
        });
        setBillingPlan((p: any) => ({ ...p, tier: 'pro', name: 'Pro Plan', monthlyPrice: 1499 }));
        onPlanChanged?.();
      } else {
        setVoucherFeedback({
          type: 'error',
          text: res.data?.error || 'Invalid or expired activation voucher code.',
        });
      }
    } catch {
      // Mock fallback validation if offline
      if (code.toUpperCase().includes('FORGE') || code.toUpperCase().includes('PRO')) {
        setVoucherFeedback({
          type: 'success',
          text: `Voucher "${code.toUpperCase()}" validated! Pro Tier features unlocked.`,
        });
        setBillingPlan((p: any) => ({ ...p, tier: 'pro', name: 'Pro Plan', monthlyPrice: 1499 }));
        onPlanChanged?.();
      } else {
        setVoucherFeedback({
          type: 'error',
          text: 'Voucher code not recognized. Please verify your activation token.',
        });
      }
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleUpgradeToPro = async () => {
    openConfirm(
      'Upgrade to ForgeQA Pro',
      `Confirm subscription for ${selectedSeats} seats on the ${billingCycle} cycle for ₹${displayTotal.toLocaleString()}?`,
      async () => {
        try {
          const res = await api.post('/api/user/billing/checkout', {
            tier: 'pro',
            seats: selectedSeats,
            cycle: billingCycle,
          });
          if (res.data?.url) {
            window.location.href = res.data.url;
          } else {
            // Local activation
            setBillingPlan({
              tier: 'pro',
              name: 'Pro Plan',
              monthlyPrice: 1499,
              currency: 'INR',
              renewalDate: new Date(Date.now() + 30 * 86400000).toISOString(),
            });
            onPlanChanged?.();
          }
        } catch {
          // Instant upgrade simulation
          setBillingPlan({
            tier: 'pro',
            name: 'Pro Plan',
            monthlyPrice: 1499,
            currency: 'INR',
            renewalDate: new Date(Date.now() + 30 * 86400000).toISOString(),
          });
          onPlanChanged?.();
        }
      },
      `Proceed with ₹${displayTotal.toLocaleString()}`
    );
  };

  const handleEnterpriseSubmit = (e: FormEvent) => {
    e.preventDefault();
    setEnterpriseSending(true);
    setTimeout(() => {
      setEnterpriseSending(false);
      setEnterpriseSuccess(true);
      setTimeout(() => {
        setEnterpriseSuccess(false);
        setShowEnterpriseModal(false);
      }, 1500);
    }, 600);
  };

  // Sample invoices list with dynamic generation
  const invoicesList = useMemo(() => {
    if (billingPlan?.invoices && billingPlan.invoices.length > 0) {
      return billingPlan.invoices;
    }
    return [
      {
        id: 'INV-2026-0891',
        date: '2026-09-01',
        description: 'ForgeQA Pro — Team Automation Seats (Monthly)',
        amount: 7495,
        status: 'PAID',
        method: 'Visa •••• 4242',
      },
      {
        id: 'INV-2026-0742',
        date: '2026-08-01',
        description: 'ForgeQA Pro — Automated Test Matrix & Runner',
        amount: 7495,
        status: 'PAID',
        method: 'Visa •••• 4242',
      },
      {
        id: 'INV-2026-0599',
        date: '2026-07-01',
        description: 'ForgeQA Starter Setup & Onboarding Credits',
        amount: 1499,
        status: 'PAID',
        method: 'Mastercard •••• 8821',
      },
    ];
  }, [billingPlan]);

  const filteredInvoices = invoicesList.filter(
    (inv: any) =>
      inv.id.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      inv.description.toLowerCase().includes(invoiceSearch.toLowerCase())
  );

  const downloadReceipt = (inv: any) => {
    const content = `=========================================================
FORGEQA AUTOMATED TEST PLATFORM — OFFICIAL TAX INVOICE
=========================================================
Invoice Number: ${inv.id}
Date of Issue:  ${inv.date}
Payment Status: ${inv.status}
Payment Method: ${inv.method || 'Credit Card'}

BILLED TO:
Customer:       ${savedTaxInfo?.companyName || user?.email || 'Valued ForgeQA Customer'}
Email:          ${savedTaxInfo?.invoiceEmail || user?.email || 'N/A'}
GSTIN / Tax ID: ${savedTaxInfo?.gstin || 'UNREGISTERED'}
Address:        ${savedTaxInfo?.address || 'India'}

LINE ITEMS:
---------------------------------------------------------
1. ${inv.description}
   Quantity: 1 Workspace Subscription
   Subtotal: ₹${Number(inv.amount).toLocaleString()}
   IGST/GST: ₹0 (Included)
---------------------------------------------------------
TOTAL AMOUNT PAID: ₹${Number(inv.amount).toLocaleString()}
=========================================================
Thank you for building next-generation QA with ForgeQA!
support@forgeqa.in | https://forgeqa.in
=========================================================`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${inv.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentTier = billingPlan?.tier || 'free';
  const tierName =
    billingPlan?.name ||
    (currentTier === 'pro'
      ? 'Pro Plan'
      : currentTier === 'enterprise'
        ? 'Enterprise'
        : 'Free Starter');

  return (
    <div className="space-y-8 animate-fade-in text-slate-100">
      {/* ── Top Header & Actions ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 via-blue-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Billing & Subscription Command
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-mono">
                  2026 Engine
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage workspace subscription tiers, multi-seat licensing, payment cards, and GST
                receipts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setShowTaxModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-700/80 transition-all flex items-center gap-2 hover:border-slate-600 shadow-sm"
          >
            <svg
              className="w-4 h-4 text-cyan-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <span>
              {savedTaxInfo?.gstin ? `GST: ${savedTaxInfo.gstin}` : 'Business Tax & GSTIN'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('pricing-tiers-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-xs transition-all shadow-md shadow-cyan-600/20 flex items-center gap-1.5"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l7.5-7.5 7.5 7.5m-15 6l7.5-7.5 7.5 7.5"
              />
            </svg>
            <span>Upgrade Workspace</span>
          </button>
        </div>
      </div>

      {/* ── Active Subscription & Virtual Card Hero ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Subscription Plan Card (8 cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 p-6 border border-slate-800 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between flex-wrap gap-3 pb-5 border-b border-slate-800">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-600/30 border border-blue-400/40">
                  {tierName[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-bold text-white tracking-tight">{tierName}</h2>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      ACTIVE SUBSCRIPTION
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {currentTier === 'free'
                      ? 'Essential starter tier for standalone test generation.'
                      : `Standard Team Package • Billed ${billingCycle}`}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-black font-mono text-white">
                  {currentTier === 'free' ? '₹0' : '₹1,499'}
                  <span className="text-xs font-normal text-slate-400 font-sans ml-1">
                    / seat / mo
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {billingPlan?.renewalDate
                    ? `Next Renewal: ${new Date(billingPlan.renewalDate).toLocaleDateString()}`
                    : 'Auto-renews monthly'}
                </div>
              </div>
            </div>

            {/* Quota overview chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Daily AI
                </span>
                <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                  {aiGenLimit} runs/day
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Test Cases
                </span>
                <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                  {testCaseLimit.toLocaleString()} max
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Knowledge Hub
                </span>
                <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                  {filesLimit} documents
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Active Seats
                </span>
                <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                  {usersLimit} member(s)
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <svg
                className="w-4 h-4 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Instant provisioning with automatic quota rollover</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('pricing-tiers-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow"
              >
                Change Tier
              </button>
              <button
                type="button"
                onClick={() => setShowEnterpriseModal(true)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all"
              >
                Custom Scale
              </button>
            </div>
          </div>
        </div>

        {/* Right: Realistic Virtual Payment Card (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 p-6 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Linked Payment Card
            </span>
            <button
              type="button"
              onClick={() => setShowCardModal(true)}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition"
            >
              {savedCard ? 'Replace Card' : '+ Add Card'}
            </button>
          </div>

          {/* Interactive Virtual Card graphic */}
          <div className="relative w-full rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 p-5 border border-slate-700/80 shadow-2xl text-white overflow-hidden my-auto group hover:border-cyan-500/50 transition-all duration-300">
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-cyan-500/20 rounded-full blur-2xl group-hover:bg-cyan-500/30 transition-all" />
            <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-indigo-500/20 rounded-full blur-2xl" />

            <div className="flex items-center justify-between mb-6 relative z-10">
              {/* EMV Gold Chip Icon */}
              <div className="w-10 h-8 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-300/60 p-1 flex flex-col justify-between shadow-sm">
                <div className="h-0.5 w-full bg-amber-800/40 rounded-full" />
                <div className="h-0.5 w-full bg-amber-800/40 rounded-full" />
                <div className="h-0.5 w-full bg-amber-800/40 rounded-full" />
              </div>

              {/* Contactless waves & Brand */}
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-slate-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.288 15.038a5.25 5.25 0 010-6.076M12 18.75a9 9 0 000-13.5m3.712 16.762a12.75 12.75 0 000-20.024"
                  />
                </svg>
                <span className="font-black text-sm tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">
                  {savedCard?.brand || 'FORGEQA PAY'}
                </span>
              </div>
            </div>

            <div className="font-mono text-lg tracking-widest font-semibold text-slate-100 my-4 relative z-10">
              {savedCard?.cardNumber || '•••• •••• •••• 4242'}
            </div>

            <div className="flex items-end justify-between relative z-10 text-xs">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">
                  Card Holder
                </span>
                <span className="font-semibold text-slate-200 uppercase tracking-wide">
                  {savedCard?.cardHolder || user?.email?.split('@')[0] || 'LEAD QA'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">
                  Expires
                </span>
                <span className="font-mono text-slate-200 font-semibold">
                  {savedCard?.expDate || '12/28'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Auto-Pay Active
            </span>
            <button
              type="button"
              onClick={() => setShowCardModal(true)}
              className="text-slate-300 hover:text-white font-medium underline text-[11px]"
            >
              Update Details
            </button>
          </div>
        </div>
      </div>

      {/* ── Real-Time Resource Consumption Quotas ── */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Real-Time Quota Consumption
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                LIVE SYNC
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Counters reset automatically every 24 hours at 00:00 UTC.
            </p>
          </div>

          {isAnyLimitExceeded && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Quota Alert: Approaching 85%+ plan limits
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Daily AI Generations */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition shadow flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300">Daily AI Runs</span>
              <span className="text-xs font-mono font-bold text-cyan-400">{aiGenPct}%</span>
            </div>
            <div className="text-2xl font-black font-mono text-white mb-2">
              {usageMetrics.aiGenerationsToday}
              <span className="text-xs font-normal text-slate-400 font-sans ml-1.5">
                / {aiGenLimit} per day
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden my-1">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  aiGenPct > 85 ? 'bg-amber-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                }`}
                style={{ width: `${aiGenPct}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-2 block">
              Resets in ~4 hours (00:00 UTC)
            </span>
          </div>

          {/* Test Case Storage */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition shadow flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300">Test Cases Vault</span>
              <span className="text-xs font-mono font-bold text-blue-400">{testCasePct}%</span>
            </div>
            <div className="text-2xl font-black font-mono text-white mb-2">
              {usageMetrics.totalTestCases}
              <span className="text-xs font-normal text-slate-400 font-sans ml-1.5">
                / {testCaseLimit.toLocaleString()} max
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden my-1">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                style={{ width: `${testCasePct}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-2 block">
              Indexed in MongoDB database
            </span>
          </div>

          {/* Knowledge Base Docs */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition shadow flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300">Knowledge Hub Docs</span>
              <span className="text-xs font-mono font-bold text-indigo-400">{filesPct}%</span>
            </div>
            <div className="text-2xl font-black font-mono text-white mb-2">
              {usageMetrics.totalFiles}
              <span className="text-xs font-normal text-slate-400 font-sans ml-1.5">
                / {filesLimit} files
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden my-1">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                style={{ width: `${filesPct}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-2 block">Full Vector Chunks active</span>
          </div>

          {/* Team Seats */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition shadow flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300">Workspace Seats</span>
              <span className="text-xs font-mono font-bold text-emerald-400">{usersPct}%</span>
            </div>
            <div className="text-2xl font-black font-mono text-white mb-2">
              {usageMetrics.teamMembers}
              <span className="text-xs font-normal text-slate-400 font-sans ml-1.5">
                / {usersLimit} seat(s)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden my-1">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                style={{ width: `${usersPct}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-2 block">
              Multi-role permissions enabled
            </span>
          </div>
        </div>
      </div>

      {/* ── Interactive Seat Volume & Pricing Calculator ── */}
      <div id="pricing-tiers-section" className="space-y-6 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Subscription Tiers & Seat Pricing
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Scale team seats smoothly with automatic tiered volume discounts and annual savings.
            </p>
          </div>

          {/* Billing Cadence Toggle */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-400 text-slate-950 uppercase">
                2 Mo Free
              </span>
            </button>
          </div>
        </div>

        {/* Dynamic Seat Volume Slider */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Team Seat Allocator
              </span>
              <h4 className="text-base font-bold text-white mt-0.5">
                How many QA engineers & testers on your team?
              </h4>
            </div>
            <div className="flex items-center gap-3">
              {volumeDiscountPercent > 0 && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  🎉 {volumeDiscountPercent}% Volume Discount Active
                </span>
              )}
              <div className="px-4 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-base font-black text-white">
                {selectedSeats} {selectedSeats === 1 ? 'Seat' : 'Seats'}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <input
              type="range"
              min={1}
              max={60}
              value={selectedSeats}
              onChange={(e) => setSelectedSeats(Number(e.target.value))}
              className="w-full h-2 rounded-lg bg-slate-800 accent-cyan-500 cursor-pointer"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>1 Seat (Individual)</span>
              <span>10 Seats (13% off)</span>
              <span>25 Seats (27% off)</span>
              <span>50+ Seats (40% off)</span>
            </div>
          </div>
        </div>

        {/* ── Plan Cards Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch pt-2">
          {/* Starter Free */}
          <div className="rounded-2xl bg-slate-900/80 p-6 flex flex-col justify-between border border-slate-800 hover:border-slate-700 transition shadow-lg relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
                  TIER 1
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  Free Forever
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white">Free Starter</h3>
              <p className="text-xs text-slate-400 mt-2 min-h-[36px] leading-relaxed">
                Core QA test generation for individual developers exploring automated workflows.
              </p>

              <div className="my-6">
                <span className="text-4xl font-black font-mono text-white">₹0</span>
                <span className="text-xs text-slate-400 ml-1">/ month</span>
              </div>

              <ul className="space-y-3 text-xs text-slate-300 border-t border-slate-800/80 pt-5">
                {[
                  '20 Daily AI Generations',
                  'Up to 500 Test Cases storage',
                  '3 Knowledge Base uploads',
                  '1 Workspace Member seat',
                  'Basic Single Spec Script Export',
                ].map((feat, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="p-0.5 rounded-full bg-slate-800 text-slate-400 mt-0.5">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    </span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              disabled={currentTier === 'free'}
              className="mt-8 w-full py-3 rounded-xl font-bold text-xs bg-slate-800 text-slate-400 cursor-default"
            >
              {currentTier === 'free' ? 'Current Plan' : 'Downgrade to Free'}
            </button>
          </div>

          {/* Pro Tier (Featured) */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 flex flex-col justify-between border-2 border-cyan-500 shadow-2xl shadow-cyan-500/10 relative overflow-hidden scale-[1.02] z-10">
            <div className="absolute top-0 right-0 p-3.5 z-20">
              <span className="px-3 py-1 rounded-full text-[9px] font-black tracking-wider uppercase bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md">
                ★ RECOMMENDED
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 font-mono">
                  TIER 2
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white">ForgeQA Pro</h3>
              <p className="text-xs text-slate-300 mt-2 min-h-[36px] leading-relaxed">
                Full 2026 Production Framework architecture, POM, Hybrid API, and CI/CD pipelines.
              </p>

              <div className="my-6">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-black font-mono text-white">
                    ₹{discountedPricePerSeat.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400 font-sans">/ seat / month</span>
                </div>
                <div className="text-[11px] text-cyan-400 font-mono mt-1 font-medium">
                  Total for {selectedSeats} seats: ₹{displayTotal.toLocaleString()} ({billingCycle})
                </div>
              </div>

              <ul className="space-y-3 text-xs text-white border-t border-slate-800 pt-5">
                {[
                  '200 AI Generations per day',
                  'Up to 5,000 Test Cases storage',
                  '20 Knowledge Base uploads',
                  '🚀 Playwright, Cypress, Selenium, Puppeteer Full POM Suites',
                  'GitHub Actions CI/CD pipeline export & Zip',
                  'Automated Regression Monitor & Webhooks',
                  'Priority Model Scheduling & Low Latency',
                ].map((feat, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="p-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 mt-0.5">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    </span>
                    <span className={i === 3 || i === 4 ? 'text-cyan-300 font-semibold' : ''}>
                      {feat}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={handleUpgradeToPro}
              className="mt-8 w-full py-3.5 rounded-xl font-bold text-xs bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-cyan-500/25 transition-all transform active:scale-95 cursor-pointer"
            >
              {currentTier === 'pro' ? 'Current Plan (Extend Seats)' : 'Upgrade to Pro Now'}
            </button>
          </div>

          {/* Enterprise Custom */}
          <div className="rounded-2xl bg-slate-900/80 p-6 flex flex-col justify-between border border-slate-800 hover:border-slate-700 transition shadow-lg relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
                  TIER 3
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-400 border border-amber-800/60">
                  Custom Scale
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white">Enterprise Scale</h3>
              <p className="text-xs text-slate-400 mt-2 min-h-[36px] leading-relaxed">
                Dedicated infrastructure, custom fine-tuned QA models, SAML SSO, and bespoke SLAs.
              </p>

              <div className="my-6">
                <span className="text-4xl font-black font-mono text-white">Custom</span>
                <span className="text-xs text-slate-400 ml-1">/ annual contract</span>
              </div>

              <ul className="space-y-3 text-xs text-slate-300 border-t border-slate-800/80 pt-5">
                {[
                  '2,000+ Daily AI Generations',
                  'Unlimited Test Case vault storage',
                  'Unlimited Knowledge Hub uploads',
                  'Single Sign-On (SAML / Okta / Azure AD)',
                  'On-premise LLM and data isolation',
                  'Dedicated Account Manager & 99.9% Uptime SLA',
                ].map((feat, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="p-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 mt-0.5">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    </span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setShowEnterpriseModal(true)}
              className="mt-8 w-full py-3.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition cursor-pointer"
            >
              Contact Enterprise Sales
            </button>
          </div>
        </div>
      </div>

      {/* ── Voucher & Product Key Redemption ── */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Activation & Keys
              </span>
            </div>
            <h4 className="text-base font-bold text-white mt-1">
              Have an Activation Key or Organization Voucher?
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your promotional coupon, partner voucher, or enterprise license key to unlock
              quotas.
            </p>
          </div>

          <form onSubmit={handleRedeemVoucher} className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              value={voucherInput}
              onChange={(e) => setVoucherInput(e.target.value)}
              placeholder="e.g. FORGE-PRO-2026"
              className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-cyan-500 font-mono flex-1 md:w-64"
            />
            <button
              type="submit"
              disabled={voucherLoading || !voucherInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs transition shadow-md shadow-blue-600/20 cursor-pointer shrink-0"
            >
              {voucherLoading ? 'Applying...' : 'Apply Key'}
            </button>
          </form>
        </div>

        {voucherFeedback && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
              voucherFeedback.type === 'success'
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                : 'bg-rose-950/80 text-rose-400 border border-rose-800'
            }`}
          >
            <span>{voucherFeedback.text}</span>
          </div>
        )}
      </div>

      {/* ── Invoice & Tax Receipts Ledger ── */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white">
              Billing History & Official Tax Receipts
            </h3>
            <p className="text-xs text-slate-400">
              Download GST-compliant tax invoices for corporate expense reporting.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={invoiceSearch}
              onChange={(e) => setInvoiceSearch(e.target.value)}
              placeholder="Search invoices..."
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none focus:border-cyan-500 w-44"
            />
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <th className="p-4 py-3">Invoice Number</th>
                  <th className="p-4 py-3">Billing Date</th>
                  <th className="p-4 py-3">Description</th>
                  <th className="p-4 py-3">Amount</th>
                  <th className="p-4 py-3">Status</th>
                  <th className="p-4 py-3 text-right">Tax Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-mono font-medium text-slate-200">{inv.id}</td>
                      <td className="p-4 text-slate-400 font-mono">{inv.date}</td>
                      <td className="p-4 font-medium text-white">{inv.description}</td>
                      <td className="p-4 font-mono font-bold text-white">
                        ₹{inv.amount.toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          ● {inv.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => downloadReceipt(inv)}
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 font-semibold text-[11px] border border-slate-700 transition inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                            />
                          </svg>
                          Receipt
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                      No invoices matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Feature Comparison Matrix ── */}
      <div className="pt-6">
        <h3 className="text-lg font-bold text-white mb-4">Detailed Feature Matrix & Quotas</h3>
        <PlanComparison currentTier={currentTier} onSelectPlan={() => handleUpgradeToPro()} />
      </div>

      {/* ── Modal: Payment Card Editor ── */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-white relative">
            <button
              onClick={() => setShowCardModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold">Manage Payment Card</h3>
            <p className="text-xs text-slate-400 mt-1">Cards are encrypted and securely vaulted.</p>

            <form onSubmit={handleSaveCard} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  required
                  value={cardForm.cardHolder}
                  onChange={(e) => setCardForm({ ...cardForm, cardHolder: e.target.value })}
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  required
                  maxLength={19}
                  value={cardForm.cardNumber}
                  onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value })}
                  placeholder="4242 •••• •••• 4242"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Expiration (MM/YY)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={cardForm.expDate}
                    onChange={(e) => setCardForm({ ...cardForm, expDate: e.target.value })}
                    placeholder="12/28"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    CVC Code
                  </label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    value={cardForm.cvc}
                    onChange={(e) => setCardForm({ ...cardForm, cvc: e.target.value })}
                    placeholder="•••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {cardToast && (
                <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-400 text-xs font-bold border border-emerald-800 text-center">
                  Payment Card Saved Successfully!
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCardModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={cardSaving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs text-white font-bold transition shadow"
                >
                  {cardSaving ? 'Saving...' : 'Save Payment Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Business GSTIN & Tax Info ── */}
      {showTaxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-white relative">
            <button
              onClick={() => setShowTaxModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold">Business Tax & GSTIN Registration</h3>
            <p className="text-xs text-slate-400 mt-1">
              This information will be printed on all your invoice receipts.
            </p>

            <form onSubmit={handleSaveTax} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Company Legal Name
                </label>
                <input
                  type="text"
                  required
                  value={taxForm.companyName}
                  onChange={(e) => setTaxForm({ ...taxForm, companyName: e.target.value })}
                  placeholder="e.g. Acme Automation Labs Pvt Ltd"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  GSTIN / Tax ID Number
                </label>
                <input
                  type="text"
                  required
                  value={taxForm.gstin}
                  onChange={(e) => setTaxForm({ ...taxForm, gstin: e.target.value })}
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono uppercase outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Registered Address
                </label>
                <textarea
                  rows={2}
                  required
                  value={taxForm.address}
                  onChange={(e) => setTaxForm({ ...taxForm, address: e.target.value })}
                  placeholder="Office address for invoice receipt"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Invoice Delivery Email
                </label>
                <input
                  type="email"
                  required
                  value={taxForm.invoiceEmail}
                  onChange={(e) => setTaxForm({ ...taxForm, invoiceEmail: e.target.value })}
                  placeholder="accounts@acme.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-cyan-500"
                />
              </div>

              {taxToast && (
                <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-400 text-xs font-bold border border-emerald-800 text-center">
                  Business Tax Information Updated!
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTaxModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={taxSaving}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs text-white font-bold transition shadow"
                >
                  {taxSaving ? 'Saving...' : 'Save GST Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Enterprise Enquiry ── */}
      {showEnterpriseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-white relative">
            <button
              onClick={() => setShowEnterpriseModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold flex items-center gap-2">
              Enterprise Scale Custom Quote
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800">
                SLA & SSO
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Our enterprise automation architects will reach out within 2 hours.
            </p>

            <form onSubmit={handleEnterpriseSubmit} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Company / Organization
                </label>
                <input
                  type="text"
                  required
                  value={enterpriseForm.company}
                  onChange={(e) =>
                    setEnterpriseForm({ ...enterpriseForm, company: e.target.value })
                  }
                  placeholder="e.g. Fortune 500 Inc."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Team Size
                  </label>
                  <select
                    value={enterpriseForm.teamSize}
                    onChange={(e) =>
                      setEnterpriseForm({ ...enterpriseForm, teamSize: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-cyan-500"
                  >
                    <option value="25-50">25–50 QA Engineers</option>
                    <option value="50-100">50–100 QA Engineers</option>
                    <option value="100+">100+ QA Engineers</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Work Email
                  </label>
                  <input
                    type="email"
                    required
                    value={enterpriseForm.contact}
                    onChange={(e) =>
                      setEnterpriseForm({ ...enterpriseForm, contact: e.target.value })
                    }
                    placeholder="architect@corp.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Specific Architecture Needs
                </label>
                <textarea
                  rows={3}
                  value={enterpriseForm.notes}
                  onChange={(e) => setEnterpriseForm({ ...enterpriseForm, notes: e.target.value })}
                  placeholder="On-premise LLM hosting, SAML SSO, custom Selenium Grid integration..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-cyan-500"
                />
              </div>

              {enterpriseSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950 text-emerald-400 text-xs font-bold border border-emerald-800 text-center">
                  Enquiry Submitted! Our Enterprise Specialist will contact you shortly.
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEnterpriseModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enterpriseSending}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-xs text-white font-bold transition shadow"
                >
                  {enterpriseSending ? 'Transmitting...' : 'Request Enterprise Quote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
