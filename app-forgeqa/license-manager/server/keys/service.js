import crypto from "node:crypto";
import { ObjectId } from "mongodb";
import { getDb } from "../db.js";

function keyColl() {
  return getDb().collection("product_keys");
}

const KEY_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomGroup() {
  let group = "";
  for (let i = 0; i < 5; i++) {
    group += KEY_CHARS[crypto.randomInt(KEY_CHARS.length)];
  }
  return group;
}

function generateSingleKey() {
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
  if (filter.email) {
    query.$or = [
      { customerEmail: { $regex: filter.email, $options: "i" } },
      { registeredEmail: { $regex: filter.email, $options: "i" } },
    ];
  }

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

export async function getKeyStats() {
  const total = await keyColl().countDocuments();
  const used = await keyColl().countDocuments({ status: "used" });
  const available = await keyColl().countDocuments({ status: "available" });
  const expired = await keyColl().countDocuments({ status: "expired" });
  return { total, used, available, expired };
}

export async function assignKeyToCustomer(email) {
  const key = await keyColl().findOneAndUpdate(
    { status: "available", $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date().toISOString() } }] },
    { $set: { customerEmail: email.toLowerCase().trim() } },
    { returnDocument: "after" }
  );
  return key;
}

export async function updateProductKey(id, updates) {
  const allowed = {};
  if (updates.notes !== undefined) allowed.notes = updates.notes;
  if (updates.customerEmail !== undefined) allowed.customerEmail = updates.customerEmail.toLowerCase().trim();
  if (Object.keys(allowed).length === 0) return false;
  const result = await keyColl().updateOne(
    { _id: new ObjectId(id) },
    { $set: allowed }
  );
  return result.modifiedCount > 0;
}

export async function deleteProductKey(id) {
  const result = await keyColl().deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}
