import { getDb } from '../db.js';
import { getBillingProvider } from './providers/index.js';
import { SEED_PLANS } from './schema.js';
import { getOwnerSubscriptionAndPlan, remaining } from './entitlements.js';

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

async function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    const MAX_SIZE = 1024 * 100;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_SIZE) {
        req.destroy(new Error('Request body too large'));
        return;
      }
      body += chunk;
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

/**
 * Handles all /api/billing/* routes.
 *
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {URL} url
 * @param {object|null} user - Authenticated user (if route is authenticated)
 * @returns {Promise<boolean>} true if handled, false otherwise
 */
export async function handleBillingRoute(req, res, url, user) {
  const method = req.method;
  const pathname = url.pathname;

  // 1. GET /api/billing/plans (Public catalog)
  if (pathname === '/api/billing/plans' && method === 'GET') {
    const db = getDb();
    let plans = await db.collection('plans').find({ is_active: true }).toArray();
    if (!plans || plans.length === 0) {
      plans = SEED_PLANS;
    }
    sendJson(res, 200, { plans });
    return true;
  }

  // 2. POST /api/billing/webhook (Public, signature-verified)
  if (pathname === '/api/billing/webhook' && method === 'POST') {
    const { handleBillingWebhook } = await import('./webhooks.js');
    await handleBillingWebhook(req, res);
    return true;
  }

  // All remaining routes require authenticated user
  if (!user) {
    sendJson(res, 401, { error: 'Authentication required for billing access.' });
    return true;
  }

  // Resolve billing owner strictly from authenticated user/workspace
  const ownerId = String(user.workspaceId || user.id || user._id);
  const db = getDb();
  const provider = getBillingProvider();

  // 3. GET /api/billing/subscription (Current subscription & plan)
  if (pathname === '/api/billing/subscription' && method === 'GET') {
    const { subscription, plan, isGracePeriod } = await getOwnerSubscriptionAndPlan(ownerId);
    sendJson(res, 200, {
      subscription: subscription || {
        owner_id: ownerId,
        plan_code: 'free',
        status: 'active',
        cancel_at_period_end: false,
      },
      plan,
      isGracePeriod,
    });
    return true;
  }

  // 4. GET /api/billing/usage (Current period usage vs limits)
  if (pathname === '/api/billing/usage' && method === 'GET') {
    const { plan, subscription } = await getOwnerSubscriptionAndPlan(ownerId);
    const now = new Date();
    const periodStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
    ).toISOString();

    const balances = await db
      .collection('usage_balances')
      .find({ owner_id: ownerId, period_start: periodStart })
      .toArray();

    const metricsUsage = {};
    for (const b of balances) {
      metricsUsage[b.metric] = {
        used: b.used,
        limit: b.limit,
        remaining: Math.max(0, b.limit - b.used),
      };
    }

    // Default metric slots
    const aiLimit = plan.limits?.ai_runs_per_month ?? 100;
    const testCasesLimit = plan.limits?.test_cases ?? 500;
    const docsLimit = plan.limits?.knowledge_docs ?? 5;
    const seatsLimit = plan.limits?.seats ?? 1;

    const aiUsed = metricsUsage.ai_runs?.used ?? 0;
    const testCasesUsed = metricsUsage.test_cases?.used ?? 0;
    const docsUsed = metricsUsage.knowledge_docs?.used ?? 0;
    const seatsUsed = metricsUsage.seats?.used ?? 1;

    sendJson(res, 200, {
      owner_id: ownerId,
      period_start: periodStart,
      plan: {
        code: plan.code,
        name: plan.name,
        tier: plan.code,
        monthlyPrice: Math.round(plan.price_amount / 100),
        aiGenerationsPerDay: plan.limits?.ai_runs_per_day || 20,
        maxTestCases: testCasesLimit,
        maxFiles: docsLimit,
        maxUsers: seatsLimit,
      },
      subscription,
      usage: {
        aiGenerationsToday: aiUsed,
        totalTestCases: testCasesUsed,
        totalFiles: docsUsed,
        teamMembers: seatsUsed,
      },
      metrics: {
        ai_runs: { used: aiUsed, limit: aiLimit, remaining: Math.max(0, aiLimit - aiUsed) },
        test_cases: {
          used: testCasesUsed,
          limit: testCasesLimit,
          remaining: Math.max(0, testCasesLimit - testCasesUsed),
        },
        knowledge_docs: {
          used: docsUsed,
          limit: docsLimit,
          remaining: Math.max(0, docsLimit - docsUsed),
        },
        seats: {
          used: seatsUsed,
          limit: seatsLimit,
          remaining: Math.max(0, seatsLimit - seatsUsed),
        },
      },
    });
    return true;
  }

  // 5. POST /api/billing/checkout (Create checkout session)
  if (pathname === '/api/billing/checkout' && method === 'POST') {
    const rawBody = await readRequestBody(req);
    const body = JSON.parse(rawBody || '{}');
    const planCode = body.planCode || body.tier || 'pro';
    const interval = body.interval || (body.billingCycle === 'yearly' ? 'year' : 'month');
    const seats = parseInt(body.seats || '1', 10);

    // Free plan -> directly set active
    if (planCode === 'free') {
      await db.collection('subscriptions').updateOne(
        { owner_id: ownerId },
        {
          $set: {
            owner_id: ownerId,
            plan_code: 'free',
            status: 'active',
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          },
        },
        { upsert: true }
      );
      sendJson(res, 200, { url: '/billing?status=free_activated' });
      return true;
    }

    // Resolve plan definition
    let targetPlan = await db.collection('plans').findOne({ code: planCode, interval });
    if (!targetPlan) {
      targetPlan =
        SEED_PLANS.find((p) => p.code === planCode && p.interval === interval) ||
        SEED_PLANS.find((p) => p.code === planCode) ||
        SEED_PLANS[1];
    }

    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    const successUrl = `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${appUrl}/billing/canceled`;

    try {
      const session = await provider.createCheckoutSession(
        { id: ownerId, email: user.email, name: user.name },
        { ...targetPlan, seats },
        successUrl,
        cancelUrl
      );
      sendJson(res, 200, { url: session.url, sessionId: session.sessionId });
    } catch (err) {
      console.error('[Billing Checkout Error]:', err);
      sendJson(res, 400, { error: err.message || 'Unable to create checkout session.' });
    }
    return true;
  }

  // 6. POST /api/billing/portal (Customer portal session)
  if (pathname === '/api/billing/portal' && method === 'POST') {
    const rawBody = await readRequestBody(req);
    const body = JSON.parse(rawBody || '{}');
    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    const returnUrl = body.returnUrl || `${appUrl}/billing`;

    const customer = await db.collection('customers').findOne({ owner_id: ownerId });
    if (!customer?.provider_customer_id) {
      sendJson(res, 400, { error: 'No payment profile found. Upgrade to a paid plan first.' });
      return true;
    }

    try {
      const portal = await provider.createPortalSession(customer.provider_customer_id, returnUrl);
      sendJson(res, 200, { url: portal.url });
    } catch (err) {
      sendJson(res, 400, { error: err.message || 'Unable to create customer portal session.' });
    }
    return true;
  }

  // 7. POST /api/billing/change-plan (Upgrade/Downgrade)
  if (pathname === '/api/billing/change-plan' && method === 'POST') {
    const rawBody = await readRequestBody(req);
    const body = JSON.parse(rawBody || '{}');
    const newPlanCode = body.newPlanCode || body.tier || 'pro';
    const interval = body.interval || 'month';

    const sub = await db.collection('subscriptions').findOne({ owner_id: ownerId });
    if (!sub) {
      sendJson(res, 400, { error: 'No active subscription found to modify.' });
      return true;
    }

    let newPlan = await db.collection('plans').findOne({ code: newPlanCode, interval });
    if (!newPlan) {
      newPlan = SEED_PLANS.find((p) => p.code === newPlanCode) || SEED_PLANS[1];
    }

    try {
      if (sub.provider_subscription_id) {
        await provider.changePlan(sub.provider_subscription_id, newPlan);
      }
      await db.collection('subscriptions').updateOne(
        { owner_id: ownerId },
        {
          $set: {
            plan_code: newPlanCode,
            status: 'active',
            updated_at: new Date().toISOString(),
          },
        }
      );
      sendJson(res, 200, { ok: true, planCode: newPlanCode });
    } catch (err) {
      sendJson(res, 400, { error: err.message || 'Unable to update subscription plan.' });
    }
    return true;
  }

  // 8. POST /api/billing/cancel
  if (pathname === '/api/billing/cancel' && method === 'POST') {
    const sub = await db.collection('subscriptions').findOne({ owner_id: ownerId });
    if (!sub || !sub.provider_subscription_id) {
      sendJson(res, 400, { error: 'No active subscription found to cancel.' });
      return true;
    }
    try {
      await provider.cancelSubscription(sub.provider_subscription_id, true);
      await db.collection('subscriptions').updateOne(
        { owner_id: ownerId },
        {
          $set: {
            cancel_at_period_end: true,
            updated_at: new Date().toISOString(),
          },
        }
      );
      sendJson(res, 200, { ok: true, cancel_at_period_end: true });
    } catch (err) {
      sendJson(res, 400, { error: err.message || 'Failed to cancel subscription.' });
    }
    return true;
  }

  // 9. POST /api/billing/resume
  if (pathname === '/api/billing/resume' && method === 'POST') {
    const sub = await db.collection('subscriptions').findOne({ owner_id: ownerId });
    if (!sub || !sub.provider_subscription_id) {
      sendJson(res, 400, { error: 'No subscription found to resume.' });
      return true;
    }
    try {
      await provider.resumeSubscription(sub.provider_subscription_id);
      await db.collection('subscriptions').updateOne(
        { owner_id: ownerId },
        {
          $set: {
            cancel_at_period_end: false,
            status: 'active',
            updated_at: new Date().toISOString(),
          },
        }
      );
      sendJson(res, 200, { ok: true, status: 'active', cancel_at_period_end: false });
    } catch (err) {
      sendJson(res, 400, { error: err.message || 'Failed to resume subscription.' });
    }
    return true;
  }

  // 10. GET /api/billing/invoices (Paginated invoice history)
  if (pathname === '/api/billing/invoices' && method === 'GET') {
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10)));
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      db
        .collection('invoices')
        .find({ owner_id: ownerId })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('invoices').countDocuments({ owner_id: ownerId }),
    ]);

    // If no invoices yet, check provider fallback
    if (invoices.length === 0) {
      const customer = await db.collection('customers').findOne({ owner_id: ownerId });
      if (customer?.provider_customer_id) {
        try {
          const providerInvoices = await provider.listInvoices(customer.provider_customer_id);
          sendJson(res, 200, {
            invoices: providerInvoices,
            total: providerInvoices.length,
            page: 1,
            limit,
          });
          return true;
        } catch {
          // ignore
        }
      }
    }

    sendJson(res, 200, {
      invoices: invoices.map((inv) => ({
        id: inv.provider_invoice_id || inv._id.toString(),
        amountDue: inv.amount_due,
        amountPaid: inv.amount_paid,
        currency: inv.currency,
        status: inv.status,
        hostedInvoiceUrl: inv.hosted_invoice_url,
        pdfUrl: inv.pdf_url,
        date: inv.created_at ? inv.created_at.split('T')[0] : '2026-09-01',
        description: `ForgeQA Subscription Invoice (${inv.status})`,
      })),
      total,
      page,
      limit,
    });
    return true;
  }

  return false;
}
