/**
 * AI Model Live-Sync Service
 *
 * Automatically fetches the live model catalogue from each provider's API,
 * stores it in MongoDB (`ai_model_sync` collection), and exposes a resolver
 * that picks the best available model at runtime.
 *
 * How it works:
 *  - On server startup (and every 24 h) `syncAllProviders()` is called.
 *  - Each provider returns its live model list; we persist it in the DB.
 *  - `resolveLiveModel(provider, requestedModel)` checks:
 *      1. Is the requested model still in the live list? → use it.
 *      2. If not (removed / deprecated) → pick the best fallback from the
 *         live list using the curated preference order in MODEL_REGISTRY.
 *      3. If the sync hasn't run yet → fall back to the static registry default.
 *
 * Adding a new provider = add one entry to PROVIDER_FETCHERS below.
 * Zero changes needed anywhere else in the codebase.
 */

import { getDb } from '../db.js';
import { MODEL_REGISTRY, getRegistryDefault } from './modelRegistry.js';

// ── Provider fetchers ────────────────────────────────────────────────────────
// Each fetcher receives the decrypted API key (may be undefined for keyless
// providers) and returns an array of model IDs available right now.

const PROVIDER_FETCHERS = {
  /**
   * Groq — standard OpenAI-compatible /v1/models endpoint.
   * Does NOT require authentication for the model list.
   */
  async groq(apiKey) {
    const headers = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers,
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Groq /v1/models HTTP ${res.status}`);
    const json = await res.json();
    return (json.data ?? []).filter((m) => m.object === 'model').map((m) => m.id);
  },

  /**
   * OpenAI — standard /v1/models endpoint.
   * Requires a valid API key; skip if not configured.
   */
  async openai(apiKey) {
    if (!apiKey) return null; // skip, key not configured
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`OpenAI /v1/models HTTP ${res.status}`);
    const json = await res.json();
    return (json.data ?? []).map((m) => m.id);
  },

  /**
   * OpenRouter — public model list (no auth needed).
   */
  async openrouter(_apiKey) {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`OpenRouter /api/v1/models HTTP ${res.status}`);
    const json = await res.json();
    return (json.data ?? []).map((m) => m.id);
  },

  /**
   * Google Gemini — lists models via the REST API.
   * Requires GEMINI_API_KEY.
   */
  async gemini(apiKey) {
    if (!apiKey) return null;
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=100`,
      { signal: AbortSignal.timeout(10_000) }
    );
    if (!res.ok) throw new Error(`Gemini /v1beta/models HTTP ${res.status}`);
    const json = await res.json();
    return (json.models ?? [])
      .filter((m) => (m.supportedGenerationMethods ?? []).includes('generateContent'))
      .map((m) => m.name.replace('models/', '')); // "models/gemini-2.0-flash" → "gemini-2.0-flash"
  },

  /**
   * Anthropic Claude — no public model-list endpoint exists.
   * We rely on the static registry + live probe (modelHealthCheck) for Claude.
   */
  async claude(_apiKey) {
    return null; // not supported via API
  },
};

// ── DB helpers ───────────────────────────────────────────────────────────────

const COLLECTION = 'ai_model_sync';

async function saveSyncResult(provider, modelIds) {
  const db = getDb();
  await db
    .collection(COLLECTION)
    .updateOne(
      { provider },
      { $set: { provider, modelIds, syncedAt: new Date() } },
      { upsert: true }
    );
}

async function loadSyncResult(provider) {
  try {
    const db = getDb();
    return await db.collection(COLLECTION).findOne({ provider });
  } catch {
    return null; // DB not ready yet — graceful degradation
  }
}

// ── Sync runner ──────────────────────────────────────────────────────────────

/** Resolves the server-level API key for a provider from env vars. */
function getEnvApiKey(provider) {
  const map = {
    groq: 'GROQ_API_KEY',
    openai: 'OPENAI_API_KEY',
    openrouter: 'OPENROUTER_API_KEY',
    gemini: 'GEMINI_API_KEY',
    claude: 'CLAUDE_API_KEY',
  };
  return process.env[map[provider]] || undefined;
}

/**
 * Fetches the live model list for one provider and saves it to the DB.
 * Returns the model ID array or null if skipped / failed.
 */
