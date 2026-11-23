# AI Providers and Model Health

Settings lets users select an active AI provider and manage saved credentials. The generation APIs use provider-specific adapters and resolve usable models before requesting output.

## Provider capabilities

| Capability | Provider branches in the implementation |
| --- | --- |
| Test case generation and refinement | Gemini, OpenAI, OpenRouter, OpenCode, and Groq |
| Test scripts, framework generation, diagnosis, and regression generation | Gemini, OpenAI, OpenRouter, OpenCode, and Groq |
| PRD generation | Gemini and Claude have dedicated streaming branches. OpenAI-compatible streaming handles the other provider choices. |
| Embeddings | Gemini, OpenAI, and OpenRouter are recognized as embedding-capable. |

The configuration interface offers Gemini, OpenAI, Claude, OpenRouter, OpenCode, and Groq. Availability within a feature also depends on its adapter, model, credentials, and provider response.

## Credentials and model resolution

1. Settings saves the active provider on the account. Provider keys are encrypted at rest. The settings API lists which keys exist without returning their values.
2. A generation request can supply an explicit key. When the key is omitted, the server checks the user's saved key, then the provider's environment variable.
3. The server normalizes the requested model ID and uses the registry default when necessary. Known deprecated IDs can resolve to preferred replacements. Live model inventories can influence the resolution when available.
4. The Node server schedules provider inventory sync and model health checks at startup and every 24 hours. Alerts are stored by account and can be dismissed individually or together.

For test case generation, the server can use an available OpenAI key for embeddings when the selected generation provider lacks embedding support. The Knowledge Base also uses the embedding adapter to index text and score queries.

## API contract

| Method and path | Function |
| --- | --- |
| `GET /api/settings/api-keys`, `POST/DELETE /api/settings/api-key` | List key availability and save or remove a provider credential. |
| `PUT/DELETE /api/settings/active-provider` | Save or clear the selected provider. |
| `GET /api/ai/model-registry` | Read the static model registry. |
| `POST /api/ai/check-model` | Check an explicit or account-default provider and model and return current and new alerts. The route can use the saved provider key for a live probe. |
| `GET /api/ai/model-alerts`, `POST /api/ai/model-alerts/{id}/dismiss`, `POST /api/ai/model-alerts/dismiss-all` | Read or dismiss alerts for the signed-in account. |

## Function reference

| Function | Responsibility |
| --- | --- |
| `resolveApiKey`, `resolveModel`, `resolveEmbeddingOptions` | Choose credentials, resolve model IDs, and select embedding options for QA generation. |
| `encryptApiKey`, `decryptApiKey` | Protect and retrieve provider and connector credentials. |
| `getRegistryDefault`, `resolveDeprecated`, `checkModel` | Read registry defaults, replacements, and model status. |
| `syncAllProviders`, `resolveLiveModel`, `getLiveModels` | Cache provider model inventories in `ai_model_sync` and consult the inventory during model selection. |
| `generateWithGemini`, `generateWithGeminiStream`, `generateWithOpenAI`, `generateWithOpenAIStream` | Submit generation requests and return JSON, raw output, or streamed tokens as used by the calling module. |
| `supportsEmbeddings`, `createEmbeddings`, `cosineSimilarity` | Check embedding compatibility, create vectors, and compare vectors. |
| `runModelHealthCheck`, `checkUserProviderModel`, `getAlertsForUser` | Detect model issues and expose alerts from `ai_model_alerts`. |

Sources. [Settings](../src/pages/SettingsPage.tsx), [Main API](../server/api.js), [AI account settings routes](../server/auth/routes.js), [Model registry](../server/ai/modelRegistry.js), [Model sync](../server/ai/modelSync.js), [Health checks](../server/ai/modelHealthCheck.js), [Embeddings](../server/ai/embeddings.js), [Runtime scheduling](../server/index.js).
