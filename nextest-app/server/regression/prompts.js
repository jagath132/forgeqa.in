export function buildRegressionPrompt({ requirement, existingTestCases, platform }) {
  const existing = Array.isArray(existingTestCases) && existingTestCases.length
    ? existingTestCases.map((tc) => `- ${tc.tcId}: ${tc.summary} (${tc.category})`).join("\n")
    : "No existing test cases provided.";

  const platformGuide = platform === "mobile"
    ? "mobile app (Android APK)" : "web application";

  return `You are a senior QA engineer specializing in regression testing for a ${platformGuide}.

The user has described a change or new feature:
"""
${requirement}
"""

Existing test cases that should still pass after this change:
${existing}

Generate a regression test suite that:
1. Verifies existing functionality is NOT broken by the change (regression focus)
2. Includes positive, negative, and edge cases relevant to the change
3. Prioritizes tests that touch shared/modified components or flows
4. Uses TC_XXX format for IDs (starting from TC_001)
5. Returns valid JSON only with no markdown wrapping

Output format:
{
  "summary": "Regression test suite summary",
  "testCases": [
    {
      "tcId": "TC_001",
      "category": "Positive" | "Negative" | "Validation" | "Edge",
      "summary": "Brief title",
      "testDescription": "Detailed description of what this test verifies",
      "testSteps": ["Step 1", "Step 2"],
      "expected": "Expected result"
    }
  ]
}`;
}

export function buildRegressionScriptPrompt({ testCases, platform, framework, language, targetUrl }) {
  const source = testCases
    .map((tc) =>
      `- ${tc.tcId}: ${tc.summary}\n  Description: ${tc.testDescription}\n  Steps:\n${tc.testSteps.map((s) => `    - ${s}`).join("\n")}\n  Expected: ${tc.expected}`)
    .join("\n\n");

  const platformGuide = platform === "mobile"
    ? `Generate ${framework} Appium test scripts in ${language} for mobile regression testing.`
    : `Generate ${framework} test scripts in ${language} for web regression testing. Target URL: ${targetUrl}`;

  return `You are a senior test automation engineer.

${platformGuide}

These tests are part of a regression suite.

Requirements:
- Use ${framework} best practices.
- Include proper selectors (Appium accessibility IDs for mobile, CSS/XPath for web).
- Comment each block with the test case ID (e.g. // TC_001).
- Include setup and teardown.
- Keep the script executable and return only code without markdown.

Regression Test Cases:
${source}`;
}
