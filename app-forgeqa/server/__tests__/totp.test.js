import { describe, it, expect } from 'vitest';
import { generateTOTPSecret, verifyTOTP, generateTOTPUri } from '../2fa/index.js';
import base32 from 'base32-encode';

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
    const rawBytes = Buffer.from(secret, 'base64url');
    const uint8 = new Uint8Array(rawBytes.buffer, rawBytes.byteOffset, rawBytes.byteLength);
    const base32Secret = base32(uint8, 'RFC4648');
    expect(uri).toContain('secret=' + base32Secret);
    expect(uri).toContain('issuer=ForgeQA');
  });

  it('verifyTOTP rejects bad token', () => {
    const secret = generateTOTPSecret();
    const result = verifyTOTP(secret, '000000');
    expect(result).toBe(false);
  });
});