async function syncProvider(provider) {
  const fetcher = PROVIDER_FETCHERS[provider];
  if (!fetcher) return null;

  const apiKey = getEnvApiKey(provider);
  try {
    const modelIds = await fetcher(apiKey);
    if (!modelIds) return null; // intentionally skipped (e.g. Claude)
    await saveSyncResult(provider, modelIds);
    console.log(`[ModelSync] ${provider}: synced ${modelIds.length} model(s).`);
    return modelIds;
  } catch (err) {
    console.warn(`[ModelSync] ${provider}: sync failed — ${err.message}`);
    return null;
  }
}

/**
 * Syncs ALL known providers in parallel.
 * Called on server startup and every 24 hours automatically.
 */
export async function syncAllProviders() {
  const providers = Object.keys(PROVIDER_FETCHERS);
  const results = await Promise.allSettled(providers.map(syncProvider));
  const succeeded = results.filter((r) => r.status === 'fulfilled' && r.value).length;
  console.log(`[ModelSync] Done — ${succeeded}/${providers.length} provider(s) synced.`);
}

// ── Live-aware model resolver ────────────────────────────────────────────────

/**
 * Picks the best available model for a provider at runtime.
 *
 * Resolution order:
 *  1. Requested model is still in the provider's live list → use it.
 *  2. Requested model was removed → log a warning and find a replacement:
 *     a. First non-deprecated model from the registry that is live.
 *     b. First model from the raw live list (brand-new model not yet in registry).
 *     c. Static registry default (ultimate fallback, no DB needed).
 *
 * @param {string} provider
 * @param {string|undefined} requestedModel
 * @returns {Promise<string|undefined>}
 */
export async function resolveLiveModel(provider, requestedModel) {
  const syncDoc = await loadSyncResult(provider);

  // No sync data yet (first boot or DB unavailable) → fall back to static registry
  if (!syncDoc || !Array.isArray(syncDoc.modelIds) || syncDoc.modelIds.length === 0) {
    return requestedModel || getRegistryDefault(provider) || undefined;
  }

  const liveSet = new Set(syncDoc.modelIds);

  // 1. Requested model is still live → use it unchanged
  if (requestedModel && liveSet.has(requestedModel)) {
    return requestedModel;
  }

  // Model is gone from the provider's live list
  if (requestedModel) {
    console.warn(
      `[ModelSync] "${requestedModel}" is no longer available from ${provider}. Auto-selecting best replacement.`
    );
  }

  // 2a. Walk registry preference order — first non-deprecated live model wins
  const registryModels = MODEL_REGISTRY[provider]?.models ?? [];
  for (const entry of registryModels) {
    if (!entry.deprecated && liveSet.has(entry.id)) {
      return entry.id;
    }
  }

  // 2b. Provider added a brand-new model not in the registry yet — use it
  const firstLive = syncDoc.modelIds[0];
  if (firstLive) {
    console.log(`[ModelSync] ${provider}: falling back to first live model "${firstLive}".`);
    return firstLive;
  }

  // 2c. Ultimate fallback — static registry
  return getRegistryDefault(provider) || undefined;
}

/**
 * Returns the merged live+registry model list for a provider.
 * Used by the UI model picker to show only actually-available models.
 * Falls back to the static registry if no sync has run yet.
 */
export async function getLiveModels(provider) {
  const syncDoc = await loadSyncResult(provider);
  if (!syncDoc?.modelIds?.length) {
    return (MODEL_REGISTRY[provider]?.models ?? [])
      .filter((m) => !m.deprecated)
      .map((m) => ({ id: m.id, label: m.label, recommended: m.recommended ?? false }));
  }

  const liveSet = new Set(syncDoc.modelIds);
  const result = [];
  const seen = new Set();

  // Registry models that are currently live
  for (const entry of MODEL_REGISTRY[provider]?.models ?? []) {
    if (!entry.deprecated && liveSet.has(entry.id)) {
      result.push({ id: entry.id, label: entry.label, recommended: entry.recommended ?? false });
      seen.add(entry.id);
    }
  }

  // New live models not yet in the registry (provider launched something new)
  for (const id of syncDoc.modelIds) {
    if (!seen.has(id)) {
      result.push({ id, label: id, recommended: false });
    }
  }

  return result;
}

/** Returns the last time a provider's model list was synced. */
export async function getLastSyncTime(provider) {
  const doc = await loadSyncResult(provider);
  return doc?.syncedAt ?? null;
}
