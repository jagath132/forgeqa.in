import { act, fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { TestScriptCodeViewer } from './TestScriptCodeViewer';

describe('TestScriptCodeViewer static preview', () => {
  beforeAll(() => {
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not report generated test blocks as passed without an executor', () => {
    const script = `test('rejects invalid email', async () => {
  await page.goto('https://example.com');
  await page.getByLabel('Email').fill('not-an-email');
});`;

    render(
      <TestScriptCodeViewer
        scriptResult={null}
        frameworkProject={{
          projectName: 'test-project',
          framework: 'playwright',
          language: 'typescript',
          targetUrl: 'https://example.com',
          testCasesCount: 1,
          files: [{ path: 'workflow.spec.ts', content: script, language: 'typescript' }],
        }}
        isLoading={false}
        framework="playwright"
        language="typescript"
        onClear={vi.fn()}
        onCopy={vi.fn()}
        onDownload={vi.fn()}
        isCopied={false}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Static Preview' }));
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole('button', { name: 'Run Static Preview' }));
    act(() => {
      vi.runAllTimers();
    });

    expect(screen.getByText(/0 passed, 0 failed, 1 not run/)).toBeInTheDocument();
    expect(screen.getByText(/no test executor is configured/i)).toBeInTheDocument();
    expect(screen.queryByText(/completed successfully/i)).not.toBeInTheDocument();
    expect(screen.getByText(/not contacted in static preview/i)).toBeInTheDocument();
  });
});
