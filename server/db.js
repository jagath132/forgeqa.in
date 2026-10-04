import fs from 'node:fs';
import path from 'node:path';
import { MongoClient } from 'mongodb';

// Ensure .env is loaded if MONGO_URI is not set yet
if (!process.env.MONGO_URI && typeof process.loadEnvFile === 'function') {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    try {
      process.loadEnvFile(envPath);
    } catch {
      // ignore
    }
  }
}

function getMongoUri() {
  if (process.env.MONGO_URI) {
    return process.env.MONGO_URI;
  }
  if (process.env.NODE_ENV === 'production') {
    console.error(
      '⚠️  MONGO_URI env var not set — falling back to localhost:27017 (will fail in production)'
    );
  }
  return 'mongodb://localhost:27017';
}

const MONGO_URI = getMongoUri();
// Whether a database URL was actually provided (env var or .env file) — used
// to tell "not configured" apart from "configured but unreachable".
const MONGO_URI_CONFIGURED = Boolean(process.env.MONGO_URI);
const DB_NAME = process.env.MONGO_DB_NAME || 'forgeqa';

export function isMongoUriConfigured() {
  return MONGO_URI_CONFIGURED;
}

if (!MONGO_URI_CONFIGURED && (process.env.VERCEL || process.env.NODE_ENV === 'production')) {
  console.error(
    '[DB] MONGO_URI is not set — falling back to mongodb://localhost:27017, which cannot work here. ' +
      'Set MONGO_URI in the deployment environment (Vercel: Project Settings → Environment Variables).'
  );
}

let client = null;
let db = null;
let indexesEnsured = false;

export async function connectDb() {
  if (db) return db;
  const nextClient = new MongoClient(MONGO_URI, {
    maxPoolSize: 20,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 30000,
  });
  try {
    await nextClient.connect();
  } catch (err) {
    // Don't leak a half-open client on a failed attempt — the next call
    // builds a fresh one.
    await nextClient.close().catch(() => {});
    throw err;
  }
  client = nextClient;
  db = client.db(DB_NAME);
  if (!indexesEnsured) {
    await ensureIndexes(db);
    indexesEnsured = true;
  }
  return db;
}

export function getDb() {
  if (!db) throw new Error('Database not connected. Call connectDb() first.');
  return db;
}

export async function closeDb() {
  if (client) await client.close();
  client = null;
  db = null;
  indexesEnsured = false;
}

async function ensureIndexes(targetDb) {
  const indexPromises = [
    targetDb.collection('users').createIndex({ email: 1 }, { unique: true }),
    targetDb.collection('user_api_keys').createIndex({ userId: 1, provider: 1 }, { unique: true }),
    targetDb.collection('user_data').createIndex({ userId: 1, key: 1 }, { unique: true }),
    targetDb.collection('password_reset_tokens').createIndex({ token: 1 }, { unique: true }),
    targetDb.collection('password_reset_tokens').createIndex({ userId: 1 }, { unique: true }),
    targetDb.collection('knowledge_files').createIndex({ userId: 1 }),
    targetDb.collection('knowledge_chunks').createIndex({ fileId: 1 }),
    targetDb.collection('regression_runs').createIndex({ userId: 1, startedAt: -1 }),
    targetDb
      .collection('regression_builds')
      .createIndex({ userId: 1, platform: 1, uploadedAt: -1 }),
    targetDb
      .collection('regression_webhooks')
      .createIndex({ userId: 1, platform: 1 }, { unique: true }),
    targetDb.collection('product_keys').createIndex({ key: 1 }, { unique: true }),
    targetDb.collection('product_keys').createIndex({ customerEmail: 1 }),
    targetDb.collection('product_keys').createIndex({ status: 1 }),
    targetDb.collection('admins').createIndex({ email: 1 }, { unique: true }),
    targetDb.collection('rate_limits').createIndex({ ip: 1, endpoint: 1 }, { unique: true }),
    targetDb.collection('rate_limits').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    targetDb.collection('refresh_tokens').createIndex({ hashedToken: 1 }, { unique: true }),
    targetDb.collection('refresh_tokens').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    targetDb.collection('refresh_tokens').createIndex({ userId: 1 }),
    targetDb.collection('audit_logs').createIndex({ createdAt: -1 }),
    targetDb.collection('audit_logs').createIndex({ adminId: 1 }),
    targetDb.collection('audit_logs').createIndex({ action: 1 }),
    targetDb.collection('subscription_plans').createIndex({ tier: 1 }, { unique: true }),
    targetDb.collection('plans').createIndex({ id: 1 }, { unique: true }),
    targetDb.collection('plans').createIndex({ price: 1 }),
    targetDb.collection('enterprise_inquiries').createIndex({ email: 1 }),
    targetDb.collection('enterprise_inquiries').createIndex({ createdAt: -1 }),
    targetDb.collection('pending_registrations').createIndex({ email: 1 }, { unique: true }),
    targetDb
      .collection('pending_registrations')
      .createIndex({ pendingId: 1 }, { unique: true, sparse: true }),
    targetDb
      .collection('pending_registrations')
      .createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 }),
    targetDb.collection('pending_registrations').createIndex({ status: 1 }),
    targetDb.collection('ai_model_alerts').createIndex({ userId: 1, dismissed: 1 }),
    targetDb.collection('ai_model_alerts').createIndex({ dedupeKey: 1 }),
    targetDb.collection('ai_model_alerts').createIndex({ createdAt: -1 }),
    // Live model sync cache (one doc per provider, upserted on each sync)
    targetDb.collection('ai_model_sync').createIndex({ provider: 1 }, { unique: true }),
  ];

  await Promise.allSettled(indexPromises);
  try {
    const { ensureBillingIndexes } = await import('./billing/schema.js');
    await ensureBillingIndexes(targetDb);
  } catch (_e) {
    // ignore if schema not loaded
  }
}
