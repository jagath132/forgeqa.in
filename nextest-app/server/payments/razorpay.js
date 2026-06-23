export async function createRazorpayOrder({ pendingId, email: _email, plan, name: _name }) {
  void _email;
  void _name;
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay not configured");

  const amounts = { pro: 2999, enterprise: 9999 };
  const amount = amounts[plan];
  if (!amount) throw new Error(`No amount configured for plan: ${plan}`);

  const orderId = `order_${pendingId}_${Date.now()}`;
  return { orderId, amount, currency: "INR", keyId };
}
