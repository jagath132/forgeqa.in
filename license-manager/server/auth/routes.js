import crypto from 'node:crypto';
import { adminStore } from './store.js';
import { authenticateToken, generateToken } from './service.js';
import { logAudit, getAuditLogs } from './audit.js';

const PBKDF2_ITERATIONS = 600000;

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function getRequestClientInfo(req) {
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown';
  return { ip, userAgent };
}

// GET /api/admin/setup-status (public)
async function handleSetupStatus(req, res) {
  try {
    const count = await adminStore.countAdmins();
    sendJson(res, 200, {
      hasAdmin: count > 0,
      count,
    });
  } catch (err) {
    console.error('[auth] Setup status error:', err);
    sendJson(res, 500, { error: err.message || 'Failed to check setup status' });
  }
}

// POST /api/admin/setup (public, only if 0 admins exist)
async function handleSetup(req, res, url, body) {
  const count = await adminStore.countAdmins();
  if (count > 0) {
    sendJson(res, 403, {
      error:
        'License Manager is already initialized. Please sign in with an existing administrator account.',
    });
    return;
  }

  const { email, password } = body;
  if (!email || !password) {
    sendJson(res, 400, { error: 'Email and password are required.' });
    return;
  }

  const normalized = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalized)) {
    sendJson(res, 400, { error: 'Please enter a valid email address.' });
    return;
  }

  if (password.length < 8) {
    sendJson(res, 400, { error: 'Password must be at least 8 characters long.' });
    return;
  }

  const { ip, userAgent } = getRequestClientInfo(req);

  try {
    const newAdmin = await adminStore.createAdmin({ email: normalized, password, ip, userAgent });
    console.log(`[auth] Initial dynamic admin created: ${newAdmin.email}`);

    // Record login and audit in MongoDB
    await adminStore.recordLogin({
      adminId: newAdmin.id,
      email: newAdmin.email,
      ip,
      userAgent,
      status: 'success',
      headers: req.headers,
    });

    await logAudit({
      adminId: newAdmin.id,
      adminEmail: newAdmin.email,
      action: 'admin_setup',
      resource: 'admin',
      resourceId: newAdmin.id,
      details: { email: newAdmin.email, ip, userAgent },
      ip,
    });

    const token = generateToken({ id: newAdmin.id, email: newAdmin.email });
    sendJson(res, 201, {
      success: true,
      message: 'Admin account created successfully.',
      token,
      admin: { id: newAdmin.id, email: newAdmin.email },
    });
  } catch (err) {
    console.error('[auth] Dynamic setup error:', err);
    sendJson(res, 500, { error: err.message || 'Failed to create administrator account.' });
  }
}

// POST /api/admin/login (public)
async function handleLogin(req, res, url, body) {
  const { email, password } = body;
  const { ip, userAgent } = getRequestClientInfo(req);

  if (!email || !password) {
    await adminStore.recordLogin({
      adminId: null,
      email: email || 'unknown',
      ip,
      userAgent,
      status: 'failed',
      failureReason: 'Missing email or password',
      headers: req.headers,
    });
    sendJson(res, 400, { error: 'Email and password are required.' });
    return;
  }

  const admin = await adminStore.findByEmail(email);
  if (!admin) {
    // Record failed login in MongoDB
    await adminStore.recordLogin({
      adminId: null,
      email,
      ip,
      userAgent,
      status: 'failed',
      failureReason: 'Administrator account not found',
      headers: req.headers,
    });
    sendJson(res, 401, { error: 'Invalid credentials.' });
    return;
  }

  const checkHash = crypto
    .pbkdf2Sync(password, admin.salt, PBKDF2_ITERATIONS, 64, 'sha512')
    .toString('hex');
  let match = false;
  try {
    match = crypto.timingSafeEqual(
      Buffer.from(admin.passwordHash, 'hex'),
      Buffer.from(checkHash, 'hex')
    );
  } catch {
    match = false;
  }

  if (!match) {
    // Record failed password attempt in MongoDB
    await adminStore.recordLogin({
      adminId: admin._id.toString(),
      email: admin.email,
      ip,
      userAgent,
      status: 'failed',
      failureReason: 'Incorrect password',
      headers: req.headers,
    });
    sendJson(res, 401, { error: 'Invalid credentials.' });
    return;
  }

  // Record successful login in MongoDB (admin_logins + audit_logs + admins collection)
  await adminStore.recordLogin({
    adminId: admin._id.toString(),
    email: admin.email,
    ip,
    userAgent,
    status: 'success',
    headers: req.headers,
  });

  const token = generateToken({ id: admin._id.toString(), email: admin.email });
  sendJson(res, 200, {
    token,
    admin: { id: admin._id.toString(), email: admin.email },
  });
}

