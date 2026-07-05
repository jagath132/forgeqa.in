import type { HistoryItem, TestCase, QaResponse, KnowledgeChunk } from "./api";
import { api } from "./api";

/* ═══════════════════════════════════════════════════════════════════════════
   SAMPLE DATA SEED — ForgeQA Test Data
   ─────────────────────────────────────────────────────────────────────────
   All data is realistic but clearly identifiable as test data.
   All IDs are prefixed with "TEST_" so they can be purged before launch.
   Data is stored server-side via API calls.
   ═══════════════════════════════════════════════════════════════════════════ */

const SEEDED_KEY = "forgeqa_seeded";

/* ── Sample Test Cases ── */
const SAMPLE_TEST_CASES: TestCase[] = [
  {
    tcId: "TC_001",
    category: "Positive",
    summary: "Successful user login with valid credentials",
    testDescription: "Verify that a user can log in using a registered email and correct password.",
    testSteps: [
      "Navigate to the login page",
      "Enter valid email address",
      "Enter correct password",
      "Click the Login button",
    ],
    expected: "User is redirected to the dashboard and session token is stored.",
    status: "approved",
  },
  {
    tcId: "TC_002",
    category: "Negative",
    summary: "Login failure with invalid password",
    testDescription: "Verify that the system rejects login attempts with incorrect passwords.",
    testSteps: [
      "Navigate to the login page",
      "Enter valid email address",
      "Enter incorrect password",
      "Click the Login button",
    ],
    expected: "Error message 'Invalid credentials' is displayed and no session is created.",
    status: "reviewed",
  },
  {
    tcId: "TC_003",
    category: "Validation",
    summary: "Email format validation on registration",
    testDescription: "Verify that the registration form validates email format before submission.",
    testSteps: [
      "Navigate to the registration page",
      "Enter an invalid email like 'not-an-email'",
      "Click the Submit button",
    ],
    expected: "Inline validation error 'Please enter a valid email address' is shown.",
    status: "approved",
  },
  {
    tcId: "TC_004",
    category: "Edge",
    summary: "Password field maximum length handling",
    testDescription: "Verify that the password field enforces maximum character limits.",
    testSteps: [
      "Navigate to the registration page",
      "Enter a password exceeding 128 characters",
      "Observe field behavior",
    ],
    expected: "Input is truncated or an error indicates the password exceeds maximum length.",
    status: "draft",
  },
  {
    tcId: "TC_005",
    category: "Positive",
    summary: "Successful test case generation from requirement",
    testDescription: "Verify that the AI generates a valid test matrix from a user requirement.",
    testSteps: [
      "Log in to the dashboard",
      "Navigate to the Generator page",
      "Enter a valid requirement (min 10 chars)",
      "Click Generate",
    ],
    expected: "A test matrix with multiple test cases is displayed within 30 seconds.",
    status: "approved",
  },
  {
    tcId: "TC_006",
    category: "Validation checks",
    summary: "API key validation for AI provider",
    testDescription: "Verify that the system validates the format of the API key before saving.",
    testSteps: [
      "Navigate to Settings > Integrations",
      "Select an AI provider",
      "Enter an API key that does not match the expected format",
      "Click Save",
    ],
    expected: "Error message indicating invalid API key format is displayed.",
    status: "reviewed",
  },
  {
    tcId: "TC_007",
    category: "Positive",
    summary: "Export test cases to CSV",
    testDescription: "Verify that generated test cases can be exported as a CSV file.",
    testSteps: [
      "Generate or load test cases",
      "Click the Export button",
      "Select CSV format",
      "Confirm download",
    ],
    expected: "A CSV file is downloaded containing all test case fields.",
    status: "approved",
  },
  {
    tcId: "TC_008",
    category: "Negative",
    summary: "Upload unsupported file type to Knowledge Base",
    testDescription: "Verify that the system rejects non-supported file types.",
    testSteps: [
      "Navigate to Knowledge Base",
      "Try to upload a .exe file",
    ],
    expected: "Error toast 'Unsupported file type' is displayed and no upload occurs.",
    status: "draft",
  },
  {
    tcId: "TC_009",
    category: "Edge",
    summary: "Empty requirement submission",
    testDescription: "Verify that the generator rejects empty or whitespace-only requirements.",
    testSteps: [
      "Navigate to Generator",
      "Leave the requirement field empty or type only spaces",
      "Click Generate",
    ],
    expected: "Generate button remains disabled or shows validation error.",
    status: "approved",
  },
  {
    tcId: "TC_010",
    category: "Positive",
    summary: "Create and save a test suite",
    testDescription: "Verify that users can create a new test suite and assign test cases to it.",
    testSteps: [
      "Navigate to Test Collections",
      "Click Create Suite",
      "Enter name and description",
      "Select test cases to include",
      "Save the suite",
    ],
    expected: "Suite is created and appears in the suite list with correct case count.",
    status: "reviewed",
  },
  {
    tcId: "TC_011",
    category: "Validation",
    summary: "Billing plan upgrade flow",
    testDescription: "Verify that upgrading from Free to Pro redirects to the payment gateway.",
    testSteps: [
      "Navigate to Settings > Billing",
      "Click Upgrade to Pro",
      "Verify the upgrade modal appears",
      "Click Proceed to Payment",
    ],
    expected: "User is redirected to the Stripe/Razorpay checkout page.",
    status: "draft",
  },
  {
    tcId: "TC_012",
    category: "Edge",
    summary: "Concurrent session handling",
    testDescription: "Verify behavior when a user is logged in from two browsers simultaneously.",
    testSteps: [
      "Log in from Browser A",
      "Log in from Browser B with same credentials",
      "Perform an action in Browser A",
    ],
    expected: "Both sessions remain active unless session limit is enforced.",
    status: "draft",
  },
];

