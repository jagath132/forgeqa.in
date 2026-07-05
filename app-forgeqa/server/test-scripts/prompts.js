export function buildScriptPrompt({
  framework,
  language,
  targetUrl,
  testCases,
  options,
}) {
  const source = testCases
    .map(
      (testCase) =>
        `- ${testCase.tcId}: ${testCase.summary}\n  Description: ${testCase.testDescription}\n  Steps:\n${testCase.testSteps
          .map((step) => `    - ${step}`)
          .join("\n")}\n  Expected: ${testCase.expected}`,
    )
    .join("\n\n");

  const viewport = options?.viewport
    ? `Viewport: ${options.viewport.width}x${options.viewport.height}`
    : "";

  return `You are a senior test automation engineer.
Generate a ${framework} test script in ${language} for the following test cases.
Target URL: ${targetUrl}
${viewport}

Requirements:
- Use ${framework} best practices and patterns.
- Include proper element selectors (CSS or XPath) where possible.
- Add comments linking each block to the test case IDs (e.g. // TC_001).
- Include setup and teardown steps if required by the framework.
- Use a maintainable test structure suitable for ${framework}.
- Keep the script executable and return only code without markdown or explanation.

Test Cases:
${source}
`;
}
