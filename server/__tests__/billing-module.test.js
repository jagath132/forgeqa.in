import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FakeProvider } from '../billing/providers/fake.js';
import { can, remaining, consume, getOwnerSubscriptionAndPlan } from '../billing/entitlements.js';
import { handleBillingWebhook } from '../billing/webhooks.js';
import { handleBillingRoute } from '../billing/routes.js';
import { setBillingProvider } from '../billing/providers/index.js';

// In-memory MongoDB mock collections for testing
const mockCollections = {};

function getMockCollection(name) {
  if (!mockCollections[name]) {
    const docs = [];
    mockCollections[name] = {
      docs,
      findOne: vi.fn(async (query) => {
        return (
          docs.find((d) => Object.entries(query).every(([k, v]) => String(d[k]) === String(v))) ||
          null
        );
      }),
      find: vi.fn((query = {}) => ({
        toArray: async () =>
          docs.filter((d) => Object.entries(query).every(([k, v]) => String(d[k]) === String(v))),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
      })),
      insertOne: vi.fn(async (doc) => {
        const item = { ...doc, _id: doc._id || `id_${Date.now()}_${Math.random()}` };
        docs.push(item);
        return { insertedId: item._id };
      }),
      updateOne: vi.fn(async (query, update, options = {}) => {
        let item = docs.find((d) =>
          Object.entries(query).every(([k, v]) => String(d[k]) === String(v))
        );
        if (!item && options.upsert) {
          item = { ...query };
          docs.push(item);
        }
        if (item) {
          if (update.$set) Object.assign(item, update.$set);
          if (update.$inc) {
            for (const [k, v] of Object.entries(update.$inc)) {
              item[k] = (item[k] || 0) + v;
            }
          }
        }
        return { modifiedCount: 1, upsertedCount: item ? 0 : 1 };
      }),
      findOneAndUpdate: vi.fn(async (query, update, options = {}) => {
        let item = docs.find((d) =>
          Object.entries(query).every(([k, v]) => String(d[k]) === String(v))
        );
        if (!item && options.upsert) {
          item = { ...query };
          if (update.$setOnInsert) Object.assign(item, update.$setOnInsert);
          docs.push(item);
        }
        if (item) {
          if (update.$set) Object.assign(item, update.$set);
          if (update.$inc) {
            for (const [k, v] of Object.entries(update.$inc)) {
              item[k] = (item[k] || 0) + v;
            }
          }
        }
        return { value: item, ...item };
      }),
      deleteOne: vi.fn(async (query) => {
        const idx = docs.findIndex((d) =>
          Object.entries(query).every(([k, v]) => String(d[k]) === String(v))
        );
        if (idx !== -1) docs.splice(idx, 1);
        return { deletedCount: idx !== -1 ? 1 : 0 };
      }),
      deleteMany: vi.fn(async () => ({ deletedCount: 0 })),
      countDocuments: vi.fn(async (query = {}) => {
        return docs.filter((d) =>
          Object.entries(query).every(([k, v]) => String(d[k]) === String(v))
        ).length;
      }),
      createIndex: vi.fn(async () => 'idx'),
    };
  }
  return mockCollections[name];
}

vi.mock('../db.js', () => ({
  getDb: () => ({
    collection: (name) => getMockCollection(name),
  }),
  connectDb: vi.fn(),
}));

