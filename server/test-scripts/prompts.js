export function buildScriptPrompt({ framework, language, targetUrl, testCases, options }) {
  const source = testCases
    .map(
      (testCase) =>
        `- ${testCase.tcId}: ${testCase.summary}\n  Description: ${testCase.testDescription}\n  Steps:\n${(
          testCase.testSteps || []
        )
          .map((step) => `    - ${step}`)
          .join('\n')}\n  Expected: ${testCase.expected}`
    )
    .join('\n\n');

  const viewport = options?.viewport
    ? `Viewport: ${options.viewport.width}x${options.viewport.height}`
    : '';

  const isPlaywright = framework.toLowerCase() === 'playwright';

  return `You are a senior test automation engineer.
Generate a ${framework} test script in ${language} for the following test cases.
Target URL: ${targetUrl}
${viewport}

Requirements:
- Use ${framework} 2026 best practices and modern patterns.
${
  isPlaywright
    ? '- Use modern user-facing Playwright locators (e.g. page.getByRole, page.getByLabel, page.getByPlaceholder, page.getByTestId) rather than fragile CSS or XPath.'
    : '- Include proper element selectors where possible.'
}
- Add comments linking each test block to the test case IDs (e.g. // TC_001).
- Include setup and teardown steps if required by the framework.
- Tag tests with @smoke or @regression for selective CI execution.
- Use a maintainable test structure suitable for ${framework}.
- Keep the script executable and return ONLY code without markdown fences or explanation.

Test Cases:
${source}
`;
}

export function buildFrameworkPomPrompt({
  framework = 'playwright',
  language = 'typescript',
  targetUrl,
  testCases,
}) {
  const source = testCases
    .map(
      (tc) =>
        `- ${tc.tcId} (${tc.category || 'General'}): ${tc.summary}\n  Steps: ${(tc.testSteps || []).join(' -> ')}`
    )
    .join('\n');

  return `You are a Principal QA Automation Architect specializing in ${framework} + ${language}.
Generate ${language} Page Object Model (POM) classes that inherit from 'BasePage' for the following test flows.
Target URL: ${targetUrl}

Requirements:
- Return ONLY valid ${language} code without markdown code blocks or explanations.
- Create modular Page Object classes (e.g. AppWorkflowPage, LoginPage, etc.).
- Use standard ${framework} locators and interaction APIs appropriate for ${language}.
- Provide clean, maintainable methods for each action and verification (e.g. fillForm, submit, verifySuccess).

Test Cases to cover:
${source}
`;
}

export function buildFrameworkSpecPrompt({
  framework = 'playwright',
  language = 'typescript',
  testCases,
  targetUrl,
}) {
  const source = testCases
    .map(
      (tc) =>
        `- ${tc.tcId} (${tc.category || 'General'}): ${tc.summary}\n  Expected: ${tc.expected}\n  Steps:\n${(
          tc.testSteps || []
        )
          .map((s) => `    * ${s}`)
          .join('\n')}`
    )
    .join('\n\n');

  return `You are a Principal QA Automation Architect.
Generate an executable ${framework} test spec in ${language} for the following test cases against target ${targetUrl}.

Requirements:
- Return ONLY valid ${language} code without markdown fences or explanations.
- Group tests logically with test/describe blocks.
- Add tag annotations to test titles (e.g. '@smoke', '@regression', '@critical').
- Include meaningful assertions verifying the expected results using modern ${framework} matchers.

Test Cases:
${source}
`;
}

export function buildFrameworkApiPrompt({
  framework = 'playwright',
  language = 'typescript',
  testCases,
  targetUrl,
}) {
  const source = testCases
    .map((tc) => `- ${tc.tcId}: ${tc.summary} (Category: ${tc.category || 'API/UI'})`)
    .join('\n');

  return `You are a Full-Stack QA Engineer specializing in ${framework} + ${language}.
Generate a hybrid API / Integration test spec in ${language} for target ${targetUrl}.

Requirements:
- Return ONLY valid ${language} code without markdown fences or explanations.
- Test endpoint health and JSON payloads.
- Include assertions for status codes and response bodies.
- Tag tests with '@api' and '@regression'.

Context & Flows:
Target URL: ${targetUrl}
Test Scenarios:
${source}
`;
}

export const buildPlaywrightPomPrompt = (args) =>
  buildFrameworkPomPrompt({ framework: 'playwright', language: 'typescript', ...args });
export const buildPlaywrightSpecPrompt = (args) =>
  buildFrameworkSpecPrompt({ framework: 'playwright', language: 'typescript', ...args });
export const buildPlaywrightHybridApiPrompt = (args) =>
  buildFrameworkApiPrompt({ framework: 'playwright', language: 'typescript', ...args });

export function buildAiDiagnosticPrompt({ errorLog, failedLocator, targetUrl, testCaseSummary }) {
  return `You are a Lead QA Automation Diagnostic Agent specializing in Playwright test failures.
Analyze the following test failure and produce a structured JSON diagnostic report.

Target URL: ${targetUrl || 'Unknown'}
Test Summary: ${testCaseSummary || 'Playwright E2E Step'}
Failed Locator / Expression: ${failedLocator || 'N/A'}

Error Stack / Execution Log:
${errorLog}

Requirements:
Return ONLY a valid JSON object (no markdown, no backticks) with the following exact keys:
{
  "rootCause": "Clear 1-2 sentence explanation of why the test failed (e.g. Timeout waiting for element, Strict Mode violation, API 500, or Race condition)",
  "category": "LOCATOR_MISMATCH" | "TIMED_OUT" | "FLAKY_NETWORK" | "APPLICATION_BUG" | "ASSERTION_FAILURE",
  "isFlaky": boolean,
  "confidenceScore": number (0 to 100),
  "healedLocator": "Recommended modern resilient Playwright locator (e.g. page.getByRole('button', { name: 'Submit' })) or empty string if not locator-related",
  "suggestedFix": "Concrete code diff or action steps to resolve the failure",
  "preventionAdvice": "Best practice tip to prevent this error in CI/CD pipelines"
}
`;
}
