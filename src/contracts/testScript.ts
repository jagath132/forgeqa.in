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

export interface FrameworkFile {
  path: string;
  content: string;
  language: string;
}

export interface FrameworkProjectResponse {
  projectName: string;
  framework: TestingFramework;
  language: ScriptLanguage;
  targetUrl: string;
  testCasesCount: number;
  files: FrameworkFile[];
}

export interface GenerateFrameworkRequest {
  testCaseIds: string[];
  testCases: TestCase[];
  provider?: AiProvider;
  targetUrl: string;
  apiKey?: string;
  model?: string;
  options?: {
    projectName?: string;
    headless?: boolean;
    viewport?: { width: number; height: number };
  };
}

export interface AiDiagnosisRequest {
  errorLog: string;
  failedLocator?: string;
  targetUrl?: string;
  testCaseSummary?: string;
  provider?: AiProvider;
  apiKey?: string;
  model?: string;
}

export interface AiDiagnosisResponse {
  rootCause: string;
  category:
    | 'LOCATOR_MISMATCH'
    | 'TIMED_OUT'
    | 'FLAKY_NETWORK'
    | 'APPLICATION_BUG'
    | 'ASSERTION_FAILURE';
  isFlaky: boolean;
  confidenceScore: number;
  healedLocator?: string;
  suggestedFix: string;
  preventionAdvice: string;
}