/* ── Sample Knowledge Chunks ── */
const SAMPLE_KNOWLEDGE_CONTEXT: KnowledgeChunk[] = [
  {
    fileName: "login-api-spec.pdf",
    chunkText: "The /api/auth/login endpoint accepts POST requests with { email, password } and returns a JWT token on success.",
    score: 0.95,
  },
  {
    fileName: "ui-guidelines.docx",
    chunkText: "All form fields must include client-side validation with clear error messages. Password fields must enforce minimum 8 characters.",
    score: 0.88,
  },
  {
    fileName: "test-strategy.csv",
    chunkText: "Regression testing should cover authentication, payment flows, and API integrations before each major release.",
    score: 0.82,
  },
];

/* ── Sample QaResponse ── */
const SAMPLE_QA_RESPONSE: QaResponse = {
  summary: "User Authentication & Registration — Test Matrix",
  testCases: SAMPLE_TEST_CASES,
  knowledgeContext: SAMPLE_KNOWLEDGE_CONTEXT,
};

/* ── Generate History Items Across 14 Days ── */
function generateSampleHistory(): HistoryItem[] {
  const requirements = [
    "User login and registration flow with email validation and password strength checks",
    "Payment checkout integration with Stripe for Pro plan upgrades",
    "Knowledge base file upload supporting PDF, DOCX, CSV, and TXT formats",
    "Test case generation from natural language requirements using AI",
    "Dashboard metrics display showing test coverage and generation trends",
    "Team member invitation and role-based access control system",
    "Regression test runner with automated pass/fail reporting",
    "Export functionality for test matrices in CSV and PDF formats",
    "AI provider selection and API key management in settings",
    "Global search across test cases, scripts, and knowledge entries",
  ];

  const summaries = [
    "Authentication Flow — Full Test Matrix",
    "Payment Integration — Stripe Checkout Tests",
    "Knowledge Base Upload — Multi-format Support",
    "AI Test Generation — Quality Validation",
    "Dashboard Metrics — Display Accuracy Tests",
    "Team Management — RBAC Validation",
    "Regression Runner — Execution Pipeline",
    "Export Module — CSV & PDF Generation",
    "AI Provider Settings — Key Management",
    "Global Search — Cross-module Query Tests",
  ];

  const items: HistoryItem[] = [];
  const now = Date.now();

  for (let i = 0; i < 10; i++) {
    const daysAgo = Math.floor(Math.random() * 14);
    const timestamp = new Date(now - daysAgo * 86400000 - i * 3600000).toISOString();
    const startIdx = (i * 3) % SAMPLE_TEST_CASES.length;
    const cases = SAMPLE_TEST_CASES.slice(startIdx, startIdx + 4).map((tc, idx) => ({
      ...tc,
      tcId: `TC_HIST_${String(i * 4 + idx + 1).padStart(3, "0")}`,
    }));

    items.push({
      id: `TEST_HIST_${String(i + 1).padStart(3, "0")}`,
      timestamp,
      requirement: requirements[i],
      result: {
        summary: summaries[i],
        testCases: cases,
        knowledgeContext: i < 3 ? SAMPLE_KNOWLEDGE_CONTEXT : undefined,
      },
    });
  }

  return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/* ── Sample Knowledge Files ── */
const SAMPLE_KNOWLEDGE_FILES = [
  { id: "TEST_KF_001", file_name: "login-api-spec.pdf", file_type: "pdf", upload_date: "2026-06-28T10:30:00Z", source_type: "upload", status: "ready", chunk_count: 12 },
  { id: "TEST_KF_002", file_name: "ui-guidelines.docx", file_type: "docx", upload_date: "2026-06-29T14:15:00Z", source_type: "upload", status: "ready", chunk_count: 8 },
  { id: "TEST_KF_003", file_name: "test-strategy.csv", file_type: "csv", upload_date: "2026-06-30T09:00:00Z", source_type: "upload", status: "ready", chunk_count: 5 },
  { id: "TEST_KF_004", file_name: "product-requirements.txt", file_type: "text", upload_date: "2026-07-01T11:45:00Z", source_type: "sharepoint", status: "needs_chunking", chunk_count: 0 },
  { id: "TEST_KF_005", file_name: "security-audit.pdf", file_type: "pdf", upload_date: "2026-07-02T16:20:00Z", source_type: "upload", status: "ready", chunk_count: 15 },
  { id: "TEST_KF_006", file_name: "release-notes-v2.docx", file_type: "docx", upload_date: "2026-07-03T08:10:00Z", source_type: "upload", status: "processing", chunk_count: 0 },
];

/* ── Sample Suites ── */
const SAMPLE_SUITES = [
  { id: "TEST_SUITE_001", name: "Smoke Tests", description: "Critical path validation for core functionality", color: "#EF4444", caseIds: ["TC_001", "TC_005", "TC_007"] },
  { id: "TEST_SUITE_002", name: "Regression Suite", description: "Full regression covering all features", color: "#8B5CF6", caseIds: ["TC_001", "TC_002", "TC_003", "TC_004", "TC_005", "TC_006", "TC_007", "TC_008"] },
  { id: "TEST_SUITE_003", name: "Edge Cases", description: "Boundary and error-handling scenarios", color: "#F59E0B", caseIds: ["TC_004", "TC_008", "TC_009", "TC_012"] },
  { id: "TEST_SUITE_004", name: "Security Tests", description: "Authentication and authorization checks", color: "#10B981", caseIds: ["TC_001", "TC_002", "TC_006", "TC_012"] },
];

/* ── Sample Regression Runs ── */
const SAMPLE_REGRESSION_RUNS = [
  {
    id: "TEST_REG_001",
    platform: "web",
    status: "passed",
    testCases: SAMPLE_TEST_CASES.slice(0, 5),
    scripts: [],
    results: SAMPLE_TEST_CASES.slice(0, 5).map((tc) => ({
      testCaseId: tc.tcId,
      passed: true,
      actualOutput: "Test executed successfully",
    })),
    startedAt: "2026-07-03T10:00:00Z",
    completedAt: "2026-07-03T10:12:30Z",
    buildVersion: "v2.4.1",
    suiteName: "Smoke Tests",
  },
  {
    id: "TEST_REG_002",
    platform: "web",
    status: "failed",
    testCases: SAMPLE_TEST_CASES.slice(5, 10),
    scripts: [],
    results: SAMPLE_TEST_CASES.slice(5, 10).map((tc, i) => ({
      testCaseId: tc.tcId,
      passed: i !== 2,
      actualOutput: i === 2 ? undefined : "Test executed successfully",
      errorMessage: i === 2 ? "Element not found: #submit-btn" : undefined,
    })),
    startedAt: "2026-07-04T14:30:00Z",
    completedAt: "2026-07-04T14:35:15Z",
    buildVersion: "v2.4.2",
    suiteName: "Regression Suite",
  },
  {
    id: "TEST_REG_003",
    platform: "mobile",
    status: "passed",
    testCases: SAMPLE_TEST_CASES.slice(0, 3),
    scripts: [],
    results: SAMPLE_TEST_CASES.slice(0, 3).map((tc) => ({
      testCaseId: tc.tcId,
      passed: true,
      actualOutput: "Mobile test passed",
    })),
    startedAt: "2026-07-05T08:00:00Z",
    completedAt: "2026-07-05T08:08:45Z",
    buildVersion: "v2.4.1-mobile",
    suiteName: "Smoke Tests",
  },
];

/* ── Sample Build Artifact ── */
const SAMPLE_ARTIFACTS = [
  {
    id: "TEST_ART_001",
    platform: "web" as const,
    version: "v2.4.2",
    fileName: "forgeqa-build-2.4.2.tar.gz",
    fileSize: 15728640,
    uploadedAt: "2026-07-04T12:00:00Z",
  },
];

/* ── Sample Webhooks ── */
const SAMPLE_WEBHOOKS = [
  { platform: "web", url: "https://ci.example.com/webhooks/forgeqa" },
  { platform: "mobile", url: "https://ci.example.com/webhooks/forgeqa-mobile" },
];

/* ═══════════════════════════════════════════════════════════════════════════
   SEED FUNCTION — Call once on first login to populate test data
   ═══════════════════════════════════════════════════════════════════════════ */

export async function seedSampleData() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEEDED_KEY)) return;

  try {
    const history = generateSampleHistory();
    await api.post("/api/history", { items: history });
    await api.post("/api/qa-result", { result: SAMPLE_QA_RESPONSE });
    await api.post("/api/user/suites", { suites: SAMPLE_SUITES });
    await api.post("/api/seed-knowledge", {});
    localStorage.setItem(SEEDED_KEY, "true");
  } catch {
    // Silently fail — seed data is optional
  }
}

export function clearSampleData() {
  localStorage.removeItem(SEEDED_KEY);
}

export function isSampleDataSeeded(): boolean {
  return localStorage.getItem(SEEDED_KEY) === "true";
}
