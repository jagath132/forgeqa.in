import { afterEach, describe, expect, it, vi } from 'vitest';
import { cosineSimilarity, createEmbeddings } from '../ai/embeddings.js';
import {
  buildTraceability,
  deduplicateTestCases,
  extractRequirements,
  normalizeGherkinSteps,
} from '../ai/qa.js';
import { buildQaPrompt } from '../ai/gemini.js';
import { chunkText } from '../knowledge/chunker.js';
import { createAuthorizationUrl } from '../knowledge/connectors.js';
import { extractTextFromBuffer } from '../knowledge/parsers.js';
import { rankChunks } from '../knowledge/search.js';
import { createKnowledgeService } from '../knowledge/service.js';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('QA generation enhancements', () => {
  it('adds preset guidance, BDD instructions, and requirement IDs to the prompt', () => {
    const prompt = buildQaPrompt(
      'Email is required.\nPassword must be at least 12 characters.',
      [],
      {
        format: 'gherkin',
        techniques: ['equivalence', 'boundary', 'state', 'pairwise'],
        requirements: [
          { id: 'R1', text: 'Email is required.' },
          { id: 'R2', text: 'Password must be at least 12 characters.' },
        ],
      }
    );

    expect(prompt).toContain('Given, When, Then');
    expect(prompt).toContain('Equivalence Partitioning');
    expect(prompt).toContain('Boundary Value Analysis');
    expect(prompt).toContain('State Transition');
    expect(prompt).toContain('Pairwise Combinatorial');
    expect(prompt).toContain('R1: Email is required.');
  });

  it('extracts requirement lines and builds a coverage matrix', () => {
    const requirements = extractRequirements('- Email is required\n- Password is validated');
    const matrix = buildTraceability(requirements, [{ tcId: 'TC_001', requirementIds: ['R1'] }]);

    expect(matrix).toEqual([
      { id: 'R1', text: 'Email is required', caseIds: ['TC_001'], covered: true },
      { id: 'R2', text: 'Password is validated', caseIds: [], covered: false },
    ]);
  });

  it('normalizes BDD output to valid Gherkin keywords without list numbering', () => {
    const [testCase] = normalizeGherkinSteps([
      {
        testSteps: [
          '1. User enters a valid email',
          'User submits the form',
          'Then a session starts',
        ],
      },
    ]);

    expect(testCase.testSteps).toEqual([
      'Given User enters a valid email',
      'When User submits the form',
      'Then a session starts',
    ]);
  });

  it('merges semantically duplicate cases and steps using vectors', () => {
    const result = deduplicateTestCases(
      [
        {
          tcId: 'TC_001',
          summary: 'Sign in',
          requirementIds: ['R1'],
          testSteps: ['Given an account', 'When submitting'],
        },
        {
          tcId: 'TC_002',
          summary: 'Authenticate user',
          requirementIds: ['R2'],
          testSteps: ['Given a valid account'],
        },
      ],
      {
        caseVectors: [
          [1, 0],
          [1, 0],
        ],
        stepVectors: [
          [0, 1],
          [1, 0],
          [0, 1],
        ],
        stepOffsets: [0, 2],
      },
      0.9
    );

    expect(result).toHaveLength(1);
    expect(result[0].tcId).toBe('TC_001');
    expect(result[0].requirementIds).toEqual(['R1', 'R2']);
    expect(result[0].testSteps).toEqual(['Given an account', 'When submitting']);
  });

  it('batches OpenAI-compatible embedding requests and validates the response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [
            { index: 0, embedding: [1, 0] },
            { index: 1, embedding: [0, 1] },
          ],
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    const vectors = await createEmbeddings({
      apiKey: 'test-key',
      provider: 'openai',
      inputs: ['first', 'second'],
    });

    expect(vectors).toEqual([
      [1, 0],
      [0, 1],
    ]);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.openai.com/v1/embeddings');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).model).toBe('text-embedding-3-small');
  });
});

