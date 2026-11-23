# PRD Generation

The PRD Generator turns feature notes or a website inventory into a Markdown product requirements document. Generated PRDs can become Knowledge Base sources for downstream test case generation.

## Inputs and workflow

| Mode | Inputs | Processing and output |
| --- | --- | --- |
| From Text | Product name, module name, and at least 15 characters of feature details, with the selected AI provider and optional model | Generates a Markdown PRD from a structured prompt. |
| From URL | Target URL, optional login credentials and focus, and the selected AI provider | Inspects accessible pages and extracts structural information such as headings, forms, buttons, and visible text. Generates a PRD from the crawl report. |

The URL workflow requests a crawl of up to 20 pages. It uses browser-based exploration when Playwright is available and falls back to HTTP extraction when browser exploration is unavailable or fails. Login and dynamic-page coverage depend on the browser path and the behavior of the target site. The crawl report accompanies the completed URL generation result.

Both generation endpoints stream Server-Sent Events. `phase` indicates progress, `token` appends content, `complete` delivers the full PRD, and `error` reports a generation failure after streaming begins. Both generation paths check AI generation quota and record consumption on success.

## Review, reuse, and persistence

- The result can be copied or downloaded. The UI offers Markdown, PDF, and Word output. The Word endpoint converts Markdown into a DOCX buffer.
- PRD history supports restoring, copying, downloading, and removing entries. The application store keeps this history in browser storage.
- Saving to Knowledge stores the text as a Markdown knowledge file. Run Create / Refresh Chunks in the Knowledge Base to make the document available for indexed retrieval.

## API contract

| Method and path | Function |
| --- | --- |
| `POST /api/prd/generate-from-text` | Stream a PRD from product and module details. |
| `POST /api/prd/generate-from-url` | Inspect a website and stream a PRD. The completion event includes `prdText` and `crawlReport`. |
| `POST /api/prd/save-to-knowledge` | Store `prdText` and an optional file name as a knowledge document. |
| `POST /api/prd/export` | Return a Word attachment for the submitted PRD text and file name. |

## Function reference

| Function | Responsibility |
| --- | --- |
| `handleGenerateFromText`, `handleGenerateFromUrl` | Submit the selected generation mode and consume the event stream. |
| `buildPrdPromptFromText`, `buildPrdPromptFromCrawl` | Construct prompts from notes or structured page observations. |
| `crawlWebApp` | Build the page inventory and report crawl and login metadata. |
| `generatePrdStream` | Dispatch the request to the selected provider and relay generated tokens. |
| `convertMarkdownToDocx` | Convert supported Markdown structures to a formatted Word document. |
| `addToPrdHistory`, `deletePrdHistoryItem`, `clearPrdHistory` | Manage browser-stored generation history. |
| `savePrdToKnowledge`, `exportPrdAsDocx` | Call the knowledge-save and Word-export endpoints. |

Sources. [PRD screen](../src/pages/PrdGeneratorPage.tsx), [PRD generator](../server/prd/generator.js), [Page crawler](../server/prd/crawler.js), [Word exporter](../server/prd/export.js), [Main API](../server/api.js), [Workspace store](../src/store/useAppStore.ts).
