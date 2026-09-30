import crypto from 'node:crypto';
import { BillingProvider } from './base.js';

/**
 * In-memory / Mock Billing Provider for testing and local development without external network calls.
 */
export class FakeProvider extends BillingProvider {
  constructor() {
    super();
    this.name = 'fake';
    this.customers = new Map();
    this.subscriptions = new Map();
    this.invoices = new Map();
  }

  async createCustomer(owner) {
    const customerId = `cus_fake_${owner.id || crypto.randomBytes(6).toString('hex')}`;
    this.customers.set(customerId, {
      id: customerId,
      ownerId: owner.id,
      email: owner.email,
      name: owner.name,
      createdAt: new Date().toISOString(),
    });
    return customerId;
  }

  async createCheckoutSession(owner, plan, successUrl, cancelUrl) {
    const sessionId = `cs_fake_${crypto.randomBytes(8).toString('hex')}`;
    const customerId = await this.createCustomer(owner);
    const subscriptionId = `sub_fake_${crypto.randomBytes(8).toString('hex')}`;

    this.subscriptions.set(subscriptionId, {
      id: subscriptionId,
      customerId,
      ownerId: owner.id,
      planCode: plan.code,
      status: 'active',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
    });

    const redirectUrl = new URL(successUrl);
    redirectUrl.searchParams.set('session_id', sessionId);
    redirectUrl.searchParams.set('provider', 'fake');

    return {
      url: redirectUrl.toString(),
      sessionId,
      subscriptionId,
      customerId,
    };
  }

  async createPortalSession(_customerId, returnUrl) {
    return { url: returnUrl || 'http://localhost:5173/billing' };
  }

  async changePlan(subscriptionId, newPlan, _proration = true) {
    const sub = this.subscriptions.get(subscriptionId) || {
      id: subscriptionId,
      status: 'active',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
    };
    sub.planCode = newPlan.code;
    sub.updatedAt = new Date().toISOString();
    this.subscriptions.set(subscriptionId, sub);
    return sub;
  }

  async cancelSubscription(subscriptionId, atPeriodEnd = true) {
    const sub = this.subscriptions.get(subscriptionId) || { id: subscriptionId };
    if (atPeriodEnd) {
      sub.cancelAtPeriodEnd = true;
    } else {
      sub.status = 'canceled';
      sub.cancelAtPeriodEnd = false;
    }
    sub.updatedAt = new Date().toISOString();
    this.subscriptions.set(subscriptionId, sub);
    return sub;
  }

  async resumeSubscription(subscriptionId) {
    const sub = this.subscriptions.get(subscriptionId) || { id: subscriptionId };
    sub.cancelAtPeriodEnd = false;
    sub.status = 'active';
    sub.updatedAt = new Date().toISOString();
    this.subscriptions.set(subscriptionId, sub);
    return sub;
  }

  async verifyWebhook(rawBody, signatureHeader) {
    if (!signatureHeader || signatureHeader === 'invalid_signature') {
      const err = new Error('Invalid signature header for FakeProvider');
      err.statusCode = 400;
      throw err;
    }
    const text = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody || '{}');
    try {
      const parsed = JSON.parse(text);
      return {
        id: parsed.id || `evt_fake_${Date.now()}`,
        type: parsed.type || 'checkout.session.completed',
        data: parsed.data || { object: parsed },
        created: parsed.created || Math.floor(Date.now() / 1000),
      };
    } catch {
      return {
        id: `evt_fake_${Date.now()}`,
        type: 'checkout.session.completed',
        data: { object: {} },
        created: Math.floor(Date.now() / 1000),
      };
    }
  }

  async listInvoices(customerId) {
    const list = [];
    for (const inv of this.invoices.values()) {
      if (inv.customerId === customerId) list.push(inv);
    }
    if (list.length === 0) {
      list.push({
        id: 'in_fake_001',
        customerId,
        amountDue: 149900,
        amountPaid: 149900,
        currency: 'inr',
        status: 'paid',
        hostedInvoiceUrl: '#',
        pdfUrl: '#',
        createdAt: new Date().toISOString(),
      });
    }
    return list;
  }
}
