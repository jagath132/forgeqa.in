import crypto from "node:crypto";
import { getDb } from "../db.js";

export function generateTOTPSecret() {
  const secret = crypto.randomBytes(20).toString("base64url");
  return secret;
}

export function generateTOTPUri(email, secret, issuer = "ForgeQA") {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

function hmacSha1(key, message) {
  const hmac = crypto.createHmac("sha1", Buffer.from(key, "base64url"));
  hmac.update(message);
  return hmac.digest();
}

function truncate(hmacResult) {
  const offset = hmacResult[hmacResult.length - 1] & 0x0f;
  const code =
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff);
  return code % 1000000;
}

function generateTOTP(secret, timestamp = Date.now()) {
  const timeStep = 30000;
  const counter = Math.floor(timestamp / timeStep);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigInt64BE(BigInt(counter));
  const hmac = hmacSha1(secret, counterBuf);
  return String(truncate(hmac)).padStart(6, "0");
}

export function verifyTOTP(secret, token) {
  const now = Date.now();
  for (let i = -1; i <= 1; i++) {
    const expected = generateTOTP(secret, now + i * 30000);
    if (expected === token) return true;
  }
  return false;
}

export async function setup2FA(userId, email) {
  const secret = generateTOTPSecret();
  const uri = generateTOTPUri(email, secret);
  const db = getDb();
  await db.collection("totp_secrets").updateOne(
    { userId },
    { $set: { secret, enabled: false, createdAt: new Date().toISOString() } },
    { upsert: true }
  );
  return { secret, uri };
}

export async function enable2FA(userId, token) {
  const db = getDb();
  const record = await db.collection("totp_secrets").findOne({ userId });
  if (!record) throw new Error("2FA not initialized. Call setup first.");
  if (!verifyTOTP(record.secret, token)) throw new Error("Invalid verification code.");
  await db.collection("totp_secrets").updateOne(
    { userId },
    { $set: { enabled: true, verifiedAt: new Date().toISOString() } }
  );
  return true;
}

export async function verify2FA(userId, token) {
  const db = getDb();
  const record = await db.collection("totp_secrets").findOne({ userId });
  if (!record || !record.enabled) return true;
  return verifyTOTP(record.secret, token);
}

export async function is2FAEnabled(userId) {
  const db = getDb();
  const record = await db.collection("totp_secrets").findOne({ userId });
  return record?.enabled || false;
}

export async function disable2FA(userId) {
  const db = getDb();
  await db.collection("totp_secrets").deleteOne({ userId });
}

export async function get2FAStatus(userId) {
  const db = getDb();
  const record = await db.collection("totp_secrets").findOne({ userId });
  return { enabled: record?.enabled || false, setup: !!record };
}
