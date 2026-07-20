import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { authStore } from './store.js';
import { getDb } from '../db.js';
import { isDisposableEmail } from './disposable-emails.js';
import {
  authenticateToken,
  encryptApiKey,
  generateToken,
  generateRefreshToken,
  revokeRefreshToken,
  rotateRefreshToken,
  verifyRefreshToken,
  parseCookies,
  getAuthToken,
} from './service.js';
import { validateProductKey, claimProductKey, isValidKeyFormat } from './productKeys.js';
import { sendPasswordResetEmail, sendSupportEmail } from '../email/index.js';
import {
  checkRateLimit,
  checkAccountLockout,
  recordFailedAttempt,
  clearLockout,
} from '../rate-limit/index.js';
import { verify2FA, is2FAEnabled } from '../2fa/index.js';
import { getUserPlan } from '../billing/plans.js';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function setAuthCookie(res, token, refreshToken) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookies = [
    `token=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/${isProd ? '; Secure' : ''}`,
    refreshToken
      ? `refreshToken=${encodeURIComponent(refreshToken)}; HttpOnly; SameSite=Strict; Path=/${isProd ? '; Secure' : ''}`
      : '',
    `session=active; SameSite=Strict; Path=/${isProd ? '; Secure' : ''}`,
  ].filter(Boolean);
  res.setHeader('Set-Cookie', cookies);
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    const MAX_SIZE = 1024 * 100;
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

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

async function handleValidateKey(req, res, body) {
  const { productKey } = body;

  if (!productKey) {
    sendJson(res, 400, { error: 'Product key is required.' });
    return;
  }

  if (!isValidKeyFormat(productKey)) {
    sendJson(res, 400, { error: 'Product key format is invalid.' });
    return;
  }

  const validKey = await validateProductKey(productKey);
  if (!validKey) {
    sendJson(res, 400, { error: 'Product key is invalid, expired, or already used.' });
    return;
  }

  sendJson(res, 200, { valid: true, key: validKey.key });
}

