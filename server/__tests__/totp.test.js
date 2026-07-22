import { describe, it, expect } from 'vitest';
import { generateTOTPSecret, generateTOTP, verifyTOTP, generateTOTPUri } from '../2fa/index.js';

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
    expect(uri).toContain('secret=' + encodeURIComponent(secret));
    expect(uri).toContain('issuer=ForgeQA');
  });

  it('verifyTOTP accepts valid token generated for secret', () => {
    const secret = generateTOTPSecret();
    const token = generateTOTP(secret);
    expect(verifyTOTP(secret, token)).toBe(true);
  });

  it('verifyTOTP rejects bad token', () => {
    const secret = generateTOTPSecret();
    const result = verifyTOTP(secret, '000000');
    expect(result).toBe(false);
  });
});
