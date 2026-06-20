import nodemailer from "nodemailer";
import { getDb } from "../db.js";

let etherealTransporter = null;

async function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  if (!etherealTransporter) {
    const account = await nodemailer.createTestAccount();
    etherealTransporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: account.user, pass: account.pass },
    });
    console.log("SMTP not configured — using Ethereal dev email. View at:", account.web);
  }
  return etherealTransporter;
}

function logColl() {
  return getDb().collection("email_logs");
}

export async function sendProductKeyEmail(toEmail, productKey, customerName, completeUrl) {
  const transporter = await getTransporter();

  const from = process.env.SMTP_FROM || "noreply@nextest.app";
  const subject = "Your NexTest Product Key";
  const buttonUrl = completeUrl || (process.env.APP_URL || "http://127.0.0.1:5173") + "/auth/complete-registration?email=" + encodeURIComponent(toEmail);

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #7c3aed;">NexTest</h1>
    <p style="color: #666;">License Activation</p>
  </div>
  <p>Hello${customerName ? " " + customerName : ""},</p>
  <p>Thank you for purchasing NexTest! Your product key is:</p>
  <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f5f3ff; border-radius: 8px; border: 2px dashed #7c3aed;">
    <h2 style="font-family: 'Courier New', monospace; letter-spacing: 3px; color: #7c3aed; font-size: 24px; margin: 0;">${productKey}</h2>
  </div>
  <p>To activate your license, click the button below:</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="${buttonUrl}" style="display: inline-block; padding: 14px 32px; background: #7c3aed; color: #fff; font-size: 16px; font-weight: 600; border-radius: 8px; text-decoration: none;">Complete Registration</a>
  </div>
  <p style="color: #666; font-size: 12px; margin-top: 40px;">If you did not purchase NexTest, please ignore this email.</p>
</body>
</html>`;

  try {
    const info = await transporter.sendMail({
      from,
      to: toEmail,
      subject,
      html,
    });

    await logColl().insertOne({
      to: toEmail,
      subject,
      productKey,
      messageId: info.messageId,
      status: "sent",
      sentAt: new Date().toISOString(),
    });

    return { success: true, messageId: info.messageId };
  } catch (err) {
    await logColl().insertOne({
      to: toEmail,
      subject,
      productKey,
      error: err.message,
      status: "failed",
      sentAt: new Date().toISOString(),
    });
    throw err;
  }
}

export async function getEmailLogs(filter = {}) {
  const query = {};
  if (filter.to) query.to = { $regex: filter.to, $options: "i" };

  const docs = await logColl()
    .find(query)
    .sort({ sentAt: -1 })
    .limit(200)
    .toArray();

  return docs.map((d) => ({
    id: d._id.toString(),
    to: d.to,
    subject: d.subject,
    productKey: d.productKey,
    status: d.status,
    error: d.error || null,
    sentAt: d.sentAt,
  }));
}
