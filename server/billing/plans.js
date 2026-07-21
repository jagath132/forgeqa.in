import { getDb } from '../db.js';

export const VOLUME_TIERS = [
  { minSeats: 1, maxSeats: 10, pricePerSeat: 1499, discountPercent: 0 },
  { minSeats: 11, maxSeats: 25, pricePerSeat: 1299, discountPercent: 13 },
  { minSeats: 26, maxSeats: 50, pricePerSeat: 1099, discountPercent: 27 },
  { minSeats: 51, maxSeats: 100, pricePerSeat: 899, discountPercent: 40 },
  { minSeats: 101, maxSeats: 99999, pricePerSeat: 699, discountPercent: 53 },
];

export const PLANS = {
  free: {
    tier: 'free',
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    pricePerSeat: 0,
    currency: 'INR',
    maxUsers: 1,
    maxProjects: 3,
    maxTestCases: 500,
    maxFiles: 3,
    aiGenerationsPerDay: 20,
    features: [
      'Basic test case generation',
      'Up to 500 test cases',
      '20 AI generations / day',
      '3 Knowledge base uploads',
      '1 Workspace member',
      'CSV export',
    ],
    flags: {
      regressionTesting: false,
      cicdWebhooks: false,
      ssoSaml: false,
      customIntegrations: false,
      auditLogs: false,
      prioritySupport: false,
    },
    stripePriceId: null,
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    monthlyPrice: 1499,
    yearlyPrice: 14990,
    pricePerSeat: 1499,
    currency: 'INR',
    maxUsers: 10,
    maxProjects: 20,
    maxTestCases: 5000,
    maxFiles: 20,
    aiGenerationsPerDay: 200,
    features: [
      'Advanced AI generation',
      'Up to 5,000 test cases',
      '200 AI generations / day',
      '20 Knowledge base uploads',
      'Up to 10 Workspace members',
      'Automation script generator (Playwright, Cypress, Selenium)',
      'Regression testing suites',
      'CI/CD Webhooks & Jenkins integration',
      'Audit logs',
      'Priority email support',
    ],
    flags: {
      regressionTesting: true,
      cicdWebhooks: true,
      ssoSaml: false,
      customIntegrations: false,
      auditLogs: true,
      prioritySupport: true,
    },
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || null,
  },
  enterprise: {
    tier: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 1499, // Base price per seat per month
    yearlyPrice: 14990,
    pricePerSeat: 1499,
    currency: 'INR',
    maxUsers: 999,
    maxProjects: 999,
    maxTestCases: 50000,
    maxFiles: 999,
    aiGenerationsPerDay: 2000,
    volumeTiers: VOLUME_TIERS,
    features: [
      'Everything in Pro',
      'Per-seat volume pricing (up to 53% off)',
      'Up to 50,000 test cases',
      '2,000 AI generations / day',
      'Unlimited Knowledge base uploads',
      'Up to 999 Workspace members',
      'SSO / SAML authentication',
      'Custom integrations',
      'Dedicated account manager & SLA guarantee',
      'On-premise deployment options',
    ],
    flags: {
      regressionTesting: true,
      cicdWebhooks: true,
      ssoSaml: true,
      customIntegrations: true,
      auditLogs: true,
      prioritySupport: true,
    },
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || null,
  },
};

export async function seedPlans() {
  const db = getDb();
  for (const plan of Object.values(PLANS)) {
    await db
      .collection('subscription_plans')
      .updateOne({ tier: plan.tier }, { $set: plan }, { upsert: true });
  }
}

export async function getUserPlan(userId) {
  const db = getDb();
  const user = await db
    .collection('users')
    .findOne(
      { _id: new (await import('mongodb')).ObjectId(userId) },
      { projection: { subscriptionTier: 1, subscriptionStatus: 1, subscriptionEndsAt: 1 } }
    );
  if (!user) return { ...PLANS.free, subscriptionStatus: 'inactive' };
  const tier = user.subscriptionTier || 'free';
  const plan = PLANS[tier] || PLANS.free;
  return {
    ...plan,
    subscriptionStatus: user.subscriptionStatus || 'active',
    subscriptionEndsAt: user.subscriptionEndsAt || null,
  };
}

export async function checkBillingLimit(userId, _action) {
  const plan = await getUserPlan(userId);
  if (plan.subscriptionStatus === 'past_due' || plan.subscriptionStatus === 'canceled') {
    return { allowed: false, reason: 'Subscription is ' + plan.subscriptionStatus };
  }
  return { allowed: true };
}

export async function updateSubscription(userId, tier, status, endsAt = null) {
  const db = getDb();
  const { ObjectId } = await import('mongodb');
  await db
    .collection('users')
    .updateOne(
      { _id: new ObjectId(userId) },
      { $set: { subscriptionTier: tier, subscriptionStatus: status, subscriptionEndsAt: endsAt } }
    );
}
