import fs from 'node:fs';
import path from 'node:path';
import { MongoClient } from 'mongodb';

function loadEnvFile() {
  // Try Node 20.12+ built-in first
  if (typeof process.loadEnvFile === 'function') {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      try {
        process.loadEnvFile(envPath);
      } catch {
        /* ignore */
      }
    }
    return;
  }
  // Fallback: manual parse so dotenv isn't required as a hard dep here
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed
      .slice(eqIdx + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
    if (key && process.env[key] === undefined) process.env[key] = val;
  }
}

// Load .env eagerly so DB_NAME and MONGO_URI are always resolved correctly,
// even when this module is imported before the caller sets up process.env.
if (!process.env.MONGO_URI) loadEnvFile();

// Resolved lazily inside connectDb() so hot-reloads and env propagation order
// don't cause the wrong database name to be captured at import time.
function getMongoUri() {
  return process.env.MONGO_URI || 'mongodb://localhost:27017';
}
function getDbName() {
  return process.env.MONGO_DB_NAME || 'forgekey';
}

// Use a global cache so the MongoClient is reused across Vercel serverless
// warm invocations (the module may be re-evaluated between cold starts, but
// the global object persists within the same instance).
const globalWithMongo = globalThis;
if (!globalWithMongo.__mongoCache) {
  globalWithMongo.__mongoCache = { client: null, db: null };
}

export async function connectDb() {
  const cache = globalWithMongo.__mongoCache;
  // Return cached db if the connection is still alive
  if (cache.db) {
    try {
      await cache.client.db('admin').command({ ping: 1 });
      return cache.db;
    } catch {
      // Connection dropped — fall through to reconnect
      cache.client = null;
      cache.db = null;
    }
  }

  const mongoUri = getMongoUri();
  const dbName = getDbName();

  if (!process.env.MONGO_URI && process.env.NODE_ENV === 'production') {
    console.error(
      '⚠️  MONGO_URI env var not set — falling back to localhost:27017 (will fail in production)'
    );
  }
  console.log(
    `[db] Connecting to MongoDB: ${mongoUri.replace(/\/\/[^@]*@/, '//***@')} / db="${dbName}"`
  );

  cache.client = new MongoClient(mongoUri, {
    // Recommended for serverless: short socket timeout so stale connections
    // are detected quickly rather than hanging a Vercel function.
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
  await cache.client.connect();
  cache.db = cache.client.db(dbName);
  await ensureIndexes(cache.db);
  await seedDefaultPlans(cache.db);
  return cache.db;
}

async function seedDefaultPlans(db) {
  const count = await db.collection('plans').countDocuments();
  if (count > 0) return;
  const defaults = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      currency: 'usd',
      period: 'forever',
      description: 'Personal projects & evaluation',
      features: ['Up to 100 test cases/mo', '1 AI provider', 'Basic export', 'Community support'],
      popular: false,
      active: true,
      maxUsers: 1,
      maxTestCases: 100,
      aiProviders: 1,
      advancedExport: false,
      regressionTesting: false,
      prioritySupport: false,
      customIntegrations: false,
      onPremise: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 2900,
      currency: 'usd',
      period: 'monthly',
      description: 'Professional QA teams',
      features: [
        'Unlimited test cases',
        'All AI providers',
        'Advanced export (PDF/XLSX)',
        'Priority support',
        'Regression testing',
        'Team collaboration',
      ],
      popular: true,
      active: true,
      maxUsers: 10,
      maxTestCases: null,
      aiProviders: null,
      advancedExport: true,
      regressionTesting: true,
      prioritySupport: true,
      customIntegrations: false,
      onPremise: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 9900,
      currency: 'usd',
      period: 'monthly',
      description: 'Large-scale testing',
      features: [
        'Everything in Pro',
        'Unlimited team members',
        'Custom integrations',
        'Dedicated support',
        'SLA guarantee',
        'On-premise deployment',
      ],
      popular: false,
      active: true,
      maxUsers: null,
      maxTestCases: null,
      aiProviders: null,
      advancedExport: true,
      regressionTesting: true,
      prioritySupport: true,
      customIntegrations: true,
      onPremise: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  await db.collection('plans').insertMany(defaults);
  console.log('Seeded 3 default plans.');
}

export function getDb() {
  const db = globalThis.__mongoCache?.db;
  if (!db) throw new Error('Database not connected.');
  return db;
}

async function ensureIndexes(indexDb) {
  await indexDb.collection('admins').createIndex({ email: 1 }, { unique: true });
  await indexDb.collection('product_keys').createIndex({ key: 1 }, { unique: true });
  await indexDb.collection('product_keys').createIndex({ customerEmail: 1 });
  await indexDb.collection('product_keys').createIndex({ status: 1 });
  await indexDb.collection('email_logs').createIndex({ sentAt: -1 });
  await indexDb.collection('email_logs').createIndex({ to: 1 });
  await indexDb
    .collection('payment_transactions')
    .createIndex({ transactionId: 1 }, { unique: true });
  await indexDb.collection('payment_transactions').createIndex({ email: 1 });
  await indexDb.collection('audit_logs').createIndex({ createdAt: -1 });
  await indexDb.collection('audit_logs').createIndex({ adminId: 1 });
  await indexDb.collection('audit_logs').createIndex({ action: 1 });
  await indexDb.collection('plans').createIndex({ id: 1 }, { unique: true });
  await indexDb.collection('plans').createIndex({ price: 1 });
  // Shared collection with main app for verification workflow
  try {
    const pendingIdx = await indexDb.collection('pending_registrations').indexExists('pendingId_1');
    if (pendingIdx) await indexDb.collection('pending_registrations').dropIndex('pendingId_1');
    const emailIdx = await indexDb.collection('pending_registrations').indexExists('email_1');
    if (emailIdx) await indexDb.collection('pending_registrations').dropIndex('email_1');
  } catch {
    /* another server may be building — skip */
  }
  try {
    await indexDb
      .collection('pending_registrations')
      .createIndex({ pendingId: 1 }, { unique: true, sparse: true });
    await indexDb.collection('pending_registrations').createIndex({ email: 1 }, { unique: true });
    await indexDb.collection('pending_registrations').createIndex({ status: 1 });
  } catch (e) {
    console.error('Index setup partial failure:', e.message);
  }
}