async function handleLogin(req, res, body) {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  if (!(await checkRateLimit(clientIp))) {
    sendJson(res, 429, { error: 'Too many login attempts. Try again later.' });
    return;
  }

  const { email, password, rememberDevice, deviceToken } = body;

  if (!email || !password) {
    sendJson(res, 400, { error: 'Email and password are required.' });
    return;
  }

  const lockoutKey = `login:${email.trim().toLowerCase()}`;
  if (await checkAccountLockout(lockoutKey)) {
    const db = getDb();
    const lockoutRecord = await db
      .collection('rate_limits')
      .findOne({ ip: `lockout:${lockoutKey}`, endpoint: 'lockout' });
    const lockedUntil = lockoutRecord?.lockedUntil;
    const remainingMs = lockedUntil ? Math.max(0, lockedUntil - Date.now()) : 0;
    const remainingMinutes = Math.ceil(remainingMs / 60000);
    res.setHeader('Retry-After', String(remainingMinutes * 60));
    sendJson(res, 429, {
      error: 'Invalid email or password.',
      lockout: true,
      remainingMinutes: remainingMinutes || 15,
      unlockAt: lockedUntil || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });
    return;
  }

  const userRecord = await authStore.findUserWithPassword(email);
  const dummyHash = crypto.pbkdf2Sync('dummy', 'salt', 600000, 64, 'sha512').toString('hex');

  let match = false;
  if (userRecord && userRecord.passwordHash && userRecord.salt) {
    const checkHash = crypto
      .pbkdf2Sync(password, userRecord.salt, 600000, 64, 'sha512')
      .toString('hex');
    try {
      match = crypto.timingSafeEqual(
        Buffer.from(userRecord.passwordHash, 'hex'),
        Buffer.from(checkHash, 'hex')
      );
    } catch {
      match = false;
    }
  } else {
    crypto.timingSafeEqual(Buffer.from(dummyHash, 'hex'), Buffer.from(dummyHash, 'hex'));
  }

  if (!match) {
    recordFailedAttempt(lockoutKey);
    sendJson(res, 401, { error: 'Invalid email or password.' });
    return;
  }

  clearLockout(lockoutKey);

  const userId = userRecord._id.toString();
  const tfaCode = body.twoFactorCode;
  const tfaEnabled = await is2FAEnabled(userId);

  if (tfaEnabled) {
    const { verifyTrustedDevice } = await import('../2fa/index.js');
    const isTrusted = deviceToken && (await verifyTrustedDevice(userId, deviceToken));

    if (tfaCode) {
      const tfaOk = await verify2FA(userId, tfaCode);
      if (!tfaOk) {
        recordFailedAttempt(lockoutKey);
        sendJson(res, 401, { error: 'Invalid two-factor authentication code.' });
        return;
      }
      if (rememberDevice && !isTrusted) {
        const userAgent = req.headers['user-agent'] || 'Unknown Browser';
        const deviceName = extractDeviceName(userAgent);
        const { addTrustedDevice } = await import('../2fa/index.js');
        const device = await addTrustedDevice(userId, deviceName);
        const token = generateToken(userRecord);
        const refreshToken = await generateRefreshToken(userRecord);
        setAuthCookie(res, token, refreshToken);
        sendJson(res, 200, {
          token,
          deviceToken: device.token,
          user: {
            id: userId,
            email: userRecord.email,
            name: userRecord.name || null,
            role: userRecord.role || 'Member',
            createdAt: userRecord.createdAt,
            has_seen_welcome: userRecord.has_seen_welcome || false,
          },
        });
        return;
      }
    } else if (!isTrusted) {
      sendJson(res, 200, { require2FA: true, email: userRecord.email });
      return;
    }
  }

  const token = generateToken(userRecord);
  const refreshToken = await generateRefreshToken(userRecord);
  setAuthCookie(res, token, refreshToken);

  sendJson(res, 200, {
    token,
    user: {
      id: userId,
      email: userRecord.email,
      name: userRecord.name || null,
      role: userRecord.role || 'Member',
      createdAt: userRecord.createdAt,
      has_seen_welcome: userRecord.has_seen_welcome || false,
    },
  });
}

function extractDeviceName(userAgent) {
  if (!userAgent) return 'Unknown Device';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Edg')) return 'Edge';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera';
  return 'Unknown Browser';
}

async function handleForgotPassword(req, res, body) {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  if (!(await checkRateLimit(clientIp))) {
    sendJson(res, 429, { error: 'Too many requests. Try again later.' });
    return;
  }

  const { email } = body;

  if (!email || !email.includes('@')) {
    sendJson(res, 400, { error: 'Please enter a valid email address.' });
    return;
  }

  if (isDisposableEmail(email)) {
    sendJson(res, 400, { error: 'Temporary email addresses are not allowed.' });
    return;
  }

  const user = await authStore.findUserByEmail(email);
  if (user) {
    const resetToken = await authStore.createPasswordResetToken(email);
    if (resetToken) {
      const baseUrl = process.env.APP_URL || 'http://127.0.0.1:5173';
      const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;
      await sendPasswordResetEmail(email, resetUrl);
    }
  }

  sendJson(res, 200, {
    message:
      'If this email is registered, a password reset link has been sent. Please check your inbox and follow the instructions to reset your password.',
  });
}

async function handleResetPassword(req, res, body) {
  const { token, password } = body;

  if (!token || !password) {
    sendJson(res, 400, { error: 'Token and password are required.' });
    return;
  }

  if (!PASSWORD_REGEX.test(password)) {
    sendJson(res, 400, {
      error:
        'Password must be at least 8 characters with uppercase, lowercase, number, and special character.',
    });
    return;
  }

  try {
    const user = await authStore.resetPassword(token, password);
    if (user?.email) {
      const lockoutKey = `login:${user.email.toLowerCase()}`;
      await clearLockout(lockoutKey);
    }
    sendJson(res, 200, { message: 'Password has been reset successfully. You can now sign in.' });
  } catch (err) {
    sendJson(res, 400, { error: err.message || 'Unable to reset password.' });
  }
}

