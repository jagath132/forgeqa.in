import { getDb } from '../db.js';

const WINDOW_MS = 15 * 60 * 1000;
const IS_DEV = process.env.NODE_ENV !== 'production';
const MAX_REQUESTS = IS_DEV ? 100 : 10;

// In-memory cache to make repeated checks instant (0ms latency)
const lockoutCache = new Map(); // identifier -> { lockedUntil, cachedAt }

export async function checkRateLimit(ip, endpoint = 'auth') {
  const db = getDb();
  const now = Date.now();

  const doc = await db.collection('rate_limits').findOne({ ip, endpoint });
  if (!doc || !doc.resetAt || doc.resetAt <= now) {
    // New window or expired window: set count to 1
    await db.collection('rate_limits').updateOne(
      { ip, endpoint },
      {
        $set: {
          count: 1,
          resetAt: now + WINDOW_MS,
          expiresAt: new Date(now + WINDOW_MS + 60000),
        },
      },
      { upsert: true }
    );
    return true;
  }

  if (doc.count >= MAX_REQUESTS) {
    return false;
  }

  await db.collection('rate_limits').updateOne({ ip, endpoint }, { $inc: { count: 1 } });
  return true;
}

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000;

export async function checkAccountLockout(identifier) {
  const now = Date.now();
  const cached = lockoutCache.get(identifier);
  if (cached && now - cached.cachedAt < 10000) {
    if (!cached.lockedUntil || cached.lockedUntil <= now) {
      return false;
    }
    return true;
  }

  const db = getDb();
  const record = await db
    .collection('rate_limits')
    .findOne({ ip: `lockout:${identifier}`, endpoint: 'lockout' });

  if (!record) {
    lockoutCache.set(identifier, { lockedUntil: 0, cachedAt: now });
    return false;
  }

  if (!record.lockedUntil || record.lockedUntil < now) {
    if (record.lockedUntil) {
      db.collection('rate_limits')
        .deleteOne({ ip: `lockout:${identifier}`, endpoint: 'lockout' })
        .catch(() => {});
    }
    lockoutCache.set(identifier, { lockedUntil: 0, cachedAt: now });
    return false;
  }

  lockoutCache.set(identifier, { lockedUntil: record.lockedUntil, cachedAt: now });
  return true;
}

export async function recordFailedAttempt(identifier) {
  const db = getDb();
  const lockoutKey = `lockout:${identifier}`;
  const now = Date.now();

  const result = await db.collection('rate_limits').findOneAndUpdate(
    { ip: lockoutKey, endpoint: 'lockout', lockedUntil: { $exists: true, $gt: now } },
    {
      $inc: { attempts: 1 },
      $set: { lastAttempt: now, expiresAt: new Date(now + LOCKOUT_DURATION + 60000) },
    },
    { returnDocument: 'after', upsert: false }
  );

  if (result) {
    if (result.attempts + 1 >= LOCKOUT_THRESHOLD) {
      const lockedUntil = now + LOCKOUT_DURATION;
      await db
        .collection('rate_limits')
        .updateOne({ ip: lockoutKey, endpoint: 'lockout' }, { $set: { lockedUntil } });
      lockoutCache.set(identifier, { lockedUntil, cachedAt: now });
    }
    return;
  }

  const existing = await db
    .collection('rate_limits')
    .findOne({ ip: lockoutKey, endpoint: 'lockout' });
  const baseAttempts =
    existing?.lockedUntil && existing.lockedUntil < now ? 0 : existing?.attempts || 0;
  const newAttempts = baseAttempts + 1;
  const update = {
    attempts: newAttempts,
    lastAttempt: now,
    expiresAt: new Date(now + LOCKOUT_DURATION + 60000),
  };
  if (newAttempts >= LOCKOUT_THRESHOLD) {
    update.lockedUntil = now + LOCKOUT_DURATION;
    lockoutCache.set(identifier, { lockedUntil: update.lockedUntil, cachedAt: now });
  }
  await db
    .collection('rate_limits')
    .updateOne({ ip: lockoutKey, endpoint: 'lockout' }, { $set: update }, { upsert: true });
}

export async function clearLockout(identifier) {
  lockoutCache.delete(identifier);
  const db = getDb();
  await db
    .collection('rate_limits')
    .deleteOne({ ip: `lockout:${identifier}`, endpoint: 'lockout' });
}
