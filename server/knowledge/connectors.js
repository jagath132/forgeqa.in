import jwt from 'jsonwebtoken';
import { decryptApiKey, encryptApiKey } from '../auth/service.js';

const STATE_TTL = '10m';
const MAX_DOCUMENTS_PER_SYNC = 100;

function jwtSecret() {
  return process.env.JWT_SECRET || 'forgeqa_dev_jwt_secret_key_change_in_production_2026';
}

function callbackUrl() {
  return `${process.env.APP_URL || 'http://127.0.0.1:5173'}/api/knowledge/connectors/oauth/callback`;
}

const connectorDefinitions = {
  confluence: {
    label: 'Confluence',
    clientIdEnv: 'CONFLUENCE_OAUTH_CLIENT_ID',
    clientSecretEnv: 'CONFLUENCE_OAUTH_CLIENT_SECRET',
    authorizeUrl: 'https://auth.atlassian.com/authorize',
  },
  notion: {
    label: 'Notion',
    clientIdEnv: 'NOTION_OAUTH_CLIENT_ID',
    clientSecretEnv: 'NOTION_OAUTH_CLIENT_SECRET',
    authorizeUrl: 'https://api.notion.com/v1/oauth/authorize',
  },
  googleDrive: {
    label: 'Google Drive',
    clientIdEnv: 'GOOGLE_DRIVE_OAUTH_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_DRIVE_OAUTH_CLIENT_SECRET',
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  },
  github: {
    label: 'GitHub',
    clientIdEnv: 'GITHUB_OAUTH_CLIENT_ID',
    clientSecretEnv: 'GITHUB_OAUTH_CLIENT_SECRET',
    authorizeUrl: 'https://github.com/login/oauth/authorize',
  },
};

export function listConnectorProviders() {
  return Object.entries(connectorDefinitions).map(([id, definition]) => ({
    id,
    label: definition.label,
    configured: Boolean(
      process.env[definition.clientIdEnv] && process.env[definition.clientSecretEnv]
    ),
  }));
}

export function createAuthorizationUrl(provider, userId) {
  const definition = connectorDefinitions[provider];
  if (!definition) throw new Error('Unsupported knowledge connector.');
  const clientId = process.env[definition.clientIdEnv];
  if (!clientId || !process.env[definition.clientSecretEnv]) {
    throw new Error(`${definition.label} OAuth is not configured on this server.`);
  }
  const state = jwt.sign(
    { userId: String(userId), provider, purpose: 'knowledge-connector' },
    jwtSecret(),
    { expiresIn: STATE_TTL }
  );
  const url = new URL(definition.authorizeUrl);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', callbackUrl());
  url.searchParams.set('state', state);
  url.searchParams.set('response_type', 'code');

  if (provider === 'confluence') {
    url.searchParams.set('audience', 'api.atlassian.com');
    url.searchParams.set('scope', 'read:confluence-content.all offline_access');
    url.searchParams.set('prompt', 'consent');
  } else if (provider === 'notion') {
    url.searchParams.set('owner', 'user');
  } else if (provider === 'googleDrive') {
    url.searchParams.set('scope', 'https://www.googleapis.com/auth/drive.readonly');
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');
  } else {
    url.searchParams.set('scope', 'read:user');
  }
  return url.toString();
}

async function readJsonResponse(response, description) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      data.error_description ?? data.message ?? `${description} failed (${response.status}).`
    );
  }
  return data;
}

