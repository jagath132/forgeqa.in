/**
 * AI Model Health-Check Service
 *
 * - Validates each user's configured AI provider + model against the registry
 * - Optionally fires a live probe request to detect undocumented deprecations
 * - Stores deprecation alerts in MongoDB (ai_model_alerts collection)
 * - Exposes helpers to push browser notifications via SSE
 */
import { getDb } from '../db.js';
import {
  MODEL_REGISTRY,
  checkModel,
  getRegistryDefault,
  resolveDeprecated,
} from './modelRegistry.js';
import { decryptApiKey } from '../auth/index.js';

// ── Types ───────────────────────────────────────────────────────────────────
//  alert = { userId, provider, model, replacement, reason, seenAt }

// ── Storage helpers ─────────────────────────────────────────────────────────

export async function getAlertsForUser(userId) {
  const db = getDb();
  return db
    .collection('ai_model_alerts')
    .find({ userId: String(userId), dismissed: { $ne: true } })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function dismissAlert(userId, alertId) {
  const db = getDb();
  const { ObjectId } = await import('mongodb');
  await db
    .collection('ai_model_alerts')
    .updateOne(
      { _id: new ObjectId(alertId), userId: String(userId) },
      { $set: { dismissed: true, dismissedAt: new Date() } }
    );
}

export async function dismissAllAlerts(userId) {
  const db = getDb();
  await db
    .collection('ai_model_alerts')
    .updateMany(
      { userId: String(userId), dismissed: { $ne: true } },
      { $set: { dismissed: true, dismissedAt: new Date() } }
    );
}

async function upsertAlert(userId, provider, model, replacement, reason) {
  const db = getDb();
  const key = `${userId}:${provider}:${model}`;
  await db.collection('ai_model_alerts').updateOne(
    { dedupeKey: key, dismissed: { $ne: true } },
    {
      $setOnInsert: {
        dedupeKey: key,
        userId: String(userId),
        provider,
        model,
        replacement,
        reason,
        createdAt: new Date(),
        dismissed: false,
      },
    },
    { upsert: true }
  );
}

// ── Live probe helpers ───────────────────────────────────────────────────────

async function probeGroq(apiKey, model) {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 404 || res.status === 400) {
      const data = await res.json().catch(() => ({}));
      const msg = data.error?.message ?? '';
      if (msg.includes('does not exist') || msg.includes('not have access')) {
        return { alive: false, reason: msg };
      }
    }
    return { alive: true, reason: null };
  } catch {
    return { alive: null, reason: 'probe_timeout' }; // network issue, don't alert
  }
}

async function probeOpenAI(apiKey, model, endpoint = 'https://api.openai.com/v1/chat/completions') {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 404 || res.status === 400) {
      const data = await res.json().catch(() => ({}));
      const msg = data.error?.message ?? '';
      if (msg.includes('does not exist') || msg.includes('not have access')) {
        return { alive: false, reason: msg };
      }
    }
    return { alive: true, reason: null };
  } catch {
    return { alive: null, reason: 'probe_timeout' };
  }
}

async function probeGemini(apiKey, model) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'ping' }] }] }),
        signal: AbortSignal.timeout(8000),
      }
    );
    if (res.status === 404 || res.status === 400) {
      const data = await res.json().catch(() => ({}));
      const msg = data.error?.message ?? '';
      if (msg.includes('not found') || msg.includes('does not exist')) {
        return { alive: false, reason: msg };
      }
    }
    return { alive: true, reason: null };
  } catch {
    return { alive: null, reason: 'probe_timeout' };
  }
}

async function probeClaude(apiKey, model) {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'ping' }],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 404 || res.status === 400) {
      const data = await res.json().catch(() => ({}));
      const msg = data.error?.message ?? '';
      if (msg.includes('not found') || msg.includes('does not exist')) {
        return { alive: false, reason: msg };
      }
    }
    return { alive: true, reason: null };
  } catch {
    return { alive: null, reason: 'probe_timeout' };
  }
}

