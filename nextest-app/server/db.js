import { MongoClient } from "mongodb";

const MONGO_URI = process.env.MONGO_URI || (() => {
  console.error("⚠️  MONGO_URI env var not set — falling back to localhost:27017 (will fail in production)");
  return "mongodb://localhost:27017";
})();
const DB_NAME = process.env.MONGO_DB_NAME || "nextest";

let client = null;
let db = null;

export async function connectDb() {
  if (db) return db;
  client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db(DB_NAME);
  await ensureIndexes(db);
  return db;
}

export function getDb() {
  if (!db) throw new Error("Database not connected. Call connectDb() first.");
  return db;
}

export async function closeDb() {
  if (client) await client.close();
  client = null;
  db = null;
}

async function ensureIndexes(db) {
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("user_api_keys").createIndex({ userId: 1, provider: 1 }, { unique: true });
  await db.collection("user_data").createIndex({ userId: 1, key: 1 }, { unique: true });
  await db.collection("password_reset_tokens").createIndex({ token: 1 }, { unique: true });
  await db.collection("password_reset_tokens").createIndex({ userId: 1 }, { unique: true });
  await db.collection("knowledge_files").createIndex({ userId: 1 });
  await db.collection("knowledge_chunks").createIndex({ fileId: 1 });
  await db.collection("regression_runs").createIndex({ userId: 1, startedAt: -1 });
  await db.collection("regression_builds").createIndex({ userId: 1, platform: 1, uploadedAt: -1 });
  await db.collection("regression_webhooks").createIndex({ userId: 1, platform: 1 }, { unique: true });
  await db.collection("product_keys").createIndex({ key: 1 }, { unique: true });
  await db.collection("product_keys").createIndex({ customerEmail: 1 });
  await db.collection("product_keys").createIndex({ status: 1 });
  await db.collection("admins").createIndex({ email: 1 }, { unique: true });
  await db.collection("rate_limits").createIndex({ ip: 1, endpoint: 1 }, { unique: true });
  await db.collection("rate_limits").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db.collection("audit_logs").createIndex({ createdAt: -1 });
  await db.collection("audit_logs").createIndex({ adminId: 1 });
  await db.collection("audit_logs").createIndex({ action: 1 });
  await db.collection("subscription_plans").createIndex({ tier: 1 }, { unique: true });
  await db.collection("plans").createIndex({ id: 1 }, { unique: true });
  await db.collection("plans").createIndex({ price: 1 });
  await db.collection("totp_secrets").createIndex({ userId: 1 }, { unique: true });
  try {
    const pendingIdx = await db.collection("pending_registrations").indexExists("pendingId_1");
    if (pendingIdx) {
      await db.collection("pending_registrations").dropIndex("pendingId_1");
    }
  } catch { /* another server may be building — skip */ }
  try {
    await db.collection("pending_registrations").createIndex({ email: 1 }, { unique: true });
    await db.collection("pending_registrations").createIndex({ pendingId: 1 }, { unique: true, sparse: true });
    await db.collection("pending_registrations").createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 });
  } catch (e) { console.error("Index setup partial failure:", e.message); }
}
