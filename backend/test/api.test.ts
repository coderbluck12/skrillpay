import request from 'supertest';
import app from '../src/index';
import db from '../src/db';
import { AuthUtils } from '../src/utils/auth';
import { PaystackService } from '../src/integrations/paystack';

describe('Skrillpay Backend Unit & Integration Tests', () => {
  afterAll(async () => {
    // Close PostgreSQL pool after all tests finish to prevent TCPWRAP open handle leaks
    await db.pool.end();
  });

  describe('AuthUtils', () => {
    it('should generate valid test API key and hash', () => {
      const { rawKey, keyHash } = AuthUtils.generateApiKey(true);
      expect(rawKey).toContain('sk_test_');
      expect(keyHash).toHaveLength(64);
    });

    it('should produce identical hash for same raw key', () => {
      const rawKey = 'sk_test_1234567890abcdef';
      const hash1 = AuthUtils.hashApiKey(rawKey);
      const hash2 = AuthUtils.hashApiKey(rawKey);
      expect(hash1).toBe(hash2);
    });
  });

  describe('PaystackService HMAC Webhook Verification', () => {
    it('should correctly verify valid signature', () => {
      process.env.PAYSTACK_SECRET_KEY = 'test_secret_key';
      const payload = JSON.stringify({ event: 'charge.success', data: { id: 100 } });
      const crypto = require('crypto');
      const validSig = crypto.createHmac('sha512', 'test_secret_key').update(payload).digest('hex');

      const isValid = PaystackService.verifyWebhookSignature(payload, validSig);
      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', () => {
      process.env.PAYSTACK_SECRET_KEY = 'test_secret_key';
      const payload = JSON.stringify({ event: 'charge.success' });
      const isValid = PaystackService.verifyWebhookSignature(payload, 'invalid_sig');
      expect(isValid).toBe(false);
    });
  });

  describe('API Endpoints Validation', () => {
    it('GET /health should return status true', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe(true);
      expect(res.body.service).toBe('skrillpay-api');
    });

    it('POST /v1/charge without Auth header should return 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/v1/charge')
        .send({ amount: 50000, email: 'test@example.com', reference: 'REF_TEST' });
      expect(res.status).toBe(401);
      expect(res.body.status).toBe(false);
    });

    it('POST /v1/merchants/onboard with missing fields should return 400', async () => {
      const res = await request(app)
        .post('/v1/merchants/onboard')
        .send({ email: 'incomplete@example.com' });
      expect(res.status).toBe(400);
      expect(res.body.status).toBe(false);
    });
  });
});