// GET /api/admin/me (authenticated)
async function handleMe(req, res, url, body, admin) {
  sendJson(res, 200, { admin });
}

// GET /api/admin/logins (authenticated)
async function handleGetLogins(req, res, url, body, admin) {
  const limit = parseInt(url.searchParams?.get('limit') || '50', 10);
  const skip = parseInt(url.searchParams?.get('skip') || '0', 10);
  const logins = await adminStore.getAdminLogins({ limit, skip });
  sendJson(res, 200, { logins });
}

// GET /api/admin/audit-logs (authenticated)
async function handleGetAuditLogs(req, res, url, body, admin) {
  const limit = parseInt(url.searchParams?.get('limit') || '100', 10);
  const action = url.searchParams?.get('action') || undefined;
  const logs = await getAuditLogs({ limit, action });
  sendJson(res, 200, { logs });
}

// POST /api/admin/change-password (authenticated)
async function handleChangePassword(req, res, url, body, admin) {
  const { currentPassword, newPassword } = body;
  const { ip, userAgent } = getRequestClientInfo(req);

  if (!currentPassword || !newPassword) {
    sendJson(res, 400, { error: 'Current password and new password are required.' });
    return;
  }
  if (newPassword.length < 8) {
    sendJson(res, 400, { error: 'New password must be at least 8 characters long.' });
    return;
  }
  if (currentPassword === newPassword) {
    sendJson(res, 400, { error: 'New password must be different from current password.' });
    return;
  }

  const fullAdmin = await adminStore.findByEmail(admin.email);
  if (!fullAdmin) {
    sendJson(res, 404, { error: 'Admin account not found.' });
    return;
  }

  const checkHash = crypto
    .pbkdf2Sync(currentPassword, fullAdmin.salt, PBKDF2_ITERATIONS, 64, 'sha512')
    .toString('hex');
  let match = false;
  try {
    match = crypto.timingSafeEqual(
      Buffer.from(fullAdmin.passwordHash, 'hex'),
      Buffer.from(checkHash, 'hex')
    );
  } catch {
    match = false;
  }

  if (!match) {
    sendJson(res, 401, { error: 'Current password is incorrect.' });
    return;
  }

  await adminStore.updatePassword(fullAdmin._id, newPassword);

  // Record audit in MongoDB
  await logAudit({
    adminId: admin.id,
    adminEmail: admin.email,
    action: 'change_password',
    resource: 'admin',
    resourceId: admin.id,
    details: { ip, userAgent },
    ip,
  });

  console.log(`[auth] Dynamic password updated for admin: ${admin.email}`);
  sendJson(res, 200, { success: true, message: 'Password updated successfully.' });
}

// POST /api/admin/change-email (authenticated)
async function handleChangeEmail(req, res, url, body, admin) {
  const { newEmail, currentPassword } = body;
  const { ip, userAgent } = getRequestClientInfo(req);

  if (!newEmail || !currentPassword) {
    sendJson(res, 400, { error: 'New email and current password are required.' });
    return;
  }

  const normalized = newEmail.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalized)) {
    sendJson(res, 400, { error: 'Please enter a valid email address.' });
    return;
  }
  if (normalized === admin.email.toLowerCase()) {
    sendJson(res, 400, { error: 'New email must be different from your current email.' });
    return;
  }

  const existing = await adminStore.findByEmail(normalized);
  if (existing) {
    sendJson(res, 409, { error: 'That email is already in use by another admin.' });
    return;
  }

  const fullAdmin = await adminStore.findByEmail(admin.email);
  if (!fullAdmin) {
    sendJson(res, 404, { error: 'Admin account not found.' });
    return;
  }

  const checkHash = crypto
    .pbkdf2Sync(currentPassword, fullAdmin.salt, PBKDF2_ITERATIONS, 64, 'sha512')
    .toString('hex');
  let match = false;
  try {
    match = crypto.timingSafeEqual(
      Buffer.from(fullAdmin.passwordHash, 'hex'),
      Buffer.from(checkHash, 'hex')
    );
  } catch {
    match = false;
  }

  if (!match) {
    sendJson(res, 401, { error: 'Current password is incorrect.' });
    return;
  }

  await adminStore.updateEmail(fullAdmin._id, normalized);

  // Record audit in MongoDB
  await logAudit({
    adminId: admin.id,
    adminEmail: normalized,
    action: 'change_email',
    resource: 'admin',
    resourceId: admin.id,
    details: { oldEmail: admin.email, newEmail: normalized, ip, userAgent },
    ip,
  });

  console.log(`[auth] Dynamic email updated: ${admin.email} -> ${normalized}`);

  const newToken = generateToken({ id: fullAdmin._id.toString(), email: normalized });
  sendJson(res, 200, {
    success: true,
    message: 'Email updated successfully.',
    token: newToken,
    admin: { id: fullAdmin._id.toString(), email: normalized },
  });
}

