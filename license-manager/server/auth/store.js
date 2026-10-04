import crypto from 'node:crypto';
import { ObjectId } from 'mongodb';
import { getDb } from '../db.js';

const PBKDF2_ITERATIONS = 600000;

function parseUserAgent(ua = '') {
  let browser = 'Unknown Browser';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/')) browser = 'Safari';
  else if (ua.includes('Opera') || ua.includes('OPR/')) browser = 'Opera';

  let os = 'Unknown OS';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return { browser, os, isMobile: ua.includes('Mobile') };
}

export const adminStore = {
  async countAdmins() {
    const db = getDb();
    return db.collection('admins').countDocuments();
  },

  async findByEmail(email) {
    const db = getDb();
    return db.collection('admins').findOne({
      email: String(email || '')
        .toLowerCase()
        .trim(),
    });
  },

  async findById(id) {
    const db = getDb();
    let query;
    try {
      query = { _id: new ObjectId(id) };
    } catch {
      query = { _id: id };
    }
    return db.collection('admins').findOne(query);
  },

  async listAdmins() {
    const db = getDb();
    const admins = await db
      .collection('admins')
      .find(
        {},
        {
          projection: { passwordHash: 0, salt: 0 },
        }
      )
      .sort({ createdAt: 1 })
      .toArray();
    return admins.map((a) => ({
      id: a._id.toString(),
      email: a.email,
      createdAt: a.createdAt,
      lastLogin: a.lastLogin || null,
      lastLoginIp: a.lastLoginIp || null,
      lastLoginUserAgent: a.lastLoginUserAgent || null,
      loginCount: a.loginCount || 0,
    }));
  },

  async createAdmin({ email, password, ip = null, userAgent = null }) {
    const db = getDb();
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await this.findByEmail(normalizedEmail);
    if (existing) {
      throw new Error('An admin with this email already exists.');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = crypto
      .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 64, 'sha512')
      .toString('hex');
    const doc = {
      email: normalizedEmail,
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
      createdIp: ip,
      createdUserAgent: userAgent,
      loginCount: 0,
    };
    const result = await db.collection('admins').insertOne(doc);
    return { id: result.insertedId.toString(), email: doc.email };
  },

  async updatePassword(id, newPassword) {
    const db = getDb();
    let filter;
    try {
      filter = { _id: new ObjectId(id) };
    } catch {
      filter = { _id: id };
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = crypto
      .pbkdf2Sync(newPassword, salt, PBKDF2_ITERATIONS, 64, 'sha512')
      .toString('hex');

    const result = await db.collection('admins').updateOne(filter, {
      $set: {
        passwordHash,
        salt,
        updatedAt: new Date().toISOString(),
      },
    });
    return result.modifiedCount > 0;
  },

  async updateEmail(id, newEmail) {
    const db = getDb();
    let filter;
    try {
      filter = { _id: new ObjectId(id) };
    } catch {
      filter = { _id: id };
    }

    const normalized = newEmail.trim().toLowerCase();
    const result = await db.collection('admins').updateOne(filter, {
      $set: {
        email: normalized,
        updatedAt: new Date().toISOString(),
      },
    });
    return result.modifiedCount > 0;
  },

  async recordLogin({
    adminId,
    email,
    ip,
    userAgent,
    status = 'success',
    failureReason = null,
    headers = {},
  }) {
    const db = getDb();
    const deviceInfo = parseUserAgent(userAgent);
    const loginDoc = {
      adminId: adminId ? String(adminId) : null,
      email: String(email || '')
        .toLowerCase()
        .trim(),
      ip: ip || '127.0.0.1',
      userAgent: userAgent || 'Unknown',
      device: deviceInfo,
      status, // "success" | "failed"
      failureReason: failureReason || null,
      headers: {
        host: headers.host || null,
        origin: headers.origin || null,
        referer: headers.referer || null,
      },
      timestamp: new Date().toISOString(),
      createdAt: new Date(),
    };

    // Store in admin_logins collection
    await db.collection('admin_logins').insertOne(loginDoc);

    if (status === 'success' && adminId) {
      let filter;
      try {
        filter = { _id: new ObjectId(adminId) };
      } catch {
        filter = { _id: adminId };
      }
      await db.collection('admins').updateOne(filter, {
        $set: {
          lastLogin: loginDoc.timestamp,
          lastLoginIp: loginDoc.ip,
          lastLoginUserAgent: loginDoc.userAgent,
          lastLoginDevice: deviceInfo,
        },
        $inc: { loginCount: 1 },
      });

      // Record in audit_logs collection
      await db.collection('audit_logs').insertOne({
        adminId: String(adminId),
        adminEmail: loginDoc.email,
        action: 'admin_login',
        resource: 'admin',
        resourceId: String(adminId),
        details: {
          ip: loginDoc.ip,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          status: 'success',
        },
        ip: loginDoc.ip,
        createdAt: loginDoc.timestamp,
      });
    } else {
      // Record failed login in audit_logs
      await db.collection('audit_logs').insertOne({
        adminId: adminId ? String(adminId) : null,
        adminEmail: loginDoc.email,
        action: 'admin_login_failed',
        resource: 'admin',
        resourceId: adminId ? String(adminId) : null,
        details: {
          ip: loginDoc.ip,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          reason: failureReason,
          status: 'failed',
        },
        ip: loginDoc.ip,
        createdAt: loginDoc.timestamp,
      });
    }

    return loginDoc;
  },

  async getAdminLogins({ limit = 50, skip = 0 } = {}) {
    const db = getDb();
    const logins = await db
      .collection('admin_logins')
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return logins.map((l) => ({
      id: l._id.toString(),
      adminId: l.adminId,
      email: l.email,
      ip: l.ip,
      userAgent: l.userAgent,
      device: l.device,
      status: l.status,
      failureReason: l.failureReason,
      timestamp: l.timestamp,
    }));
  },

  async deleteAdmin(id) {
    const count = await this.countAdmins();
    if (count <= 1) {
      throw new Error('Cannot delete the only admin account.');
    }
    const db = getDb();
    let filter;
    try {
      filter = { _id: new ObjectId(id) };
    } catch {
      filter = { _id: id };
    }
    const result = await db.collection('admins').deleteOne(filter);
    return result.deletedCount > 0;
  },

  async seedDefaultAdmin() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) {
      console.log(
        '[auth] No ADMIN_EMAIL/ADMIN_PASSWORD env set — dynamic admin credentials active.'
      );
      return;
    }
    const existing = await this.findByEmail(email);
    if (!existing) {
      await this.createAdmin({ email, password });
      console.log(`[auth] Default admin seeded from environment: ${email}`);
    } else {
      console.log(`[auth] Admin account ready: ${email}`);
    }
  },
};
