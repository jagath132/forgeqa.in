# Platform and Operations

ForgeQA uses a React and TypeScript client, a Node.js HTTP API, and MongoDB. The License Manager has separate client and API entry points and can share the ForgeQA database.

## Runtime and deployment

| Surface | Entry point and behavior |
| --- | --- |
| Local ForgeQA development | `npm run dev` starts Vite. The Vite plugin mounts ForgeQA API middleware alongside the client. |
| Built ForgeQA application | `npm run build` writes `dist`. `npm start` launches the Node server, serves the built client and API, and schedules AI model sync and health checks. |
| Vercel | `vercel.json` routes API requests to `api/index.js` and client routes to the app entry. The License Manager has its own Vercel entry and configuration. |
| Railway | `railway.json` uses npm build and start commands and configures `/api/health` for the health check. License Manager has its own Railway configuration. |
| License Manager | The `license-manager` subdirectory contains its own package manifest, Vite client, Node server, and Vercel API entry. |

The root package manifest declares Node.js 24.x. Configure the database and app origin with `MONGO_URI`, `MONGO_DB_NAME`, and `APP_URL`. Authentication, credential encryption, payment services, connectors, AI providers, and email delivery read the environment supported by their respective modules. The repository includes an environment example with the MongoDB, auth, connector, and email variable names. [.env.example](../.env.example)

## Persistence

| Data | Storage |
| --- | --- |
| Accounts, pending registrations, keys, refresh tokens, and reset tokens | MongoDB, with indexed email, key, and token lookups and expiration indexes on applicable records. |
| User-owned profile, team lists, suites, history, and current QA results | `user_data`, keyed by user and data name. The browser also caches history and the current QA result. |
| Knowledge index | `knowledge_files` for source metadata and extracted text, and `knowledge_chunks` for passages and vectors. |
| Regression runs and builds | MongoDB run records and artifact metadata. Build bytes use the server filesystem. |
| Script history, framework project, and PRD history | Browser storage. |
| Billing and administration | MongoDB subscriptions, usage and webhook collections, customer and plan records, transactions, email logs, and audit events. |

Uploads use temporary server-side files. The Knowledge Base cleans up its temporary upload files after processing. Regression artifact metadata and filesystem storage have separate lifecycles.

## Cross-cutting functions

| Function or component | Responsibility |
| --- | --- |
| `createApiMiddleware` | Route API requests, initialize services, authenticate protected calls, and produce JSON or streamed responses. |
| `connectDb`, `getDb`, `closeDb` | Manage the ForgeQA MongoDB connection and provide database access. |
| `createKnowledgeStore`, `createMongoKnowledgeStore` | Instantiate the MongoDB implementation used by the live Knowledge Base. |
| `sendPasswordResetEmail`, `sendProductKeyEmail`, `sendSupportEmail` | Build and deliver customer emails with Resend or SMTP where available. |
| `api`, `useAppStore` | Handle client HTTP requests, session renewal, and shared browser workspace state. |
| `ErrorBoundary` | Render a fallback when an error reaches the React workspace boundary. |

## Existing verification coverage

- `npm test` runs client and server Vitest suites. Client tests cover the Test Scripts page and code viewer.
- Server tests cover billing logic, model registry and selection, registration approval and email behavior, product key format, QA postprocessing, knowledge indexing, and connectors.
- `npm run typecheck`, `npm run lint`, and `npm run build` are the root package's type, lint, and build entry points.

Sources. [Package scripts](../package.json), [Vite configuration](../vite.config.ts), [Production server](../server/index.js), [HTTP middleware](../server/api.js), [Vercel entry](../api/index.js), [Railway configuration](../railway.json), [Database](../server/db.js), [Email](../server/email/index.js), [API client](../src/lib/api.ts), [License Manager package](../license-manager/package.json).
