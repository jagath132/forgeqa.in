export type AiProvider = 'gemini' | 'openai' | 'claude' | 'openrouter' | 'opencode' | 'groq';

export type GeminiModel = 'gemini-2.0-flash' | 'gemini-2.5-flash';

export type ProviderKeyMap = Partial<Record<AiProvider, boolean>>;

export interface AiModelConfig {
  provider: AiProvider;
  model?: string;
  apiKey?: string;
  temperature?: number;
}

export interface IAiProviderAdapter {
  provider: AiProvider;
  generateText(prompt: string, config?: AiModelConfig): Promise<string>;
  generateStream?(
    prompt: string,
    config: AiModelConfig,
    onChunk: (chunk: string) => void
  ): Promise<string>;
  validateKey?(apiKey: string): Promise<boolean>;
}
