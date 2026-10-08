import { describe, expect, it } from 'vitest';
import { normalizeModelId } from '../ai/modelRegistry.js';

describe('normalizeModelId', () => {
  it.each([
    ['gemini-2.0-flash', 'gemini-2.0-flash'],
    [{ id: 'gpt-4o-mini', label: 'GPT-4o Mini' }, 'gpt-4o-mini'],
    [{ model: 'claude-3-5-sonnet', label: 'Claude' }, 'claude-3-5-sonnet'],
    [{ value: 'llama-3.3-70b-versatile' }, 'llama-3.3-70b-versatile'],
    [{ name: 'openai/gpt-4o-mini' }, 'openai/gpt-4o-mini'],
    [{ label: 'No model identifier' }, null],
    [null, null],
    [42, null],
    ['', null],
  ])('normalizes %j to %j', (input, expected) => {
    expect(normalizeModelId(input)).toBe(expected);
  });
});
