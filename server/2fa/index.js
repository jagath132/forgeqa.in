import crypto from 'node:crypto';
import QRCode from 'qrcode';
import base32 from 'base32-encode';
import { getDb } from '../db.js';

function base32ToBuffer(b32Str) {
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = String(b32Str || '')
    .toUpperCase()
    .replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const output = [];
  for (let i = 0; i < clean.length; i++) {
    value = (value << 5) | ALPHABET.indexOf(clean[i]);
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

function getSecretBytes(secret) {
  if (!secret) return Buffer.alloc(0);
  const trimmed = String(secret).trim();
  if (/^[A-Z2-7=]+$/i.test(trimmed)) {
    return base32ToBuffer(trimmed);
  }
  return Buffer.from(trimmed, 'base64url');
}

export function generateTOTPSecret() {
  const raw = crypto.randomBytes(20);
  const uint8 = new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength);
  return base32(uint8, 'RFC4648');
}

export function generateTOTPUri(email, secret, issuer = 'ForgeQA') {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

async function generateQRCodeDataUrl(uri) {
  return QRCode.toDataURL(uri, {
    width: 200,
    margin: 2,
    color: { dark: '#1E293B', light: '#FFFFFF' },
  });
}

function hmacSha1(key, message) {
  const keyBytes = getSecretBytes(key);
  const hmac = crypto.createHmac('sha1', keyBytes);
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
  return String(truncate(hmac)).padStart(6, '0');
}

export function verifyTOTP(secret, token) {
  if (!token) return false;
  const cleanToken = String(token).trim().replace(/[\s-]/g, '');
  const now = Date.now();
  for (let i = -1; i <= 1; i++) {
    const expected = generateTOTP(secret, now + i * 30000);
    if (expected === cleanToken) return true;
  }
  return false;
}

export async function setup2FA(userId, email) {
  const secret = generateTOTPSecret();
  const uri = generateTOTPUri(email, secret);
  const qrCode = await generateQRCodeDataUrl(uri);
  const db = getDb();
  await db
    .collection('totp_secrets')
    .updateOne(
      { userId },
      { $set: { secret, enabled: false, createdAt: new Date().toISOString() } },
      { upsert: true }
    );
  return { secret, uri, qrCode };
}

export async function enable2FA(userId, token) {
  const db = getDb();
  const record = await db.collection('totp_secrets').findOne({ userId });
  if (!record) throw new Error('2FA not initialized. Call setup first.');
  if (!verifyTOTP(record.secret, token)) throw new Error('Invalid verification code.');
  await db
    .collection('totp_secrets')
    .updateOne({ userId }, { $set: { enabled: true, verifiedAt: new Date().toISOString() } });
  return true;
}

export async function verify2FA(userId, token) {
  const db = getDb();
  const record = await db.collection('totp_secrets').findOne({ userId });
  if (!record || !record.enabled) return true;
  return verifyTOTP(record.secret, token);
}

export async function is2FAEnabled(userId) {
  const db = getDb();
  const record = await db.collection('totp_secrets').findOne({ userId });
  return record?.enabled || false;
}

export async function disable2FA(userId) {
  const db = getDb();
  await db.collection('totp_secrets').deleteOne({ userId });
}

export async function get2FAStatus(userId) {
  const db = getDb();
  const record = await db.collection('totp_secrets').findOne({ userId });
  return { enabled: record?.enabled || false, setup: !!record };
}

const DEVICE_TOKEN_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days

export function generateDeviceToken() {
  return crypto.randomBytes(32).toString('hex');
}

export async function addTrustedDevice(userId, deviceName) {
  const db = getDb();
  const token = generateDeviceToken();
  const expiresAt = new Date(Date.now() + DEVICE_TOKEN_EXPIRY).toISOString();
  await db.collection('trusted_devices').insertOne({
    userId,
    token,
    deviceName: deviceName || 'Unknown Device',
    createdAt: new Date().toISOString(),
    expiresAt,
  });
  return { token, expiresAt };
}

export async function verifyTrustedDevice(userId, token) {
  const db = getDb();
  const device = await db.collection('trusted_devices').findOne({
    userId,
    token,
    expiresAt: { $gt: new Date().toISOString() },
  });
  return !!device;
}

export async function getTrustedDevices(userId) {
  const db = getDb();
  const devices = await db
    .collection('trusted_devices')
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();
  return devices.map((d) => ({
    id: d._id.toString(),
    deviceName: d.deviceName,
    createdAt: d.createdAt,
    expiresAt: d.expiresAt,
    isExpired: new Date(d.expiresAt) < new Date(),
  }));
}

export async function removeTrustedDevice(userId, deviceId) {
  const db = getDb();
  const { ObjectId } = await import('mongodb');
  await db.collection('trusted_devices').deleteOne({
    _id: new ObjectId(deviceId),
    userId,
  });
}

export async function removeAllTrustedDevices(userId) {
  const db = getDb();
  await db.collection('trusted_devices').deleteMany({ userId });
}
