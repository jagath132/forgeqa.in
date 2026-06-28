import fs from 'node:fs/promises';
import path from 'node:path';
import multer from 'multer';
import { connectDb, getDb } from './db.js';
import { createKnowledgeService } from './knowledge/service.js';
import { createKnowledgeStore } from './storage/index.js';
import {
  buildQaPrompt,
  generateWithGemini,
  generateWithGeminiStream,
  parseSafeJson,
} from './ai/gemini.js';
import { generateWithOpenAI, generateWithOpenAIStream } from './ai/openai.js';
import { generateTestScript } from './test-scripts/generator.js';
import { generateRegressionTestCases } from './regression/generator.js';
import { generateRegressionScripts } from './regression/scripts.js';
import {
  storeBuildArtifact,
  getLatestBuild,
  saveWebhook,
  getWebhooks,
} from './regression/builds.js';
import { createRun, listRuns, getRun, updateRun } from './regression/runs.js';
import {
  authStore,
  authenticateToken,
  handleAuthRoute,
  decryptApiKey,
  findProductKeyByUserId,
  logAudit,
} from './auth/index.js';

const ALLOWED_EXTENSIONS = [
  '.apk',
  '.aab',
  '.zip',
  '.html',
  '.js',
  '.css',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.ico',
  '.json',
  '.txt',
  '.pdf',
  '.csv',
  '.xlsx',
  '.docx',
  '.pptx',
];

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.includes(ext)) return cb(null, true);
  cb(new Error(`File type "${ext}" is not allowed.`));
}

const uploadDir = process.env.VERCEL ? '/tmp/uploads' : path.resolve('.data/uploads');
const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 12,
  },
  fileFilter,
});

