# ForgeQA Module Specifications

ForgeQA turns product requirements and reference material into test matrices, automation code, and regression run records. It also provides account and subscription management. The License Manager is a separate application for operators who manage registration approvals, product keys, plans, customers, and payments.

These specifications describe the implementation in the workspace. Each module covers its entry points, workflow, data, important functions, and conditions that affect what users can do.

| Module | What it covers |
| --- | --- |
| [Workspace and navigation](01-workspace.md) | Landing page, first sign-in, dashboard, search, and route availability |
| [Identity and account](02-identity-and-account.md) | Registration, product key activation, sign-in, password recovery, profile, and account deletion |
| [PRD generation](03-prd-generation.md) | Requirements from text or a website, streaming, exports, history, and Knowledge Base handoff |
| [Test case generation and management](04-test-cases.md) | AI test matrices, refinement, traceability, history, exports, and suite storage |
| [Knowledge Base and connectors](05-knowledge-base.md) | Uploads, document import, OAuth connectors, indexing, and retrieval |
| [Automation script generation](06-automation-scripts.md) | Case selection, target configuration, framework output, downloads, and failure diagnosis |
| [Regression testing](07-regression.md) | Regression cases and scripts, run records, builds, and webhook settings |
| [AI providers and model health](08-ai-providers.md) | Provider settings, credentials, model resolution, embeddings, and alerts |
| [Billing and subscriptions](09-billing.md) | Catalogs, checkout, subscriptions, invoicing, and metering |
| [Administration and License Manager](10-administration.md) | Admin APIs, verification, keys, customers, plans, payments, and audit |
| [Platform and operations](11-platform.md) | Runtime, persistence, entry points, deployment, email, and existing tests |

## Product workflow

1. Register, complete any required verification and product-key activation, then sign in.
2. Select an AI provider in Settings. Supply a provider key when the server has no configured key for that provider.
3. Enter requirements directly in the Test Case Generator or draft a PRD from notes or a website. Save a PRD to the Knowledge Base if it should inform later generation.
4. Upload supporting documents or import them from SharePoint, then create or refresh their chunks so generation can retrieve relevant passages.
5. Generate, inspect, refine, or export the test matrix. Open Test Scripts to turn selected cases into automation code.
6. Use Regression to generate regression cases and scripts and store run records or build metadata. The execution endpoint currently returns HTTP 501 for an existing run.

## Application boundaries

| Surface | Entry point |
| --- | --- |
| ForgeQA web application | [src/App.tsx](../src/App.tsx) |
| ForgeQA HTTP API | [server/api.js](../server/api.js) |
| License Manager web application | [license-manager/src/App.tsx](../license-manager/src/App.tsx) |
| License Manager HTTP API | [license-manager/server/api.js](../license-manager/server/api.js) |

API paths are relative to the application that owns them. The two applications have separate authentication flows. Shared records such as product keys and pending registrations link the customer-facing and operator workflows.
