import crypto from "node:crypto";
import { ObjectId } from "mongodb";
import { getDb } from "../db.js";

const PBKDF2_ITERATIONS = 600000;

export const adminStore = {
  async findByEmail(email) {
    const db = getDb();
    return db.collection("admins").findOne({ email: String(email || "").toLowerCase().trim() });
  },

  async findById(id) {
    const db = getDb();
    let query;
    try { query = { _id: new ObjectId(id) }; } catch { query = { _id: id }; }
    return db.collection("admins").findOne(query);
  },

  async createAdmin({ email, password }) {
    const db = getDb();
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 64, "sha512").toString("hex");
    const doc = {
      email: email.trim().toLowerCase(),
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
    };
    const result = await db.collection("admins").insertOne(doc);
    return { id: result.insertedId.toString(), email: doc.email };
  },

  async seedDefaultAdmin() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) return;
    const existing = await this.findByEmail(email);
    if (!existing) {
      await this.createAdmin({ email, password });
    }
  },
};
