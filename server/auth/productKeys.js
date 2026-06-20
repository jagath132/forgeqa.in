import crypto from "node:crypto";
import { getDb } from "../db.js";

const PRODUCT_KEY_REGEX = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}$/;

export function isValidKeyFormat(key) {
  return PRODUCT_KEY_REGEX.test(key);
}

function keyColl() {
  return getDb().collection("product_keys");
}

export async function validateProductKey(key) {
  if (!isValidKeyFormat(key)) return null;
  const doc = await keyColl().findOne({ key: key.toUpperCase() });
  if (!doc) return null;
  if (doc.status === "used") return null;
  if (doc.expiresAt && new Date(doc.expiresAt) < new Date()) return null;
  return { key: doc.key, status: doc.status, customerEmail: doc.customerEmail || null };
}

export async function claimProductKey(key, userId, userEmail) {
  const result = await keyColl().updateOne(
    { key: key.toUpperCase(), status: { $ne: "used" } },
    {
      $set: {
        status: "used",
        usedBy: userId,
        usedAt: new Date().toISOString(),
        registeredEmail: userEmail,
      },
    }
  );
  return result.modifiedCount > 0;
}

export async function findProductKeyByEmail(email) {
  return keyColl().findOne({ customerEmail: email.toLowerCase().trim() });
}

export async function findProductKeyByUserId(userId) {
  return keyColl().findOne({ usedBy: userId });
}

export async function getKeyStats() {
  const total = await keyColl().countDocuments();
  const used = await keyColl().countDocuments({ status: "used" });
  const available = await keyColl().countDocuments({ status: "available" });
  const expired = await keyColl().countDocuments({ status: "expired" });
  return { total, used, available, expired };
}

const KEY_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomGroup() {
  let group = "";
  for (let i = 0; i < 5; i++) {
    group += KEY_CHARS[crypto.randomInt(KEY_CHARS.length)];
  }
  return group;
}

export function generateSingleKey() {
  const groups = [];
  for (let i = 0; i < 5; i++) {
    groups.push(randomGroup());
  }
  return groups.join("-");
}

export async function generateProductKeys(count, metadata = {}) {
  const keys = [];
  const existing = new Set();
  const existingDocs = await keyColl().find({}, { projection: { key: 1 } }).toArray();
  for (const doc of existingDocs) existing.add(doc.key);

  const batch = [];
  for (let i = 0; i < count; i++) {
    let key;
    do { key = generateSingleKey(); } while (existing.has(key));
    existing.add(key);
    keys.push(key);
    batch.push({
      key,
      status: "available",
      customerEmail: metadata.customerEmail || null,
      usedBy: null,
      usedAt: null,
      createdAt: new Date().toISOString(),
      expiresAt: metadata.expiresAt || null,
      notes: metadata.notes || null,
    });
  }

  if (batch.length) {
    await keyColl().insertMany(batch);
  }

  return keys;
}

export async function listProductKeys(filter = {}) {
  const query = {};
  if (filter.status) query.status = filter.status;
  if (filter.email) query.$or = [
    { customerEmail: { $regex: filter.email, $options: "i" } },
    { registeredEmail: { $regex: filter.email, $options: "i" } },
  ];

  const docs = await keyColl()
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();

  return docs.map((d) => ({
    id: d._id.toString(),
    key: d.key,
    status: d.status,
    customerEmail: d.customerEmail || null,
    registeredEmail: d.registeredEmail || null,
    usedBy: d.usedBy || null,
    usedAt: d.usedAt || null,
    createdAt: d.createdAt,
    expiresAt: d.expiresAt || null,
    notes: d.notes || null,
  }));
}

export async function revokeProductKey(key) {
  const result = await keyColl().updateOne(
    { key: key.toUpperCase() },
    { $set: { status: "expired" } }
  );
  return result.modifiedCount > 0;
}
