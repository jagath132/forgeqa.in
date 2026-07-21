let stripeInstance;

async function getStripe() {
  if (stripeInstance) return stripeInstance;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  const stripe = await import('stripe');
  stripeInstance = (stripe.default || stripe)(key);
  return stripeInstance;
}

export async function createCheckoutSession({
  userId,
  pendingId,
  email,
  plan = 'pro',
  seats = 1,
  billingCycle = 'monthly',
  successUrl,
  cancelUrl,
}) {
  const s = await getStripe();
  const prices = {
    pro: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_default',
    enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_default',
  };

  const priceId = prices[plan];
  if (!priceId) throw new Error(`No price configured for plan: ${plan}`);

  const seatQuantity = Math.max(1, parseInt(seats || 1, 10));

  const session = await s.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: seatQuantity,
      },
    ],
    customer_email: email,
    metadata: {
      userId: userId || '',
      pendingId: pendingId || '',
      plan,
      seats: String(seatQuantity),
      billingCycle,
      email,
    },
    success_url:
      successUrl || `${process.env.APP_URL || 'http://127.0.0.1:5173'}/settings?billing=success`,
    cancel_url:
      cancelUrl || `${process.env.APP_URL || 'http://127.0.0.1:5173'}/settings?billing=canceled`,
  });

  return { url: session.url, sessionId: session.id };
}

export async function createCustomerPortalSession(customerId, returnUrl) {
  const s = await getStripe();
  const session = await s.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl || `${process.env.APP_URL || 'http://127.0.0.1:5173'}/settings`,
  });
  return { url: session.url };
}

export async function verifyWebhookEvent(rawBody, signature) {
  const s = await getStripe();
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!endpointSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET not configured');
  }
  return s.webhooks.constructEvent(rawBody, signature, endpointSecret);
}
