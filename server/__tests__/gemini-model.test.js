import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateWithGemini } from '../ai/gemini.js';

describe('Gemini model selection', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('accepts a model registry entry instead of requiring a string', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: '{"result":"ok"}' }] } }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await generateWithGemini({
      apiKey: 'test-key',
      prompt: 'test prompt',
      model: { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    });

    expect(result).toEqual({ result: 'ok' });
    expect(fetchMock.mock.calls[0][0]).toContain('/models/gemini-2.0-flash:generateContent');
  });

  it('falls back to the default model when the selection has no model identifier', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: '{"result":"ok"}' }] } }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      generateWithGemini({
        apiKey: 'test-key',
        prompt: 'test prompt',
        model: { label: 'Gemini 2.0 Flash' },
      })
    ).resolves.toEqual({ result: 'ok' });

    expect(fetchMock.mock.calls[0][0]).toContain('/models/gemini-2.0-flash:generateContent');
  });
});
