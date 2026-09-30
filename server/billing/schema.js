import { getDb } from '../db.js';

/**
 * Default starter plans catalog with amounts in smallest currency unit (paise for INR).
 * 1 INR = 100 paise. (e.g. ₹1,499 = 149,900 paise).
 */
export const SEED_PLANS = [
  {
    id: 'plan_free_monthly',
    code: 'free',
    name: 'Free Starter',
    interval: 'month',
    price_amount: 0,
    currency: 'INR',
    provider_price_id: null,
    is_active: true,
    limits: {
      ai_runs_per_month: 100,
      ai_runs_per_day: 20,
      test_cases: 500,
      knowledge_docs: 5,
      seats: 1,
      projects: 3,
    },
    features: [
      '100 Monthly AI Runs (20/day)',
      'Up to 500 Test Cases storage',
      '5 Knowledge Hub documents',
      '1 Workspace Member seat',
      'Single Spec Code Export',
    ],
    flags: {
      automationFrameworks: false,
      regressionSuites: false,
      cicdWebhooks: false,
      ssoSaml: false,
      auditLogs: false,
      prioritySupport: false,
    },
  },
  {
    id: 'plan_pro_monthly',
    code: 'pro',
    name: 'ForgeQA Pro',
    interval: 'month',
    price_amount: 149900, // ₹1,499.00
    currency: 'INR',
    provider_price_id: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly',
    is_active: true,
    limits: {
      ai_runs_per_month: 2500,
      ai_runs_per_day: 200,
      test_cases: 5000,
      knowledge_docs: 20,
      seats: 10,
      projects: 20,
    },
    features: [
      '2,500 Monthly AI Runs (200/day)',
      'Up to 5,000 Test Cases storage',
      '20 Knowledge Hub documents',
      'Up to 10 Team Seats',
      'Full Multi-Framework Export (Playwright, Cypress, Selenium, Robot)',
      'Automated Regression Suites & Webhooks',
      'Priority Email Support',
    ],
    flags: {
      automationFrameworks: true,
      regressionSuites: true,
      cicdWebhooks: true,
      ssoSaml: false,
      auditLogs: true,
      prioritySupport: true,
    },
  },
  {
    id: 'plan_pro_yearly',
    code: 'pro',
    name: 'ForgeQA Pro (Annual)',
    interval: 'year',
    price_amount: 1499000, // ₹14,990.00 (2 months free)
    currency: 'INR',
    provider_price_id: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly',
    is_active: true,
    limits: {
      ai_runs_per_month: 2500,
      ai_runs_per_day: 200,
      test_cases: 5000,
      knowledge_docs: 20,
      seats: 10,
      projects: 20,
    },
    features: [
      'All ForgeQA Pro features',
      '2 Months Free with Annual Billing',
      'Dedicated Slack/Teams channel support',
    ],
    flags: {
      automationFrameworks: true,
      regressionSuites: true,
      cicdWebhooks: true,
      ssoSaml: false,
      auditLogs: true,
      prioritySupport: true,
    },
  },
  {
    id: 'plan_team_monthly',
    code: 'team',
    name: 'ForgeQA Team Scale',
    interval: 'month',
    price_amount: 499900, // ₹4,999.00
    currency: 'INR',
    provider_price_id: process.env.STRIPE_TEAM_MONTHLY_PRICE_ID || 'price_team_monthly',
    is_active: true,
    limits: {
      ai_runs_per_month: 10000,
      ai_runs_per_day: 1000,
      test_cases: 25000,
      knowledge_docs: 50,
      seats: 25,
      projects: 100,
    },
    features: [
      '10,000 Monthly AI Runs (1,000/day)',
      'Up to 25,000 Test Cases storage',
      '50 Knowledge Hub documents',
      'Up to 25 Team Seats included',
      'CI/CD Pipeline Runners & Jenkins Webhooks',
      'Audit Logging & Governance',
    ],
    flags: {
      automationFrameworks: true,
      regressionSuites: true,
      cicdWebhooks: true,
      ssoSaml: false,
      auditLogs: true,
      prioritySupport: true,
    },
  },
  {
    id: 'plan_enterprise_yearly',
    code: 'enterprise',
    name: 'Enterprise Scale',
    interval: 'year',
    price_amount: 14990000, // ₹149,900.00
    currency: 'INR',
    provider_price_id: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
    is_active: true,
    limits: {
      ai_runs_per_month: 100000,
      ai_runs_per_day: 5000,
      test_cases: 100000,
      knowledge_docs: 999,
      seats: 100,
      projects: 999,
    },
    features: [
      'Custom LLM Fine-Tuning & Private VPC',
      'Unlimited Test Cases & 100,000+ AI Runs',
      'Okta / Azure AD / SAML Single Sign-On',
      'SOC2 Type II Compliance & Audit Logs',
      'Dedicated Account Manager & 99.9% SLA',
    ],
    flags: {
      automationFrameworks: true,
      regressionSuites: true,
      cicdWebhooks: true,
      ssoSaml: true,
      auditLogs: true,
      prioritySupport: true,
    },
  },
];

/**
 * Ensures MongoDB indexes for the billing collections:
 * plans, customers, subscriptions, invoices, usage_events, usage_balances, webhook_events
 */
export async function ensureBillingIndexes(targetDb) {
  const indexPromises = [
    // plans
    targetDb.collection('plans').createIndex({ code: 1, interval: 1 }, { unique: true }),
    targetDb.collection('plans').createIndex({ id: 1 }, { unique: true, sparse: true }),
    targetDb.collection('plans').createIndex({ is_active: 1 }),

    // customers
    targetDb.collection('customers').createIndex({ owner_id: 1, provider: 1 }, { unique: true }),
    targetDb.collection('customers').createIndex({ provider_customer_id: 1 }),

    // subscriptions
    targetDb.collection('subscriptions').createIndex({ owner_id: 1 }, { unique: true }),
    targetDb
      .collection('subscriptions')
      .createIndex({ provider_subscription_id: 1 }, { sparse: true }),
    targetDb.collection('subscriptions').createIndex({ status: 1 }),

    // invoices
    targetDb.collection('invoices').createIndex({ owner_id: 1, created_at: -1 }),
    targetDb
      .collection('invoices')
      .createIndex({ provider_invoice_id: 1 }, { unique: true, sparse: true }),

    // usage_events (append-only metering log with idempotency)
    targetDb
      .collection('usage_events')
      .createIndex({ idempotency_key: 1 }, { unique: true, sparse: true }),
    targetDb.collection('usage_events').createIndex({ owner_id: 1, metric: 1, created_at: -1 }),

    // usage_balances (fast counters per period)
    targetDb
      .collection('usage_balances')
      .createIndex({ owner_id: 1, metric: 1, period_start: 1 }, { unique: true }),

    // webhook_events (dedup and audit)
    targetDb
      .collection('webhook_events')
      .createIndex({ provider: 1, event_id: 1 }, { unique: true }),
  ];

  await Promise.allSettled(indexPromises);
}

/**
 * Seeds or updates active plans catalog in MongoDB.
 */
export async function seedBillingPlans() {
  const db = getDb();
  for (const plan of SEED_PLANS) {
    await db
      .collection('plans')
      .updateOne({ code: plan.code, interval: plan.interval }, { $set: plan }, { upsert: true });
  }
}
