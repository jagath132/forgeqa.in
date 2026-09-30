import { BillingProvider } from './base.js';

export class StripeProvider extends BillingProvider {
  constructor() {
    super();
    this.name = 'stripe';
    this.stripeInstance = null;
  }

  async getStripe() {
    if (this.stripeInstance) return this.stripeInstance;
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not configured in environment');
    const moduleName = 'stripe';
    const stripeModule = await import(/* @vite-ignore */ moduleName);
    const StripeConstructor = stripeModule.default || stripeModule;
    this.stripeInstance = new StripeConstructor(key, { apiVersion: '2023-10-16' });
    return this.stripeInstance;
  }

  async createCustomer(owner) {
    const stripe = await this.getStripe();
    const customer = await stripe.customers.create({
      email: owner.email,
      name: owner.name || undefined,
      metadata: { ownerId: owner.id },
    });
    return customer.id;
  }

  async createCheckoutSession(owner, plan, successUrl, cancelUrl) {
    const stripe = await this.getStripe();
    const priceId = plan.provider_price_id || plan.providerPriceId;
    if (!priceId) {
      throw new Error(`Plan "${plan.code}" has no Stripe Price ID configured`);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: owner.email,
      line_items: [
        {
          price: priceId,
          quantity: plan.seats ? Math.max(1, plan.seats) : 1,
        },
      ],
      metadata: {
        ownerId: owner.id,
        planCode: plan.code,
        interval: plan.interval || 'month',
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return {
      url: session.url,
      sessionId: session.id,
    };
  }

  async createPortalSession(customerId, returnUrl) {
    const stripe = await this.getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return { url: session.url };
  }

  async changePlan(subscriptionId, newPlan, proration = true) {
    const stripe = await this.getStripe();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const itemId = subscription.items.data[0]?.id;

    if (!itemId) {
      throw new Error('No items found on Stripe subscription to update');
    }

    return await stripe.subscriptions.update(subscriptionId, {
      proration_behavior: proration ? 'create_prorations' : 'none',
      items: [
        {
          id: itemId,
          price: newPlan.provider_price_id || newPlan.providerPriceId,
        },
      ],
    });
  }

  async cancelSubscription(subscriptionId, atPeriodEnd = true) {
    const stripe = await this.getStripe();
    if (atPeriodEnd) {
      return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    }
    return await stripe.subscriptions.cancel(subscriptionId);
  }

  async resumeSubscription(subscriptionId) {
    const stripe = await this.getStripe();
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
  }

  async verifyWebhook(rawBody, signatureHeader) {
    const stripe = await this.getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }
    return stripe.webhooks.constructEvent(rawBody, signatureHeader, webhookSecret);
  }

  async listInvoices(customerId) {
    const stripe = await this.getStripe();
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 20,
    });
    return invoices.data.map((inv) => ({
      id: inv.id,
      amountDue: inv.amount_due,
      amountPaid: inv.amount_paid,
      currency: inv.currency,
      status: inv.status,
      hostedInvoiceUrl: inv.hosted_invoice_url,
      pdfUrl: inv.invoice_pdf,
      createdAt: new Date(inv.created * 1000).toISOString(),
    }));
  }
}
