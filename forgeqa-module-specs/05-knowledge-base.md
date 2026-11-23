# Knowledge Base and Connectors

The Knowledge Base at `/knowledge` makes source documents available for retrieval-augmented test generation. The page supports uploads and SharePoint imports. The PRD Generator can save Markdown to the Knowledge Base, and OAuth connector operations remain available through the API.

## Ingestion and indexing

| Source | Processing |
| --- | --- |
| Upload | Accepts supported PDFs, DOCX documents, XLSX workbooks, JSON, CSV, Markdown, plain text, and supported PNG and JPEG images through multipart upload. The upload middleware allows up to 12 files per request and 25 MiB per file. |
| Structured JSON | Recognizes OpenAPI documents and Postman collections and extracts API entities. JSON parsing redacts recognized secret fields and patterns. |
| Image | Extracts readable text through OCR. |
| SharePoint | Fetches a document from an HTTPS SharePoint URL. The document must be reachable using the supplied URL and its sharing permissions. |
| Saved PRD | Stores generated PRD Markdown through the PRD workflow. |
| OAuth connectors | Syncs documents from Confluence, Notion, Google Drive, and GitHub. GitHub document sync covers public repositories. |

The service stores extracted content and metadata with status `needs_chunking`. Create / Refresh Chunks splits text into sections, builds windows of up to 220 words with a 40-word overlap within each section, and stores replacement chunks. A successful replacement sets the file to `ready`. A file with no usable chunks is marked `failed`. When a compatible embedding provider is unavailable, new chunks are indexed for keyword search and existing ready files retain their index.

For a connector document, the provider and external ID identify the record. Unchanged content is skipped by hash. Changed content clears previous chunks and returns the document to `needs_chunking`. API clients can configure the sync interval and call the due-sync endpoint.

## Search and storage

Search is scoped to the account, with an optional file filter. The ranker uses normalized BM25 lexical scores. When a query embedding is available, the score combines 65% cosine similarity and 35% lexical ranking. Search results can include file name, text excerpt, and relevance score for traceability.

MongoDB stores user-owned metadata and extracted text in `knowledge_files` and the indexed source passages and vectors in `knowledge_chunks`. File deletion removes its chunks. OAuth credentials are encrypted and stored per user.

## API contract

| Method and path | Function |
| --- | --- |
| `GET /api/knowledge/files`, `DELETE /api/knowledge/files/{id}` | List knowledge files or remove a file and its chunks. |
| `POST /api/knowledge/upload`, `POST /api/knowledge/sharepoint` | Upload multipart `files` or import using a SharePoint `url`. |
| `POST /api/knowledge/chunks/refresh`, `GET /api/knowledge/search` | Refresh chunks or search by query, with optional file and result-count filters. |
| `GET /api/knowledge/connectors`, `POST /api/knowledge/connectors/sync-due` | Read connector status and trigger due syncs for the current user. |
| `POST /api/knowledge/connectors/{provider}/authorize`, `GET /api/knowledge/connectors/oauth/callback` | Start and complete OAuth. |
| `POST /api/knowledge/connectors/{provider}/sync`, `POST /api/knowledge/connectors/{provider}/settings`, `DELETE /api/knowledge/connectors/{provider}` | Sync immediately, update the interval, or disconnect. |

Connector IDs are `confluence`, `notion`, `googleDrive`, and `github`. Provider credentials and callback registration requirements are documented in the [connector setup guide](../docs/knowledge-connectors.md).

## Function reference

| Function | Responsibility |
| --- | --- |
| `createKnowledgeService`, `saveExtractedKnowledge` | Coordinate ingestion and persistence and track change detection and indexing state. |
| `processUpload`, `processSharePointUrl`, `syncConnector` | Adapt file, SharePoint, or connector inputs to stored documents. |
| `extractTextFromBuffer`, `chunkText`, `refreshChunks` | Parse supported formats, split documents, embed passages, and replace the stored index. |
| `searchChunks`, `rankChunks` | Prepare search input and rank eligible chunks. |
| `createAuthorizationUrl`, `completeConnectorOAuth`, `syncConnectorDocuments` | Authorize provider access and retrieve source documents. |
| `getConnectorStatuses`, `saveConnectorSettings`, `disconnectConnector` | Read or change the connector's account-level settings. |

Sources. [Knowledge Base screen](../src/pages/KnowledgeBase.tsx), [Knowledge service](../server/knowledge/service.js), [Parsers](../server/knowledge/parsers.js), [Chunker](../server/knowledge/chunker.js), [Ranking](../server/knowledge/search.js), [Connector service](../server/knowledge/connectors.js), [MongoDB store](../server/storage/mongoStore.js), [Main API](../server/api.js).
