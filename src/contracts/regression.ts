import type { TestCase } from './testCase';
import type { TestScriptResponse } from './testScript';
import type { AiProvider } from './aiProvider';

export type RegressionPlatform = 'web' | 'mobile';
export type RegressionStatus = 'pending' | 'running' | 'passed' | 'failed' | 'error';

export interface RegressionResult {
  testCaseId: string;
  passed: boolean;
  actualOutput?: string;
  errorMessage?: string;
  screenshot?: string;
}

export interface RegressionRun {
  id: string;
  platform: RegressionPlatform;
  status: RegressionStatus;
  testCases: TestCase[];
  scripts: TestScriptResponse[];
  results: RegressionResult[];
  startedAt: string;
  completedAt?: string;
  buildVersion?: string;
  suiteName?: string;
}

export interface RegressionBuildArtifact {
  id: string;
  platform: 'android' | 'web';
  version: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

export interface RegressionScriptRequest {
  testCases: TestCase[];
  platform: RegressionPlatform;
  framework: string;
  language: string;
  targetUrl?: string;
  provider?: AiProvider;
  apiKey?: string;
  model?: string;
}

export interface RegressionGenerateRequest {
  requirement: string;
  testCases?: TestCase[];
  platform: RegressionPlatform;
  provider?: AiProvider;
  apiKey?: string;
  model?: string;
}