async function handleRefreshToken(req, res, body) {
  try {
    const { user, rawToken } = await verifyRefreshToken(req);
    const newAccessToken = generateToken(user);
    const newRefreshToken = await rotateRefreshToken(rawToken);
    setAuthCookie(res, newAccessToken, newRefreshToken);
    sendJson(res, 200, { token: newAccessToken });
  } catch (e) {
    const status = e.statusCode || 401;
    sendJson(res, status, { error: e.message || 'Invalid or expired refresh token' });
  }
}

async function handleChangePassword(req, res, url, body, user) {
  const { newPassword } = body;
  if (!newPassword) {
    sendJson(res, 400, { error: 'New password is required.' });
    return;
  }
  if (!PASSWORD_REGEX.test(newPassword)) {
    sendJson(res, 400, {
      error:
        'New password must be at least 8 characters with uppercase, lowercase, number, and special character.',
    });
    return;
  }
  try {
    await authStore.resetUserPassword(user.id, newPassword);
    sendJson(res, 200, { message: 'Password changed successfully.' });
  } catch (err) {
    sendJson(res, 400, { error: err.message });
  }
}

async function handleMe(req, res, url, body, user) {
  const plan = await getUserPlan(user.id);
  const twoFactor = await is2FAEnabled(user.id);
  const db = getDb();
  const userDoc = await db
    .collection('users')
    .findOne(
      { _id: new (await import('mongodb')).ObjectId(user.id) },
      { projection: { activeProvider: 1 } }
    );
  const db2 = getDb();
  const fullUser = await db2
    .collection('users')
    .findOne(
      { _id: new (await import('mongodb')).ObjectId(user.id) },
      { projection: { has_seen_welcome: 1 } }
    );

  sendJson(res, 200, {
    user: {
      id: user.id,
      email: user.email,
      name: user.name || null,
      role: user.role || 'Member',
      createdAt: user.createdAt,
      subscriptionTier: plan.tier,
      subscriptionStatus: plan.subscriptionStatus,
      twoFactorEnabled: twoFactor,
      activeProvider: userDoc?.activeProvider || null,
      has_seen_welcome: fullUser?.has_seen_welcome || false,
    },
  });
}

async function handleWelcomeSeen(req, res, url, body, user) {
  const db = getDb();
  const { ObjectId } = await import('mongodb');
  await db
    .collection('users')
    .updateOne({ _id: new ObjectId(user.id) }, { $set: { has_seen_welcome: true } });
  sendJson(res, 200, { ok: true });
}

async function handleSetup2FA(req, res, url, body, user) {
  const { setup2FA } = await import('../2fa/index.js');
  const result = await setup2FA(user.id, user.email);
  sendJson(res, 200, result);
}

async function handleEnable2FA(req, res, url, body, user) {
  const { enable2FA } = await import('../2fa/index.js');
  const { token } = body;
  if (!token) {
    sendJson(res, 400, { error: 'Verification code is required.' });
    return;
  }
  try {
    await enable2FA(user.id, token);
    sendJson(res, 200, { ok: true });
  } catch (err) {
    sendJson(res, 400, { error: err.message });
  }
}

async function handleDisable2FA(req, res, url, body, user) {
  const { disable2FA } = await import('../2fa/index.js');
  const { token } = body;
  if (!token) {
    sendJson(res, 400, { error: 'Verification code is required.' });
    return;
  }
  const { verify2FA } = await import('../2fa/index.js');
  const ok = await verify2FA(user.id, token);
  if (!ok) {
    sendJson(res, 400, { error: 'Invalid verification code.' });
    return;
  }
  await disable2FA(user.id);
  sendJson(res, 200, { ok: true });
}

async function handleGetTrustedDevices(req, res, url, body, user) {
  const { getTrustedDevices } = await import('../2fa/index.js');
  const devices = await getTrustedDevices(user.id);
  sendJson(res, 200, { devices });
}