export async function completeConnectorOAuth({ code, state, authStore }) {
  const statePayload = jwt.verify(state, jwtSecret());
  if (
    statePayload.purpose !== 'knowledge-connector' ||
    !connectorDefinitions[statePayload.provider]
  ) {
    throw new Error('Invalid knowledge connector OAuth state.');
  }
  const provider = statePayload.provider;
  const definition = connectorDefinitions[provider];
  const clientId = process.env[definition.clientIdEnv];
  const clientSecret = process.env[definition.clientSecretEnv];
  const tokenUrl =
    provider === 'notion'
      ? 'https://api.notion.com/v1/oauth/token'
      : provider === 'github'
        ? 'https://github.com/login/oauth/access_token'
        : provider === 'confluence'
          ? 'https://auth.atlassian.com/oauth/token'
          : 'https://oauth2.googleapis.com/token';
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  const body = {
    grant_type: 'authorization_code',
    code,
    redirect_uri: callbackUrl(),
    client_id: clientId,
    client_secret: clientSecret,
  };
  if (provider === 'notion') {
    headers.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
    delete body.client_id;
    delete body.client_secret;
  }
  const tokenResponse = await fetch(tokenUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const tokens = await readJsonResponse(tokenResponse, `${definition.label} authorization`);
  const connection = {
    ...tokens,
    provider,
    connectedAt: new Date().toISOString(),
    expiresAt: tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : null,
  };
  const encrypted = encryptApiKey(JSON.stringify(connection));
  await authStore.saveUserData(statePayload.userId, `knowledge-connector:${provider}`, encrypted);
  return { provider, userId: statePayload.userId };
}

export async function getConnectorConnection(authStore, userId, provider) {
  const encrypted = await authStore.loadUserData(userId, `knowledge-connector:${provider}`);
  if (!encrypted) return null;
  let connection;
  try {
    connection = JSON.parse(decryptApiKey(encrypted.encryptedKey, encrypted.iv, encrypted.authTag));
  } catch {
    throw new Error(
      `Unable to decrypt the ${connectorDefinitions[provider]?.label ?? provider} connection.`
    );
  }
  if (!connection.access_token) throw new Error('Connector access token is missing.');

  if (
    connection.expiresAt &&
    connection.expiresAt < Date.now() + 60_000 &&
    connection.refresh_token &&
    ['googleDrive', 'confluence'].includes(provider)
  ) {
    const definition = connectorDefinitions[provider];
    const response = await fetch(
      provider === 'googleDrive'
        ? 'https://oauth2.googleapis.com/token'
        : 'https://auth.atlassian.com/oauth/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: connection.refresh_token,
          client_id: process.env[definition.clientIdEnv],
          client_secret: process.env[definition.clientSecretEnv],
        }),
      }
    );
    const refreshed = await readJsonResponse(response, `${definition.label} token refresh`);
    connection = {
      ...connection,
      ...refreshed,
      refresh_token: refreshed.refresh_token ?? connection.refresh_token,
      expiresAt: Date.now() + (refreshed.expires_in ?? 3600) * 1000,
    };
    await authStore.saveUserData(
      userId,
      `knowledge-connector:${provider}`,
      encryptApiKey(JSON.stringify(connection))
    );
  }
  return connection;
}

export async function getConnectorStatuses(authStore, userId) {
  const definitions = listConnectorProviders();
  const statuses = await Promise.all(
    definitions.map(async (provider) => {
      const connection = await authStore.loadUserData(userId, `knowledge-connector:${provider.id}`);
      const settings = await authStore.loadUserData(
        userId,
        `knowledge-connector-settings:${provider.id}`
      );
      return {
        ...provider,
        connected: Boolean(connection),
        lastSyncAt: settings?.lastSyncAt ?? null,
        autoSyncMinutes: settings?.autoSyncMinutes ?? 60,
      };
    })
  );
  return statuses;
}

export async function saveConnectorSettings(authStore, userId, provider, autoSyncMinutes) {
  if (!connectorDefinitions[provider]) throw new Error('Unsupported knowledge connector.');
  const allowedIntervals = [0, 15, 30, 60, 360, 1440];
  if (!allowedIntervals.includes(Number(autoSyncMinutes))) {
    throw new Error('Choose a supported auto-sync interval.');
  }
  const settings =
    (await authStore.loadUserData(userId, `knowledge-connector-settings:${provider}`)) ?? {};
  await authStore.saveUserData(userId, `knowledge-connector-settings:${provider}`, {
    ...settings,
    autoSyncMinutes: Number(autoSyncMinutes),
  });
}

async function fetchProviderJson(url, token, provider, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(provider === 'notion' ? { 'Notion-Version': '2022-06-28' } : {}),
      ...(provider === 'github' ? { 'X-GitHub-Api-Version': '2022-11-28' } : {}),
      ...options.headers,
    },
  });
  return readJsonResponse(response, `${connectorDefinitions[provider].label} sync`);
}

async function syncGoogleDrive(token) {
  const params = new URLSearchParams({
    q: "trashed = false and (mimeType = 'application/vnd.google-apps.document' or mimeType = 'text/markdown' or mimeType = 'text/plain')",
    pageSize: String(MAX_DOCUMENTS_PER_SYNC),
    orderBy: 'modifiedTime desc',
    fields: 'files(id,name,mimeType,modifiedTime,webViewLink)',
  });
  const { files = [] } = await fetchProviderJson(
    `https://www.googleapis.com/drive/v3/files?${params}`,
    token,
    'googleDrive'
  );
  const documents = [];
  for (const file of files) {
    const isGoogleDoc = file.mimeType === 'application/vnd.google-apps.document';
    const url = isGoogleDoc
      ? `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}/export?mimeType=text/plain`
      : `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}?alt=media`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok)
      throw new Error(`Google Drive document download failed (${response.status}).`);
    documents.push({
      externalId: file.id,
      externalUrl: file.webViewLink ?? url,
      fileName: file.name,
      fileType: file.name.toLowerCase().endsWith('.md') ? 'markdown' : 'text',
      text: await response.text(),
      modifiedAt: file.modifiedTime,
    });
  }
  return documents;
}

