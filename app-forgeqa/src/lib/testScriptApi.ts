import { api, type TestScriptRequest, type TestScriptResponse } from "./api";

export function generateTestScript(payload: TestScriptRequest) {
  return api.post<TestScriptResponse>("/api/generate-test-scripts", payload);
}
