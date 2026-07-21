import { verifyWebhookEvent } from './stripe.js';
import { updateSubscription } from '../billing/plans.js';
import { getDb } from '../db.js';

export async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    let body = req.rawBody;
    if (!body) {
      // Buffer raw body if not already available
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      body = Buffer.concat(chunks);
    }
    event = await verifyWebhookEvent(body, sig);
  } catch (err) {
    console.error(`Stripe Webhook Signature Verification Failed: ${err.message}`);
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: `Webhook Error: ${err.message}` }));
    return;
  }

  const db = getDb();
  const { ObjectId } = await import('mongodb');

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan || 'pro';
        const seats = parseInt(session.metadata?.seats || '1', 10);
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        if (userId) {
          await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            {
              $set: {
                subscriptionTier: plan,
                subscriptionStatus: 'active',
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                seats,
                updatedAt: new Date().toISOString(),
              },
            }
          );
        } else if (session.metadata?.email) {
          await db.collection('users').updateOne(
            { email: session.metadata.email },
            {
              $set: {
                subscriptionTier: plan,
                subscriptionStatus: 'active',
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                seats,
                updatedAt: new Date().toISOString(),
              },
            }
          );
        }
        console.log(`Successfully processed subscription checkout for plan ${plan}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const status = subscription.status; // active, past_due, canceled, unpaid
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();

        await db.collection('users').updateOne(
          { stripeCustomerId: customerId },
          {
            $set: {
              subscriptionStatus: status,
              subscriptionEndsAt: currentPeriodEnd,
              updatedAt: new Date().toISOString(),
            },
          }
        );
        console.log(`Updated subscription status to ${status} for customer ${customerId}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        await db.collection('users').updateOne(
          { stripeCustomerId: customerId },
          {
            $set: {
              subscriptionTier: 'free',
              subscriptionStatus: 'canceled',
              seats: 1,
              updatedAt: new Date().toISOString(),
            },
          }
        );
        console.log(`Canceled subscription and downgraded to free for customer ${customerId}`);
        break;
      }

      default:
        console.log(`Unhandled Stripe event type ${event.type}`);
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ received: true }));
  } catch (err) {
    console.error('Error handling Stripe webhook event:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Webhook handler failed' }));
  }
}
