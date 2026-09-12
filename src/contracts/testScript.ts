import type { TestCase } from './testCase';
import type { AiProvider } from './aiProvider';

export type TestingFramework = 'playwright' | 'cypress' | 'selenium' | 'puppeteer';
export type ScriptLanguage = 'javascript' | 'typescript' | 'python' | 'java' | 'csharp';

export interface TestScriptOptions {
  headless: boolean;
  viewport: { width: number; height: number };
}

export interface TestScriptRequest {
  testCaseIds: string[];
  testCases: TestCase[];
  framework: TestingFramework;
  language: ScriptLanguage;
  provider?: AiProvider;
  targetUrl: string;
  apiKey?: string;
  model?: string;
  options: TestScriptOptions;
}

export interface TestScriptResponse {
  script: string;
  framework: TestingFramework;
  language: ScriptLanguage;
  fileName: string;
  testCases: TestCase[];
}
