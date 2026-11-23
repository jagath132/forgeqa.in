import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { TestScriptCodeViewer } from './TestScriptCodeViewer';

describe('TestScriptCodeViewer static preview', () => {
  beforeAll(() => {
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    });
  });

  it('reports declarations and locators from Selenium source without fabricating execution results', async () => {
    const script = `// @Test void commentedOut() {}
class WorkflowTest {
  @Test
  void rejectsInvalidEmail() {
    driver.findElement(By.id("email")).sendKeys("invalid");
  }
}`;

    render(
      <TestScriptCodeViewer
        scriptResult={null}
        frameworkProject={{
          projectName: 'test-project',
          framework: 'selenium',
          language: 'java',
          targetUrl: 'https://example.com',
          testCasesCount: 1,
          files: [{ path: 'WorkflowTest.java', content: script, language: 'java' }],
        }}
        isLoading={false}
        framework="selenium"
        language="java"
        onClear={vi.fn()}
        onCopy={vi.fn()}
        onDownload={vi.fn()}
        isCopied={false}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Static Preview' }));
    fireEvent.click(screen.getByRole('button', { name: 'Run Static Preview' }));
    expect(screen.getByText('Line 3 | Test | rejectsInvalidEmail')).toBeInTheDocument();
    expect(screen.getByText('Line 5 | Locator | email')).toBeInTheDocument();
    expect(screen.queryByText(/commentedOut|example\.com|0 passed|Test Case 1/)).not.toBeInTheDocument();
    expect(screen.getByText(/no test executor is configured/i)).toBeInTheDocument();

    const log = 'Tests run: 1, Failures: 1\nExpected valid email';
    fireEvent.change(screen.getByLabelText('Import Run Log'), {
      target: { files: [{ name: 'selenium.log', text: async () => log }] },
    });
    expect((await screen.findByText(/Expected valid email/)).textContent).toBe(log);
    expect(screen.getByRole('button', { name: 'Download Log' })).toBeInTheDocument();
  });
});
