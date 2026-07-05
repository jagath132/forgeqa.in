let stripeInstance;
async function getStripe() {
  if (stripeInstance) return stripeInstance;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  const stripe = await import("stripe");
  stripeInstance = (stripe.default || stripe)(key);
  return stripeInstance;
}

export async function createCheckoutSession({ pendingId, email, plan, name: _name }) {
  const s = await getStripe();
  const prices = {
    pro: process.env.STRIPE_PRO_PRICE_ID || "price_pro",
    enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID || "price_enterprise",
  };
  const priceId = prices[plan];
  if (!priceId) throw new Error(`No price configured for plan: ${plan}`);

  const session = await s.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: email,
    metadata: { pendingId, plan, email },
    success_url: `${process.env.APP_URL || "http://127.0.0.1:5173"}/register?step=pending_verification&email=${encodeURIComponent(email)}&pendingId=${pendingId}`,
    cancel_url: `${process.env.APP_URL || "http://127.0.0.1:5173"}/register?canceled=true`,
  });

  return { url: session.url, sessionId: session.id };
}
