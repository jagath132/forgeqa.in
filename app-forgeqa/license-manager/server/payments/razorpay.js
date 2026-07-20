import crypto from "node:crypto";
import { getDb } from "../db.js";

export async function handleRazorpayWebhook(req, rawBody) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET not configured");
  }

  const signature = req.headers["x-razorpay-signature"];
  if (!signature) throw new Error("Missing x-razorpay-signature header");

  const expectedSig = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  if (signature !== expectedSig) {
    throw new Error("Razorpay webhook signature mismatch");
  }

  const event = JSON.parse(rawBody);
  if (event.event !== "payment.captured") {
    return { received: true, ignored: true };
  }

  const payment = event.payload.payment.entity;
  const customerEmail = payment.email;
  const customerName = payment.notes?.name || "";
  const planFromNotes = payment.notes?.plan || null;

  if (!customerEmail) {
    throw new Error("No customer email in Razorpay payment");
  }

  const db = getDb();
  const txColl = db.collection("payment_transactions");
  await txColl.insertOne({
    transactionId: payment.id,
    email: customerEmail,
    amount: payment.amount ? payment.amount / 100 : null,
    currency: payment.currency || null,
    status: "completed",
    provider: "razorpay",
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
          plan: planFromNotes || pending.plan || "pro",
          transactionId: payment.id,
          paymentProvider: "razorpay",
        }
      }
    );
  } else {
    // Payment without a prior registration — create a pending entry
    await pendingReg.insertOne({
      pendingId: crypto.randomBytes(16).toString("hex"),
      name: customerName,
      email: customerEmail.toLowerCase().trim(),
      plan: planFromNotes || "pro",
      paymentStatus: "completed",
      status: "pending_verification",
      transactionId: payment.id,
      paymentProvider: "razorpay",
      createdAt: new Date().toISOString(),
    });
  }

  return { received: true, queued: true, email: customerEmail };
}
