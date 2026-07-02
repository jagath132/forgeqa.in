import nodemailer from "nodemailer";
import { getDb } from "../db.js";
import { sendProductKeyEmailResend } from "./resend.js";

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
  if (process.env.RESEND_API_KEY) {
    return sendProductKeyEmailResend(toEmail, productKey, customerName, completeUrl);
  }
  const transporter = await getTransporter();

  const from = process.env.SMTP_FROM || "jagathwork372@gmail.com";
  const subject = "Your ForgeKey Product Key";
  const buttonUrl = completeUrl || (process.env.APP_URL || "http://127.0.0.1:5173") + "/auth/complete-registration?email=" + encodeURIComponent(toEmail);

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #F59E0B;">ForgeKey</h1>
    <p style="color: #888;">License Activation</p>
  </div>
  <p>Hello${customerName ? " " + customerName : ""},</p>
  <p>Thank you for purchasing ForgeKey! Your product key is:</p>
  <div style="text-align: center; margin: 30px 0; padding: 20px; background: #1a1a1a; border-radius: 8px; border: 2px dashed #F59E0B;">
    <h2 style="font-family: 'Courier New', monospace; letter-spacing: 3px; color: #FBBF24; font-size: 24px; margin: 0;">${productKey}</h2>
  </div>
   <p style="margin: 24px 0 8px;"><a href="${buttonUrl}" style="color: #F59E0B; font-size: 14px;">Click here to activate your account &rarr;</a></p>
   <p style="color: #888; font-size: 12px; margin-top: 24px;">If you did not purchase ForgeKey, please ignore this email.</p>
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

  if (filter.search) {
    const re = { $regex: filter.search, $options: "i" };
    query.$or = [
      { to: re },
      { productKey: re },
      { subject: re },
    ];
  }
  if (filter.status && filter.status !== "all") {
    query.status = filter.status;
  }
  if (filter.to) query.to = { $regex: filter.to, $options: "i" };
  if (filter.dateFrom || filter.dateTo) {
    query.sentAt = {};
    if (filter.dateFrom) query.sentAt.$gte = filter.dateFrom;
    if (filter.dateTo) query.sentAt.$lte = filter.dateTo;
  }

  const page = Math.max(parseInt(filter.page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(filter.pageSize, 10) || 50, 1), 200);
  const skip = (page - 1) * pageSize;

  const total = await logColl().countDocuments(query);
  const docs = await logColl()
    .find(query)
    .sort({ sentAt: -1 })
    .skip(skip)
    .limit(pageSize)
    .toArray();

  return {
    logs: docs.map((d) => ({
      id: d._id.toString(),
      to: d.to,
      subject: d.subject,
      productKey: d.productKey,
      status: d.status,
      error: d.error || null,
      sentAt: d.sentAt,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function resendEmail(logId) {
  const { ObjectId } = await import("mongodb");
  const doc = await logColl().findOne({ _id: new ObjectId(logId) });
  if (!doc) throw new Error("Email log entry not found.");

  const result = await sendProductKeyEmail(doc.to, doc.productKey, "");
  return result;
}