describe('Billing Module Engine (Playbook)', () => {
  let fakeProvider;

  beforeEach(() => {
    // Clear mock storage
    for (const key of Object.keys(mockCollections)) {
      mockCollections[key].docs.length = 0;
    }
    fakeProvider = new FakeProvider();
    setBillingProvider(fakeProvider);
  });

  describe('Phase 2 - Provider Adapter (FakeProvider)', () => {
    it('creates customer and checkout session', async () => {
      const owner = { id: 'usr_123', email: 'alex@forgeqa.in', name: 'Alex' };
      const plan = { code: 'pro', interval: 'month', price_amount: 149900 };
      const session = await fakeProvider.createCheckoutSession(
        owner,
        plan,
        'http://localhost:5173/billing/success',
        'http://localhost:5173/billing/canceled'
      );

      expect(session.url).toContain('/billing/success');
      expect(session.sessionId).toBeDefined();
      expect(session.customerId).toContain('cus_fake_usr_123');
    });

    it('rejects invalid webhook signatures', async () => {
      await expect(
        fakeProvider.verifyWebhook(Buffer.from('{}'), 'invalid_signature')
      ).rejects.toThrow();
    });

    it('accepts valid signatures and parses payload', async () => {
      const event = await fakeProvider.verifyWebhook(
        Buffer.from(JSON.stringify({ type: 'checkout.session.completed', id: 'evt_test_1' })),
        'valid_sig'
      );
      expect(event.type).toBe('checkout.session.completed');
      expect(event.id).toBe('evt_test_1');
    });
  });

  describe('Phase 4 - Webhook Handling & State Transitions', () => {
    it('returns 400 when webhook signature is rejected', async () => {
      const req = {
        headers: { 'stripe-signature': 'invalid_signature' },
        rawBody: Buffer.from('{}'),
      };
      const res = {
        statusCode: 0,
        setHeader: vi.fn(),
        end: vi.fn(),
      };

      await handleBillingWebhook(req, res);
      expect(res.statusCode).toBe(400);
      expect(res.end).toHaveBeenCalledWith(
        expect.stringContaining('Signature verification failed')
      );
    });

    it('handles checkout completed and activates subscription', async () => {
      const eventPayload = {
        id: 'evt_checkout_success',
        type: 'checkout.session.completed',
        data: {
          object: {
            customer: 'cus_123',
            subscription: 'sub_999',
            metadata: {
              ownerId: 'owner_abc',
              planCode: 'pro',
              email: 'owner@test.com',
            },
          },
        },
      };

      const req = {
        headers: { 'stripe-signature': 'valid_sig' },
        rawBody: Buffer.from(JSON.stringify(eventPayload)),
      };
      const res = {
        statusCode: 0,
        setHeader: vi.fn(),
        end: vi.fn(),
      };

      await handleBillingWebhook(req, res);
      expect(res.statusCode).toBe(200);

      // Verify DB was updated
      const sub = await getMockCollection('subscriptions').findOne({ owner_id: 'owner_abc' });
      expect(sub).toBeDefined();
      expect(sub.plan_code).toBe('pro');
      expect(sub.status).toBe('active');
    });

    it('deduplicates duplicate webhook events safely', async () => {
      const eventPayload = {
        id: 'evt_dedup_test',
        type: 'checkout.session.completed',
        data: { object: { customer: 'cus_dup', metadata: { ownerId: 'owner_dup' } } },
      };
      const req = {
        headers: { 'stripe-signature': 'valid_sig' },
        rawBody: Buffer.from(JSON.stringify(eventPayload)),
      };
      const res = { statusCode: 0, setHeader: vi.fn(), end: vi.fn() };

      // First call
      await handleBillingWebhook(req, res);
      expect(res.statusCode).toBe(200);

      // Second duplicate call
      const res2 = { statusCode: 0, setHeader: vi.fn(), end: vi.fn() };
      await handleBillingWebhook(req, res2);
      expect(res2.statusCode).toBe(200);
      expect(res2.end).toHaveBeenCalledWith(expect.stringContaining('"deduplicated":true'));
    });

    it('ignores older out-of-order events from overwriting newer state', async () => {
      // 1. Setup subscription with modern timestamp
      await getMockCollection('customers').insertOne({
        owner_id: 'owner_ooo',
        provider_customer_id: 'cus_ooo',
      });
      await getMockCollection('subscriptions').insertOne({
        owner_id: 'owner_ooo',
        status: 'active',
        updated_at: new Date('2026-09-29T20:00:00Z').toISOString(),
      });

      // 2. Fire older event from 2026-09-29T10:00:00Z
      const olderEvent = {
        id: 'evt_older_past_due',
        type: 'customer.subscription.updated',
        created: Math.floor(new Date('2026-09-29T10:00:00Z').getTime() / 1000),
        data: {
          object: {
            customer: 'cus_ooo',
            status: 'past_due',
          },
        },
      };

      const req = {
        headers: { 'stripe-signature': 'valid_sig' },
        rawBody: Buffer.from(JSON.stringify(olderEvent)),
      };
      const res = { statusCode: 0, setHeader: vi.fn(), end: vi.fn() };
      await handleBillingWebhook(req, res);

      // Verify status remained 'active' because incoming event was older!
      const sub = await getMockCollection('subscriptions').findOne({ owner_id: 'owner_ooo' });
      expect(sub.status).toBe('active');
    });
  });

  describe('Phase 5 - Entitlements & Atomic Usage Metering', () => {
    it('verifies features for Free vs Pro using can()', async () => {
      // User with Free plan
      expect(await can('free_user', 'automationFrameworks')).toBe(false);

      // User with Pro plan
      await getMockCollection('subscriptions').insertOne({
        owner_id: 'pro_user',
        plan_code: 'pro',
        status: 'active',
      });
      expect(await can('pro_user', 'automationFrameworks')).toBe(true);
      expect(await can('pro_user', 'regressionSuites')).toBe(true);
    });

    it('enforces quota limit and prevents over-consumption', async () => {
      const ownerId = 'meter_user';

      // 1. Consume 80 runs out of 100 limit on Free plan
      const first = await consume(ownerId, 'ai_runs', 80, 'req_1');
      expect(first.ok).toBe(true);
      expect(first.remaining).toBe(20);

      // 2. Consume 15 runs
      const second = await consume(ownerId, 'ai_runs', 15, 'req_2');
      expect(second.ok).toBe(true);
      expect(second.remaining).toBe(5);

      // 3. Attempt to consume 10 runs (exceeds remaining 5)
      const third = await consume(ownerId, 'ai_runs', 10, 'req_3');
      expect(third.ok).toBe(false);
      expect(third.remaining).toBe(5);
    });

    it('idempotency key prevents double charging on retries', async () => {
      const ownerId = 'idempotent_user';

      // First run with idempotencyKey 'job_777'
      const run1 = await consume(ownerId, 'ai_runs', 10, 'job_777');
      expect(run1.ok).toBe(true);

      // Retry with identical idempotencyKey 'job_777'
      const run2 = await consume(ownerId, 'ai_runs', 10, 'job_777');
      expect(run2.ok).toBe(true);
      expect(run2.deduplicated).toBe(true);

      // Verify balance in DB was only charged once (used = 10, not 20)
      const balance = await getMockCollection('usage_balances').findOne({ owner_id: ownerId });
      expect(balance.used).toBe(10);
    });

    it('allows access during past_due grace period, then restricts', async () => {
      const ownerId = 'grace_user';

      // Subscription updated 2 days ago (within 7-day grace period)
      await getMockCollection('subscriptions').insertOne({
        owner_id: ownerId,
        plan_code: 'pro',
        status: 'past_due',
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const { plan, isGracePeriod } = await getOwnerSubscriptionAndPlan(ownerId);
      expect(isGracePeriod).toBe(true);
      expect(plan.code).toBe('pro');

      // Now set update to 10 days ago (exceeded grace period)
      await getMockCollection('subscriptions').updateOne(
        { owner_id: ownerId },
        { $set: { updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() } }
      );

      const expired = await getOwnerSubscriptionAndPlan(ownerId);
      expect(expired.plan.code).toBe('free'); // Grace expired -> downgraded to Free
    });
  });

  describe('Phase 3 - API Endpoints & Authorization', () => {
    it('rejects unauthenticated requests on protected billing endpoints', async () => {
      const req = { method: 'GET' };
      const res = { statusCode: 0, setHeader: vi.fn(), end: vi.fn() };
      const url = new URL('http://localhost/api/billing/subscription');

      const handled = await handleBillingRoute(req, res, url, null);
      expect(handled).toBe(true);
      expect(res.statusCode).toBe(401);
    });

    it('authorizes strictly against authenticated user owner_id', async () => {
      const user = { id: 'alice_123', email: 'alice@forgeqa.in' };
      const req = { method: 'GET' };
      const res = { statusCode: 0, setHeader: vi.fn(), end: vi.fn() };
      const url = new URL('http://localhost/api/billing/subscription');

      await handleBillingRoute(req, res, url, user);
      expect(res.statusCode).toBe(200);
      expect(res.end).toHaveBeenCalledWith(expect.stringContaining('alice_123'));
    });

    it('executes checkout and returns session URL', async () => {
      const user = { id: 'charlie_456', email: 'charlie@forgeqa.in' };
      const req = {
        method: 'POST',
        on: (event, cb) => {
          if (event === 'data') cb(Buffer.from(JSON.stringify({ planCode: 'pro' })));
          if (event === 'end') cb();
        },
      };
      const res = { statusCode: 0, setHeader: vi.fn(), end: vi.fn() };
      const url = new URL('http://localhost/api/billing/checkout');

      await handleBillingRoute(req, res, url, user);
      expect(res.statusCode).toBe(200);
      expect(res.end).toHaveBeenCalledWith(expect.stringContaining('/billing/success'));
    });
  });
});
