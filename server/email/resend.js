import { Resend } from 'resend';
import { getPasswordResetEmailHtml, getProductKeyEmailHtml } from './templates.js';

let resendClient = null;
let resendFailed = false;

function getResend() {
  if (resendFailed) return null;
  if (!resendClient) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      resendFailed = true;
      return null;
    }
    resendClient = new Resend(key);
  }
  return resendClient;
}
function getFromEmail() {
  return process.env.RESEND_FROM || 'ForgeQA <onboarding@resend.dev>';
}

export async function sendProductKeyEmailResend(to, productKey, customerName) {
  const client = getResend();
  if (!client) return false;

  const sender = getFromEmail();
  const html = getProductKeyEmailHtml(to, productKey, customerName);
  const { data, error } = await client.emails.send({
    from: sender,
    to: [to],
    subject: 'Your ForgeQA Product License Key',
    html,
  });

  if (error) {
    console.error('Resend product key email failed:', error);
    if (error.statusCode === 401 || error.message?.includes('invalid')) {
      resendFailed = true;
      console.warn('Resend API key invalid — disabling Resend for this session');
    }
    return false;
  }
  console.log(`Product key email sent via Resend to ${to}, id=${data?.id}`);
  return true;
}

export async function sendPasswordResetEmailResend(to, resetUrl) {
  const client = getResend();
  if (!client) return false;

  const sender = getFromEmail();
  const resetHtml = getPasswordResetEmailHtml(to, resetUrl);

  const { data, error } = await client.emails.send({
    from: sender,
    to: [to],
    subject: 'Reset Your ForgeQA Password',
    html: resetHtml,
  });

  if (error) {
    console.error('Resend password reset email failed:', error);
    if (error.statusCode === 401 || error.message?.includes('invalid')) {
      resendFailed = true;
      console.warn('Resend API key invalid — disabling Resend for this session');
    }
    return false;
  }
  console.log(`Password reset email sent via Resend to ${to}, id=${data?.id}`);
  return true;
}

export async function sendSupportEmailResend({ name, email, subject, message }) {
  const client = getResend();
  if (!client) return false;
  const adminEmail = process.env.SUPPORT_EMAIL || 'jagathwork372@gmail.com';
  const sender = getFromEmail();
  const { data, error } = await client.emails.send({
    from: sender,
    to: [adminEmail],
    replyTo: email,
    subject: `[Support] ${subject || 'Support Request'} — from ${name}`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#16161f;border:1px solid #2a2a3d;border-radius:16px;overflow:hidden"><tr><td style="padding:32px 32px 0" align="center"><h1 style="color:#ededf5;font-size:20px;font-weight:700;margin:0 0 4px">Support Request</h1><p style="color:#6b6b8a;font-size:13px;margin:0 0 24px">From the ForgeQA app</p></td></tr><tr><td style="padding:0 32px 32px"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:8px 0"><span style="color:#6b6b8a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Name</span></td></tr><tr><td style="padding:0 0 12px;color:#ededf5;font-size:14px">${name}</td></tr><tr><td style="padding:8px 0"><span style="color:#6b6b8a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Email</span></td></tr><tr><td style="padding:0 0 12px;color:#ededf5;font-size:14px">${email}</td></tr><tr><td style="padding:8px 0"><span style="color:#6b6b8a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Subject</span></td></tr><tr><td style="padding:0 0 12px;color:#ededf5;font-size:14px">${subject || 'Support Request'}</td></tr><tr><td style="padding:8px 0"><span style="color:#6b6b8a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Message</span></td></tr><tr><td style="padding:0 0 12px;color:#ededf5;font-size:14px;line-height:1.6">${message}</td></tr></table></td></tr></table><p style="color:#4a4a5a;font-size:11px;margin-top:24px">&copy; ${new Date().getFullYear()} ForgeQA. All rights reserved.</p></td></tr></table></body></html>`,
  });

  if (error) {
    console.error('Resend support email failed:', error);
    if (error.statusCode === 401 || error.message?.includes('invalid')) {
      resendFailed = true;
      console.warn('Resend API key invalid — disabling Resend for this session');
    }
    return false;
  }
  console.log(`Support email sent via Resend from ${email}, id=${data?.id}`);
  return true;
}
