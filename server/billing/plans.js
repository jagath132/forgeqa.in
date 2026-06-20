import { getDb } from "../db.js";

export const PLANS = {
  free: {
    tier: "free",
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxUsers: 1,
    maxProjects: 3,
    maxTestCases: 500,
    aiGenerationsPerDay: 20,
    features: ["Basic test generation", "Manual test creation", "CSV export"],
    stripePriceId: null,
  },
  pro: {
    tier: "pro",
    name: "Pro",
    monthlyPrice: 29,
    yearlyPrice: 290,
    maxUsers: 5,
    maxProjects: 20,
    maxTestCases: 5000,
    aiGenerationsPerDay: 200,
    features: ["Advanced AI generation", "Automation scripts", "Regression testing", "API access", "Priority support"],
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || null,
  },
  enterprise: {
    tier: "enterprise",
    name: "Enterprise",
    monthlyPrice: 99,
    yearlyPrice: 990,
    maxUsers: 999,
    maxProjects: 999,
    maxTestCases: 50000,
    aiGenerationsPerDay: 2000,
    features: ["Everything in Pro", "Custom integrations", "SSO/SAML", "Audit logs", "Dedicated support", "SLA guarantee"],
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || null,
  },
};

export async function seedPlans() {
  const db = getDb();
  for (const plan of Object.values(PLANS)) {
    await db.collection("subscription_plans").updateOne(
      { tier: plan.tier },
      { $set: plan },
      { upsert: true }
    );
  }
}

export async function getUserPlan(userId) {
  const db = getDb();
  const user = await db.collection("users").findOne(
    { _id: new (await import("mongodb")).ObjectId(userId) },
    { projection: { subscriptionTier: 1, subscriptionStatus: 1, subscriptionEndsAt: 1 } }
  );
  if (!user) return { ...PLANS.free, subscriptionStatus: "inactive" };
  const tier = user.subscriptionTier || "free";
  const plan = PLANS[tier] || PLANS.free;
  return {
    ...plan,
    subscriptionStatus: user.subscriptionStatus || "active",
    subscriptionEndsAt: user.subscriptionEndsAt || null,
  };
}

export async function checkBillingLimit(userId, _action) {
  const plan = await getUserPlan(userId);
  if (plan.subscriptionStatus === "past_due" || plan.subscriptionStatus === "canceled") {
    return { allowed: false, reason: "Subscription is " + plan.subscriptionStatus };
  }
  return { allowed: true };
}

export async function updateSubscription(userId, tier, status, endsAt = null) {
  const db = getDb();
  const { ObjectId } = await import("mongodb");
  await db.collection("users").updateOne(
    { _id: new ObjectId(userId) },
    { $set: { subscriptionTier: tier, subscriptionStatus: status, subscriptionEndsAt: endsAt } }
  );
}
