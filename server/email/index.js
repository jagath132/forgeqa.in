import nodemailer from 'nodemailer';
import {
  sendProductKeyEmailResend,
  sendPasswordResetEmailResend,
  sendSupportEmailResend,
} from './resend.js';
import { getPasswordResetEmailHtml, getProductKeyEmailHtml } from './templates.js';

async function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // 1. Direct Gmail Service support
  if (
    process.env.SMTP_SERVICE === 'gmail' ||
    (user && user.toLowerCase().endsWith('@gmail.com') && !host) ||
    (host && host.includes('gmail'))
  ) {
    if (user && pass) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
    }
  }

  // 2. Standard custom SMTP host
  if (host && host !== 'smtp.ethereal.email' && (pass || user)) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user: user || 'apikey', pass },
    });
  }

  return null;
}

function getFromEmail() {
  return (
    process.env.SMTP_FROM ||
    process.env.RESEND_FROM?.match(/<(.+)>/)?.[1] ||
    'onboarding@resend.dev'
  );
}

function getSenderName() {
  return (
    process.env.RESEND_FROM?.match(/^([^<]+)/)?.[1]?.trim() || process.env.APP_NAME || 'ForgeQA'
  );
}

export async function sendPasswordResetEmail(to, resetUrl) {
  // 1. Try Resend if configured
  if (process.env.RESEND_API_KEY) {
    try {
      const result = await sendPasswordResetEmailResend(to, resetUrl);
      if (result) {
        console.log(`Password reset email delivered via Resend to: ${to}`);
        return true;
      }
    } catch (err) {
      console.warn('[Email] Resend attempt failed, checking SMTP fallback:', err.message);
    }
  }

  // 2. Try configured SMTP transport
  const transport = await getTransport();
  if (transport) {
    const html = getPasswordResetEmailHtml(to, resetUrl);
    const fromEmail = getFromEmail();
    const brand = getSenderName();

    try {
      await transport.sendMail({
        from: `"${brand}" <${fromEmail}>`,
        to,
        subject: 'Reset Your ForgeQA Password',
        html,
      });
      console.log(`Password reset email sent via SMTP to ${to}`);
      return true;
    } catch (err) {
      console.error('[Email] Failed to send password reset email via SMTP:', err.message);
      return false;
    }
  }

  console.warn(
    `⚠️ [Email] No active email transport configured in production. Password reset link: ${resetUrl}`
  );
  return false;
}

export async function sendProductKeyEmail(to, productKey, customerName) {
  if (process.env.RESEND_API_KEY) {
    try {
      const result = await sendProductKeyEmailResend(to, productKey, customerName);
      if (result) return true;
    } catch (err) {
      console.warn('Resend failed, falling back to SMTP:', err.message);
    }
  }
  const html = getProductKeyEmailHtml(to, productKey, customerName);

  const transport = await getTransport();
  if (transport) {
    try {
      await transport.sendMail({
        from: `"${BRAND}" <${FROM_EMAIL}>`,
        to,
        subject: 'Your ForgeQA Product Key — Complete Registration',
        html,
      });
      console.log(`Product key email sent via SMTP to ${to}`);
      return true;
    } catch (err) {
      console.error('Failed to send product key email via SMTP:', err.message);
      return false;
    }
  }

  console.warn(
    `⚠️ No active real email transport configured. Product key generated for ${to}: ${productKey}`
  );
  return false;
}

export async function sendSupportEmail({ name, email, subject, message }) {
  if (process.env.RESEND_API_KEY) {
    try {
      const result = await sendSupportEmailResend({ name, email, subject, message });
      if (result) return true;
    } catch (err) {
      console.warn('Resend failed, checking SMTP fallback:', err.message);
    }
  }
  const adminEmail = process.env.SUPPORT_EMAIL || 'jagathwork372@gmail.com';
  const html = [
    '<!DOCTYPE html><html><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '</head><body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">',
    '<tr><td align="center" style="padding:40px 20px">',
    '<table role="presentation" width="480" cellpadding="0" cellspacing="0"',
    ' style="background:#16161f;border:1px solid #2a2a3d;border-radius:16px;overflow:hidden">',
    '<tr><td style="padding:32px 32px 0" align="center">',
    '<h1 style="color:#ededf5;font-size:20px;font-weight:700;margin:0 0 4px">Support Request</h1>',
    '<p style="color:#6b6b8a;font-size:13px;margin:0 0 24px">From the ForgeQA app</p>',
    '</td></tr>',
    '<tr><td style="padding:0 32px 32px">',
    '<table width="100%" cellpadding="0" cellspacing="0">',
    '<tr><td style="padding:8px 0"><span style="color:#6b6b8a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Name</span></td></tr>',
    `<tr><td style="padding:0 0 12px;color:#ededf5;font-size:14px">${name}</td></tr>`,
    '<tr><td style="padding:8px 0"><span style="color:#6b6b8a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Email</span></td></tr>',
    `<tr><td style="padding:0 0 12px;color:#ededf5;font-size:14px">${email}</td></tr>`,
    '<tr><td style="padding:8px 0"><span style="color:#6b6b8a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Subject</span></td></tr>',
    `<tr><td style="padding:0 0 12px;color:#ededf5;font-size:14px">${subject || 'Support Request'}</td></tr>`,
    '<tr><td style="padding:8px 0"><span style="color:#6b6b8a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Message</span></td></tr>',
    `<tr><td style="padding:0 0 12px;color:#ededf5;font-size:14px;line-height:1.6">${message}</td></tr>`,
    '</table></td></tr></table>',
    '<p style="color:#4a4a5a;font-size:11px;margin-top:24px">',
    `&copy; ${new Date().getFullYear()} ForgeQA. All rights reserved.</p>`,
    '</td></tr></table></body></html>',
  ].join('');

  const transport = await getTransport();
  if (transport) {
    try {
      await transport.sendMail({
        from: `"${BRAND}" <${FROM_EMAIL}>`,
        to: adminEmail,
        replyTo: email,
        subject: `[Support] ${subject || 'Support Request'} — from ${name}`,
        html,
      });
      console.log(`Support email sent via SMTP from ${email}`);
      return true;
    } catch (err) {
      console.error('Failed to send support email via SMTP:', err.message);
      return false;
    }
  }

  console.warn(
    `⚠️ No active real email transport configured. Support message from ${email} logged.`
  );
  return false;
}
