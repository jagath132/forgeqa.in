# Knowledge Base connectors

ForgeQA supports OAuth connections to Confluence, Notion, Google Drive, and
GitHub. Configure each connector's OAuth client ID and secret in the server
environment (`.env.example` lists the variables). Register this exact callback
URL with each OAuth application:

```text
${APP_URL}/api/knowledge/connectors/oauth/callback
```

`APP_URL` must be the public ForgeQA origin that serves both the application and
the `/api` routes. OAuth access and refresh tokens are encrypted with
`ENCRYPTION_SECRET` before being stored per user. Keep the client secrets,
`JWT_SECRET`, and `ENCRYPTION_SECRET` private.

Required OAuth permissions are Confluence content read, Notion page read, Google
Drive read-only, and GitHub profile read. GitHub sync is limited to public
repositories so it does not request broad private-repository access. The first
sync indexes at most 100 documents per connector; GitHub sync scans up to 20
recently updated repositories and indexes up to 10 Markdown files per repository.

Auto-sync defaults to hourly and checks for due work while the Knowledge Base
page is open. Choose a different interval or turn it off in the connector card.
Semantic indexing additionally requires a configured Gemini, OpenAI, or
OpenRouter provider with embedding support. Connector documents can be synced
first and indexed later from **Create / Refresh Chunks**.
