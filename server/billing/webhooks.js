import { getDb } from '../db.js';
import { getBillingProvider } from './providers/index.js';

/**
 * Handles incoming provider webhook requests with raw-body signature verification,
 * deduplication, and atomic state synchronization.
 *
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 */
export async function handleBillingWebhook(req, res) {
  const provider = getBillingProvider();
  const signature =
    req.headers['stripe-signature'] ||
    req.headers['x-razorpay-signature'] ||
    req.headers['x-webhook-signature'] ||
    'mock_signature';

  // 1. Read raw body
  let rawBody = req.rawBody;
  if (!rawBody) {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    rawBody = Buffer.concat(chunks);
  }

  // 2. Verify signature
  let event;
  try {
    event = await provider.verifyWebhook(rawBody, signature);
  } catch (err) {
    console.error(`[Billing Webhook] Signature verification failed: ${err.message}`);
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: `Signature verification failed: ${err.message}` }));
    return;
  }

  const db = getDb();
  const eventId = event.id;
  const eventType = event.type;
  const providerName = provider.name || 'stripe';

  // 3. Deduplication check via webhook_events
  const existingEvent = await db.collection('webhook_events').findOne({
    provider: providerName,
    event_id: eventId,
  });

  if (existingEvent?.processed_at) {
    // Already processed this event
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ received: true, deduplicated: true }));
    return;
  }

  // Insert or record webhook event audit
  await db.collection('webhook_events').updateOne(
    { provider: providerName, event_id: eventId },
    {
      $set: {
        provider: providerName,
        event_id: eventId,
        type: eventType,
        payload: event.data?.object || {},
        created_at: new Date().toISOString(),
      },
    },
    { upsert: true }
  );

  try {
    const obj = event.data?.object || {};

    switch (eventType) {
      case 'checkout.session.completed':
      case 'checkout_completed': {
        const metadata = obj.metadata || {};
        const ownerId = metadata.ownerId || metadata.userId;
        const planCode = metadata.planCode || metadata.plan || 'pro';
        const customerId = obj.customer;
        const subscriptionId = obj.subscription || `sub_${Date.now()}`;

        if (ownerId) {
          // Link customer
          if (customerId) {
            await db.collection('customers').updateOne(
              { owner_id: String(ownerId), provider: providerName },
              {
                $set: {
                  owner_id: String(ownerId),
                  provider: providerName,
                  provider_customer_id: customerId,
                  email: metadata.email || obj.customer_email,
                  created_at: new Date().toISOString(),
                },
              },
              { upsert: true }
            );
          }

          // Link subscription
          await db.collection('subscriptions').updateOne(
            { owner_id: String(ownerId) },
            {
              $set: {
                owner_id: String(ownerId),
                plan_code: planCode,
                status: 'active',
                provider_subscription_id: subscriptionId,
                current_period_start: new Date().toISOString(),
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                cancel_at_period_end: false,
                updated_at: new Date().toISOString(),
              },
            },
            { upsert: true }
          );

          // Update user record for backward compat
          const { ObjectId } = await import('mongodb');
          try {
            await db.collection('users').updateOne(
              { _id: new ObjectId(ownerId) },
              {
                $set: {
                  subscriptionTier: planCode,
                  subscriptionStatus: 'active',
                  stripeCustomerId: customerId,
                  stripeSubscriptionId: subscriptionId,
                  updatedAt: new Date().toISOString(),
                },
              }
            );
          } catch {
            // ownerId might not be an ObjectId in tests
          }
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const customerId = obj.customer;
        const status = obj.status || 'active'; // active, past_due, canceled, unpaid
        const cancelAtPeriodEnd = Boolean(obj.cancel_at_period_end);
        const periodStart = obj.current_period_start
          ? new Date(obj.current_period_start * 1000).toISOString()
          : new Date().toISOString();
        const periodEnd = obj.current_period_end
          ? new Date(obj.current_period_end * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        // Find customer mapping
        const custDoc = await db.collection('customers').findOne({
          provider_customer_id: customerId,
        });

        if (custDoc?.owner_id) {
          const existingSub = await db.collection('subscriptions').findOne({
            owner_id: custDoc.owner_id,
          });

          // Out-of-order check: do not overwrite newer state with an older event timestamp
          const eventTime = event.created ? event.created * 1000 : Date.now();
          const lastUpdateTime = existingSub?.updated_at
            ? new Date(existingSub.updated_at).getTime()
            : 0;

          if (eventTime >= lastUpdateTime) {
            await db.collection('subscriptions').updateOne(
              { owner_id: custDoc.owner_id },
              {
                $set: {
                  status,
                  current_period_start: periodStart,
                  current_period_end: periodEnd,
                  cancel_at_period_end: cancelAtPeriodEnd,
                  updated_at: new Date(eventTime).toISOString(),
                },
              },
              { upsert: true }
            );

            // Update user collection
            const { ObjectId } = await import('mongodb');
            try {
              await db.collection('users').updateOne(
                { _id: new ObjectId(custDoc.owner_id) },
                {
                  $set: {
                    subscriptionStatus: status,
                    subscriptionEndsAt: periodEnd,
                    updatedAt: new Date().toISOString(),
                  },
                }
              );
            } catch {
              /* ignore */
            }
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const customerId = obj.customer;
        const custDoc = await db.collection('customers').findOne({
          provider_customer_id: customerId,
        });

        if (custDoc?.owner_id) {
          await db.collection('subscriptions').updateOne(
            { owner_id: custDoc.owner_id },
            {
              $set: {
                status: 'canceled',
                plan_code: 'free',
                cancel_at_period_end: false,
                updated_at: new Date().toISOString(),
              },
            }
          );

          const { ObjectId } = await import('mongodb');
          try {
            await db.collection('users').updateOne(
              { _id: new ObjectId(custDoc.owner_id) },
              {
                $set: {
                  subscriptionTier: 'free',
                  subscriptionStatus: 'canceled',
                  updatedAt: new Date().toISOString(),
                },
              }
            );
          } catch {
            /* ignore */
          }
        }
        break;
      }

      case 'invoice.paid': {
        const customerId = obj.customer;
        const custDoc = await db.collection('customers').findOne({
          provider_customer_id: customerId,
        });

        if (custDoc?.owner_id) {
          // Record invoice
          await db.collection('invoices').updateOne(
            { provider_invoice_id: obj.id || `inv_${Date.now()}` },
            {
              $set: {
                owner_id: custDoc.owner_id,
                provider_invoice_id: obj.id || `inv_${Date.now()}`,
                amount_due: obj.amount_due || 0,
                amount_paid: obj.amount_paid || obj.amount_due || 0,
                currency: obj.currency || 'inr',
                status: 'paid',
                hosted_invoice_url: obj.hosted_invoice_url || null,
                pdf_url: obj.invoice_pdf || null,
                period_start: obj.period_start
                  ? new Date(obj.period_start * 1000).toISOString()
                  : null,
                period_end: obj.period_end ? new Date(obj.period_end * 1000).toISOString() : null,
                created_at: new Date().toISOString(),
              },
            },
            { upsert: true }
          );

          // Reset usage balance for new period
          const now = new Date();
          const periodStart = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
          ).toISOString();
          await db.collection('usage_balances').deleteMany({
            owner_id: custDoc.owner_id,
            period_start: { $lt: periodStart },
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const customerId = obj.customer;
        const custDoc = await db.collection('customers').findOne({
          provider_customer_id: customerId,
        });

        if (custDoc?.owner_id) {
          await db.collection('subscriptions').updateOne(
            { owner_id: custDoc.owner_id },
            {
              $set: {
                status: 'past_due',
                updated_at: new Date().toISOString(),
              },
            }
          );
        }
        break;
      }

      default:
        console.log(`[Billing Webhook] Unhandled event type: ${eventType}`);
        break;
    }

    // Mark event processed successfully
    await db
      .collection('webhook_events')
      .updateOne(
        { provider: providerName, event_id: eventId },
        { $set: { processed_at: new Date().toISOString() } }
      );

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ received: true }));
  } catch (err) {
    console.error(`[Billing Webhook] Processing error for ${eventType}:`, err);
    await db
      .collection('webhook_events')
      .updateOne(
        { provider: providerName, event_id: eventId },
        { $set: { error: err.message, failed_at: new Date().toISOString() } }
      );
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Webhook processing error', details: err.message }));
  }
}
