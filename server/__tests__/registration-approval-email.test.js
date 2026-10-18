import { afterEach, describe, expect, it, vi } from 'vitest';
import { sendVerificationEmail } from '../../license-manager/server/email/service.js';
import { getVerificationEmailHtml } from '../../license-manager/server/email/templates.js';

const { sendVerificationEmailResendMock } = vi.hoisted(() => ({
  sendVerificationEmailResendMock: vi.fn(),
}));

vi.mock('../../license-manager/server/email/resend.js', () => ({
  sendProductKeyEmailResend: vi.fn(),
  sendVerificationEmailResend: sendVerificationEmailResendMock,
}));

describe('registration approval email', () => {
  const originalResendApiKey = process.env.RESEND_API_KEY;
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    sendVerificationEmailResendMock.mockReset();
    if (originalResendApiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalResendApiKey;
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  });

  it('requires an assigned product key and activation URL before sending approval', async () => {
    await expect(
      sendVerificationEmail({
        to: 'qa@example.com',
        name: 'QA User',
        status: 'approved',
        productKey: null,
        completeUrl: null,
      })
    ).rejects.toThrow('Approved registration emails require an assigned product key');
  });

  it('does not fall back to SMTP when Resend reports an error', async () => {
    process.env.RESEND_API_KEY = 'test-resend-key';
    process.env.NODE_ENV = 'production';
    sendVerificationEmailResendMock.mockRejectedValueOnce(new Error('Resend request failed'));

    await expect(
      sendVerificationEmail({
        to: 'qa@example.com',
        name: 'QA User',
        status: 'approved',
        productKey: 'FQA-1234-ABCD',
        completeUrl: 'https://forgeqa.in/auth/complete-registration',
      })
    ).rejects.toThrow('Resend request failed');
    expect(sendVerificationEmailResendMock).toHaveBeenCalledOnce();
  });

  it('includes approval status, key activation steps, and support contact', () => {
    const html = getVerificationEmailHtml({
      name: 'QA User',
      status: 'approved',
      productKey: 'FQA-1234-ABCD',
      completeUrl: 'https://forgeqa.in/auth/complete-registration',
      supportEmail: 'help@forgeqa.in',
    });

    expect(html).toContain('Welcome to ForgeQA');
    expect(html).toContain('<strong>Registration status:</strong> Approved');
    expect(html).toContain('FQA-1234-ABCD');
    expect(html).toContain('Finish setting up your account');
    expect(html).toContain('help@forgeqa.in');
  });
});
