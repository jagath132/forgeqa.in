/**
 * Central AI Model Registry for ForgeQA
 *
 * Defines all supported models per provider, marks deprecated ones,
 * provides recommended replacements, and exposes live-validation helpers.
 *
 * The registry is the single source of truth — update it here whenever
 * a provider changes a model and all dependent code picks it up automatically.
 */

export const MODEL_REGISTRY = {
  gemini: {
    label: 'Google Gemini',
    models: [
      {
        id: 'gemini-2.0-flash',
        label: 'Gemini 2.0 Flash',
        recommended: true,
        deprecated: false,
        replacement: null,
        contextWindow: 1_048_576,
      },
      {
        id: 'gemini-2.5-flash',
        label: 'Gemini 2.5 Flash',
        recommended: false,
        deprecated: false,
        replacement: null,
        contextWindow: 1_048_576,
      },
      {
        id: 'gemini-1.5-flash',
        label: 'Gemini 1.5 Flash',
        recommended: false,
        deprecated: false,
        replacement: null,
        contextWindow: 1_048_576,
      },
      {
        id: 'gemini-1.5-pro',
        label: 'Gemini 1.5 Pro',
        recommended: false,
        deprecated: false,
        replacement: null,
        contextWindow: 2_097_152,
      },
      {
        id: 'gemini-1.0-pro',
        label: 'Gemini 1.0 Pro (Deprecated)',
        recommended: false,
        deprecated: true,
        replacement: 'gemini-2.0-flash',
        contextWindow: 32_768,
      },
    ],
  },
  openai: {
    label: 'OpenAI',
    models: [
      {
        id: 'gpt-4o-mini',
        label: 'GPT-4o Mini',
        recommended: true,
        deprecated: false,
        replacement: null,
        contextWindow: 128_000,
      },
      {
        id: 'gpt-4o',
        label: 'GPT-4o',
        recommended: false,
        deprecated: false,
        replacement: null,
        contextWindow: 128_000,
      },
      {
        id: 'o3-mini',
        label: 'o3-mini',
        recommended: false,
        deprecated: false,
        replacement: null,
        contextWindow: 200_000,
      },
      {
        id: 'gpt-3.5-turbo',
        label: 'GPT-3.5 Turbo (Deprecated)',
        recommended: false,
        deprecated: true,
        replacement: 'gpt-4o-mini',
        contextWindow: 16_385,
      },
    ],
  },
  groq: {
    label: 'Groq',
    models: [
      {
        id: 'openai/gpt-oss-120b',
        label: 'GPT-OSS 120B',
        recommended: true,
        deprecated: false,
        replacement: null,
        contextWindow: 128_000,
      },
      {
        id: 'qwen-2.5-32b',
        label: 'Qwen 2.5 32B',
        recommended: false,
        deprecated: false,
        replacement: null,
        contextWindow: 128_000,
      },
      {
        id: 'openai/gpt-oss-20b',
        label: 'GPT-OSS 20B',
        recommended: false,
        deprecated: false,
        replacement: null,
        contextWindow: 128_000,
      },
      {
        id: 'llama-3.1-8b-instant',
        label: 'LLaMA 3.1 8B Instant (Deprecated)',
        recommended: false,
        deprecated: true,
        replacement: 'openai/gpt-oss-120b',
        deprecatedOn: '2026-08-16',
        contextWindow: 0,
      },
      {
        id: 'llama-3.3-70b-versatile',
        label: 'LLaMA 3.3 70B Versatile (Deprecated)',
        recommended: false,
        deprecated: true,
        replacement: 'openai/gpt-oss-120b',
        deprecatedOn: '2026-08-16',
        contextWindow: 0,
      },
    ],
  },
  claude: {
    label: 'Anthropic Claude',
    models: [
      {
        id: 'claude-3-5-sonnet-20241022',
        label: 'Claude 3.5 Sonnet',
        recommended: true,
        deprecated: false,
        replacement: null,
        contextWindow: 200_000,
      },
      {
        id: 'claude-3-5-haiku-20241022',
        label: 'Claude 3.5 Haiku',
        recommended: false,
        deprecated: false,
        replacement: null,
        contextWindow: 200_000,
      },
      {
        id: 'claude-3-7-sonnet-20250219',
        label: 'Claude 3.7 Sonnet',
        recommended: false,
        deprecated: false,
        replacement: null,
        contextWindow: 200_000,
      },
      {
        id: 'claude-3-opus-20240229',
        label: 'Claude 3 Opus (Deprecated)',
        recommended: false,
        deprecated: true,
        replacement: 'claude-3-5-sonnet-20241022',
        contextWindow: 200_000,
      },
      {
        id: 'claude-3-sonnet-20240229',
        label: 'Claude 3 Sonnet (Deprecated)',
        recommended: false,
        deprecated: true,
        replacement: 'claude-3-5-sonnet-20241022',
        contextWindow: 200_000,
      },
    ],
  },
  openrouter: {
    label: 'OpenRouter',
    models: [
      {
        id: 'openai/gpt-4o-mini',
        label: 'GPT-4o Mini (via OpenRouter)',
        recommended: true,
        deprecated: false,
        replacement: null,
        contextWindow: 128_000,
      },
      {
        id: 'google/gemini-2.0-flash-001',
        label: 'Gemini 2.0 Flash (via OpenRouter)',
        recommended: false,
        deprecated: false,
        replacement: null,
        contextWindow: 1_000_000,
      },
      {
        id: 'meta-llama/llama-3.3-70b-instruct',
        label: 'LLaMA 3.3 70B (via OpenRouter)',
        recommended: false,
        deprecated: false,
        replacement: null,
        contextWindow: 128_000,
      },
      {
        id: 'google/gemini-2.0-flash-exp:free',
        label: 'Gemini 2.0 Flash (Free tier — rate limited)',
        recommended: false,
        deprecated: false,
        replacement: 'google/gemini-2.0-flash-001',
        contextWindow: 1_000_000,
      },
    ],
  },
  opencode: {
    label: 'OpenCode',
    models: [
      {
        id: 'gpt-4o-mini',
        label: 'GPT-4o Mini',
        recommended: true,
        deprecated: false,
        replacement: null,
        contextWindow: 128_000,
      },
    ],
  },
};