// GET /api/admin/list (authenticated)
async function handleListAdmins(req, res, url, body, admin) {
  const admins = await adminStore.listAdmins();
  sendJson(res, 200, { admins, currentAdminId: admin.id });
}

// POST /api/admin/create (authenticated)
async function handleCreateAdmin(req, res, url, body, admin) {
  const { email, password } = body;
  const { ip, userAgent } = getRequestClientInfo(req);

  if (!email || !password) {
    sendJson(res, 400, { error: 'Email and password are required.' });
    return;
  }
  const normalized = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalized)) {
    sendJson(res, 400, { error: 'Please enter a valid email address.' });
    return;
  }
  if (password.length < 8) {
    sendJson(res, 400, { error: 'Password must be at least 8 characters long.' });
    return;
  }

  const newAdmin = await adminStore.createAdmin({ email: normalized, password, ip, userAgent });

  // Record audit in MongoDB
  await logAudit({
    adminId: admin.id,
    adminEmail: admin.email,
    action: 'create_admin',
    resource: 'admin',
    resourceId: newAdmin.id,
    details: { createdEmail: newAdmin.email, ip, userAgent },
    ip,
  });

  console.log(`[auth] Admin ${admin.email} created new admin: ${newAdmin.email}`);
  sendJson(res, 201, { success: true, admin: newAdmin });
}

// POST /api/admin/delete (authenticated)
async function handleDeleteAdmin(req, res, url, body, admin) {
  const { id } = body;
  const { ip, userAgent } = getRequestClientInfo(req);

  if (!id) {
    sendJson(res, 400, { error: 'Admin ID is required.' });
    return;
  }
  if (id === admin.id) {
    sendJson(res, 400, { error: 'You cannot delete your own admin account.' });
    return;
  }

  const targetAdmin = await adminStore.findById(id);
  await adminStore.deleteAdmin(id);

  // Record audit in MongoDB
  await logAudit({
    adminId: admin.id,
    adminEmail: admin.email,
    action: 'delete_admin',
    resource: 'admin',
    resourceId: id,
    details: { deletedEmail: targetAdmin?.email || id, ip, userAgent },
    ip,
  });

  console.log(`[auth] Admin ${admin.email} deleted admin: ${id}`);
  sendJson(res, 200, { success: true, message: 'Admin removed successfully.' });
}

const ROUTE_CONFIG = [
  { path: '/api/admin/setup-status', method: 'GET', handler: handleSetupStatus, auth: false },
  { path: '/api/admin/setup', method: 'POST', handler: handleSetup, auth: false },
  { path: '/api/admin/login', method: 'POST', handler: handleLogin, auth: false },
  { path: '/api/admin/me', method: 'GET', handler: handleMe, auth: true },
  { path: '/api/admin/logins', method: 'GET', handler: handleGetLogins, auth: true },
  { path: '/api/admin/audit-logs', method: 'GET', handler: handleGetAuditLogs, auth: true },
  { path: '/api/admin/change-password', method: 'POST', handler: handleChangePassword, auth: true },
  { path: '/api/admin/change-email', method: 'POST', handler: handleChangeEmail, auth: true },
  { path: '/api/admin/list', method: 'GET', handler: handleListAdmins, auth: true },
  { path: '/api/admin/create', method: 'POST', handler: handleCreateAdmin, auth: true },
  { path: '/api/admin/delete', method: 'POST', handler: handleDeleteAdmin, auth: true },
];

export async function handleAuthRoute(req, res, url) {
  const routeConfig = ROUTE_CONFIG.find((r) => r.path === url.pathname && r.method === req.method);
  if (!routeConfig) return false;

  let body = {};
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const rawBody = await readRequestBody(req);
    body = rawBody ? JSON.parse(rawBody) : {};
  }

  if (routeConfig.auth) {
    try {
      const admin = await authenticateToken(req);
      await routeConfig.handler(req, res, url, body, admin);
    } catch (authError) {
      sendJson(res, authError.statusCode || 401, { error: authError.message });
    }
  } else {
    try {
      await routeConfig.handler(req, res, url, body);
    } catch (handlerError) {
      console.error('[auth] Public route error:', handlerError);
      sendJson(res, 500, { error: handlerError.message || 'An internal error occurred.' });
    }
  }

  return true;
}
