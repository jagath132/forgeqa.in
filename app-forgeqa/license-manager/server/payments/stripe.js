import { getDb } from "../db.js";

export async function handleStripeWebhook(req, rawBody) {
  const stripeSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET not configured");
  }

  let stripe;
  try {
    stripe = await import("stripe");
    stripe = stripe.default || stripe;
  } catch {
    throw new Error("stripe package not installed");
  }

  const sig = req.headers["stripe-signature"];
  if (!sig) throw new Error("Missing stripe-signature header");

  let event;
  try {
    const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);
    event = stripeInstance.webhooks.constructEvent(rawBody, sig, stripeSecret);
  } catch (err) {
    throw new Error(`Stripe webhook signature verification failed: ${err.message}`);
  }

  if (event.type !== "checkout.session.completed") {
    return { received: true, ignored: true };
  }

  const session = event.data.object;
  const customerEmail = session.customer_details?.email || session.customer_email;
  const customerName = session.customer_details?.name || "";
  const metadata = session.metadata || {};

  if (!customerEmail) {
    throw new Error("No customer email in Stripe session");
  }

  const db = getDb();
  const txColl = db.collection("payment_transactions");
  await txColl.insertOne({
    transactionId: session.id,
    email: customerEmail,
    amount: session.amount_total ? session.amount_total / 100 : null,
    currency: session.currency || null,
    status: "completed",
    provider: "stripe",
    productKey: null,
    timestamp: new Date().toISOString(),
  });

  // Queue for manual ForgeKey verification instead of auto-issuing a key.
  // An admin will approve/reject in the ForgeKey Verifications page.
  const pendingReg = db.collection("pending_registrations");
  const pending = await pendingReg.findOne({ email: customerEmail.toLowerCase().trim() });
  if (pending) {
    await pendingReg.updateOne(
      { email: customerEmail.toLowerCase().trim() },
      {
        $set: {
          paymentStatus: "completed",
          status: "pending_verification",
          plan: metadata.plan || pending.plan || "pro",
          transactionId: session.id,
          paymentProvider: "stripe",
        }
      }
    );
  } else {
    // Payment without a prior registration — create a pending entry
    const crypto = await import("node:crypto");
    await pendingReg.insertOne({
      pendingId: crypto.randomBytes(16).toString("hex"),
      name: customerName,
      email: customerEmail.toLowerCase().trim(),
      plan: metadata.plan || "pro",
      paymentStatus: "completed",
      status: "pending_verification",
      transactionId: session.id,
      paymentProvider: "stripe",
      createdAt: new Date().toISOString(),
    });
  }

  return { received: true, queued: true, email: customerEmail };
}
