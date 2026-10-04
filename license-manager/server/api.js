import { connectDb, isMongoUriConfigured } from './db.js';
import {
  adminStore,
  authenticateToken,
  handleAuthRoute,
  logAudit,
  getAuditLogs,
} from './auth/index.js';
import { KEY_ROUTES } from './keys/routes.js';
import { sendProductKeyEmail, getEmailLogs, resendEmail } from './email/service.js';
import { handleStripeWebhook } from './payments/stripe.js';
import { handleRazorpayWebhook } from './payments/razorpay.js';

function corsify(res, req) {
  const origin = req?.headers?.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  if (origin !== '*') res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    const MAX_SIZE = 1024 * 512;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_SIZE) {
        req.destroy(new Error('Request body too large'));
        return;
      }
      body += chunk;
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function parseUrl(req) {
  return new URL(req.url, 'http://localhost');
}

export function createApiMiddleware(env) {
  // Propagate env vars for modules that read process.env directly (e.g. resend)
  if (env && typeof env === 'object' && env !== process.env) {
    for (const key of Object.keys(env)) {
      if (env[key] !== undefined && process.env[key] === undefined) {
        process.env[key] = env[key];
      }
    }
  }

  // dbReady is reset on failure so the next request retries the connection
  // instead of permanently returning 503 from a stale rejected promise.
  let dbReady = null;

  function getDbReady() {
    if (!dbReady) {
      dbReady = connectDb()
        .then(async () => {
          await adminStore.seedDefaultAdmin();
        })
        .catch((err) => {
          // Reset so the next request will try again
          dbReady = null;
          throw err;
        });
    }
    return dbReady;
  }

  return async function apiMiddleware(req, res, next) {
    const url = parseUrl(req);

    corsify(res, req);

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (!url.pathname.startsWith('/api/')) {
      next();
      return;
    }

    // Healthcheck — always responds immediately, no DB needed
    if (url.pathname === '/api/health' && req.method === 'GET') {
      sendJson(res, 200, { status: 'ok', uptime: process.uptime() });
      return;
    }

    try {
      await getDbReady();
    } catch (dbError) {
      const configured = isMongoUriConfigured();
      console.error('MongoDB not ready:', {
        name: dbError.name,
        code: dbError.code,
        message: dbError.message,
        mongoUriConfigured: configured,
        databaseName: process.env.MONGO_DB_NAME || 'forgeqa',
      });
      sendJson(
        res,
        503,
        configured
          ? {
              error:
                'MongoDB is unreachable. Check the License Manager MONGO_URI, MongoDB network access rules, and database credentials.',
              code: 'mongo_unreachable',
            }
          : {
              error:
                'The License Manager is missing its MONGO_URI environment variable. Configure it in the deployment settings.',
              code: 'mongo_uri_not_configured',
            }
      );
      return;
    }

    try {
      // Stripe webhook needs raw body (not JSON parsed)
      if (url.pathname === '/api/webhooks/stripe' && req.method === 'POST') {
        const rawBody = await readRequestBody(req);
        const result = await handleStripeWebhook(req, rawBody);
        sendJson(res, 200, result);
        return;
      }

      // Razorpay webhook also needs raw body
      if (url.pathname === '/api/webhooks/razorpay' && req.method === 'POST') {
        const rawBody = await readRequestBody(req);
        const result = await handleRazorpayWebhook(req, rawBody);
        sendJson(res, 200, result);
        return;
      }

      // Internal endpoints (bypass admin auth)
      if (url.pathname === '/api/internal/register-key' && req.method === 'POST') {
        const rawBody = await readRequestBody(req);
        const { email, name } = JSON.parse(rawBody || '{}');
        if (!email) {
          sendJson(res, 400, { error: 'Email is required.' });
          return;
        }
        try {
          const { generateProductKeys, listProductKeys } = await import('./keys/service.js');
          const keys = await generateProductKeys(1, {
            customerEmail: email,
            notes: 'Free plan registration',
          });
          const key = keys[0];
          const { sendProductKeyEmail } = await import('./email/service.js');
          const appUrl =
            process.env.app_forgeqa_in_APP_URL || process.env.APP_URL || 'http://127.0.0.1:5173';
          const completeUrl = `${appUrl}/auth/complete-registration?email=${encodeURIComponent(email)}&key=${key}`;
          await sendProductKeyEmail(email, key, name || '', completeUrl);
          sendJson(res, 200, { key, email });
        } catch (err) {
          sendJson(res, 500, { error: err.message });
        }
        return;
      }

      // Auth routes (login, me)
      const matched = await handleAuthRoute(req, res, url);
      if (matched) return;

      // All remaining /api/* routes require admin authentication
      let admin;
      try {
        admin = await authenticateToken(req);
      } catch (authError) {
        sendJson(res, authError.statusCode || 401, { error: authError.message });
        return;
      }

      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

      // Key management routes
      for (const route of KEY_ROUTES) {
        const match = route.pathprefix
          ? url.pathname.startsWith(route.pathprefix) && req.method === route.method
          : url.pathname === route.path && req.method === route.method;
        if (match) {
          const rawBody = await readRequestBody(req);
          const body = rawBody ? JSON.parse(rawBody) : {};
          const result = await route.handler(req, res, url, body, admin);
          if (result?.action) {
            await logAudit({
              adminId: admin.id,
              adminEmail: admin.email,
              action: result.action,
              resource: 'key',
              resourceId: result.keyId,
              details: result.details,
              ip: clientIp,
            });
          }
          return;
        }
      }

      // Email sending endpoint
      if (url.pathname === '/api/admin/email/send' && req.method === 'POST') {
        const rawBody = await readRequestBody(req);
        const { to, productKey, customerName } = JSON.parse(rawBody || '{}');
        if (!to || !productKey) {
          sendJson(res, 400, { error: 'Recipient email and product key are required.' });
          return;
        }
        try {
          const appUrl =
            process.env.app_forgeqa_in_APP_URL || process.env.APP_URL || 'http://127.0.0.1:5173';
          const completeUrl = `${appUrl}/auth/complete-registration?email=${encodeURIComponent(to)}&key=${productKey}`;
          await sendProductKeyEmail(to, productKey, customerName, completeUrl);
          await logAudit({
            adminId: admin.id,
            adminEmail: admin.email,
            action: 'send_email',
            resource: 'email',
            details: { to, productKey },
            ip: clientIp,
          });
          sendJson(res, 200, { ok: true });
        } catch (err) {
          sendJson(res, 500, { error: err.message });
        }
        return;
      }

      // Email log endpoint (enhanced with filters + pagination)
      if (url.pathname === '/api/admin/email/logs' && req.method === 'GET') {
        const search = url.searchParams.get('search') || '';
        const status = url.searchParams.get('status') || 'all';
        const dateFrom = url.searchParams.get('dateFrom') || '';
        const dateTo = url.searchParams.get('dateTo') || '';
        const page = url.searchParams.get('page') || '1';
        const pageSize = url.searchParams.get('pageSize') || '50';
        const result = await getEmailLogs({ search, status, dateFrom, dateTo, page, pageSize });
        sendJson(res, 200, result);
        return;
      }

      // Delete an email log entry
      if (url.pathname.startsWith('/api/admin/email/logs/') && req.method === 'DELETE') {
        const id = url.pathname.replace('/api/admin/email/logs/', '');
        if (!id || id.includes('/')) {
          sendJson(res, 400, { error: 'Log ID is required.' });
          return;
        }
        const { ObjectId } = await import('mongodb');
        const { getDb } = await import('./db.js');
        let result;
        try {
          result = await getDb()
            .collection('email_logs')
            .deleteOne({ _id: new ObjectId(id) });
        } catch {
          sendJson(res, 400, { error: 'Invalid log ID.' });
          return;
        }
        if (result.deletedCount === 0) {
          sendJson(res, 404, { error: 'Email log entry not found.' });
          return;
        }
        await logAudit({
          adminId: admin.id,
          adminEmail: admin.email,
          action: 'delete_email_log',
          resource: 'email',
          resourceId: id,
          ip: clientIp,
        });
        sendJson(res, 200, { ok: true });
        return;
      }

      // Resend email
      if (url.pathname === '/api/admin/email/resend' && req.method === 'POST') {
        const rawBody = await readRequestBody(req);
        const { logId } = JSON.parse(rawBody || '{}');
        if (!logId) {
          sendJson(res, 400, { error: 'logId is required.' });
          return;
        }
        try {
          await resendEmail(logId);
          await logAudit({
            adminId: admin.id,
            adminEmail: admin.email,
            action: 'resend_email',
            resource: 'email',
            details: { logId },
            ip: clientIp,
          });
          sendJson(res, 200, { ok: true });
        } catch (err) {
          sendJson(res, 500, { error: err.message });
        }
        return;
      }

      // Customer list and CRUD (users collection)
      if (url.pathname === '/api/admin/customers' && req.method === 'GET') {
        const { getDb } = await import('./db.js');
        const db = getDb();

        // Single customer detail
        const idParam = url.searchParams.get('id');
        if (idParam) {
          const { ObjectId } = await import('mongodb');
          let user;
          try {
            user = await db.collection('users').findOne({ _id: new ObjectId(idParam) });
          } catch {
            user = null;
          }
          if (!user) {
            sendJson(res, 404, { error: 'Customer not found.' });
            return;
          }
          const keys = await db
            .collection('product_keys')
            .find({ $or: [{ customerEmail: user.email }, { registeredEmail: user.email }] })
            .sort({ createdAt: -1 })
            .toArray();
          sendJson(res, 200, {
            customer: {
              id: user._id.toString(),
              email: user.email,
              role: user.role,
              name: user.name || null,
              notes: user.notes || null,
              createdAt: user.createdAt,
              productKey: keys[0]?.key || null,
              keyStatus: keys[0]?.status || null,
              keys: keys.map((k) => ({
                id: k._id.toString(),
                key: k.key,
                status: k.status,
                createdAt: k.createdAt,
              })),
            },
          });
          return;
        }

        // Full list — merge approved users + rejected pending_registrations, dedup by email
        const users = await db
          .collection('users')
          .find({}, { projection: { email: 1, role: 1, name: 1, createdAt: 1, notes: 1 } })
          .sort({ createdAt: -1 })
          .toArray();

        const approvedEmails = new Set(users.map((u) => u.email));

        const rejectedRegs = await db
          .collection('pending_registrations')
          .find(
            { status: 'rejected' },
            {
              projection: {
                email: 1,
                name: 1,
                createdAt: 1,
                status: 1,
                rejectionReason: 1,
                rejectedAt: 1,
                rejectedBy: 1,
                plan: 1,
              },
            }
          )
          .sort({ createdAt: -1 })
          .toArray();

        const dedupedRejected = rejectedRegs.filter((r) => !approvedEmails.has(r.email));

        const mapUser = async (u, status) => {
          const keys = await db
            .collection('product_keys')
            .find({ $or: [{ customerEmail: u.email }, { registeredEmail: u.email }] })
            .sort({ createdAt: -1 })
            .toArray();
          return {
            id: u._id ? u._id.toString() : `rejected_${u.email}`,
            email: u.email,
            role: u.role || 'user',
            name: u.name || null,
            notes: u.notes || null,
            status,
            createdAt: u.createdAt,
            productKey: keys[0]?.key || null,
            keyStatus: keys[0]?.status || null,
            keys: keys.map((k) => ({
              id: k._id.toString(),
              key: k.key,
              status: k.status,
              createdAt: k.createdAt,
            })),
          };
        };

        const approved = await Promise.all(users.map((u) => mapUser(u, 'approved')));
        const rejected = await Promise.all(dedupedRejected.map((r) => mapUser(r, 'rejected')));

        const customers = [...approved, ...rejected].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        sendJson(res, 200, { customers });
        return;
      }

      // Create customer
      if (url.pathname === '/api/admin/customers' && req.method === 'POST') {
        const rawBody = await readRequestBody(req);
        const { email, name, role, notes, password } = JSON.parse(rawBody || '{}');
        const normalizedEmail = String(email || '')
          .trim()
          .toLowerCase();
        if (!normalizedEmail || !normalizedEmail.includes('@')) {
          sendJson(res, 400, { error: 'A valid email is required.' });
          return;
        }
        if (role && !['Admin', 'Member'].includes(role)) {
          sendJson(res, 400, { error: 'Invalid role.' });
          return;
        }
        const { getDb } = await import('./db.js');
        const db = getDb();
        const existing = await db.collection('users').findOne({ email: normalizedEmail });
        if (existing) {
          sendJson(res, 409, { error: 'A customer with this email already exists.' });
          return;
        }
        const crypto = await import('node:crypto');
        const salt = crypto.randomBytes(16).toString('hex');
        const finalPassword = password || crypto.randomBytes(12).toString('base64url');
        const iterations = parseInt(process.env.PBKDF2_ITERATIONS, 10) || 210000;
        const passwordHash = crypto
          .pbkdf2Sync(finalPassword, salt, iterations, 64, 'sha512')
          .toString('hex');
        const doc = {
          email: normalizedEmail,
          passwordHash,
          salt,
          iterations,
          name: name || null,
          role: role || 'Member',
          notes: notes || null,
          subscriptionTier: 'free',
          subscriptionStatus: 'active',
          subscriptionEndsAt: null,
          createdAt: new Date().toISOString(),
          has_seen_welcome: false,
        };
        const result = await db.collection('users').insertOne(doc);
        await logAudit({
          adminId: admin.id,
          adminEmail: admin.email,
          action: 'create_customer',
          resource: 'customer',
          resourceId: result.insertedId.toString(),
          details: { email: normalizedEmail, role: doc.role },
          ip: clientIp,
        });
        sendJson(res, 201, {
          customer: {
            id: result.insertedId.toString(),
            email: doc.email,
            name: doc.name,
            role: doc.role,
            notes: doc.notes,
            createdAt: doc.createdAt,
          },
          tempPassword: password ? undefined : finalPassword,
        });
        return;
      }

      // Update customer
      if (url.pathname.startsWith('/api/admin/customers/') && req.method === 'PUT') {
        const id = url.pathname.replace('/api/admin/customers/', '');
        if (!id || id.includes('/')) {
          sendJson(res, 400, { error: 'Customer ID is required.' });
          return;
        }
        const { ObjectId } = await import('mongodb');
        const rawBody = await readRequestBody(req);
        const { role, notes, name } = JSON.parse(rawBody || '{}');
        const update = {};
        if (role) update.role = role;
        if (notes !== undefined) update.notes = notes;
        if (name !== undefined) update.name = name || null;
        if (Object.keys(update).length === 0) {
          sendJson(res, 400, { error: 'No fields to update.' });
          return;
        }
        const { getDb } = await import('./db.js');
        const result = await getDb()
          .collection('users')
          .updateOne({ _id: new ObjectId(id) }, { $set: update });
        if (result.matchedCount === 0) {
          sendJson(res, 404, { error: 'Customer not found.' });
          return;
        }
        await logAudit({
          adminId: admin.id,
          adminEmail: admin.email,
          action: 'update_customer',
          resource: 'customer',
          resourceId: id,
          details: update,
          ip: clientIp,
        });
        sendJson(res, 200, { ok: true });
        return;
      }

      // Delete customer
      if (url.pathname.startsWith('/api/admin/customers/') && req.method === 'DELETE') {
        const id = url.pathname.replace('/api/admin/customers/', '');
        if (!id || id.includes('/')) {
          sendJson(res, 400, { error: 'Customer ID is required.' });
          return;
        }
        const { ObjectId } = await import('mongodb');
        const { getDb } = await import('./db.js');
        const db = getDb();
        const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
        if (!user) {
          sendJson(res, 404, { error: 'Customer not found.' });
          return;
        }
        await db.collection('users').deleteOne({ _id: new ObjectId(id) });
        // Tombstone so login can tell "this account was deleted" apart from a
        // wrong password, and so the Deleted Users module can restore it.
        await db.collection('deleted_users').insertOne({
          originalId: user._id.toString(),
          email: user.email,
          name: user.name || null,
          deletedAt: new Date().toISOString(),
        });
        await db
          .collection('product_keys')
          .updateMany(
            { $or: [{ customerEmail: user.email }, { registeredEmail: user.email }] },
            { $set: { status: 'available', usedBy: null, usedAt: null, registeredEmail: null } }
          );
        await logAudit({
          adminId: admin.id,
          adminEmail: admin.email,
          action: 'delete_customer',
          resource: 'customer',
          resourceId: id,
          details: { email: user.email },
          ip: clientIp,
        });
        sendJson(res, 200, { ok: true });
        return;
      }

      // ── Plan management ──────────────────────────────────────────────────────

      // List all plans
      if (url.pathname === '/api/admin/plans' && req.method === 'GET') {
        const { getDb } = await import('./db.js');
        const plans = await getDb().collection('plans').find({}).sort({ sortOrder: 1 }).toArray();
        sendJson(res, 200, {
          plans: plans.map((p) => ({ id: p._id.toString(), ...p, _id: undefined })),
        });
        return;
      }

      // Create a plan
      if (url.pathname === '/api/admin/plans' && req.method === 'POST') {
        const rawBody = await readRequestBody(req);
        const {
          id,
          name,
          price,
          currency,
          period,
          description,
          features,
          popular,
          active,
          maxUsers,
          maxTestCases,
          aiProviders,
          advancedExport,
          regressionTesting,
          prioritySupport,
          customIntegrations,
          onPremise,
        } = JSON.parse(rawBody || '{}');
        if (!id || !name || price === undefined) {
          sendJson(res, 400, { error: 'Plan id, name, and price are required.' });
          return;
        }
        const { getDb } = await import('./db.js');
        const db = getDb();
        const existing = await db.collection('plans').findOne({ id });
        if (existing) {
          sendJson(res, 409, { error: 'A plan with this id already exists.' });
          return;
        }
        const plan = {
          id,
          name,
          price,
          currency: currency || 'usd',
          period: period || 'monthly',
          description: description || '',
          features: features || [],
          popular: !!popular,
          active: active !== false,
          maxUsers: maxUsers ?? null,
          maxTestCases: maxTestCases ?? null,
          aiProviders: aiProviders ?? null,
          advancedExport: !!advancedExport,
          regressionTesting: !!regressionTesting,
          prioritySupport: !!prioritySupport,
          customIntegrations: !!customIntegrations,
          onPremise: !!onPremise,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await db.collection('plans').insertOne(plan);
        await logAudit({
          adminId: admin.id,
          adminEmail: admin.email,
          action: 'create_plan',
          resource: 'plan',
          resourceId: id,
          details: plan,
          ip: clientIp,
        });
        sendJson(res, 201, { plan });
        return;
      }

      // Update a plan
      if (url.pathname.startsWith('/api/admin/plans/') && req.method === 'PUT') {
        const id = url.pathname.replace('/api/admin/plans/', '');
        if (!id || id.includes('/')) {
          sendJson(res, 400, { error: 'Plan ID is required.' });
          return;
        }
        const rawBody = await readRequestBody(req);
        const fields = JSON.parse(rawBody || '{}');
        const allowed = [
          'name',
          'price',
          'currency',
          'period',
          'description',
          'features',
          'popular',
          'active',
          'maxUsers',
          'maxTestCases',
          'aiProviders',
          'advancedExport',
          'regressionTesting',
          'prioritySupport',
          'customIntegrations',
          'onPremise',
        ];
        const update = {};
        for (const key of allowed) {
          if (fields[key] !== undefined) update[key] = fields[key];
        }
        if (Object.keys(update).length === 0) {
          sendJson(res, 400, { error: 'No fields to update.' });
          return;
        }
        update.updatedAt = new Date().toISOString();
        const { getDb } = await import('./db.js');
        const result = await getDb().collection('plans').updateOne({ id }, { $set: update });
        if (result.matchedCount === 0) {
          sendJson(res, 404, { error: 'Plan not found.' });
          return;
        }
        await logAudit({
          adminId: admin.id,
          adminEmail: admin.email,
          action: 'update_plan',
          resource: 'plan',
          resourceId: id,
          details: update,
          ip: clientIp,
        });
        sendJson(res, 200, { ok: true });
        return;
      }

      // Delete a plan
      if (url.pathname.startsWith('/api/admin/plans/') && req.method === 'DELETE') {
        const id = url.pathname.replace('/api/admin/plans/', '');
        if (!id || id.includes('/')) {
          sendJson(res, 400, { error: 'Plan ID is required.' });
          return;
        }
        const { getDb } = await import('./db.js');
        const result = await getDb().collection('plans').deleteOne({ id });
        if (result.deletedCount === 0) {
          sendJson(res, 404, { error: 'Plan not found.' });
          return;
        }
        await logAudit({
          adminId: admin.id,
          adminEmail: admin.email,
          action: 'delete_plan',
          resource: 'plan',
          resourceId: id,
          ip: clientIp,
        });
        sendJson(res, 200, { ok: true });
        return;
      }

      // Create a manual/adjustment transaction
      if (url.pathname === '/api/admin/transactions' && req.method === 'POST') {
        const rawBody = await readRequestBody(req);
        const { email, amount, currency, status, provider, productKey, notes } = JSON.parse(
          rawBody || '{}'
        );
        if (!email || !String(email).includes('@')) {
          sendJson(res, 400, { error: 'A valid email is required.' });
          return;
        }
        if (amount === undefined || isNaN(Number(amount)) || Number(amount) < 0) {
          sendJson(res, 400, { error: 'A non-negative amount is required.' });
          return;
        }
        const crypto = await import('node:crypto');
        const { getDb } = await import('./db.js');
        const doc = {
          transactionId: `manual-${crypto.randomBytes(8).toString('hex')}`,
          email: String(email).trim().toLowerCase(),
          amount: Number(amount),
          currency: currency || 'usd',
          status: status || 'completed',
          provider: provider || 'manual',
          productKey: productKey || null,
          notes: notes || null,
          manualEntry: true,
          timestamp: new Date().toISOString(),
        };
        const result = await getDb().collection('payment_transactions').insertOne(doc);
        await logAudit({
          adminId: admin.id,
          adminEmail: admin.email,
          action: 'create_transaction',
          resource: 'transaction',
          resourceId: doc.transactionId,
          details: { email: doc.email, amount: doc.amount, status: doc.status },
          ip: clientIp,
        });
        sendJson(res, 201, {
          transaction: {
            id: result.insertedId.toString(),
            transactionId: doc.transactionId,
            email: doc.email,
            amount: doc.amount,
            currency: doc.currency,
            status: doc.status,
            provider: doc.provider,
            productKey: doc.productKey,
            timestamp: doc.timestamp,
          },
        });
        return;
      }

      // Update a transaction (status/amount/notes correction)
      if (url.pathname.startsWith('/api/admin/transactions/') && req.method === 'PUT') {
        const id = url.pathname.replace('/api/admin/transactions/', '');
        if (!id || id.includes('/')) {
          sendJson(res, 400, { error: 'Transaction ID is required.' });
          return;
        }
        const rawBody = await readRequestBody(req);
        const { status, amount, currency, notes } = JSON.parse(rawBody || '{}');
        const update = {};
        if (status !== undefined) update.status = status;
        if (amount !== undefined) {
          if (isNaN(Number(amount)) || Number(amount) < 0) {
            sendJson(res, 400, { error: 'Amount must be a non-negative number.' });
            return;
          }
          update.amount = Number(amount);
        }
        if (currency !== undefined) update.currency = currency;
        if (notes !== undefined) update.notes = notes;
        if (Object.keys(update).length === 0) {
          sendJson(res, 400, { error: 'No fields to update.' });
          return;
        }
        const { ObjectId } = await import('mongodb');
        const { getDb } = await import('./db.js');
        let result;
        try {
          result = await getDb()
            .collection('payment_transactions')
            .updateOne({ _id: new ObjectId(id) }, { $set: update });
        } catch {
          sendJson(res, 400, { error: 'Invalid transaction ID.' });
          return;
        }
        if (result.matchedCount === 0) {
          sendJson(res, 404, { error: 'Transaction not found.' });
          return;
        }
        await logAudit({
          adminId: admin.id,
          adminEmail: admin.email,
          action: 'update_transaction',
          resource: 'transaction',
          resourceId: id,
          details: update,
          ip: clientIp,
        });
        sendJson(res, 200, { ok: true });
        return;
      }

      // Delete a transaction
      if (url.pathname.startsWith('/api/admin/transactions/') && req.method === 'DELETE') {
        const id = url.pathname.replace('/api/admin/transactions/', '');
        if (!id || id.includes('/')) {
          sendJson(res, 400, { error: 'Transaction ID is required.' });
          return;
        }
        const { ObjectId } = await import('mongodb');
        const { getDb } = await import('./db.js');
        let result;
        try {
          result = await getDb()
            .collection('payment_transactions')
            .deleteOne({ _id: new ObjectId(id) });
        } catch {
          sendJson(res, 400, { error: 'Invalid transaction ID.' });
          return;
        }
        if (result.deletedCount === 0) {
          sendJson(res, 404, { error: 'Transaction not found.' });
          return;
        }
        await logAudit({
          adminId: admin.id,
          adminEmail: admin.email,
          action: 'delete_transaction',
          resource: 'transaction',
          resourceId: id,
          ip: clientIp,
        });
        sendJson(res, 200, { ok: true });
        return;
      }

      // Payment transactions
      if (url.pathname === '/api/admin/transactions' && req.method === 'GET') {
        const { getDb } = await import('./db.js');
        const docs = await getDb()
          .collection('payment_transactions')
          .find({})
          .sort({ timestamp: -1 })
          .limit(100)
          .toArray();
        sendJson(res, 200, {
          transactions: docs.map((d) => ({
            id: d._id.toString(),
            transactionId: d.transactionId,
            email: d.email,
            amount: d.amount,
            currency: d.currency,
            status: d.status,
            provider: d.provider,
            productKey: d.productKey,
            notes: d.notes || null,
            manualEntry: !!d.manualEntry,
            timestamp: d.timestamp,
          })),
        });
        return;
      }

      // Audit logs
      if (url.pathname === '/api/admin/audit-logs' && req.method === 'GET') {
        const logs = await getAuditLogs({ limit: 200 });
        sendJson(res, 200, { logs });
        return;
      }

      // ── Verification routes ──────────────────────────────────────────────────

      // List pending registrations (from main app shared DB)
      if (url.pathname === '/api/admin/verifications' && req.method === 'GET') {
        const { getDb } = await import('./db.js');
        const db = getDb();
        const query = {};
        const status = url.searchParams.get('status');
        if (status) query.status = status;
        const docs = await db
          .collection('pending_registrations')
          .find(query)
          .sort({ createdAt: -1 })
          .limit(200)
          .toArray();
        const registrations = docs.map((d) => ({
          id: d._id.toString(),
          pendingId: d.pendingId,
          name: d.name || null,
          email: d.email,
          plan: d.plan || null,
          paymentStatus: d.paymentStatus || 'pending',
          status: d.status,
          transactionId: d.transactionId || null,
          createdAt: d.createdAt,
        }));
        sendJson(res, 200, { registrations });
        return;
      }

      // Approve a pending registration
      if (url.pathname === '/api/admin/verifications/approve' && req.method === 'POST') {
        const rawBody = await readRequestBody(req);
        const { pendingId } = JSON.parse(rawBody || '{}');
        if (!pendingId) {
          sendJson(res, 400, { error: 'pendingId is required.' });
          return;
        }
        const { getDb } = await import('./db.js');
        const db = getDb();
        const pending = await db.collection('pending_registrations').findOne({ pendingId });
        if (!pending) {
          sendJson(res, 404, { error: 'Pending registration not found.' });
          return;
        }
        if (pending.status !== 'pending_verification') {
          sendJson(res, 400, {
            error: `Registration is in '${pending.status}' state, not 'pending_verification'.`,
          });
          return;
        }
        // Generate a product key for this user
        const { generateProductKeys } = await import('./keys/service.js');
        const keys = await generateProductKeys(1, {
          customerEmail: pending.email,
          notes: `${pending.plan || 'free'} plan approval`,
        });
        const productKey = keys[0];
        // Email the key to the user
        const appUrl =
          process.env.app_forgeqa_in_APP_URL || process.env.APP_URL || 'http://127.0.0.1:5173';
        const completeUrl = `${appUrl}/auth/complete-registration?email=${encodeURIComponent(pending.email)}&key=${productKey}`;
        await sendProductKeyEmail(pending.email, productKey, pending.name || '', completeUrl);
        // Update the pending registration status to "ready" with the key
        await db.collection('pending_registrations').updateOne(
          { pendingId },
          {
            $set: {
              status: 'ready',
              productKey,
              approvedAt: new Date().toISOString(),
              approvedBy: admin.email,
            },
          }
        );
        await logAudit({
          adminId: admin.id,
          adminEmail: admin.email,
          action: 'approve_registration',
          resource: 'pending_registration',
          resourceId: pendingId,
          details: { email: pending.email, plan: pending.plan, productKey },
          ip: clientIp,
        });
        sendJson(res, 200, { ok: true, productKey, email: pending.email });
        return;
      }

      // Reject a pending registration
      if (url.pathname === '/api/admin/verifications/reject' && req.method === 'POST') {
        const rawBody = await readRequestBody(req);
        const { pendingId, reason } = JSON.parse(rawBody || '{}');
        if (!pendingId) {
          sendJson(res, 400, { error: 'pendingId is required.' });
          return;
        }
        const { getDb } = await import('./db.js');
        const db = getDb();
        const pending = await db.collection('pending_registrations').findOne({ pendingId });
        if (!pending) {
          sendJson(res, 404, { error: 'Pending registration not found.' });
          return;
        }
        // Send rejection email
        try {
          const transporter = (await import('nodemailer')).default;
          const host = process.env.SMTP_HOST;
          const port = parseInt(process.env.SMTP_PORT, 10) || 587;
          const user = process.env.SMTP_USER;
          const pass = process.env.SMTP_PASS;
          let t;
          if (host && pass) {
            t = transporter.createTransport({
              host,
              port,
              secure: port === 465,
              auth: { user, pass },
            });
          } else {
            const account = await transporter.createTestAccount();
            t = transporter.createTransport({
              host: 'smtp.ethereal.email',
              port: 587,
              secure: false,
              auth: { user: account.user, pass: account.pass },
            });
          }
          const reasonHtml = reason ? `<p><strong>Reason:</strong> ${reason}</p>` : '';
          await t.sendMail({
            from: process.env.SMTP_FROM || 'ForgeQA <noreply@app-forgeqa.in>',
            to: pending.email,
            subject: 'ForgeKey Registration Update',
            html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h1 style="color:#F59E0B;">ForgeKey</h1><p>Hello${pending.name ? ' ' + pending.name : ''},</p><p>We were unable to approve your ForgeKey registration at this time.</p>${reasonHtml}<p>If you believe this is an error, please contact support.</p><p style="color:#999;font-size:12px;">ForgeKey Team</p></body></html>`,
          });
        } catch (emailErr) {
          console.warn('Rejection email failed:', emailErr.message);
        }
        // Delete or mark as rejected
        await db.collection('pending_registrations').updateOne(
          { pendingId },
          {
            $set: {
              status: 'rejected',
              rejectedAt: new Date().toISOString(),
              rejectedBy: admin.email,
              rejectionReason: reason || null,
            },
          }
        );
        await logAudit({
          adminId: admin.id,
          adminEmail: admin.email,
          action: 'reject_registration',
          resource: 'pending_registration',
          resourceId: pendingId,
          details: { email: pending.email, reason },
          ip: clientIp,
        });
        sendJson(res, 200, { ok: true });
        return;
      }

      // Delete a pending registration record
      if (url.pathname.startsWith('/api/admin/verifications/') && req.method === 'DELETE') {
        const pendingId = decodeURIComponent(url.pathname.replace('/api/admin/verifications/', ''));
        if (!pendingId || pendingId.includes('/')) {
          sendJson(res, 400, { error: 'pendingId is required.' });
          return;
        }
        const { getDb } = await import('./db.js');
        const db = getDb();
        const pending = await db.collection('pending_registrations').findOne({ pendingId });
        if (!pending) {
          sendJson(res, 404, { error: 'Pending registration not found.' });
          return;
        }
        await db.collection('pending_registrations').deleteOne({ pendingId });
        await logAudit({
          adminId: admin.id,
          adminEmail: admin.email,
          action: 'delete_registration',
          resource: 'pending_registration',
          resourceId: pendingId,
          details: { email: pending.email, status: pending.status },
          ip: clientIp,
        });
        sendJson(res, 200, { ok: true });
        return;
      }

      // Deleted users list
      if (url.pathname === '/api/admin/deleted-users' && req.method === 'GET') {
        const { getDb } = await import('./db.js');
        const docs = await getDb()
          .collection('deleted_users')
          .find({})
          .sort({ deletedAt: -1 })
          .limit(200)
          .toArray();
        sendJson(res, 200, {
          deletedUsers: docs.map((d) => ({
            id: d._id.toString(),
            originalId: d.originalId,
            email: d.email,
            name: d.name,
            deletedAt: d.deletedAt,
          })),
        });
        return;
      }

      // Restore a deleted user back into the users collection
      if (
        url.pathname.startsWith('/api/admin/deleted-users/') &&
        url.pathname.endsWith('/restore') &&
        req.method === 'POST'
      ) {
        const id = url.pathname.replace('/api/admin/deleted-users/', '').replace('/restore', '');
        if (!id || id.includes('/')) {
          sendJson(res, 400, { error: 'Deleted user ID is required.' });
          return;
        }
        const { ObjectId } = await import('mongodb');
        const { getDb } = await import('./db.js');
        const db = getDb();
        let deletedDoc;
        try {
          deletedDoc = await db.collection('deleted_users').findOne({ _id: new ObjectId(id) });
        } catch {
          sendJson(res, 400, { error: 'Invalid deleted user ID.' });
          return;
        }
        if (!deletedDoc) {
          sendJson(res, 404, { error: 'Deleted user record not found.' });
          return;
        }
        const email = String(deletedDoc.email || '')
          .trim()
          .toLowerCase();
        if (!email) {
          sendJson(res, 400, { error: 'Record has no email; purge it instead.' });
          return;
        }
        const existing = await db.collection('users').findOne({ email });
        if (existing) {
          sendJson(res, 409, {
            error: 'An active account with this email already exists. Purge the record instead.',
          });
          return;
        }
        // Recreate the account without a password — user signs in via "Forgot password".
        const restored = {
          email,
          passwordHash: null,
          salt: null,
          iterations: null,
          name: deletedDoc.name || null,
          role: 'Member',
          subscriptionTier: 'free',
          subscriptionStatus: 'active',
          subscriptionEndsAt: null,
          createdAt: new Date().toISOString(),
          restoredAt: new Date().toISOString(),
          has_seen_welcome: false,
        };
        const insertResult = await db.collection('users').insertOne(restored);
        await db.collection('deleted_users').deleteOne({ _id: new ObjectId(id) });
        await logAudit({
          adminId: admin.id,
          adminEmail: admin.email,
          action: 'restore_user',
          resource: 'user',
          resourceId: insertResult.insertedId.toString(),
          details: { email },
          ip: clientIp,
        });
        sendJson(res, 200, { ok: true, id: insertResult.insertedId.toString(), email });
        return;
      }

      // Permanently purge a deleted-user record
      if (url.pathname.startsWith('/api/admin/deleted-users/') && req.method === 'DELETE') {
        const id = url.pathname.replace('/api/admin/deleted-users/', '');
        if (!id || id.includes('/')) {
          sendJson(res, 400, { error: 'Deleted user ID is required.' });
          return;
        }
        const { ObjectId } = await import('mongodb');
        const { getDb } = await import('./db.js');
        let result;
        try {
          result = await getDb()
            .collection('deleted_users')
            .deleteOne({ _id: new ObjectId(id) });
        } catch {
          sendJson(res, 400, { error: 'Invalid deleted user ID.' });
          return;
        }
        if (result.deletedCount === 0) {
          sendJson(res, 404, { error: 'Deleted user record not found.' });
          return;
        }
        await logAudit({
          adminId: admin.id,
          adminEmail: admin.email,
          action: 'purge_deleted_user',
          resource: 'deleted_user',
          resourceId: id,
          ip: clientIp,
        });
        sendJson(res, 200, { ok: true });
        return;
      }

      sendJson(res, 404, { error: 'Route not found.' });
    } catch (error) {
      console.error('ForgeKey API error:', error);
      sendJson(res, error.statusCode || 500, { error: error.message || 'Internal error' });
    }
  };
}