async function handleRemoveTrustedDevice(req, res, url, body, user) {
  const { removeTrustedDevice } = await import('../2fa/index.js');
  const { deviceId } = body;
  if (!deviceId) {
    sendJson(res, 400, { error: 'Device ID is required.' });
    return;
  }
  await removeTrustedDevice(user.id, deviceId);
  sendJson(res, 200, { ok: true });
}

async function handleRemoveAllTrustedDevices(req, res, url, body, user) {
  const { removeAllTrustedDevices } = await import('../2fa/index.js');
  await removeAllTrustedDevices(user.id);
  sendJson(res, 200, { ok: true });
}

async function handleGetBilling(req, res, url, body, user) {
  const plan = await getUserPlan(user.id);
  sendJson(res, 200, { plan });
}

async function handleUpgradeSubscription(req, res, url, body, user) {
  const { tier } = body;
  if (!tier || !['free', 'pro', 'enterprise'].includes(tier)) {
    sendJson(res, 400, { error: 'Valid plan tier is required (free, pro, enterprise).' });
    return;
  }
  const { updateSubscription } = await import('../billing/plans.js');
  const endsAt =
    tier === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await updateSubscription(user.id, tier, 'active', endsAt);
  const plan = await getUserPlan(user.id);
  sendJson(res, 200, { ok: true, plan });
}

async function handleCreateUpgradeCheckout(req, res, url, body, user) {
  const { tier } = body;
  if (!tier || !['pro', 'enterprise'].includes(tier)) {
    sendJson(res, 400, { error: 'Valid paid plan tier is required.' });
    return;
  }
  try {
    const { createCheckoutSession } = await import('../payments/stripe.js');
    const pendingId = `upgrade_${user.id}_${Date.now()}`;
    const result = await createCheckoutSession({
      pendingId,
      email: user.email,
      plan: tier,
      name: user.name || '',
    });
    sendJson(res, 200, result);
  } catch (err) {
    sendJson(res, 400, { error: err.message });
  }
}

async function handleGetApiKeys(req, res, url, body, user) {
  const configuredProviders = await authStore.listUserApiKeys(user.id);
  const providers = ['gemini', 'openai', 'groq', 'claude', 'openrouter', 'opencode'];
  const keysObj = {};
  providers.forEach((p) => {
    keysObj[p] = configuredProviders.includes(p);
  });
  sendJson(res, 200, { keys: keysObj });
}

async function handleSaveApiKey(req, res, url, body, user) {
  const { provider, apiKey } = body;
  if (!provider || !apiKey || !apiKey.trim()) {
    sendJson(res, 400, { error: 'Provider and API key are required.' });
    return;
  }
  const encrypted = encryptApiKey(apiKey.trim());
  await authStore.saveEncryptedApiKey(user.id, provider, encrypted);
  sendJson(res, 200, { ok: true });
}

async function handleDeleteApiKey(req, res, url, body, user) {
  const provider = url.searchParams.get('provider');
  if (!provider) {
    sendJson(res, 400, { error: 'Provider query parameter is required.' });
    return;
  }
  await authStore.deleteApiKey(user.id, provider);
  sendJson(res, 200, { ok: true });
}

async function handleSetActiveProvider(req, res, url, body, user) {
  const { provider } = body;
  if (!provider) {
    sendJson(res, 400, { error: 'Provider is required.' });
    return;
  }
  const validProviders = ['gemini', 'openai', 'groq', 'claude', 'openrouter', 'opencode'];
  if (!validProviders.includes(provider)) {
    sendJson(res, 400, { error: 'Invalid provider.' });
    return;
  }
  const db = getDb();
  await db
    .collection('users')
    .updateOne(
      { _id: new (await import('mongodb')).ObjectId(user.id) },
      { $set: { activeProvider: provider } }
    );
  sendJson(res, 200, { activeProvider: provider });
}

async function handleClearActiveProvider(req, res, url, body, user) {
  const db = getDb();
  await db
    .collection('users')
    .updateOne(
      { _id: new (await import('mongodb')).ObjectId(user.id) },
      { $set: { activeProvider: null } }
    );
  sendJson(res, 200, { activeProvider: null });
}

