import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}
const FROM = process.env.RESEND_FROM || "ForgeQA <noreply@forgeqa.in>";

export async function sendProductKeyEmailResend(to, productKey, customerName) {
  const baseUrl = process.env.APP_URL || "http://127.0.0.1:5173";
  const completeUrl = `${baseUrl}/auth/complete-registration?email=${encodeURIComponent(to)}`;

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to: [to],
    subject: "Your ForgeQA Product Key — Complete Registration",
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#16161f;border:1px solid #2a2a3d;border-radius:16px;overflow:hidden"><tr><td style="padding:32px 32px 0" align="center"><div style="display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-size:22px;font-weight:800;margin-bottom:16px">FQ</div><h1 style="color:#ededf5;font-size:20px;font-weight:700;margin:0 0 4px">Your ForgeQA Product Key</h1><p style="color:#6b6b8a;font-size:13px;margin:0 0 24px">Thank you for choosing ForgeQA${customerName ? ", " + customerName : ""}! Use the product key below to activate your account.</p></td></tr><tr><td align="center" style="padding:0 32px"><div style="background:#1e1e2a;border:2px dashed #7c3aed;border-radius:12px;padding:20px;margin-bottom:24px;font-family:'Courier New',monospace;font-size:22px;font-weight:700;letter-spacing:4px;color:#a78bfa;text-align:center">${productKey}</div></td></tr><tr><td align="center" style="padding:0 32px 32px"><a href="${completeUrl}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-size:14px;font-weight:600;border-radius:8px;text-decoration:none;box-shadow:0 4px 16px rgba(124,58,237,0.35)">Complete Registration</a><p style="color:#6b6b8a;font-size:12px;margin:16px 0 0;line-height:1.5">If you didn't sign up for ForgeQA, you can safely ignore this email.<br>Your product key is also shown above for manual entry.</p></td></tr></table><p style="color:#4a4a5a;font-size:11px;margin-top:24px">&copy; ${new Date().getFullYear()} ForgeQA. All rights reserved.</p></td></tr></table></body></html>`,
  });

  if (error) {
    console.error("Resend product key email failed:", error);
    return false;
  }
  console.log(`Product key email sent via Resend to ${to}, id=${data?.id}`);
  return true;
}

export async function sendPasswordResetEmailResend(to, resetUrl) {
  const { data, error } = await getResend().emails.send({
    from: FROM,
    to: [to],
    subject: "Reset Your ForgeQA Password",
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#16161f;border:1px solid #2a2a3d;border-radius:16px;overflow:hidden"><tr><td style="padding:32px 32px 0" align="center"><div style="display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-size:22px;font-weight:800;margin-bottom:16px">FQ</div><h1 style="color:#ededf5;font-size:20px;font-weight:700;margin:0 0 4px">Reset Your Password</h1><p style="color:#6b6b8a;font-size:13px;margin:0 0 24px">Click the button below to reset your password. This link expires in 1 hour.</p></td></tr><tr><td align="center" style="padding:0 32px 32px"><a href="${resetUrl}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-size:14px;font-weight:600;border-radius:8px;text-decoration:none;box-shadow:0 4px 16px rgba(124,58,237,0.35)">Reset Password</a><p style="color:#6b6b8a;font-size:12px;margin:16px 0 0;line-height:1.5">If you didn't request a password reset, you can safely ignore this email.<br>Your account security matters to us.</p></td></tr></table><p style="color:#4a4a5a;font-size:11px;margin-top:24px">&copy; ${new Date().getFullYear()} ForgeQA. All rights reserved.</p></td></tr></table></body></html>`,
  });

  if (error) {
    console.error("Resend password reset email failed:", error);
    return false;
  }
  console.log(`Password reset email sent via Resend to ${to}, id=${data?.id}`);
  return true;
}

export async function sendSupportEmailResend({ name, email, subject, message }) {
  const adminEmail = process.env.SUPPORT_EMAIL || "admin@forgeqa.in";
  const { data, error } = await getResend().emails.send({
    from: FROM,
    to: [adminEmail],
    replyTo: email,
    subject: `[Support] ${subject || "Support Request"} — from ${name}`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#16161f;border:1px solid #2a2a3d;border-radius:16px;overflow:hidden"><tr><td style="padding:32px 32px 0" align="center"><h1 style="color:#ededf5;font-size:20px;font-weight:700;margin:0 0 4px">Support Request</h1><p style="color:#6b6b8a;font-size:13px;margin:0 0 24px">From the ForgeQA app</p></td></tr><tr><td style="padding:0 32px 32px"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:8px 0"><span style="color:#6b6b8a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Name</span></td></tr><tr><td style="padding:0 0 12px;color:#ededf5;font-size:14px">${name}</td></tr><tr><td style="padding:8px 0"><span style="color:#6b6b8a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Email</span></td></tr><tr><td style="padding:0 0 12px;color:#ededf5;font-size:14px">${email}</td></tr><tr><td style="padding:8px 0"><span style="color:#6b6b8a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Subject</span></td></tr><tr><td style="padding:0 0 12px;color:#ededf5;font-size:14px">${subject || "Support Request"}</td></tr><tr><td style="padding:8px 0"><span style="color:#6b6b8a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Message</span></td></tr><tr><td style="padding:0 0 12px;color:#ededf5;font-size:14px;line-height:1.6">${message}</td></tr></table></td></tr></table><p style="color:#4a4a5a;font-size:11px;margin-top:24px">&copy; ${new Date().getFullYear()} ForgeQA. All rights reserved.</p></td></tr></table></body></html>`,
  });

  if (error) {
    console.error("Resend support email failed:", error);
    return false;
  }
  console.log(`Support email sent via Resend from ${email}, id=${data?.id}`);
  return true;
}
