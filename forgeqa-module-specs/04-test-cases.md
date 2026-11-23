# Test Case Generation and Management

The Test Case Generator at `/generator` turns requirement text into a test matrix. Users can refine the matrix, inspect coverage, export cases, or pass selected cases to the automation module.

## Generation and refinement

1. Enter a requirement of at least 10 characters and select an AI provider. The UI offers standard steps or Gherkin, with optional test design techniques.
2. The API checks AI usage limits, resolves the provider and model, and searches the signed-in user's Knowledge Base for up to four relevant chunks.
3. The generator builds a prompt from requirement text, retrieved context, and generation options. The streaming endpoint sends progress and token events, followed by a complete result or an error.
4. The server extracts requirement references, normalizes Gherkin steps when selected, and merges similar cases and steps when embeddings are available. The default similarity threshold is 0.92. The server assigns sequential case IDs and builds a traceability map. The response can include warnings when embedding-based merging is unavailable.
5. The page presents the matrix, its coverage information, and any retrieved source excerpts. Refinement sends the current cases, original requirement, and a new instruction to the API.

A case contains a test case ID, category, summary, test description, step list, and expected result. Categories cover positive, negative, validation, and edge cases. A case can also carry a draft, reviewed, or approved status and a list of requirement IDs. Each traceability row contains the requirement ID and text, the matching case IDs, and a flag indicating whether any case covers the requirement.

## History, exports, and suites

- The current result and generation history are cached in the browser and synchronized through account APIs. The browser store keeps up to 50 history entries.
- The matrix supports row selection and provides Excel and PDF exports. Gherkin results can be exported as a feature file.
- Suite storage accepts a user-owned list over `/api/user/suites`. Suite records contain identifying metadata and test case references. The repository contains dedicated Test Cases and Suites components, with active generation and review available through `/generator`.

## API contract

| Method and path | Inputs and outputs |
| --- | --- |
| `POST /api/generate-test-cases` | Accepts requirement, provider, and generation options. Returns a JSON matrix with summary, cases, and available knowledge and traceability metadata. |
| `POST /api/generate-test-cases/stream` | Accepts similar inputs and emits `phase`, `token`, `complete`, and `error` events as applicable. |
| `POST /api/generate-test-cases/refine` | Requires an existing matrix, its requirement, and a refinement instruction. Returns the refined matrix and traceability. |
| `GET/POST /api/history` | Reads or replaces the signed-in user's list of saved generation results. |
| `GET/POST /api/qa-result` | Reads or replaces the current result. |
| `GET/POST /api/user/suites` | Reads or replaces the signed-in user's suite list. |

## Function reference

| Function | Responsibility |
| --- | --- |
| `handleGenerate`, `handleStreamingGenerate`, `handleRefine` | Submit generation or refinement and update the visible matrix. |
| `buildQaPrompt`, `buildQaRefinementPrompt` | Build the initial or refinement prompt. |
| `extractRequirements`, `normalizeGherkinSteps`, `deduplicateTestCases`, `buildTraceability` | Identify requirement references, normalize output, merge duplicate cases, and map cases to requirements. |
| `finalizeQaResult` | Combine the postprocessing steps and attach warnings and traceability. |
| `setQaResult`, `addToHistory`, `deleteHistoryItem`, `clearHistory` | Manage and synchronize the current matrix and history. |
| `exportExcel`, `exportPdf`, `exportGherkin` | Convert selected or displayed matrix data to downloadable formats. |

Sources. [Generator](../src/pages/GeneratorPage.tsx), [Test case table](../src/components/TestCaseTable.tsx), [Browser API and types](../src/lib/api.ts), [Workspace store](../src/store/useAppStore.ts), [Generation routes](../server/api.js), [QA postprocessing](../server/ai/qa.js), [Prompt and JSON helpers](../server/ai/gemini.js).