async function handleStartRegistration(req, res, body) {
  const { name, email, password } = body;
  if (!name || !email || !password) {
    sendJson(res, 400, { error: 'Name, email, and password are required.' });
    return;
  }
  if (!email.includes('@') || email.length > 254) {
    sendJson(res, 400, { error: 'Please enter a valid email address.' });
    return;
  }
  if (!PASSWORD_REGEX.test(password)) {
    sendJson(res, 400, {
      error:
        'Password must be at least 8 characters with uppercase, lowercase, number, and special character.',
    });
    return;
  }
  if (isDisposableEmail(email)) {
    sendJson(res, 400, { error: 'Temporary email addresses are not allowed.' });
    return;
  }
  const existingUser = await authStore.findUserByEmail(email);
  if (existingUser) {
    sendJson(res, 409, {
      error: 'An account with this email already exists. Try signing in instead.',
    });
    return;
  }

  const db = getDb();
  const pendingId = crypto.randomBytes(16).toString('hex');
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = crypto.pbkdf2Sync(password, salt, 600000, 64, 'sha512').toString('hex');

  await db.collection('pending_registrations').updateOne(
    { email: email.toLowerCase().trim() },
    {
      $set: {
        pendingId,
        name,
        email: email.toLowerCase().trim(),
        passwordHash,
        salt,
        plan: null,
        paymentStatus: 'pending',
        productKey: null,
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    },
    { upsert: true }
  );

  sendJson(res, 200, { pendingId, email: email.toLowerCase().trim() });
}

async function handleSelectPlan(req, res, body) {
  const { pendingId, plan, provider } = body;
  if (!pendingId || !plan) {
    sendJson(res, 400, { error: 'Pending ID and plan are required.' });
    return;
  }

  const db = getDb();
  const planDoc = await db.collection('plans').findOne({ id: plan, active: true });
  if (!planDoc) {
    sendJson(res, 400, { error: 'Invalid or inactive plan.' });
    return;
  }

  const pending = await db.collection('pending_registrations').findOne({ pendingId });
  if (!pending) {
    sendJson(res, 404, { error: 'Registration session not found. Please start over.' });
    return;
  }

  await db
    .collection('pending_registrations')
    .updateOne({ pendingId }, { $set: { plan, paymentProvider: provider || null } });

  const isFree = planDoc.price === 0;
  if (isFree) {
    await db
      .collection('pending_registrations')
      .updateOne(
        { pendingId },
        { $set: { paymentStatus: 'completed', status: 'pending_verification' } }
      );
    sendJson(res, 200, { status: 'pending_verification', pendingId, email: pending.email, plan });
    return;
  }

  await db
    .collection('pending_registrations')
    .updateOne({ pendingId }, { $set: { status: 'pending_verification' } });
  sendJson(res, 200, { status: 'payment_required', pendingId, email: pending.email, plan });
}

async function handleCompletePayment(req, res, body) {
  const { pendingId, transactionId, provider } = body;
  if (!pendingId) {
    sendJson(res, 400, { error: 'Pending ID is required.' });
    return;
  }

  const db = getDb();
  const pending = await db.collection('pending_registrations').findOne({ pendingId });
  if (!pending) {
    sendJson(res, 404, { error: 'Registration session not found.' });
    return;
  }

  const txId = transactionId || 'mock-tx-' + crypto.randomBytes(8).toString('hex');

  // Update status to pending_verification and paymentStatus to completed
  await db.collection('pending_registrations').updateOne(
    { pendingId },
    {
      $set: {
        paymentStatus: 'completed',
        status: 'pending_verification',
        paymentProvider: provider || 'mock',
        transactionId: txId,
      },
    }
  );

  // If there's a payment, also insert a transaction document
  await db.collection('payment_transactions').insertOne({
    transactionId: txId,
    email: pending.email,
    amount: pending.plan === 'pro' ? 29 : pending.plan === 'enterprise' ? 99 : 0,
    currency: 'usd',
    status: 'completed',
    provider: provider || 'mock',
    productKey: null,
    timestamp: new Date().toISOString(),
  });

  sendJson(res, 200, { status: 'pending_verification', email: pending.email });
}

async function handleRegistrationStatus(req, res, body, url) {
  const email = url.searchParams.get('email');
  if (!email) {
    sendJson(res, 400, { error: 'Email parameter is required.' });
    return;
  }

  const db = getDb();
  const pending = await db
    .collection('pending_registrations')
    .findOne({ email: email.toLowerCase().trim() });
  if (!pending) {
    // If not found in pending, check if a user is already created!
    const user = await db.collection('users').findOne({ email: email.toLowerCase().trim() });
    if (user) {
      // User is already registered and complete!
      const keyDoc = await db.collection('product_keys').findOne({ usedBy: user._id.toString() });
      sendJson(res, 200, { status: 'completed', productKey: keyDoc?.key || null });
      return;
    }
    sendJson(res, 404, { error: 'No registration in progress found.' });
    return;
  }

  sendJson(res, 200, {
    status: pending.status, // "pending", "pending_verification", "ready"
    paymentStatus: pending.paymentStatus,
    productKey: pending.productKey || null,
  });
}

async function handleLogout(req, res, _body) {
  const isProd = process.env.NODE_ENV === 'production';
  try {
    const cookies = parseCookies(req);
    if (cookies.refreshToken) {
      const decoded = jwt.decode(decodeURIComponent(cookies.refreshToken));
      if (decoded?.userId) {
        await revokeRefreshToken(decoded.userId);
      }
    }
  } catch {
    /* best-effort revocation */
  }
  res.setHeader('Set-Cookie', [
    `token=; HttpOnly; SameSite=Strict; Path=/${isProd ? '; Secure' : ''}; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    `refreshToken=; HttpOnly; SameSite=Strict; Path=/${isProd ? '; Secure' : ''}; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    `session=; SameSite=Strict; Path=/${isProd ? '; Secure' : ''}; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
  ]);
  sendJson(res, 200, { ok: true });
}

async function handleEnterpriseInquiry(req, res, body) {
  const { pendingId, company, teamSize, requirements, contact } = body;
  if (!pendingId || !company || !requirements) {
    sendJson(res, 400, { error: 'Company name and requirements are required.' });
    return;
  }
  const db = getDb();
  const pending = await db.collection('pending_registrations').findOne({ pendingId });
  if (!pending) {
    sendJson(res, 404, { error: 'Registration session not found.' });
    return;
  }
  await db.collection('pending_registrations').updateOne(
    { pendingId },
    {
      $set: {
        plan: 'enterprise',
        status: 'inquiry_submitted',
        company,
        teamSize: teamSize || null,
        requirements,
        contact: contact || null,
        inquiredAt: new Date().toISOString(),
      },
    }
  );
  await db.collection('enterprise_inquiries').insertOne({
    email: pending.email,
    name: pending.name,
    company,
    teamSize: teamSize || null,
    requirements,
    contact: contact || null,
    pendingId,
    createdAt: new Date().toISOString(),
  });
  // Send email notification to support (reuses shared sendSupportEmail for SMTP + Resend)
  try {
    const details = [
      `Company: ${company}`,
      `Team Size: ${teamSize || 'Not specified'}`,
      `Contact Info: ${contact || 'Not specified'}`,
      ``,
      `Requirements:`,
      requirements,
    ].join('\n');
    await sendSupportEmail({
      name: pending.name || 'Not provided',
      email: pending.email,
      subject: `Enterprise Inquiry from ${company}`,
      message: details,
    });
  } catch (emailErr) {
    console.warn('Failed to send enterprise inquiry email:', emailErr.message);
  }
  sendJson(res, 200, { ok: true });
}

async function handleCompleteRegistration(req, res, body) {
  const { email, productKey } = body;
  if (!email || !productKey) {
    sendJson(res, 400, { error: 'Email and product key are required.' });
    return;
  }

  if (!isValidKeyFormat(productKey)) {
    sendJson(res, 400, { error: 'Invalid product key format.' });
    return;
  }

  const validKey = await validateProductKey(productKey);
  if (!validKey) {
    sendJson(res, 400, { error: 'Product key is invalid, expired, or already used.' });
    return;
  }

  const existingUser = await authStore.findUserByEmail(email);
  if (existingUser) {
    sendJson(res, 409, {
      error: 'An account with this email already exists. Try signing in instead.',
    });
    return;
  }

  const db = getDb();
  const pending = await db
    .collection('pending_registrations')
    .findOne({ email: email.toLowerCase().trim() });

  let user;
  if (pending) {
    user = await authStore.createUserFromHash({
      email: pending.email,
      passwordHash: pending.passwordHash,
      salt: pending.salt,
      name: pending.name,
      subscriptionTier: pending.plan || undefined,
    });
    await db
      .collection('pending_registrations')
      .updateOne(
        { email: email.toLowerCase().trim() },
        { $set: { status: 'completed', completedAt: new Date().toISOString() } }
      );
  } else {
    const salt = crypto.randomBytes(16).toString('hex');
    const randomPassword = crypto.randomBytes(32).toString('hex');
    const passwordHash = crypto
      .pbkdf2Sync(randomPassword, salt, 600000, 64, 'sha512')
      .toString('hex');
    user = await authStore.createUserFromHash({
      email: email.toLowerCase().trim(),
      passwordHash,
      salt,
      name: null,
    });
  }

  await claimProductKey(productKey, user.id, email);

  sendJson(res, 200, { ok: true });
}

async function handleDeleteAccount(req, res, url, body, user) {
  const db = getDb();
  const { ObjectId } = await import('mongodb');
  const userDoc = await db.collection('users').findOne({ _id: new ObjectId(user.id) });
  if (!userDoc) {
    sendJson(res, 404, { error: 'User not found.' });
    return;
  }
  const email = userDoc.email;
  await db.collection('users').deleteOne({ _id: new ObjectId(user.id) });
  await revokeRefreshToken(user.id);
  await db.collection('user_data').deleteMany({ userId: user.id });
  await db.collection('user_api_keys').deleteMany({ userId: user.id });
  await db
    .collection('product_keys')
    .updateMany(
      { $or: [{ customerEmail: email }, { registeredEmail: email }] },
      { $set: { status: 'available', usedBy: null, usedAt: null, registeredEmail: null } }
    );
  await db.collection('deleted_users').insertOne({
    originalId: user.id,
    email: email,
    name: userDoc.name || null,
    deletedAt: new Date().toISOString(),
  });
  res.setHeader('Set-Cookie', [
    `token=; HttpOnly; SameSite=Strict; Path=/${isProd ? '; Secure' : ''}; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    `refreshToken=; HttpOnly; SameSite=Strict; Path=/${isProd ? '; Secure' : ''}; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    `session=; SameSite=Strict; Path=/${isProd ? '; Secure' : ''}; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
  ]);
  sendJson(res, 200, { ok: true });
}

async function handleSupport(req, res, body) {
  const { name, email, subject, message } = body;
  if (!name || !email || !message) {
    sendJson(res, 400, { error: 'Name, email, and message are required.' });
    return;
  }

  try {
    const ok = await sendSupportEmail({
      name,
      email,
      subject: subject || 'Support Request',
      message,
    });
    if (!ok) {
      sendJson(res, 500, { error: 'Failed to send support message.' });
      return;
    }
    sendJson(res, 200, { ok: true });
  } catch (err) {
    sendJson(res, 500, { error: err.message || 'Failed to send support message.' });
  }
}

const ROUTE_CONFIG = [
  // Removed: old /api/auth/register (bypasses new registration flow). Use start-registration + select-plan + complete-registration instead.
  { path: '/api/auth/validate-key', method: 'POST', handler: handleValidateKey, auth: false },
  { path: '/api/auth/refresh', method: 'POST', handler: handleRefreshToken, auth: false },
  { path: '/api/auth/support', method: 'POST', handler: handleSupport, auth: false },
  { path: '/api/auth/login', method: 'POST', handler: handleLogin, auth: false },
  { path: '/api/auth/forgot-password', method: 'POST', handler: handleForgotPassword, auth: false },
  { path: '/api/auth/logout', method: 'POST', handler: handleLogout, auth: false },
  { path: '/api/auth/reset-password', method: 'POST', handler: handleResetPassword, auth: false },
  { path: '/api/auth/me', method: 'GET', handler: handleMe, auth: true },
  { path: '/api/auth/welcome-seen', method: 'POST', handler: handleWelcomeSeen, auth: true },
  { path: '/api/auth/password', method: 'PUT', handler: handleChangePassword, auth: true },
  { path: '/api/settings/api-keys', method: 'GET', handler: handleGetApiKeys, auth: true },
  { path: '/api/settings/api-key', method: 'POST', handler: handleSaveApiKey, auth: true },
  { path: '/api/settings/api-key', method: 'DELETE', handler: handleDeleteApiKey, auth: true },
  { path: '/api/auth/2fa/setup', method: 'POST', handler: handleSetup2FA, auth: true },
  { path: '/api/auth/2fa/enable', method: 'POST', handler: handleEnable2FA, auth: true },
  { path: '/api/auth/2fa/disable', method: 'POST', handler: handleDisable2FA, auth: true },
  {
    path: '/api/auth/trusted-devices',
    method: 'GET',
    handler: handleGetTrustedDevices,
    auth: true,
  },
  {
    path: '/api/auth/trusted-devices',
    method: 'DELETE',
    handler: handleRemoveTrustedDevice,
    auth: true,
  },
  {
    path: '/api/auth/trusted-devices/all',
    method: 'DELETE',
    handler: handleRemoveAllTrustedDevices,
    auth: true,
  },
  {
    path: '/api/settings/active-provider',
    method: 'PUT',
    handler: handleSetActiveProvider,
    auth: true,
  },
  {
    path: '/api/settings/active-provider',
    method: 'DELETE',
    handler: handleClearActiveProvider,
    auth: true,
  },
  { path: '/api/user/billing', method: 'GET', handler: handleGetBilling, auth: true },
  {
    path: '/api/user/billing/upgrade',
    method: 'POST',
    handler: handleUpgradeSubscription,
    auth: true,
  },
  {
    path: '/api/user/billing/checkout',
    method: 'POST',
    handler: handleCreateUpgradeCheckout,
    auth: true,
  },
  { path: '/api/auth/delete-account', method: 'POST', handler: handleDeleteAccount, auth: true },
  {
    path: '/api/auth/start-registration',
    method: 'POST',
    handler: handleStartRegistration,
    auth: false,
  },
  { path: '/api/auth/select-plan', method: 'POST', handler: handleSelectPlan, auth: false },
  {
    path: '/api/auth/complete-payment',
    method: 'POST',
    handler: handleCompletePayment,
    auth: false,
  },
  {
    path: '/api/auth/registration-status',
    method: 'GET',
    handler: handleRegistrationStatus,
    auth: false,
  },
  {
    path: '/api/auth/complete-registration',
    method: 'POST',
    handler: handleCompleteRegistration,
    auth: false,
  },
  {
    path: '/api/auth/enterprise-inquiry',
    method: 'POST',
    handler: handleEnterpriseInquiry,
    auth: false,
  },
];

export async function handleAuthRoute(req, res, url) {
  const routeConfig = ROUTE_CONFIG.find((r) => r.path === url.pathname && r.method === req.method);
  if (!routeConfig) return false;

  const rawBody = await readRequestBody(req);
  const body = rawBody ? JSON.parse(rawBody) : {};

  if (routeConfig.auth) {
    try {
      const user = await authenticateToken(req);
      await routeConfig.handler(req, res, url, body, user);
    } catch (authError) {
      sendJson(res, authError.statusCode || 401, { error: authError.message });
    }
  } else {
    try {
      await routeConfig.handler(req, res, body, url);
    } catch (handlerError) {
      console.error('Public auth route error:', handlerError);
      sendJson(res, 500, { error: handlerError.message || 'An internal error occurred.' });
    }
  }

  return true;
}