describe('Knowledge indexing and connectors', () => {
  it('splits documents along markdown sections and keeps API entities attached', () => {
    const chunks = chunkText(
      `# Checkout\n\n${'Payment requirement details. '.repeat(12)}\n\n## POST /orders\n\n${'Validate order payload and return a documented status. '.repeat(8)}`,
      {
        entities: [{ type: 'api_endpoint', method: 'POST', path: '/orders' }],
      }
    );

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.some((chunk) => chunk.section === '## POST /orders')).toBe(true);
    expect(chunks.find((chunk) => chunk.section === '## POST /orders')?.entity).toMatchObject({
      method: 'POST',
      path: '/orders',
    });
  });

  it('extracts OpenAPI endpoints, parameters, payloads, and response codes', async () => {
    const document = {
      openapi: '3.0.3',
      info: { title: 'Orders API' },
      paths: {
        '/orders': {
          post: {
            operationId: 'createOrder',
            parameters: [{ name: 'idempotency-key', in: 'header', required: true }],
            requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
            responses: { 201: { description: 'Created' } },
          },
        },
      },
    };
    const parsed = await extractTextFromBuffer(Buffer.from(JSON.stringify(document)), {
      fileName: 'orders.json',
      fileType: 'json',
    });

    expect(parsed.fileType).toBe('openapi');
    expect(parsed.entities[0]).toMatchObject({
      type: 'api_endpoint',
      method: 'POST',
      path: '/orders',
      operationId: 'createOrder',
      parameters: [{ name: 'idempotency-key', in: 'header', required: true }],
      responses: [{ status: '201', description: 'Created' }],
    });
    expect(parsed.text).toContain('Request payload');
  });

  it('extracts nested Postman requests into endpoint entities', async () => {
    const parsed = await extractTextFromBuffer(
      Buffer.from(
        JSON.stringify({
          info: { name: 'Store API' },
          item: [
            {
              name: 'Orders',
              item: [
                {
                  name: 'Create order',
                  request: {
                    method: 'POST',
                    url: {
                      raw: 'https://api.example.test/orders?access_token=secret-query-token',
                      query: [{ key: 'dryRun' }, { key: 'api_key', value: 'secret-query-key' }],
                    },
                    body: { mode: 'raw', raw: '{"password":"secret-password","items":[]}' },
                  },
                  response: [{ code: 201, name: 'Created' }],
                },
              ],
            },
          ],
        })
      ),
      { fileName: 'store.postman_collection.json', fileType: 'json' }
    );

    expect(parsed.fileType).toBe('postman');
    expect(parsed.entities[0]).toMatchObject({
      method: 'POST',
      path: 'https://api.example.test/orders?access_token=[REDACTED]',
      parameters: [
        { name: 'dryRun', value: '', description: '', disabled: undefined },
        { name: 'api_key', value: '[REDACTED]', description: '', disabled: undefined },
      ],
      responses: [{ status: 201, name: 'Created' }],
    });
    expect(JSON.stringify(parsed.entities[0])).not.toContain('secret-password');
    expect(JSON.stringify(parsed.entities[0])).not.toContain('secret-query-key');
  });

  it('ranks vector matches with hybrid semantic and keyword scoring', () => {
    const results = rankChunks(
      [
        { id: 'semantic', chunk_text: 'User authentication and access control', embedding: [1, 0] },
        { id: 'keyword', chunk_text: 'Login email validation', embedding: [0, 1] },
      ],
      'sign-in workflow',
      2,
      [1, 0]
    );

    expect(results[0].id).toBe('semantic');
    expect(results[0].score).toBeGreaterThan(0);
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
  });

  it('upserts connector documents without re-indexing unchanged content', async () => {
    const files = [];
    let createCount = 0;
    const store = {
      async findFileByExternalId(sourceType, externalId) {
        const file = files.find(
          (item) => item.source_type === sourceType && item.external_id === externalId
        );
        return file
          ? { id: file.id, content_hash: file.content_hash, modified_at: file.modified_at }
          : null;
      },
      async createFile(file) {
        createCount += 1;
        const created = { id: `file-${createCount}`, ...file };
        files.push(created);
        return created;
      },
      async updateFile(id, patch) {
        const file = files.find((item) => item.id === id);
        Object.assign(file, patch);
        return file;
      },
      async clearFileChunks() {},
    };
    const service = createKnowledgeService(store);
    const document = {
      externalId: 'doc-1',
      fileName: 'Product Guide',
      fileType: 'markdown',
      text: '# Product\n\nThe product supports checkout.',
    };

    expect(await service.syncConnector('notion', [document], 'user-1')).toHaveLength(1);
    expect(await service.syncConnector('notion', [document], 'user-1')).toEqual([]);
    expect(createCount).toBe(1);
  });

  it('builds OAuth authorization URLs with a signed state and least-privilege GitHub scope', () => {
    vi.stubEnv('GITHUB_OAUTH_CLIENT_ID', 'client-id');
    vi.stubEnv('GITHUB_OAUTH_CLIENT_SECRET', 'client-secret');
    vi.stubEnv('APP_URL', 'https://forgeqa.example.test');
    const authorizationUrl = new URL(createAuthorizationUrl('github', 'user-123'));

    expect(authorizationUrl.origin).toBe('https://github.com');
    expect(authorizationUrl.searchParams.get('scope')).toBe('read:user');
    expect(authorizationUrl.searchParams.get('redirect_uri')).toBe(
      'https://forgeqa.example.test/api/knowledge/connectors/oauth/callback'
    );
    expect(authorizationUrl.searchParams.get('state')).toBeTruthy();
  });
});
