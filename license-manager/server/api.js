import { connectDb } from "./db.js";
import { adminStore, authenticateToken, handleAuthRoute, logAudit, getAuditLogs } from "./auth/index.js";
import { KEY_ROUTES } from "./keys/routes.js";
import { sendProductKeyEmail, getEmailLogs, resendEmail } from "./email/service.js";
import { handleStripeWebhook } from "./payments/stripe.js";
import { handleRazorpayWebhook } from "./payments/razorpay.js";

function corsify(res, req) {
  const origin = req?.headers?.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  if (origin !== "*") res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    let size = 0;
    const MAX_SIZE = 1024 * 512;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_SIZE) {
        req.destroy(new Error("Request body too large"));
        return;
      }
      body += chunk;
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function parseUrl(req) {
  return new URL(req.url, "http://localhost");
}

export function createApiMiddleware(env) {
  // Propagate env vars for modules that read process.env directly (e.g. resend)
  if (env && typeof env === "object" && env !== process.env) {
    for (const key of Object.keys(env)) {
      if (env[key] !== undefined && process.env[key] === undefined) {
        process.env[key] = env[key];
      }
    }
  }

  let dbReady = connectDb().then(async () => {
    await adminStore.seedDefaultAdmin();
  });

  return async function apiMiddleware(req, res, next) {
    const url = parseUrl(req);

    corsify(res, req);

    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (!url.pathname.startsWith("/api/")) {
      next();
      return;
    }

    // Healthcheck — always responds immediately, no DB needed
    if (url.pathname === "/api/health" && req.method === "GET") {
      sendJson(res, 200, { status: "ok", uptime: process.uptime() });
      return;
    }

    try {
      await dbReady;
    } catch (dbError) {
      console.error("MongoDB not ready:", dbError);
      sendJson(res, 503, { error: "Database not connected. Please try again." });
      return;
    }

    try {
      // Stripe webhook needs raw body (not JSON parsed)
      if (url.pathname === "/api/webhooks/stripe" && req.method === "POST") {
        const rawBody = await readRequestBody(req);
        const result = await handleStripeWebhook(req, rawBody);
        sendJson(res, 200, result);
        return;
      }

      // Razorpay webhook also needs raw body
      if (url.pathname === "/api/webhooks/razorpay" && req.method === "POST") {
        const rawBody = await readRequestBody(req);
        const result = await handleRazorpayWebhook(req, rawBody);
        sendJson(res, 200, result);
        return;
      }

      // Internal endpoints (bypass admin auth)
      if (url.pathname === "/api/internal/register-key" && req.method === "POST") {
        const rawBody = await readRequestBody(req);
        const { email, name } = JSON.parse(rawBody || "{}");
        if (!email) {
          sendJson(res, 400, { error: "Email is required." });
          return;
        }
        try {
          const { generateProductKeys, listProductKeys } = await import("./keys/service.js");
          const keys = await generateProductKeys(1, { customerEmail: email, notes: "Free plan registration" });
          const key = keys[0];
          const { sendProductKeyEmail } = await import("./email/service.js");
          const appUrl = process.env.app_forgeqa_in_APP_URL || "http://127.0.0.1:5173";
          const completeUrl = `${appUrl}/auth/complete-registration?email=${encodeURIComponent(email)}&key=${key}`;
          await sendProductKeyEmail(email, key, name || "", completeUrl);
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

      const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";

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
            await logAudit({ adminId: admin.id, adminEmail: admin.email, action: result.action, resource: "key", resourceId: result.keyId, details: result.details, ip: clientIp });
          }
          return;
        }
      }

      // Email sending endpoint
      if (url.pathname === "/api/admin/email/send" && req.method === "POST") {
        const rawBody = await readRequestBody(req);
        const { to, productKey, customerName } = JSON.parse(rawBody || "{}");
        if (!to || !productKey) {
          sendJson(res, 400, { error: "Recipient email and product key are required." });
          return;
        }
        try {
          const appUrl = process.env.app_forgeqa_in_APP_URL || "http://127.0.0.1:5173";
          const completeUrl = `${appUrl}/auth/complete-registration?email=${encodeURIComponent(to)}&key=${productKey}`;
          await sendProductKeyEmail(to, productKey, customerName, completeUrl);
          await logAudit({ adminId: admin.id, adminEmail: admin.email, action: "send_email", resource: "email", details: { to, productKey }, ip: clientIp });
          sendJson(res, 200, { ok: true });
        } catch (err) {
          sendJson(res, 500, { error: err.message });
        }
        return;
      }

      // Email log endpoint (enhanced with filters + pagination)
      if (url.pathname === "/api/admin/email/logs" && req.method === "GET") {
        const search = url.searchParams.get("search") || "";
        const status = url.searchParams.get("status") || "all";
        const dateFrom = url.searchParams.get("dateFrom") || "";
        const dateTo = url.searchParams.get("dateTo") || "";
        const page = url.searchParams.get("page") || "1";
        const pageSize = url.searchParams.get("pageSize") || "50";
        const result = await getEmailLogs({ search, status, dateFrom, dateTo, page, pageSize });
        sendJson(res, 200, result);
        return;
      }

      // Resend email
      if (url.pathname === "/api/admin/email/resend" && req.method === "POST") {
        const rawBody = await readRequestBody(req);
        const { logId } = JSON.parse(rawBody || "{}");
        if (!logId) {
          sendJson(res, 400, { error: "logId is required." });
          return;
        }
        try {
          await resendEmail(logId);
          await logAudit({ adminId: admin.id, adminEmail: admin.email, action: "resend_email", resource: "email", details: { logId }, ip: clientIp });
          sendJson(res, 200, { ok: true });
        } catch (err) {
          sendJson(res, 500, { error: err.message });
        }
        return;
      }

      // Customer list and CRUD (users collection)
      if (url.pathname === "/api/admin/customers" && req.method === "GET") {
        const { getDb } = await import("./db.js");
        const db = getDb();

        // Single customer detail
        const idParam = url.searchParams.get("id");
        if (idParam) {
          const { ObjectId } = await import("mongodb");
          let user;
          try { user = await db.collection("users").findOne({ _id: new ObjectId(idParam) }); } catch { user = null; }
          if (!user) {
            sendJson(res, 404, { error: "Customer not found." });
            return;
          }
          const keys = await db.collection("product_keys").find(
            { $or: [{ customerEmail: user.email }, { registeredEmail: user.email }] }
          ).sort({ createdAt: -1 }).toArray();
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
              keys: keys.map((k) => ({ id: k._id.toString(), key: k.key, status: k.status, createdAt: k.createdAt })),
            },
          });
          return;
        }

        // Full list — merge approved users + rejected pending_registrations, dedup by email
        const users = await db.collection("users")
          .find({}, { projection: { email: 1, role: 1, name: 1, createdAt: 1, notes: 1 } })
          .sort({ createdAt: -1 })
          .toArray();

        const approvedEmails = new Set(users.map((u) => u.email));

        const rejectedRegs = await db.collection("pending_registrations")
          .find({ status: "rejected" }, {
            projection: { email: 1, name: 1, createdAt: 1, status: 1, rejectionReason: 1, rejectedAt: 1, rejectedBy: 1, plan: 1 },
          })
          .sort({ createdAt: -1 })
          .toArray();

        const dedupedRejected = rejectedRegs.filter(
          (r) => !approvedEmails.has(r.email)
        );

        const mapUser = async (u, status) => {
          const keys = await db.collection("product_keys").find(
            { $or: [{ customerEmail: u.email }, { registeredEmail: u.email }] }
          ).sort({ createdAt: -1 }).toArray();
          return {
            id: u._id ? u._id.toString() : `rejected_${u.email}`,
            email: u.email,
            role: u.role || "user",
            name: u.name || null,
            notes: u.notes || null,
            status,
            createdAt: u.createdAt,
            productKey: keys[0]?.key || null,
            keyStatus: keys[0]?.status || null,
            keys: keys.map((k) => ({ id: k._id.toString(), key: k.key, status: k.status, createdAt: k.createdAt })),
          };
        };

        const approved = await Promise.all(users.map((u) => mapUser(u, "approved")));
        const rejected = await Promise.all(dedupedRejected.map((r) => mapUser(r, "rejected")));

        const customers = [...approved, ...rejected].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        sendJson(res, 200, { customers });
        return;
      }

      // Update customer
      if (url.pathname.startsWith("/api/admin/customers/") && req.method === "PUT") {
        const id = url.pathname.replace("/api/admin/customers/", "");
        if (!id || id.includes("/")) {
          sendJson(res, 400, { error: "Customer ID is required." });
          return;
        }
        const { ObjectId } = await import("mongodb");
        const rawBody = await readRequestBody(req);
        const { role, notes } = JSON.parse(rawBody || "{}");
        const update = {};
        if (role) update.role = role;
        if (notes !== undefined) update.notes = notes;
        if (Object.keys(update).length === 0) {
          sendJson(res, 400, { error: "No fields to update." });
          return;
        }
        const { getDb } = await import("./db.js");
        const result = await getDb().collection("users").updateOne(
          { _id: new ObjectId(id) },
          { $set: update }
        );
        if (result.matchedCount === 0) {
          sendJson(res, 404, { error: "Customer not found." });
          return;
        }
        await logAudit({ adminId: admin.id, adminEmail: admin.email, action: "update_customer", resource: "customer", resourceId: id, details: update, ip: clientIp });
        sendJson(res, 200, { ok: true });
        return;
      }

      // Delete customer
      if (url.pathname.startsWith("/api/admin/customers/") && req.method === "DELETE") {
        const id = url.pathname.replace("/api/admin/customers/", "");
        if (!id || id.includes("/")) {
          sendJson(res, 400, { error: "Customer ID is required." });
          return;
        }
        const { ObjectId } = await import("mongodb");
        const { getDb } = await import("./db.js");
        const db = getDb();
        const user = await db.collection("users").findOne({ _id: new ObjectId(id) });
        if (!user) {
          sendJson(res, 404, { error: "Customer not found." });
          return;
        }
        await db.collection("users").deleteOne({ _id: new ObjectId(id) });
        await db.collection("product_keys").updateMany(
          { $or: [{ customerEmail: user.email }, { registeredEmail: user.email }] },
          { $set: { status: "available", usedBy: null, usedAt: null, registeredEmail: null } }
        );
        await logAudit({ adminId: admin.id, adminEmail: admin.email, action: "delete_customer", resource: "customer", resourceId: id, details: { email: user.email }, ip: clientIp });
        sendJson(res, 200, { ok: true });
        return;
      }

      // ── Plan management ──────────────────────────────────────────────────────

      // List all plans
      if (url.pathname === "/api/admin/plans" && req.method === "GET") {
        const { getDb } = await import("./db.js");
        const plans = await getDb().collection("plans")
          .find({})
          .sort({ sortOrder: 1 })
          .toArray();
        sendJson(res, 200, {
          plans: plans.map((p) => ({ id: p._id.toString(), ...p, _id: undefined })),
        });
        return;
      }

      // Create a plan
      if (url.pathname === "/api/admin/plans" && req.method === "POST") {
        const rawBody = await readRequestBody(req);
        const { id, name, price, currency, period, description, features, popular, active, maxUsers, maxTestCases, aiProviders, advancedExport, regressionTesting, prioritySupport, customIntegrations, onPremise } = JSON.parse(rawBody || "{}");
        if (!id || !name || price === undefined) {
          sendJson(res, 400, { error: "Plan id, name, and price are required." });
          return;
        }
        const { getDb } = await import("./db.js");
        const db = getDb();
        const existing = await db.collection("plans").findOne({ id });
        if (existing) {
          sendJson(res, 409, { error: "A plan with this id already exists." });
          return;
        }
        const plan = {
          id,
          name,
          price,
          currency: currency || "usd",
          period: period || "monthly",
          description: description || "",
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
        await db.collection("plans").insertOne(plan);
        await logAudit({ adminId: admin.id, adminEmail: admin.email, action: "create_plan", resource: "plan", resourceId: id, details: plan, ip: clientIp });
        sendJson(res, 201, { plan });
        return;
      }

      // Update a plan
      if (url.pathname.startsWith("/api/admin/plans/") && req.method === "PUT") {
        const id = url.pathname.replace("/api/admin/plans/", "");
        if (!id || id.includes("/")) {
          sendJson(res, 400, { error: "Plan ID is required." });
          return;
        }
        const rawBody = await readRequestBody(req);
        const fields = JSON.parse(rawBody || "{}");
        const allowed = ["name", "price", "currency", "period", "description", "features", "popular", "active", "maxUsers", "maxTestCases", "aiProviders", "advancedExport", "regressionTesting", "prioritySupport", "customIntegrations", "onPremise"];
        const update = {};
        for (const key of allowed) {
          if (fields[key] !== undefined) update[key] = fields[key];
        }
        if (Object.keys(update).length === 0) {
          sendJson(res, 400, { error: "No fields to update." });
          return;
        }
        update.updatedAt = new Date().toISOString();
        const { getDb } = await import("./db.js");
        const result = await getDb().collection("plans").updateOne({ id }, { $set: update });
        if (result.matchedCount === 0) {
          sendJson(res, 404, { error: "Plan not found." });
          return;
        }
        await logAudit({ adminId: admin.id, adminEmail: admin.email, action: "update_plan", resource: "plan", resourceId: id, details: update, ip: clientIp });
        sendJson(res, 200, { ok: true });
        return;
      }

      // Delete a plan
      if (url.pathname.startsWith("/api/admin/plans/") && req.method === "DELETE") {
        const id = url.pathname.replace("/api/admin/plans/", "");
        if (!id || id.includes("/")) {
          sendJson(res, 400, { error: "Plan ID is required." });
          return;
        }
        const { getDb } = await import("./db.js");
        const result = await getDb().collection("plans").deleteOne({ id });
        if (result.deletedCount === 0) {
          sendJson(res, 404, { error: "Plan not found." });
          return;
        }
        await logAudit({ adminId: admin.id, adminEmail: admin.email, action: "delete_plan", resource: "plan", resourceId: id, ip: clientIp });
        sendJson(res, 200, { ok: true });
        return;
      }

      // Payment transactions
      if (url.pathname === "/api/admin/transactions" && req.method === "GET") {
        const { getDb } = await import("./db.js");
        const docs = await getDb().collection("payment_transactions")
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
            timestamp: d.timestamp,
          })),
        });
        return;
      }

      // Audit logs
      if (url.pathname === "/api/admin/audit-logs" && req.method === "GET") {
        const logs = await getAuditLogs({ limit: 200 });
        sendJson(res, 200, { logs });
        return;
      }

      // ── Verification routes ──────────────────────────────────────────────────

      // List pending registrations (from main app shared DB)
      if (url.pathname === "/api/admin/verifications" && req.method === "GET") {
        const { getDb } = await import("./db.js");
        const db = getDb();
        const query = {};
        const status = url.searchParams.get("status");
        if (status) query.status = status;
        const docs = await db.collection("pending_registrations")
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
          paymentStatus: d.paymentStatus || "pending",
          status: d.status,
          transactionId: d.transactionId || null,
          createdAt: d.createdAt,
        }));
        sendJson(res, 200, { registrations });
        return;
      }

      // Approve a pending registration
      if (url.pathname === "/api/admin/verifications/approve" && req.method === "POST") {
        const rawBody = await readRequestBody(req);
        const { pendingId } = JSON.parse(rawBody || "{}");
        if (!pendingId) {
          sendJson(res, 400, { error: "pendingId is required." });
          return;
        }
        const { getDb } = await import("./db.js");
        const db = getDb();
        const pending = await db.collection("pending_registrations").findOne({ pendingId });
        if (!pending) {
          sendJson(res, 404, { error: "Pending registration not found." });
          return;
        }
        if (pending.status !== "pending_verification") {
          sendJson(res, 400, { error: `Registration is in '${pending.status}' state, not 'pending_verification'.` });
          return;
        }
        // Generate a product key for this user
        const { generateProductKeys } = await import("./keys/service.js");
        const keys = await generateProductKeys(1, { customerEmail: pending.email, notes: `${pending.plan || "free"} plan approval` });
        const productKey = keys[0];
        // Email the key to the user
        const appUrl = process.env.app_forgeqa_in_APP_URL || "http://127.0.0.1:5173";
        const completeUrl = `${appUrl}/auth/complete-registration?email=${encodeURIComponent(pending.email)}&key=${productKey}`;
        await sendProductKeyEmail(pending.email, productKey, pending.name || "", completeUrl);
        // Update the pending registration status to "ready" with the key
        await db.collection("pending_registrations").updateOne(
          { pendingId },
          { $set: { status: "ready", productKey, approvedAt: new Date().toISOString(), approvedBy: admin.email } }
        );
        await logAudit({ adminId: admin.id, adminEmail: admin.email, action: "approve_registration", resource: "pending_registration", resourceId: pendingId, details: { email: pending.email, plan: pending.plan, productKey }, ip: clientIp });
        sendJson(res, 200, { ok: true, productKey, email: pending.email });
        return;
      }

      // Reject a pending registration
      if (url.pathname === "/api/admin/verifications/reject" && req.method === "POST") {
        const rawBody = await readRequestBody(req);
        const { pendingId, reason } = JSON.parse(rawBody || "{}");
        if (!pendingId) {
          sendJson(res, 400, { error: "pendingId is required." });
          return;
        }
        const { getDb } = await import("./db.js");
        const db = getDb();
        const pending = await db.collection("pending_registrations").findOne({ pendingId });
        if (!pending) {
          sendJson(res, 404, { error: "Pending registration not found." });
          return;
        }
        // Send rejection email
        try {
          const transporter = (await import("nodemailer")).default;
          const host = process.env.SMTP_HOST;
          const port = parseInt(process.env.SMTP_PORT, 10) || 587;
          const user = process.env.SMTP_USER;
          const pass = process.env.SMTP_PASS;
          let t;
          if (host && pass) {
            t = transporter.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
          } else {
            const account = await transporter.createTestAccount();
            t = transporter.createTransport({ host: "smtp.ethereal.email", port: 587, secure: false, auth: { user: account.user, pass: account.pass } });
          }
          const reasonHtml = reason ? `<p><strong>Reason:</strong> ${reason}</p>` : "";
          await t.sendMail({
            from: process.env.SMTP_FROM || "ForgeKey <onboarding@resend.dev>",
            to: pending.email,
            subject: "ForgeKey Registration Update",
            html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h1 style="color:#F59E0B;">ForgeKey</h1><p>Hello${pending.name ? " " + pending.name : ""},</p><p>We were unable to approve your ForgeKey registration at this time.</p>${reasonHtml}<p>If you believe this is an error, please contact support.</p><p style="color:#999;font-size:12px;">ForgeKey Team</p></body></html>`,
          });
        } catch (emailErr) {
          console.warn("Rejection email failed:", emailErr.message);
        }
        // Delete or mark as rejected
        await db.collection("pending_registrations").updateOne(
          { pendingId },
          { $set: { status: "rejected", rejectedAt: new Date().toISOString(), rejectedBy: admin.email, rejectionReason: reason || null } }
        );
        await logAudit({ adminId: admin.id, adminEmail: admin.email, action: "reject_registration", resource: "pending_registration", resourceId: pendingId, details: { email: pending.email, reason }, ip: clientIp });
        sendJson(res, 200, { ok: true });
        return;
      }

      // Deleted users list
      if (url.pathname === "/api/admin/deleted-users" && req.method === "GET") {
        const { getDb } = await import("./db.js");
        const docs = await getDb().collection("deleted_users")
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

      sendJson(res, 404, { error: "Route not found." });
    } catch (error) {
      console.error("ForgeKey API error:", error);
      sendJson(res, error.statusCode || 500, { error: error.message || "Internal error" });
    }
  };
}
