# Automation Script Generation

Test Scripts at `/test-scripts` transforms selected cases from the current matrix into a single source file or a framework project. Users configure the target URL, framework and language, headless mode, viewport, and optional project name.

## Framework and language options

| Framework | Languages offered by the UI |
| --- | --- |
| Playwright | JavaScript, TypeScript, Python, Java, and C# |
| Cypress | JavaScript and TypeScript |
| Selenium | JavaScript, Python, Java, and C# |
| Puppeteer | JavaScript and TypeScript |

## Generation, review, and output

1. Select one or more cases from the current matrix and confirm the provider and target URL. The page blocks submission when required inputs are missing.
2. Single Script mode sends the selected cases and options to the AI generator. The response contains script text, file name, framework, language, and the associated cases.
3. Framework mode requests page-object, test-spec, and API-spec content and combines the available output with framework-specific scaffolding. Individual AI-generation failures can fall back to scaffold defaults. The response includes project metadata and files with path, content, and language.
4. The code viewer presents generated files for review, copy, individual download, and framework ZIP download. Saved-script history and the current framework project use browser storage.

Failure diagnosis takes an error log and optional locator, URL, and case summary. The returned data can include a root cause, category, confidence score, flaky flag, suggested locator, fix, and prevention advice.

## API contract

| Method and path | Function |
| --- | --- |
| `POST /api/generate-test-scripts` | Generate one script given a provider, framework, language, target URL, cases, and execution preferences. |
| `POST /api/test-scripts/generate-framework` | Generate a multi-file project. The API defaults to Playwright and TypeScript when neither is supplied. |
| `POST /api/test-scripts/ai-diagnose` | Diagnose a supplied failure log and return structured suggestions. |

## Function reference

| Function | Responsibility |
| --- | --- |
| `handleGenerate` | Validate the page inputs and dispatch the selected generation mode. |
| `generateTestScript` | Build the single-script prompt, call the provider, clean the output, and return the file metadata. |
| `generateFrameworkProject` | Request project content, apply fallbacks, and assemble a framework project. |
| `buildFrameworkScaffold` | Dispatch to the Playwright, Cypress, Selenium, or Puppeteer scaffold. |
| `buildFrameworkPomPrompt`, `buildFrameworkSpecPrompt`, `buildFrameworkApiPrompt` | Specify the generated page objects, browser tests, and API test content. |
| `diagnoseTestFailure` | Analyze a supplied log and return structured diagnostic fields. |
| `TestScriptCodeViewer`, `addSavedScript`, `selectSavedScript` | Show output, create download artifacts, and manage local script history. |

Sources. [Test Scripts screen](../src/pages/TestScripts.tsx), [Code viewer](../src/components/TestScriptCodeViewer.tsx), [Client API](../src/lib/testScriptApi.ts), [Automation generator](../server/test-scripts/generator.js), [Prompts](../server/test-scripts/prompts.js), [Scaffold builders](../server/test-scripts/frameworkScaffold.js), [Main API](../server/api.js).
