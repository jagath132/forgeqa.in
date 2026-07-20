import { MongoClient } from "mongodb";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.MONGO_DB_NAME || "forgekey";

let client = null;
let db = null;

export async function connectDb() {
  if (db) return db;
  if (!process.env.MONGO_URI) {
    console.error("⚠️  MONGO_URI env var not set — falling back to localhost:27017 (will fail in production)");
  }
  client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db(DB_NAME);
  await ensureIndexes(db);
  await seedDefaultPlans(db);
  return db;
}

async function seedDefaultPlans(db) {
  const count = await db.collection("plans").countDocuments();
  if (count > 0) return;
  const defaults = [
    {
      id: "free",
      name: "Free",
      price: 0,
      currency: "usd",
      period: "forever",
      description: "Personal projects & evaluation",
      features: ["Up to 100 test cases/mo", "1 AI provider", "Basic export", "Community support"],
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
      id: "pro",
      name: "Pro",
      price: 2900,
      currency: "usd",
      period: "monthly",
      description: "Professional QA teams",
      features: ["Unlimited test cases", "All AI providers", "Advanced export (PDF/XLSX)", "Priority support", "Regression testing", "Team collaboration"],
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
      id: "enterprise",
      name: "Enterprise",
      price: 9900,
      currency: "usd",
      period: "monthly",
      description: "Large-scale testing",
      features: ["Everything in Pro", "Unlimited team members", "Custom integrations", "Dedicated support", "SLA guarantee", "On-premise deployment"],
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
  await db.collection("plans").insertMany(defaults);
  console.log("Seeded 3 default plans.");
}

export function getDb() {
  if (!db) throw new Error("Database not connected.");
  return db;
}

async function ensureIndexes(indexDb) {
  await indexDb.collection("admins").createIndex({ email: 1 }, { unique: true });
  await indexDb.collection("product_keys").createIndex({ key: 1 }, { unique: true });
  await indexDb.collection("product_keys").createIndex({ customerEmail: 1 });
  await indexDb.collection("product_keys").createIndex({ status: 1 });
  await indexDb.collection("email_logs").createIndex({ sentAt: -1 });
  await indexDb.collection("email_logs").createIndex({ to: 1 });
  await indexDb.collection("payment_transactions").createIndex({ transactionId: 1 }, { unique: true });
  await indexDb.collection("payment_transactions").createIndex({ email: 1 });
  await indexDb.collection("audit_logs").createIndex({ createdAt: -1 });
  await indexDb.collection("audit_logs").createIndex({ adminId: 1 });
  await indexDb.collection("audit_logs").createIndex({ action: 1 });
  await indexDb.collection("plans").createIndex({ id: 1 }, { unique: true });
  await indexDb.collection("plans").createIndex({ price: 1 });
  // Shared collection with main app for verification workflow
  try {
    const pendingIdx = await indexDb.collection("pending_registrations").indexExists("pendingId_1");
    if (pendingIdx) await indexDb.collection("pending_registrations").dropIndex("pendingId_1");
    const emailIdx = await indexDb.collection("pending_registrations").indexExists("email_1");
    if (emailIdx) await indexDb.collection("pending_registrations").dropIndex("email_1");
  } catch { /* another server may be building — skip */ }
  try {
    await indexDb.collection("pending_registrations").createIndex({ pendingId: 1 }, { unique: true, sparse: true });
    await indexDb.collection("pending_registrations").createIndex({ email: 1 }, { unique: true });
    await indexDb.collection("pending_registrations").createIndex({ status: 1 });
  } catch (e) { console.error("Index setup partial failure:", e.message); }
}
