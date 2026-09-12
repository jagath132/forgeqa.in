export type TestCaseCategory =
  | 'Positive'
  | 'Negative'
  | 'Validation'
  | 'Validation checks'
  | 'Edge'
  | 'Edge cases';

export type TestCaseStatus = 'draft' | 'reviewed' | 'approved';

export interface TestCase {
  tcId: string;
  category: TestCaseCategory;
  summary: string;
  testDescription: string;
  testSteps: string[];
  expected: string;
  status?: TestCaseStatus;
}

export interface TestCaseDraft {
  category: TestCaseCategory;
  summary: string;
  testDescription: string;
  testSteps: string[];
  expected: string;
}

export interface QaResponse {
  summary: string;
  testCases: TestCase[];
  knowledgeContext?: Array<{
    fileName: string;
    chunkText: string;
    score: number;
  }>;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  requirement: string;
  result: QaResponse;
}
