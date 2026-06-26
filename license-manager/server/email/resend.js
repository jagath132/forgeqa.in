import { Resend } from "resend";
import { getDb } from "../db.js";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not set. Add it to your Vercel environment variables or .env file.");
  }
  return new Resend(key);
}
const FROM = process.env.RESEND_FROM || "ForgeKey <onboarding@resend.dev>";

function logColl() {
  return getDb().collection("email_logs");
}

export async function sendProductKeyEmailResend(toEmail, productKey, customerName, completeUrl) {
  const buttonUrl = completeUrl || (process.env.APP_URL || "http://127.0.0.1:5173") + "/auth/complete-registration?email=" + encodeURIComponent(toEmail);
  const subject = "Your ForgeKey Product Key";

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to: [toEmail],
    subject,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#0C0C0C;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#181818;border:1px solid #2E2E2E;border-radius:16px;overflow:hidden"><tr><td style="padding:32px 32px 0" align="center"><div style="display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,#F59E0B,#FBBF24);color:#fff;font-size:22px;font-weight:800;margin-bottom:16px">FK</div><h1 style="color:#F5F5F5;font-size:20px;font-weight:700;margin:0 0 4px">Your ForgeKey Product Key</h1><p style="color:#6B6B6B;font-size:13px;margin:0 0 24px">Thank you for choosing ForgeKey${customerName ? ", " + customerName : ""}! Use the product key below to activate your account.</p></td></tr><tr><td align="center" style="padding:0 32px"><div style="background:#222222;border:2px dashed #F59E0B;border-radius:12px;padding:20px;margin-bottom:24px;font-family:'Courier New',monospace;font-size:22px;font-weight:700;letter-spacing:4px;color:#FBBF24;text-align:center">${productKey}</div></td></tr><tr><td align="center" style="padding:0 32px 32px"><a href="${buttonUrl}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#F59E0B,#FBBF24);color:#fff;font-size:14px;font-weight:600;border-radius:8px;text-decoration:none;box-shadow:0 4px 16px rgba(245,158,11,0.35)">Complete Registration</a><p style="color:#6B6B6B;font-size:12px;margin:16px 0 0;line-height:1.5">If you didn't sign up for ForgeKey, you can safely ignore this email.<br>Your product key is also shown above for manual entry.</p></td></tr></table><p style="color:#4a4a4a;font-size:11px;margin-top:24px">&copy; ${new Date().getFullYear()} ForgeKey. All rights reserved.</p></td></tr></table></body></html>`,
  });

  if (error) {
    await logColl().insertOne({
      to: toEmail,
      subject,
      productKey,
      error: error.message,
      status: "failed",
      sentAt: new Date().toISOString(),
    });
    console.error("Resend product key email failed:", error);
    throw error;
  }

  await logColl().insertOne({
    to: toEmail,
    subject,
    productKey,
    messageId: data?.id,
    status: "sent",
    sentAt: new Date().toISOString(),
  });

  console.log(`Product key email sent via Resend to ${toEmail}, id=${data?.id}`);
  return { success: true, messageId: data?.id };
}
