import crypto from 'crypto';
import { PaystackService } from '../src/integrations/paystack';

describe('Standalone Paystack Integration Layer Tests', () => {
  it('should verify valid HMAC SHA512 signature', () => {
    process.env.PAYSTACK_SECRET_KEY = 'sk_test_mock_secret_key';
    const samplePayload = JSON.stringify({ event: 'charge.success', data: { id: 12345, reference: 'ref_001' } });

    const expectedHash = crypto
      .createHmac('sha512', 'sk_test_mock_secret_key')
      .update(samplePayload)
      .digest('hex');

    const isValid = PaystackService.verifyWebhookSignature(samplePayload, expectedHash);
    const isInvalid = PaystackService.verifyWebhookSignature(samplePayload, 'wrong_signature');

    expect(isValid).toBe(true);
    expect(isInvalid).toBe(false);
  });

  it('should reject non-integer float amount for transaction initialization', async () => {
    await expect(
      PaystackService.initializeTransaction({
        email: 'test@example.com',
        amount: 100.50, // Floating point amount (INVALID)
        reference: 'ref_float_test',
        subaccount: 'ACCT_12345',
      })
    ).rejects.toThrow('Invalid amount');
  });
});