export function normalizeModelId(model) {
  const modelId =
    typeof model === 'string'
      ? model
      : model && typeof model === 'object'
        ? (model.id ?? model.model ?? model.value ?? model.name)
        : null;
  return typeof modelId === 'string' && modelId.trim() ? modelId.trim() : null;
}

/** Returns the default (recommended) model ID for a given provider */
export function getRegistryDefault(provider) {
  const entry = MODEL_REGISTRY[provider];
  if (!entry) return null;
  return entry.models.find((m) => m.recommended && !m.deprecated)?.id ?? null;
}

/** Returns the active replacement for a deprecated model, or null */
export function resolveDeprecated(provider, modelId) {
  const entry = MODEL_REGISTRY[provider];
  if (!entry) return null;
  const found = entry.models.find((m) => m.id === modelId);
  if (!found || !found.deprecated) return null;
  return found.replacement ?? null;
}

/** Returns all deprecated models for a provider */
export function getDeprecatedModels(provider) {
  return (MODEL_REGISTRY[provider]?.models ?? []).filter((m) => m.deprecated);
}

/** Returns all active (non-deprecated) models for a provider */
export function getActiveModels(provider) {
  return (MODEL_REGISTRY[provider]?.models ?? []).filter((m) => !m.deprecated);
}

/**
 * Checks a model against the registry.
 * Returns { valid, deprecated, replacement, recommended }
 */
export function checkModel(provider, modelId) {
  const entry = MODEL_REGISTRY[provider];
  if (!entry) return { valid: false, deprecated: false, replacement: null, recommended: null };
  const found = entry.models.find((m) => m.id === modelId);
  if (!found)
    return {
      valid: false,
      deprecated: false,
      replacement: null,
      recommended: getRegistryDefault(provider),
    };
  return {
    valid: true,
    deprecated: found.deprecated,
    replacement: found.replacement,
    recommended: getRegistryDefault(provider),
  };
}
