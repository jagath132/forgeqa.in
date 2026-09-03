import crypto from 'node:crypto';
import util from 'node:util';
import { ObjectId } from 'mongodb';
import { getDb } from '../db.js';

const pbkdf2Async = util.promisify(crypto.pbkdf2);

export const DEFAULT_PBKDF2_ITERATIONS = parseInt(process.env.PBKDF2_ITERATIONS || '210000', 10);
export const LEGACY_PBKDF2_ITERATIONS = 600000;

export async function hashPassword(password, salt, iterations = DEFAULT_PBKDF2_ITERATIONS) {
  const buf = await pbkdf2Async(password, salt, iterations, 64, 'sha512');
  return buf.toString('hex');
}

export const authStore = {
  async findUserByEmail(email) {
    const db = getDb();
    const doc = await db.collection('users').findOne(
      {
        email: String(email || '')
          .toLowerCase()
          .trim(),
      },
      { projection: { passwordHash: 0, salt: 0 } }
    );
    if (!doc) return null;
    return { ...doc, id: doc._id.toString(), role: doc.role || 'Member' };
  },

  async findUserById(id) {
    const db = getDb();
    let query;
    try {
      query = { _id: new ObjectId(id) };
    } catch {
      query = { _id: id };
    }
    const doc = await db
      .collection('users')
      .findOne(query, { projection: { passwordHash: 0, salt: 0 } });
    if (!doc) return null;
    return { ...doc, id: doc._id.toString(), role: doc.role || 'Member' };
  },

  async findUserWithPassword(email) {
    const db = getDb();
    return db.collection('users').findOne({
      email: String(email || '')
        .toLowerCase()
        .trim(),
    });
  },

  async countUsers() {
    const db = getDb();
    return db.collection('users').countDocuments();
  },

  async createUserFromHash({ email, passwordHash, salt, name, subscriptionTier, iterations }) {
    const db = getDb();
    const userCount = await this.countUsers();
    const role = userCount === 0 ? 'Admin' : 'Member';
    const doc = {
      email: email.trim().toLowerCase(),
      passwordHash,
      salt,
      iterations: iterations || DEFAULT_PBKDF2_ITERATIONS,
      name: name || null,
      role,
      createdAt: new Date().toISOString(),
      has_seen_welcome: false,
    };
    if (subscriptionTier) {
      doc.subscriptionTier = subscriptionTier;
      doc.subscriptionStatus = 'active';
      doc.subscriptionEndsAt = null;
    }
    const result = await db.collection('users').insertOne(doc);
    return {
      id: result.insertedId.toString(),
      email: doc.email,
      role: doc.role,
      createdAt: doc.createdAt,
      has_seen_welcome: false,
      subscriptionTier: subscriptionTier || null,
    };
  },

  async createUser({ email, password, name }) {
    const db = getDb();
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = await hashPassword(password, salt, DEFAULT_PBKDF2_ITERATIONS);
    const userCount = await this.countUsers();
    const role = userCount === 0 ? 'Admin' : 'Member';
    const doc = {
      email: email.trim().toLowerCase(),
      passwordHash,
      salt,
      iterations: DEFAULT_PBKDF2_ITERATIONS,
      name: name || null,
      role,
      createdAt: new Date().toISOString(),
    };
    const result = await db.collection('users').insertOne(doc);
    return {
      id: result.insertedId.toString(),
      email: doc.email,
      name: doc.name,
      role: doc.role,
      createdAt: doc.createdAt,
    };
  },

  async upgradeUserPasswordHash(userId, newPasswordHash, salt, iterations) {
    const db = getDb();
    try {
      await db
        .collection('users')
        .updateOne(
          { _id: new ObjectId(userId) },
          { $set: { passwordHash: newPasswordHash, salt, iterations } }
        );
    } catch {
      // non-blocking migration error
    }
  },

  async getEncryptedApiKey(userId, provider) {
    const db = getDb();
    const cleanUserId = String(userId || '');
    let doc = await db.collection('user_api_keys').findOne({ userId: cleanUserId, provider });
    if (!doc) {
      try {
        doc = await db
          .collection('user_api_keys')
          .findOne({ userId: new ObjectId(cleanUserId), provider });
      } catch {
        // ignore
      }
    }
    return doc;
  },

  async saveEncryptedApiKey(userId, provider, { encryptedKey, iv, authTag }) {
    const db = getDb();
    await db
      .collection('user_api_keys')
      .updateOne(
        { userId, provider },
        { $set: { encryptedKey, iv, authTag, updatedAt: new Date().toISOString() } },
        { upsert: true }
      );
  },

  async deleteApiKey(userId, provider) {
    const db = getDb();
    await db.collection('user_api_keys').deleteOne({ userId, provider });
  },

  async listUserApiKeys(userId) {
    const db = getDb();
    const docs = await db
      .collection('user_api_keys')
      .find({ userId })
      .project({ provider: 1 })
      .toArray();
    return docs.map((d) => d.provider);
  },

  async saveUserData(userId, key, data) {
    const db = getDb();
    await db
      .collection('user_data')
      .updateOne(
        { userId, key },
        { $set: { data, updatedAt: new Date().toISOString() } },
        { upsert: true }
      );
  },

  async loadUserData(userId, key) {
    const db = getDb();
    const doc = await db.collection('user_data').findOne({ userId, key });
    return doc ? doc.data : null;
  },

  async deleteUserData(userId, key) {
    const db = getDb();
    await db.collection('user_data').deleteOne({ userId, key });
  },

  async createPasswordResetToken(email) {
    const user = await this.findUserByEmail(email);
    if (!user) return null;
    const db = getDb();
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000);
    await db
      .collection('password_reset_tokens')
      .updateOne({ userId: user._id.toString() }, { $set: { token, expiresAt } }, { upsert: true });
    return token;
  },

  async validateResetToken(token) {
    const db = getDb();
    const data = await db.collection('password_reset_tokens').findOne({ token });
    if (!data) return null;
    if (new Date(data.expiresAt) < new Date()) return null;
    return this.findUserById(data.userId);
  },

  async changePassword(userId, currentPassword, newPassword) {
    const db = getDb();
    let query;
    try {
      query = { _id: new ObjectId(userId) };
    } catch {
      query = { _id: userId };
    }
    const user = await db.collection('users').findOne(query);
    if (!user) throw new Error('User not found.');

    const userIterations = user.iterations || LEGACY_PBKDF2_ITERATIONS;
    const checkHash = await hashPassword(currentPassword, user.salt, userIterations);

    let match = false;
    try {
      match = crypto.timingSafeEqual(
        Buffer.from(user.passwordHash, 'hex'),
        Buffer.from(checkHash, 'hex')
      );
    } catch {
      match = false;
    }
    if (!match) throw new Error('Current password is incorrect.');

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = await hashPassword(newPassword, salt, DEFAULT_PBKDF2_ITERATIONS);
    await db
      .collection('users')
      .updateOne(
        { _id: new ObjectId(userId) },
        { $set: { passwordHash, salt, iterations: DEFAULT_PBKDF2_ITERATIONS } }
      );
    return true;
  },

  async resetUserPassword(userId, newPassword) {
    const db = getDb();
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = await hashPassword(newPassword, salt, DEFAULT_PBKDF2_ITERATIONS);
    let query;
    try {
      query = { _id: new ObjectId(userId) };
    } catch {
      query = { _id: userId };
    }
    await db
      .collection('users')
      .updateOne(query, { $set: { passwordHash, salt, iterations: DEFAULT_PBKDF2_ITERATIONS } });
    return true;
  },

  async resetPassword(token, newPassword) {
    const user = await this.validateResetToken(token);
    if (!user) throw new Error('Invalid or expired reset token.');
    const db = getDb();
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = await hashPassword(newPassword, salt, DEFAULT_PBKDF2_ITERATIONS);
    let query;
    try {
      query = { _id: new ObjectId(user.id) };
    } catch {
      query = { _id: user.id };
    }
    await db
      .collection('users')
      .updateOne(query, { $set: { passwordHash, salt, iterations: DEFAULT_PBKDF2_ITERATIONS } });
    await db.collection('password_reset_tokens').deleteMany({
      $or: [{ userId: user.id }, { userId: String(user._id || user.id) }],
    });
    return user;
  },
};
