import { describe, it, expect } from 'vitest';
import { generateTOTPSecret, verifyTOTP, generateTOTPUri } from '../2fa/index.js';

describe('TOTP', () => {
  it('generates a secret', () => {
    const secret = generateTOTPSecret();
    expect(secret).toBeTruthy();
    expect(typeof secret).toBe('string');
    expect(secret.length).toBeGreaterThan(20);
  });

  it('generates a valid OTP auth URI', () => {
    const secret = generateTOTPSecret();
    const uri = generateTOTPUri('test@example.com', secret, 'ForgeQA');
    expect(uri).toContain('otpauth://totp/');
    expect(uri).toContain('secret=' + secret);
    expect(uri).toContain('issuer=ForgeQA');
  });

  it('verifyTOTP rejects bad token', () => {
    const secret = generateTOTPSecret();
    const result = verifyTOTP(secret, '000000');
    expect(result).toBe(false);
  });
});
