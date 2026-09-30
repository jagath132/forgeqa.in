import { getDb } from '../db.js';
import { SEED_PLANS } from './schema.js';

const GRACE_PERIOD_MS =
  parseInt(process.env.BILLING_GRACE_PERIOD_DAYS || '7', 10) * 24 * 60 * 60 * 1000;

function getCurrentPeriodStart() {
  const now = new Date();
  // Current calendar month starting timestamp
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

/**
 * Resolves the active subscription and plan for a given billing owner.
 * If past_due and beyond grace period, falls back to free plan.
 * @param {string} ownerId
 */
export async function getOwnerSubscriptionAndPlan(ownerId) {
  const db = getDb();
  const sub = await db.collection('subscriptions').findOne({ owner_id: String(ownerId) });

  let planCode = sub?.plan_code || 'free';
  let status = sub?.status || 'active';

  // Handle past_due grace period
  if (status === 'past_due' && sub?.updated_at) {
    const elapsed = Date.now() - new Date(sub.updated_at).getTime();
    if (elapsed > GRACE_PERIOD_MS) {
      planCode = 'free'; // Grace period exceeded -> fall back to Free limits
    }
  } else if (['canceled', 'unpaid', 'incomplete'].includes(status)) {
    planCode = 'free';
  }

  // Fetch plan definition from DB, fallback to SEED_PLANS
  let plan = await db.collection('plans').findOne({ code: planCode });
  if (!plan) {
    plan = SEED_PLANS.find((p) => p.code === planCode) || SEED_PLANS[0];
  }

  return { subscription: sub, plan, isGracePeriod: status === 'past_due' && planCode !== 'free' };
}

/**
 * Checks if a billing owner has access to a specific boolean feature.
 * @param {string} ownerId
 * @param {string} featureName
 * @returns {Promise<boolean>}
 */
export async function can(ownerId, featureName) {
  if (!ownerId) return false;
  const { plan } = await getOwnerSubscriptionAndPlan(ownerId);
  return Boolean(plan.flags?.[featureName]);
}

/**
 * Returns remaining quota for a metric in the current billing period.
 * @param {string} ownerId
 * @param {string} metricName
 * @returns {Promise<number>}
 */
export async function remaining(ownerId, metricName) {
  if (!ownerId) return 0;
  const db = getDb();
  const { plan } = await getOwnerSubscriptionAndPlan(ownerId);
  const periodStart = getCurrentPeriodStart();

  const limitKey = metricName.includes('per_month') ? metricName : `${metricName}_per_month`;
  const limit = plan.limits?.[limitKey] ?? plan.limits?.[metricName] ?? 100;

  const balance = await db.collection('usage_balances').findOne({
    owner_id: String(ownerId),
    metric: metricName,
    period_start: periodStart,
  });

  const used = balance?.used || 0;
  return Math.max(0, limit - used);
}

/**
 * Atomically consumes quota for a metric with idempotency key protection.
 * @param {string} ownerId
 * @param {string} metricName
 * @param {number} quantity
 * @param {string|null} idempotencyKey
 * @returns {Promise<{ ok: boolean, remaining: number, limit: number, current: number, deduplicated?: boolean }>}
 */
export async function consume(ownerId, metricName, quantity = 1, idempotencyKey = null) {
  if (!ownerId) {
    return { ok: false, remaining: 0, limit: 0, current: 0, error: 'Owner ID required' };
  }

  const db = getDb();
  const periodStart = getCurrentPeriodStart();

  // 1. Idempotency Check: if already processed for this idempotencyKey, return success without double charging
  if (idempotencyKey) {
    const existingEvent = await db.collection('usage_events').findOne({
      idempotency_key: String(idempotencyKey),
    });
    if (existingEvent) {
      const rem = await remaining(ownerId, metricName);
      return { ok: true, remaining: rem, limit: 0, current: 0, deduplicated: true };
    }
  }

  const { plan } = await getOwnerSubscriptionAndPlan(ownerId);
  const limitKey = metricName.includes('per_month') ? metricName : `${metricName}_per_month`;
  const limit = plan.limits?.[limitKey] ?? plan.limits?.[metricName] ?? 100;

  // 2. Fetch current balance
  const currentBalance = await db.collection('usage_balances').findOne({
    owner_id: String(ownerId),
    metric: metricName,
    period_start: periodStart,
  });

  const currentUsed = currentBalance?.used || 0;

  // 3. Check if within limit
  if (currentUsed + quantity > limit) {
    return {
      ok: false,
      remaining: Math.max(0, limit - currentUsed),
      limit,
      current: currentUsed,
    };
  }

  // 4. Atomically increment usage
  const updatedBalance = await db.collection('usage_balances').findOneAndUpdate(
    {
      owner_id: String(ownerId),
      metric: metricName,
      period_start: periodStart,
    },
    {
      $inc: { used: quantity },
      $setOnInsert: { limit, createdAt: new Date().toISOString() },
      $set: { updatedAt: new Date().toISOString() },
    },
    { upsert: true, returnDocument: 'after' }
  );

  const newUsed = updatedBalance?.value?.used || updatedBalance?.used || currentUsed + quantity;

  // 5. Append-only usage event record with idempotency
  if (idempotencyKey) {
    await db.collection('usage_events').insertOne({
      owner_id: String(ownerId),
      metric: metricName,
      quantity,
      idempotency_key: String(idempotencyKey),
      created_at: new Date().toISOString(),
    });
  }

  return {
    ok: true,
    remaining: Math.max(0, limit - newUsed),
    limit,
    current: newUsed,
  };
}
