import { createCustomerPortalSession } from './stripe.js';
import { getDb } from '../db.js';

export async function handleCustomerPortal(req, res) {
  const userId = req.user?.id || req.user?._id;
  if (!userId) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Authentication required' }));
    return;
  }

  const db = getDb();
  const { ObjectId } = await import('mongodb');
  const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

  if (!user?.stripeCustomerId) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error:
          'No active Stripe billing profile found for this account. Upgrade to a paid plan first.',
      })
    );
    return;
  }

  try {
    const returnUrl = `${process.env.APP_URL || 'http://127.0.0.1:5173'}/settings`;
    const session = await createCustomerPortalSession(user.stripeCustomerId, returnUrl);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ url: session.url }));
  } catch (err) {
    console.error('Error creating Stripe customer portal session:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Failed to launch Stripe billing portal' }));
  }
}
