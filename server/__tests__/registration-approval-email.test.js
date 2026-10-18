import { describe, expect, it } from 'vitest';
import { sendVerificationEmail } from '../../license-manager/server/email/service.js';
import { getVerificationEmailHtml } from '../../license-manager/server/email/templates.js';

describe('registration approval email', () => {
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
