import crypto from "node:crypto";
import { ObjectId } from "mongodb";
import { getDb } from "../db.js";

const PBKDF2_ITERATIONS = 600000;

export const authStore = {
  async findUserByEmail(email) {
    const db = getDb();
    const doc = await db.collection("users").findOne(
      { email: String(email || "").toLowerCase().trim() },
      { projection: { passwordHash: 0, salt: 0 } }
    );
    if (!doc) return null;
    return { ...doc, id: doc._id.toString(), role: doc.role || "Member" };
  },

  async findUserById(id) {
    const db = getDb();
    let query;
    try { query = { _id: new ObjectId(id) }; } catch { query = { _id: id }; }
    const doc = await db.collection("users").findOne(query, { projection: { passwordHash: 0, salt: 0 } });
    if (!doc) return null;
    return { ...doc, id: doc._id.toString(), role: doc.role || "Member" };
  },

  async findUserWithPassword(email) {
    const db = getDb();
    return db.collection("users").findOne(
      { email: String(email || "").toLowerCase().trim() }
    );
  },

  async countUsers() {
    const db = getDb();
    return db.collection("users").countDocuments();
  },

  async createUserFromHash({ email, passwordHash, salt, name }) {
    const db = getDb();
    const userCount = await this.countUsers();
    const role = userCount === 0 ? "Admin" : "Member";
    const doc = {
      email: email.trim().toLowerCase(),
      passwordHash,
      salt,
      name: name || null,
      role,
      createdAt: new Date().toISOString(),
      has_seen_welcome: false,
    };
    const result = await db.collection("users").insertOne(doc);
    return { id: result.insertedId.toString(), email: doc.email, role: doc.role, createdAt: doc.createdAt, has_seen_welcome: false };
  },

  async createUser({ email, password, name }) {
    const db = getDb();
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 64, "sha512").toString("hex");
    const userCount = await this.countUsers();
    const role = userCount === 0 ? "Admin" : "Member";
    const doc = {
      email: email.trim().toLowerCase(),
      passwordHash,
      salt,
      name: name || null,
      role,
      createdAt: new Date().toISOString(),
    };
    const result = await db.collection("users").insertOne(doc);
    return { id: result.insertedId.toString(), email: doc.email, name: doc.name, role: doc.role, createdAt: doc.createdAt };
  },

  async getEncryptedApiKey(userId, provider) {
    const db = getDb();
    return db.collection("user_api_keys").findOne({ userId, provider });
  },

  async saveEncryptedApiKey(userId, provider, { encryptedKey, iv, authTag }) {
    const db = getDb();
    await db.collection("user_api_keys").updateOne(
      { userId, provider },
      { $set: { encryptedKey, iv, authTag, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );
  },

  async deleteApiKey(userId, provider) {
    const db = getDb();
    await db.collection("user_api_keys").deleteOne({ userId, provider });
  },

  async listUserApiKeys(userId) {
    const db = getDb();
    const docs = await db.collection("user_api_keys").find({ userId }).project({ provider: 1 }).toArray();
    return docs.map((d) => d.provider);
  },

  async saveUserData(userId, key, data) {
    const db = getDb();
    await db.collection("user_data").updateOne(
      { userId, key },
      { $set: { data, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );
  },

  async loadUserData(userId, key) {
    const db = getDb();
    const doc = await db.collection("user_data").findOne({ userId, key });
    return doc ? doc.data : null;
  },

  async deleteUserData(userId, key) {
    const db = getDb();
    await db.collection("user_data").deleteOne({ userId, key });
  },

  async createPasswordResetToken(email) {
    const user = await this.findUserByEmail(email);
    if (!user) return null;
    const db = getDb();
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000);
    await db.collection("password_reset_tokens").updateOne(
      { userId: user._id.toString() },
      { $set: { token, expiresAt } },
      { upsert: true }
    );
    return token;
  },

  async validateResetToken(token) {
    const db = getDb();
    const data = await db.collection("password_reset_tokens").findOne({ token });
    if (!data) return null;
    if (new Date(data.expiresAt) < new Date()) return null;
    return this.findUserById(data.userId);
  },

  async changePassword(userId, currentPassword, newPassword) {
    const db = getDb();
    let query;
    try { query = { _id: new ObjectId(userId) }; } catch { query = { _id: userId }; }
    const user = await db.collection("users").findOne(query);
    if (!user) throw new Error("User not found.");
    const checkHash = crypto.pbkdf2Sync(currentPassword, user.salt, PBKDF2_ITERATIONS, 64, "sha512").toString("hex");
    let match = false;
    try {
      match = crypto.timingSafeEqual(Buffer.from(user.passwordHash, "hex"), Buffer.from(checkHash, "hex"));
    } catch { match = false; }
    if (!match) throw new Error("Current password is incorrect.");
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = crypto.pbkdf2Sync(newPassword, salt, PBKDF2_ITERATIONS, 64, "sha512").toString("hex");
    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { $set: { passwordHash, salt } }
    );
    return true;
  },

  async resetUserPassword(userId, newPassword) {
    const db = getDb();
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = crypto.pbkdf2Sync(newPassword, salt, PBKDF2_ITERATIONS, 64, "sha512").toString("hex");
    const { ObjectId } = await import("mongodb");
    let query;
    try { query = { _id: new ObjectId(userId) }; } catch { query = { _id: userId }; }
    await db.collection("users").updateOne(query, { $set: { passwordHash, salt } });
    return true;
  },

  async resetPassword(token, newPassword) {
    const user = await this.validateResetToken(token);
    if (!user) throw new Error("Invalid or expired reset token.");
    const db = getDb();
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = crypto.pbkdf2Sync(newPassword, salt, PBKDF2_ITERATIONS, 64, "sha512").toString("hex");
    await db.collection("users").updateOne(
      { _id: new ObjectId(user.id) },
      { $set: { passwordHash, salt } }
    );
    await db.collection("password_reset_tokens").deleteOne({ userId: user.id });
    return user;
  },
};