async function probeModel(provider, model, encryptedKey) {
  let apiKey;
  try {
    apiKey = decryptApiKey(encryptedKey.encryptedKey, encryptedKey.iv, encryptedKey.authTag);
  } catch {
    return { alive: null, reason: 'decrypt_error' };
  }
  switch (provider) {
    case 'groq':
      return probeGroq(apiKey, model);
    case 'openai':
    case 'opencode':
      return probeOpenAI(apiKey, model);
    case 'openrouter':
      return probeOpenAI(apiKey, model, 'https://openrouter.ai/api/v1/chat/completions');
    case 'gemini':
      return probeGemini(apiKey, model);
    case 'claude':
      return probeClaude(apiKey, model);
    default:
      return { alive: null, reason: 'unknown_provider' };
  }
}

// ── Main check function ──────────────────────────────────────────────────────

/**
 * Checks the user's saved provider / model against:
 *   1. The static MODEL_REGISTRY (instant, no network needed)
 *   2. A live probe to the provider API (catches undocumented deprecations)
 *
 * Returns an array of new alert objects created (may be empty).
 */
export async function checkUserProviderModel(
  userId,
  { provider, model, encryptedKey, liveProbe = false }
) {
  const alerts = [];

  if (!MODEL_REGISTRY[provider]) return alerts;

  // ── Step 1: registry check ──────────────────────────────────────────────
  const { valid, deprecated, replacement } = checkModel(provider, model);

  if (deprecated) {
    const rec = replacement ?? getRegistryDefault(provider);
    await upsertAlert(
      userId,
      provider,
      model,
      rec,
      `The model "${model}" was deprecated by ${MODEL_REGISTRY[provider].label}. Recommended replacement: ${rec}.`
    );
    alerts.push({ provider, model, replacement: rec, source: 'registry' });
    return alerts; // no need to probe a known-deprecated model
  }

  if (!valid) {
    const rec = getRegistryDefault(provider);
    await upsertAlert(
      userId,
      provider,
      model,
      rec,
      `The model "${model}" is no longer listed by ${MODEL_REGISTRY[provider].label}. Switching to ${rec} is recommended.`
    );
    alerts.push({ provider, model, replacement: rec, source: 'registry_unknown' });
    return alerts;
  }

  // ── Step 2: optional live probe ─────────────────────────────────────────
  if (liveProbe && encryptedKey) {
    const probe = await probeModel(provider, model, encryptedKey);
    if (probe.alive === false) {
      const rec = replacement ?? getRegistryDefault(provider);
      await upsertAlert(
        userId,
        provider,
        model,
        rec,
        `Live check: "${model}" returned an access error from ${MODEL_REGISTRY[provider].label}. Recommended replacement: ${rec}.`
      );
      alerts.push({
        provider,
        model,
        replacement: rec,
        source: 'live_probe',
        reason: probe.reason,
      });
    }
  }

  return alerts;
}

/**
 * Scans ALL users' saved API keys + provider preferences for deprecated/broken models.
 * Called on server startup and every 24 hours via a scheduled interval.
 * Pass liveProbe=true to actually hit provider endpoints (slower, but catches surprises).
 */
export async function runModelHealthCheck({ liveProbe = false } = {}) {
  const db = getDb();

  // Fetch all saved user API keys
  const allKeys = await db.collection('user_api_keys').find({}).toArray();
  const allUsers = await db
    .collection('users')
    .find({}, { projection: { _id: 1, activeProvider: 1 } })
    .toArray();

  const userProviderMap = new Map();
  allUsers.forEach((u) => {
    userProviderMap.set(String(u._id), u.activeProvider ?? null);
  });

  let totalAlerts = 0;

  for (const keyDoc of allKeys) {
    const userId = String(keyDoc.userId);
    const provider = keyDoc.provider;

    // Determine model to check: prefer the user's saved model preference if stored,
    // otherwise use the registry default.
    const savedModel = keyDoc.preferredModel ?? getRegistryDefault(provider);
    if (!savedModel) continue;

    const newAlerts = await checkUserProviderModel(userId, {
      provider,
      model: savedModel,
      encryptedKey: keyDoc,
      liveProbe,
    });
    totalAlerts += newAlerts.length;
  }

  console.log(
    `[ModelHealthCheck] Completed. ${allKeys.length} provider configs checked, ${totalAlerts} new alert(s) created.`
  );
  return { checked: allKeys.length, alerts: totalAlerts };
}
