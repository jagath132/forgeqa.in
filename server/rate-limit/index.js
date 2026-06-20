import { getDb } from "../db.js";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 10;

export async function checkRateLimit(ip, endpoint = "auth") {
  const db = getDb();
  const now = Date.now();

  await db.collection("rate_limits").deleteMany({ expiresAt: { $lt: new Date() } });

  const result = await db.collection("rate_limits").findOneAndUpdate(
    { ip, endpoint, resetAt: { $gt: now }, count: { $lt: MAX_REQUESTS } },
    { $inc: { count: 1 } },
    { returnDocument: "after" }
  );
  if (result) return true;

  const expired = await db.collection("rate_limits").findOneAndUpdate(
    { ip, endpoint, $or: [{ resetAt: { $lte: now } }, { resetAt: { $exists: false } }] },
    { $set: { count: 1, resetAt: now + WINDOW_MS, expiresAt: new Date(now + WINDOW_MS + 60000) } },
    { returnDocument: "after" }
  );
  if (expired) return true;

  const existing = await db.collection("rate_limits").findOne({ ip, endpoint });
  if (existing && existing.count >= MAX_REQUESTS) return false;

  await db.collection("rate_limits").updateOne(
    { ip, endpoint },
    { $setOnInsert: { count: 1, resetAt: now + WINDOW_MS, expiresAt: new Date(now + WINDOW_MS + 60000) } },
    { upsert: true }
  );
  return true;
}

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000;

export async function checkAccountLockout(identifier) {
  const db = getDb();
  const record = await db.collection("rate_limits").findOne({ ip: `lockout:${identifier}`, endpoint: "lockout" });
  if (!record) return false;
  if (!record.lockedUntil || record.lockedUntil < Date.now()) {
    if (record.lockedUntil) {
      await db.collection("rate_limits").deleteOne({ ip: `lockout:${identifier}`, endpoint: "lockout" });
    }
    return false;
  }
  return true;
}

export async function recordFailedAttempt(identifier) {
  const db = getDb();
  const lockoutKey = `lockout:${identifier}`;
  const now = Date.now();

  const result = await db.collection("rate_limits").findOneAndUpdate(
    { ip: lockoutKey, endpoint: "lockout", lockedUntil: { $exists: true, $gt: now } },
    { $inc: { attempts: 1 }, $set: { lastAttempt: now, expiresAt: new Date(now + LOCKOUT_DURATION + 60000) } },
    { returnDocument: "after", upsert: false }
  );

  if (result) {
    if (result.attempts + 1 >= LOCKOUT_THRESHOLD) {
      await db.collection("rate_limits").updateOne(
        { ip: lockoutKey, endpoint: "lockout" },
        { $set: { lockedUntil: now + LOCKOUT_DURATION } }
      );
    }
    return;
  }

  const existing = await db.collection("rate_limits").findOne({ ip: lockoutKey, endpoint: "lockout" });
  const baseAttempts = (existing?.lockedUntil && existing.lockedUntil < now) ? 0 : (existing?.attempts || 0);
  const newAttempts = baseAttempts + 1;
  const update = { attempts: newAttempts, lastAttempt: now, expiresAt: new Date(now + LOCKOUT_DURATION + 60000) };
  if (newAttempts >= LOCKOUT_THRESHOLD) {
    update.lockedUntil = now + LOCKOUT_DURATION;
  }
  await db.collection("rate_limits").updateOne(
    { ip: lockoutKey, endpoint: "lockout" },
    { $set: update },
    { upsert: true }
  );
}

export async function clearLockout(identifier) {
  const db = getDb();
  await db.collection("rate_limits").deleteOne({ ip: `lockout:${identifier}`, endpoint: "lockout" });
}
