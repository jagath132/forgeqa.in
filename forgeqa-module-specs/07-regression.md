# Regression Testing

Regression at `/regression` generates regression cases and scripts, stores run records, and tracks uploaded builds and webhook settings. The current execution endpoint returns HTTP 501 for an existing run and leaves its results unchanged.

## Functional specification

| Area | Inputs and behavior |
| --- | --- |
| Regression matrix | Accepts a requirement of at least 10 characters, provider, model override, web or mobile target, and optional existing cases. Returns cases and a summary. |
| Regression scripts | Accepts cases, provider, target platform, framework, language, and URL. The API defaults to Playwright for web, Appium for mobile, and TypeScript. |
| Run records | Creates a `pending` run from platform and selected cases. Stores optional suite and build labels, start and completion timestamps, and initially empty script and result arrays. |
| Run list and detail | Retrieves account-scoped run records. Results can carry test case IDs, pass flags, output, error messages, and screenshot fields when populated. |
| Build artifacts | Accepts a multipart file with a platform and version. The build UI offers web and Android. Artifact bytes use filesystem storage and metadata uses MongoDB. |
| Webhook settings | Saves one URL per user and platform. URLs must pass HTTPS and host validation. The settings endpoint stores the URL. The separate webhook test panel performs a manual request. |

The run contract supports `pending`, `running`, `passed`, `failed`, and `error`. For an unknown run ID the execution handler returns 404. For a known run it reports that an execution backend is unavailable.

## API contract

| Method and path | Operation |
| --- | --- |
| `POST /api/regression/generate` | Generate a regression matrix. |
| `POST /api/regression/scripts` | Generate a regression script and return it in a `scripts` array. |
| `GET/POST /api/regression/runs` | List runs or create a pending run. |
| `GET /api/regression/runs/{id}`, `POST /api/regression/runs/{id}/execute` | Read a run or request execution. |
| `POST /api/regression/builds/upload`, `GET /api/regression/builds/latest/{platform}` | Upload a build or get the latest build metadata for a platform. |
| `GET/POST /api/regression/builds/webhook` | List saved webhook settings or save a platform URL. |

## Function reference

| Function | Responsibility |
| --- | --- |
| `generateRegressionTestCases`, `generateRegressionScripts` | Build platform-specific provider requests and return generated cases or scripts. |
| `createRun`, `listRuns`, `getRun`, `updateRun` | Manage account-owned entries in `regression_runs`. The current execute handler does not call `updateRun`. |
| `storeBuildArtifact`, `getLatestBuild` | Write the file and use `regression_builds` for metadata and latest-build lookup. |
| `validateWebhookUrl`, `saveWebhook`, `getWebhooks` | Validate and persist settings in `regression_webhooks`. |
| `RegressionRunner`, `RegressionResultsTable`, `useRegressionStore` | Display the selected run, request execution, and present available run results. |

Sources. [Regression screen](../src/pages/RegressionPage.tsx), [Runner](../src/components/RegressionRunner.tsx), [Build manager](../src/components/RegressionBuildManager.tsx), [Webhook test panel](../src/components/WebhookTestPanel.tsx), [Main API](../server/api.js), [Run repository](../server/regression/runs.js), [Build and webhook storage](../server/regression/builds.js).