async function syncGitHub(token) {
  const repositories = await fetchProviderJson(
    'https://api.github.com/user/repos?per_page=50&sort=updated',
    token,
    'github'
  );
  const documents = [];
  for (const repository of repositories.filter((item) => !item.private).slice(0, 20)) {
    const branch = repository.default_branch;
    const tree = await fetchProviderJson(
      `https://api.github.com/repos/${encodeURIComponent(repository.full_name)}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
      token,
      'github'
    );
    const markdownFiles = (tree.tree ?? [])
      .filter((item) => item.type === 'blob' && /\.md$/i.test(item.path))
      .slice(0, 10);
    for (const item of markdownFiles) {
      const response = await fetchProviderJson(
        `https://api.github.com/repos/${encodeURIComponent(repository.full_name)}/contents/${item.path
          .split('/')
          .map(encodeURIComponent)
          .join('/')}?ref=${encodeURIComponent(branch)}`,
        token,
        'github'
      );
      if (!response.content) continue;
      documents.push({
        externalId: `${repository.full_name}:${item.path}`,
        externalUrl: response.html_url,
        fileName: `${repository.name}/${item.path}`,
        fileType: 'markdown',
        text: Buffer.from(response.content, 'base64').toString('utf8'),
        modifiedAt: repository.updated_at,
      });
      if (documents.length >= MAX_DOCUMENTS_PER_SYNC) return documents;
    }
  }
  return documents;
}

function notionBlockText(block) {
  const data = block[block.type];
  const richText = data?.rich_text ?? data?.title ?? [];
  return richText.map((part) => part.plain_text ?? '').join('');
}

async function getNotionPageText(token, pageId, depth = 0) {
  if (depth > 2) return '';
  const blocks = await fetchProviderJson(
    `https://api.notion.com/v1/blocks/${encodeURIComponent(pageId)}/children?page_size=100`,
    token,
    'notion'
  );
  const sections = [];
  for (const block of blocks.results ?? []) {
    const text = notionBlockText(block);
    if (text) sections.push(text);
    if (block.has_children) {
      const childText = await getNotionPageText(token, block.id, depth + 1);
      if (childText) sections.push(childText);
    }
  }
  return sections.join('\n');
}

async function syncNotion(token) {
  const search = await fetchProviderJson('https://api.notion.com/v1/search', token, 'notion', {
    method: 'POST',
    body: JSON.stringify({
      page_size: MAX_DOCUMENTS_PER_SYNC,
      filter: { property: 'object', value: 'page' },
    }),
  });
  const documents = [];
  for (const page of search.results ?? []) {
    const title =
      Object.values(page.properties ?? {})
        .find((property) => property.type === 'title')
        ?.title?.map((item) => item.plain_text)
        .join('') || 'Notion page';
    const text = await getNotionPageText(token, page.id);
    if (!text.trim()) continue;
    documents.push({
      externalId: page.id,
      externalUrl: page.url,
      fileName: title,
      fileType: 'text',
      text,
      modifiedAt: page.last_edited_time,
    });
  }
  return documents;
}

function stripHtml(html) {
  return String(html ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|h[1-6]|li|tr|div)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function syncConfluence(token) {
  const resources = await fetchProviderJson(
    'https://api.atlassian.com/oauth/token/accessible-resources',
    token,
    'confluence'
  );
  const resource = resources[0];
  if (!resource?.id) throw new Error('No accessible Confluence site is connected.');
  const documents = [];
  let next = `https://api.atlassian.com/ex/confluence/${encodeURIComponent(resource.id)}/wiki/api/v2/pages?limit=100&body-format=storage`;
  while (next && documents.length < MAX_DOCUMENTS_PER_SYNC) {
    const page = await fetchProviderJson(next, token, 'confluence');
    for (const item of page.results ?? []) {
      const text = stripHtml(item.body?.storage?.value);
      if (!text) continue;
      documents.push({
        externalId: String(item.id),
        externalUrl: item._links?.webui ? `${resource.url}/wiki${item._links.webui}` : resource.url,
        fileName: item.title ?? 'Confluence page',
        fileType: 'text',
        text,
        modifiedAt: item.version?.createdAt ?? item.version?.when ?? null,
      });
      if (documents.length >= MAX_DOCUMENTS_PER_SYNC) break;
    }
    next = page._links?.next
      ? new URL(
          page._links.next,
          `https://api.atlassian.com/ex/confluence/${resource.id}`
        ).toString()
      : null;
  }
  return documents;
}

export async function syncConnectorDocuments(provider, token) {
  if (provider === 'googleDrive') return syncGoogleDrive(token);
  if (provider === 'github') return syncGitHub(token);
  if (provider === 'notion') return syncNotion(token);
  if (provider === 'confluence') return syncConfluence(token);
  throw new Error('Unsupported knowledge connector.');
}

export async function disconnectConnector(authStore, userId, provider) {
  if (!connectorDefinitions[provider]) throw new Error('Unsupported knowledge connector.');
  await authStore.deleteUserData(userId, `knowledge-connector:${provider}`);
  await authStore.deleteUserData(userId, `knowledge-connector-settings:${provider}`);
}
