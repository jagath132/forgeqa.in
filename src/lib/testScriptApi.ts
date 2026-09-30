import {
  api,
  type TestScriptRequest,
  type TestScriptResponse,
  type GenerateFrameworkRequest,
  type FrameworkProjectResponse,
  type AiDiagnosisRequest,
  type AiDiagnosisResponse,
} from './api';

export function generateTestScript(payload: TestScriptRequest) {
  return api.post<TestScriptResponse>('/api/generate-test-scripts', payload);
}

export function generateFrameworkProject(payload: GenerateFrameworkRequest) {
  return api.post<FrameworkProjectResponse>('/api/test-scripts/generate-framework', payload);
}

export const generatePlaywrightFramework = generateFrameworkProject;

export function diagnoseTestFailure(payload: AiDiagnosisRequest) {
  return api.post<AiDiagnosisResponse>('/api/test-scripts/ai-diagnose', payload);
}