function corsify(res, req) {
  const origin = req?.headers?.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  if (origin !== '*') res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');
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

const providerEnvKeyMap = {
  gemini: 'GEMINI_API_KEY',
  openai: 'OPENAI_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  claude: 'CLAUDE_API_KEY',
  opencode: 'OPENCODE_API_KEY',
  groq: 'GROQ_API_KEY',
};

function getDefaultModel(provider) {
  switch (provider) {
    case 'openai':
    case 'openrouter':
    case 'opencode':
      return 'gpt-4o-mini';
    case 'groq':
      return 'llama-3.1-8b-instant';
    case 'claude':
      return 'claude-3-5-sonnet-latest';
    default:
      return undefined;
  }
}

async function resolveApiKey(provider, requestApiKey, env, userId) {
  const trimmedRequestKey = String(requestApiKey || '').trim();
  if (trimmedRequestKey) {
    return trimmedRequestKey;
  }
  if (userId) {
    try {
      const dbKey = await authStore.getEncryptedApiKey(userId, provider);
      if (dbKey) {
        return decryptApiKey(dbKey.encryptedKey, dbKey.iv, dbKey.authTag);
      }
    } catch (err) {
      console.error('Error retrieving API key from database:', err);
    }
  }
  return env[providerEnvKeyMap[provider]] || '';
}

async function cleanupFiles(files = []) {
  await Promise.all(files.map((file) => fs.unlink(file.path).catch(() => undefined)));
}

export function createApiMiddleware(env) {
  let store;
  let knowledge;
  let dbReady = connectDb()
    .then(async () => {
      store = createKnowledgeStore();
      knowledge = createKnowledgeService(store, env);
      const { seedPlans } = await import('./billing/plans.js');
      await seedPlans();
      const plansDb = getDb();
      const defaults = [
        {
          id: 'free',
          name: 'Free',
          price: 0,
          currency: 'inr',
          period: 'monthly',
          description: 'Get started with essential testing tools at no cost.',
          features: [
            '100 test cases/month',
            '1 AI provider',
            'Basic reporting',
            'Community support',
            '1 user',
          ],
          popular: false,
          active: true,
          sortOrder: 1,
          maxUsers: 1,
          maxTestCases: 100,
          aiProviders: 1,
          advancedExport: false,
          regressionTesting: false,
          prioritySupport: false,
          customIntegrations: false,
          onPremise: false,
        },
        {
          id: 'pro',
          name: 'Pro',
          price: 99900,
          currency: 'inr',
          period: 'monthly',
          description: 'For teams that need advanced testing and analytics.',
          features: [
            'Unlimited test cases',
            '5 AI providers',
            'Advanced reporting & export',
            'Regression testing',
            'Email support',
            'Up to 10 users',
          ],
          popular: true,
          active: true,
          sortOrder: 2,
          maxUsers: 10,
          maxTestCases: null,
          aiProviders: 5,
          advancedExport: true,
          regressionTesting: true,
          prioritySupport: false,
          customIntegrations: false,
          onPremise: false,
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          price: 0,
          currency: 'inr',
          period: 'monthly',
          description: 'Custom solutions for large organizations. Contact us for pricing.',
          features: [
            'Everything in Pro',
            'Unlimited users',
            'All AI providers',
            'Custom integrations',
            'On-premise deployment',
            'Priority support',
            'Dedicated account manager',
            'SLA guarantee',
          ],
          popular: false,
          active: true,
          sortOrder: 3,
          maxUsers: null,
          maxTestCases: null,
          aiProviders: null,
          advancedExport: true,
          regressionTesting: true,
          prioritySupport: true,
          customIntegrations: true,
          onPremise: true,
        },
      ];
      for (const plan of defaults) {
        await plansDb.collection('plans').updateOne(
          { id: plan.id },
          { $set: { ...plan, updatedAt: new Date().toISOString() }, $setOnInsert: { createdAt: new Date().toISOString() } },
          { upsert: true }
        );
      }
    })
    .catch((err) => {
      console.error('Failed to connect to MongoDB:', err);
      throw err;
    });

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

    // 0a. Healthcheck — always responds immediately, no DB needed
    if (url.pathname === '/api/health' && req.method === 'GET') {
      sendJson(res, 200, { status: 'ok', uptime: process.uptime() });
      return;
    }

    try {
      await dbReady;
    } catch (dbError) {
      console.error('MongoDB not ready:', dbError);
      sendJson(res, 503, { error: 'Database not connected. Please try again.' });
      return;
    }

    try {
      // 0b. Plans lookup — public (used during registration flow)
      if (url.pathname === '/api/plans' && req.method === 'GET') {
        const db = getDb();
        const plans = await db
          .collection('plans')
          .find({ active: true })
          .sort({ sortOrder: 1 })
          .toArray();
        sendJson(res, 200, { plans: plans.map((p) => ({ ...p, id: p.id })) });
        return;
      }

      // 1. Try auth routes (register, login, forgot-password, reset-password, /me, api-keys)
      const matched = await handleAuthRoute(req, res, url);
      if (matched) return;

      // 1b. Payment routes (unauthenticated — part of registration flow)
      if (url.pathname === '/api/payments/create-checkout' && req.method === 'POST') {
        const rawBody = await readRequestBody(req);
        const { pendingId, plan, email } = JSON.parse(rawBody || '{}');
        if (!pendingId || !plan || !email) {
          sendJson(res, 400, { error: 'pendingId, plan, and email are required.' });
          return;
        }
        try {
          const { createCheckoutSession } = await import('./payments/stripe.js');
          const result = await createCheckoutSession({ pendingId, email, plan });
          sendJson(res, 200, result);
        } catch (err) {
          sendJson(res, 400, { error: err.message });
        }
        return;
      }

      if (url.pathname === '/api/payments/create-order' && req.method === 'POST') {
        const rawBody = await readRequestBody(req);
        const { pendingId, plan, email } = JSON.parse(rawBody || '{}');
        if (!pendingId || !plan || !email) {
          sendJson(res, 400, { error: 'pendingId, plan, and email are required.' });
          return;
        }
        try {
          const { createRazorpayOrder } = await import('./payments/razorpay.js');
          const result = await createRazorpayOrder({ pendingId, email, plan });
          sendJson(res, 200, result);
        } catch (err) {
          sendJson(res, 400, { error: err.message });
        }
        return;
      }

      // 2. All remaining /api/* routes require authentication
      let user;
      try {
        user = await authenticateToken(req);
      } catch (authError) {
        sendJson(res, authError.statusCode || 401, { error: authError.message });
        return;
      }

      // Admin routes (require Admin role)
      if (url.pathname.startsWith('/api/admin/')) {
        if (user.role !== 'Admin') {
          sendJson(res, 403, { error: 'Admin access required.' });
          return;
        }
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        if (url.pathname === '/api/admin/users' && req.method === 'GET') {
          const db = getDb();
          const users = await db
            .collection('users')
            .find({}, { projection: { passwordHash: 0, salt: 0 } })
            .sort({ createdAt: -1 })
            .toArray();
          sendJson(res, 200, {
            users: users.map((u) => ({
              id: u._id.toString(),
              email: u.email,
              role: u.role || 'Member',
              createdAt: u.createdAt,
              subscriptionTier: u.subscriptionTier || 'free',
            })),
          });
          return;
        }
        if (url.pathname === '/api/admin/stats' && req.method === 'GET') {
          const db = getDb();
          const [userCount, keyCount, usedKeys, deletedCount] = await Promise.all([
            db.collection('users').countDocuments(),
            db.collection('product_keys').countDocuments(),
            db.collection('product_keys').countDocuments({ status: 'used' }),
            db.collection('deleted_users').countDocuments(),
          ]);
          sendJson(res, 200, {
            userCount,
            keyCount,
            usedKeys,
            availableKeys: keyCount - usedKeys,
            deletedCount,
          });
          return;
        }
        if (url.pathname.match(/^\/api\/admin\/users\/([a-f0-9]+)$/) && req.method === 'PUT') {
          const id = url.pathname.split('/').pop();
          const rawBody = await readRequestBody(req);
          const { role } = JSON.parse(rawBody || '{}');
          if (!['Admin', 'Member'].includes(role)) {
            sendJson(res, 400, { error: 'Invalid role.' });
            return;
          }
          const { ObjectId } = await import('mongodb');
          const db = getDb();
          await db.collection('users').updateOne({ _id: new ObjectId(id) }, { $set: { role } });
          await logAudit({
            adminId: user.id,
            adminEmail: user.email,
            action: 'update_role',
            resource: 'user',
            resourceId: id,
            details: { role },
            ip: clientIp,
          });
          sendJson(res, 200, { ok: true });
          return;
        }
        if (url.pathname === '/api/admin/audit-logs' && req.method === 'GET') {
          const { getAuditLogs } = await import('./audit/index.js');
          const logs = await getAuditLogs({ limit: 200 });
          sendJson(res, 200, { logs });
          return;
        }
        if (url.pathname === '/api/admin/unlock' && req.method === 'POST') {
          const rawBody = await readRequestBody(req);
          const { email } = JSON.parse(rawBody || '{}');
          if (!email) {
            sendJson(res, 400, { error: 'Email is required.' });
            return;
          }
          const { clearLockout } = await import('./rate-limit/index.js');
          await clearLockout(`login:${email.toLowerCase()}`);
          await logAudit({
            adminId: user.id,
            adminEmail: user.email,
            action: 'unlock_account',
            resource: 'user',
            details: { email },
            ip: clientIp,
          });
          sendJson(res, 200, { ok: true });
          return;
        }
        if (url.pathname === '/api/admin/billing/plans' && req.method === 'GET') {
          const { getDb } = await import('./db.js');
          const plans = await getDb().collection('subscription_plans').find({}).toArray();
          sendJson(res, 200, { plans: plans.map((p) => ({ ...p, id: p._id.toString() })) });
          return;
        }
        if (
          url.pathname.match(/^\/api\/admin\/users\/([a-f0-9]+)\/subscription$/) &&
          req.method === 'PUT'
        ) {
          const id = url.pathname.split('/').pop();
          const rawBody = await readRequestBody(req);
          const { tier, status } = JSON.parse(rawBody || '{}');
          const { updateSubscription } = await import('./billing/plans.js');
          await updateSubscription(id, tier, status);
          await logAudit({
            adminId: user.id,
            adminEmail: user.email,
            action: 'update_subscription',
            resource: 'user',
            resourceId: id,
            details: { tier, status },
            ip: clientIp,
          });
          sendJson(res, 200, { ok: true });
          return;
        }
        sendJson(res, 404, { error: 'Admin route not found.' });
        return;
      }

      if (url.pathname === '/api/knowledge/files' && req.method === 'GET') {
        const files = await knowledge.listFiles(url.searchParams.get('search') ?? '', user.id);
        sendJson(res, 200, { files, storageMode: store.mode });
        return;
      }

      if (url.pathname === '/api/knowledge/upload' && req.method === 'POST') {
        await fs.mkdir(uploadDir, { recursive: true });

        upload.array('files')(req, res, async (error) => {
          if (error) {
            sendJson(res, 400, { error: error.message });
            return;
          }

          try {
            const files = req.files ?? [];
            const processed = [];

            for (const file of files) {
              processed.push(await knowledge.processUpload(file, user.id));
            }

            await cleanupFiles(files);
            sendJson(res, 200, { files: processed });
          } catch (uploadError) {
            await cleanupFiles(req.files ?? []);
            sendJson(res, uploadError.statusCode ?? 500, {
              error: uploadError.message ?? 'Unable to process upload.',
            });
          }
        });
        return;
      }

      if (url.pathname.startsWith('/api/knowledge/files/') && req.method === 'DELETE') {
        const id = decodeURIComponent(url.pathname.split('/').pop());
        await knowledge.deleteFile(id, user.id);
        sendJson(res, 200, { ok: true });
        return;
      }

      if (url.pathname === '/api/knowledge/sharepoint' && req.method === 'POST') {
        const rawBody = await readRequestBody(req);
        const { url: sharePointUrl } = JSON.parse(rawBody || '{}');

        if (!sharePointUrl) {
          sendJson(res, 400, { error: 'SharePoint URL is required.' });
          return;
        }

        const file = await knowledge.processSharePointUrl(sharePointUrl, user.id);
        sendJson(res, 200, { file });
        return;
      }

      if (url.pathname === '/api/knowledge/search' && req.method === 'GET') {
        const query = url.searchParams.get('q') ?? '';
        const chunks = await knowledge.searchChunks(query, 8, user.id);
        sendJson(res, 200, { chunks });
        return;
      }

      if (url.pathname === '/api/knowledge/chunks/refresh' && req.method === 'POST') {
        const result = await knowledge.refreshChunks(user.id);
        sendJson(res, 200, result);
        return;
      }

      if (url.pathname === '/api/generate-test-cases' && req.method === 'POST') {
        const rawBody = await readRequestBody(req);
        const { requirement, apiKey: requestApiKey, model, provider } = JSON.parse(rawBody || '{}');
        if (!provider) {
          sendJson(res, 400, { error: 'provider is required.' });
          return;
        }
        const apiKey = await resolveApiKey(provider, requestApiKey, env, user.id);

        if (!apiKey) {
          sendJson(res, 500, {
            error: `Missing ${provider} API key. Provide it in settings or env.`,
          });
          return;
        }

        if (!requirement || requirement.trim().length < 10) {
          sendJson(res, 400, { error: 'Requirement text must be at least 10 characters.' });
          return;
        }

        const chunks = await knowledge.searchChunks(requirement, 4, user.id);
        const defaultModel = model || getDefaultModel(provider);
        let result;

        if (provider === 'gemini') {
          result = await generateWithGemini({
            apiKey,
            prompt: buildQaPrompt(requirement, chunks),
            model: defaultModel,
          });
        } else if (
          provider === 'openai' ||
          provider === 'openrouter' ||
          provider === 'opencode' ||
          provider === 'groq'
        ) {
          const endpoint =
            provider === 'openrouter'
              ? 'https://openrouter.ai/api/v1/chat/completions'
              : provider === 'groq'
                ? 'https://api.groq.com/openai/v1/chat/completions'
                : 'https://api.openai.com/v1/chat/completions';

          const responseText = await generateWithOpenAI({
            apiKey,
            prompt: buildQaPrompt(requirement, chunks),
            model: defaultModel,
            endpoint,
            provider,
          });
          result = parseSafeJson(responseText);
        } else {
          sendJson(res, 501, { error: `${provider} support is not implemented yet.` });
          return;
        }

        sendJson(res, 200, {
          ...result,
          knowledgeContext: chunks.map((chunk) => ({
            fileName: chunk.file_name,
            chunkText: chunk.chunk_text,
            score: chunk.score,
          })),
        });
        return;
      }

      if (url.pathname === '/api/generate-test-cases/stream' && req.method === 'POST') {
        const rawBody = await readRequestBody(req);
        const { requirement, apiKey: requestApiKey, model, provider } = JSON.parse(rawBody || '{}');
        if (!provider) {
          sendJson(res, 400, { error: 'provider is required.' });
          return;
        }
        const apiKey = await resolveApiKey(provider, requestApiKey, env, user.id);

        if (!apiKey) {
          sendJson(res, 500, {
            error: `Missing ${provider} API key. Provide it in settings or env.`,
          });
          return;
        }

        if (!requirement || requirement.trim().length < 10) {
          sendJson(res, 400, { error: 'Requirement text must be at least 10 characters.' });
          return;
        }

        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
        });

        const sendSSE = (event, data) => {
          res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        };

        sendSSE('phase', { phase: 'knowledge', message: 'Searching knowledge base...' });

        const chunks = await knowledge.searchChunks(requirement, 4, user.id);

        sendSSE('phase', { phase: 'prompt', message: 'Building RAG prompt...' });

        const prompt = buildQaPrompt(requirement, chunks);
        const defaultModel = model || getDefaultModel(provider);

        sendSSE('phase', { phase: 'generating', message: 'Requesting AI model...' });

        let fullText = '';

        try {
          if (provider === 'gemini') {
            await generateWithGeminiStream({
              apiKey,
              prompt,
              model: defaultModel,
              onToken: (token) => {
                fullText += token;
                sendSSE('token', { token });
              },
            });
          } else if (
            provider === 'openai' ||
            provider === 'openrouter' ||
            provider === 'opencode' ||
            provider === 'groq'
          ) {
            const endpoint =
              provider === 'openrouter'
                ? 'https://openrouter.ai/api/v1/chat/completions'
                : provider === 'groq'
                  ? 'https://api.groq.com/openai/v1/chat/completions'
                  : 'https://api.openai.com/v1/chat/completions';

            await generateWithOpenAIStream({
              apiKey,
              prompt,
              model: defaultModel,
              endpoint,
              onToken: (token) => {
                fullText += token;
                sendSSE('token', { token });
              },
            });
          } else {
            sendSSE('error', { error: `${provider} streaming is not supported yet.` });
            res.end();
            return;
          }

          const result = parseSafeJson(fullText);

          sendSSE('complete', {
            ...result,
            knowledgeContext: chunks.map((chunk) => ({
              fileName: chunk.file_name,
              chunkText: chunk.chunk_text,
              score: chunk.score,
            })),
          });
        } catch (error) {
          sendSSE('error', { error: error.message || 'Generation failed.' });
        }

        res.end();
        return;
      }

      if (url.pathname === '/api/generate-test-scripts' && req.method === 'POST') {
        const rawBody = await readRequestBody(req);
        const {
          framework,
          language,
          targetUrl,
          options,
          testCaseIds,
          testCases,
          apiKey: requestApiKey,
          model,
          provider,
        } = JSON.parse(rawBody || '{}');
        if (!provider) {
          sendJson(res, 400, { error: 'provider is required.' });
          return;
        }

        const apiKey = await resolveApiKey(provider, requestApiKey, env, user.id);

        if (!apiKey) {
          sendJson(res, 500, {
            error: `Missing ${provider} API key. Provide it in settings or env.`,
          });
          return;
        }

        if (!framework || !language || !targetUrl || !Array.isArray(testCases)) {
          sendJson(res, 400, {
            error: 'framework, language, targetUrl and testCases are required.',
          });
          return;
        }

        const selectedTestCases =
          Array.isArray(testCaseIds) && testCaseIds.length
            ? testCases.filter((testCase) => testCaseIds.includes(testCase.tcId))
            : testCases;

        if (!selectedTestCases.length) {
          sendJson(res, 400, {
            error: 'At least one valid test case is required to generate a script.',
          });
          return;
        }

        const result = await generateTestScript({
          apiKey,
          provider,
          framework,
          language,
          targetUrl,
          options,
          testCases: selectedTestCases,
          model: model || getDefaultModel(provider),
        });

        sendJson(res, 200, result);
        return;
      }

      // === Regression Testing endpoints ===

      if (url.pathname === '/api/regression/generate' && req.method === 'POST') {
        const rawBody = await readRequestBody(req);
        const {
          requirement,
          testCases,
          platform,
          apiKey: requestApiKey,
          model,
          provider,
        } = JSON.parse(rawBody || '{}');
        if (!provider) {
          sendJson(res, 400, { error: 'provider is required.' });
          return;
        }
        const apiKey = await resolveApiKey(provider, requestApiKey, env, user.id);
        if (!apiKey) {
          sendJson(res, 500, { error: `Missing ${provider} API key.` });
          return;
        }
        if (!requirement || requirement.trim().length < 10) {
          sendJson(res, 400, { error: 'Requirement text must be at least 10 characters.' });
          return;
        }
        const result = await generateRegressionTestCases({
          apiKey,
          provider,
          requirement,
          existingTestCases: testCases,
          platform: platform || 'web',
          model: model || getDefaultModel(provider),
        });
        sendJson(res, 200, { testCases: result?.testCases || [], summary: result?.summary || '' });
        return;
      }

      if (url.pathname === '/api/regression/scripts' && req.method === 'POST') {
        const rawBody = await readRequestBody(req);
        const {
          testCases,
          platform,
          framework,
          language,
          targetUrl,
          apiKey: requestApiKey,
          model,
          provider,
        } = JSON.parse(rawBody || '{}');
        if (!provider) {
          sendJson(res, 400, { error: 'provider is required.' });
          return;
        }
        const apiKey = await resolveApiKey(provider, requestApiKey, env, user.id);
        if (!apiKey) {
          sendJson(res, 500, { error: `Missing ${provider} API key.` });
          return;
        }
        if (!Array.isArray(testCases) || !testCases.length) {
          sendJson(res, 400, { error: 'At least one test case is required.' });
          return;
        }
        const fw = framework || (platform === 'mobile' ? 'appium' : 'playwright');
        const lang = language || 'typescript';
        const result = await generateRegressionScripts({
          apiKey,
          provider,
          testCases,
          platform: platform || 'web',
          framework: fw,
          language: lang,
          targetUrl: targetUrl || 'http://localhost:3000',
          model: model || getDefaultModel(provider),
        });
        sendJson(res, 200, { scripts: [result] });
        return;
      }

      if (url.pathname === '/api/regression/runs' && req.method === 'POST') {
        const rawBody = await readRequestBody(req);
        const data = JSON.parse(rawBody || '{}');
        const run = await createRun(user.id, data);
        sendJson(res, 200, run);
        return;
      }

      if (url.pathname === '/api/regression/runs' && req.method === 'GET') {
        const runs = await listRuns(user.id);
        sendJson(res, 200, { runs });
        return;
      }

      if (url.pathname.startsWith('/api/regression/runs/') && req.method === 'GET') {
        const runId = url.pathname.split('/').pop();
        const run = await getRun(user.id, runId);
        if (!run) {
          sendJson(res, 404, { error: 'Run not found.' });
          return;
        }
        sendJson(res, 200, run);
        return;
      }

      if (
        url.pathname.startsWith('/api/regression/runs/') &&
        req.method === 'POST' &&
        url.pathname.endsWith('/execute')
      ) {
        const segments = url.pathname.split('/');
        const runId = segments[segments.length - 2];
        const run = await getRun(user.id, runId);
        if (!run) {
          sendJson(res, 404, { error: 'Run not found.' });
          return;
        }
        await updateRun(runId, { status: 'running' }, user.id);
        const results = run.testCases.map((tc) => ({
          testCaseId: tc.tcId,
          passed: true,
          actualOutput: 'Simulated: test passed',
        }));
        await updateRun(
          runId,
          { status: 'passed', results, completedAt: new Date().toISOString() },
          user.id
        );
        const updated = await getRun(user.id, runId);
        sendJson(res, 200, updated);
        return;
      }

      if (url.pathname === '/api/regression/builds/upload' && req.method === 'POST') {
        await fs.mkdir(uploadDir, { recursive: true });
        upload.single('file')(req, res, async (error) => {
          if (error) {
            sendJson(res, 400, { error: error.message });
            return;
          }
          try {
            const { platform, version } = req.body;
            if (!platform || !version) {
              sendJson(res, 400, { error: 'platform and version are required.' });
              return;
            }
            const artifact = await storeBuildArtifact(user.id, platform, version, req.file);
            sendJson(res, 200, artifact);
          } catch (uploadError) {
            sendJson(res, 500, { error: uploadError.message });
          }
        });
        return;
      }

      if (url.pathname.startsWith('/api/regression/builds/latest/') && req.method === 'GET') {
        const platform = url.pathname.split('/').pop();
        const artifact = await getLatestBuild(user.id, platform);
        sendJson(res, 200, { artifact });
        return;
      }

      if (url.pathname === '/api/regression/builds/webhook' && req.method === 'POST') {
        const rawBody = await readRequestBody(req);
        const { platform, url: webhookUrl } = JSON.parse(rawBody || '{}');
        if (!platform || !webhookUrl) {
          sendJson(res, 400, { error: 'platform and url are required.' });
          return;
        }
        await saveWebhook(user.id, platform, webhookUrl);
        sendJson(res, 200, { ok: true });
        return;
      }

      if (url.pathname === '/api/regression/builds/webhook' && req.method === 'GET') {
        const webhooks = await getWebhooks(user.id);
        sendJson(res, 200, { webhooks });
        return;
      }

      // === User Data endpoints (profile, team, suites, history, qaResult) ===

      if (url.pathname === '/api/user/profile' && req.method === 'GET') {
        const data = await authStore.loadUserData(user.id, 'profile');
        sendJson(res, 200, { profile: data || { displayName: '' } });
        return;
      }

      if (url.pathname === '/api/user/profile' && req.method === 'POST') {
        const rawBody = await readRequestBody(req);
        const { displayName } = JSON.parse(rawBody || '{}');
        await authStore.saveUserData(user.id, 'profile', { displayName: displayName || '' });
        sendJson(res, 200, { ok: true });
        return;
      }

      if (url.pathname === '/api/user/product-key' && req.method === 'GET') {
        const keyDoc = await findProductKeyByUserId(user.id);
        sendJson(res, 200, {
          productKey: keyDoc ? { key: keyDoc.key, activatedAt: keyDoc.usedAt } : null,
        });
        return;
      }

      if (url.pathname === '/api/user/team' && req.method === 'GET') {
        const data = await authStore.loadUserData(user.id, 'team');
        sendJson(res, 200, { members: data || [] });
        return;
      }

      if (url.pathname === '/api/user/team' && req.method === 'POST') {
        if (user.role !== 'Admin') {
          sendJson(res, 403, { error: 'Only admins can manage team.' });
          return;
        }
        const rawBody = await readRequestBody(req);
        const { members } = JSON.parse(rawBody || '{}');
        await authStore.saveUserData(user.id, 'team', members || []);
        sendJson(res, 200, { ok: true });
        return;
      }

      if (url.pathname === '/api/user/suites' && req.method === 'GET') {
        const data = await authStore.loadUserData(user.id, 'suites');
        sendJson(res, 200, { suites: data || [] });
        return;
      }

      if (url.pathname === '/api/user/suites' && req.method === 'POST') {
        const rawBody = await readRequestBody(req);
        const { suites } = JSON.parse(rawBody || '{}');
        await authStore.saveUserData(user.id, 'suites', suites || []);
        sendJson(res, 200, { ok: true });
        return;
      }

      if (url.pathname === '/api/history' && req.method === 'GET') {
        const data = await authStore.loadUserData(user.id, 'history');
        sendJson(res, 200, { items: data || [] });
        return;
      }

      if (url.pathname === '/api/history' && req.method === 'POST') {
        const rawBody = await readRequestBody(req);
        const { items } = JSON.parse(rawBody || '{}');
        await authStore.saveUserData(user.id, 'history', items || []);
        sendJson(res, 200, { ok: true });
        return;
      }

      if (url.pathname === '/api/qa-result' && req.method === 'GET') {
        const data = await authStore.loadUserData(user.id, 'qaResult');
        sendJson(res, 200, { result: data || null });
        return;
      }

      if (url.pathname === '/api/qa-result' && req.method === 'POST') {
        const rawBody = await readRequestBody(req);
        const { result } = JSON.parse(rawBody || '{}');
        await authStore.saveUserData(user.id, 'qaResult', result || null);
        sendJson(res, 200, { ok: true });
        return;
      }

      // Landing page enterprise inquiry (no pending registration needed)
      if (url.pathname === '/api/enterprise-inquiry' && req.method === 'POST') {
        const rawBody = await readRequestBody(req);
        const { name, email, company, message } = JSON.parse(rawBody || '{}');
        if (!name || !email || !company || !message) {
          sendJson(res, 400, { error: 'All fields are required.' });
          return;
        }
        const db = getDb();
        await db.collection('enterprise_inquiries').insertOne({
          name, email, company, message,
          source: 'landing_page',
          createdAt: new Date().toISOString(),
        });
        try {
          const transporter = (await import('nodemailer')).default;
          const host = process.env.SMTP_HOST;
          const port = parseInt(process.env.SMTP_PORT, 10) || 587;
          const user = process.env.SMTP_USER;
          const pass = process.env.SMTP_PASS;
          const supportEmail = process.env.SUPPORT_EMAIL || 'support@forgeqa.in';
          let t;
          if (host && pass) {
            t = transporter.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
          } else {
            const account = await transporter.createTestAccount();
            t = transporter.createTransport({ host: 'smtp.ethereal.email', port: 587, secure: false, auth: { user: account.user, pass: account.pass } });
          }
          await t.sendMail({
            from: process.env.SMTP_FROM || 'ForgeQA <onboarding@resend.dev>',
            to: supportEmail,
            subject: `Enterprise Inquiry from ${company}`,
            html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h2>New Enterprise Inquiry</h2><table style="width:100%;border-collapse:collapse;"><tr><td style="padding:8px;background:#f5f5f5;font-weight:bold;border:1px solid #ddd;">Name</td><td style="padding:8px;border:1px solid #ddd;">${name}</td></tr><tr><td style="padding:8px;background:#f5f5f5;font-weight:bold;border:1px solid #ddd;">Email</td><td style="padding:8px;border:1px solid #ddd;">${email}</td></tr><tr><td style="padding:8px;background:#f5f5f5;font-weight:bold;border:1px solid #ddd;">Company</td><td style="padding:8px;border:1px solid #ddd;">${company}</td></tr><tr><td style="padding:8px;background:#f5f5f5;font-weight:bold;border:1px solid #ddd;">Message</td><td style="padding:8px;border:1px solid #ddd;">${message}</td></tr></table><p style="color:#999;font-size:12px;">Submitted from ForgeQA landing page</p></body></html>`,
          });
        } catch (emailErr) {
          console.warn('Failed to send enterprise inquiry email:', emailErr.message);
        }
        sendJson(res, 200, { ok: true });
        return;
      }

      sendJson(res, 404, { error: 'API route not found.' });
    } catch (error) {
      console.error('API error encountered:', error);
      console.error('Request URL:', req.url);
      if (error.stack) console.error('Stack:', error.stack.split('\n').slice(0, 4).join('\n'));

      const userMessage =
        error.statusCode && error.statusCode < 500
          ? (error.message ?? 'Request failed.')
          : 'An internal error occurred. Please try again later.';

      sendJson(res, error.statusCode ?? 500, {
        error: userMessage,
      });
    }
  };
}
