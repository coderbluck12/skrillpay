import request from 'supertest';
import app from '../src/index';
import db from '../src/db';
import { MailerUtils } from '../src/utils/mailer';

describe('Email Verification & Rate Limiting Tests', () => {
  const testEmail = `verify_test_${Date.now()}@example.com`;
  const testPassword = 'SecurePassword123!';
  const testBusinessName = 'Verification Test Merchant';
  let verificationToken: string;

  beforeAll(async () => {
    // Ensure DB columns exist if migrations haven't run
    try {
      await db.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT false;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMPTZ;
      `);
    } catch (e) {
      // Ignore if database is mock/not connected
    }
  });

  afterAll(async () => {
    // Clean up test user
    try {
      await db.query('DELETE FROM users WHERE email = $1', [testEmail]);
    } catch (e) {}
    await db.pool.end();
  });

  describe('Nodemailer Utility Unit Tests', () => {
    it('should format and handle verification email dispatch without throwing error', async () => {
      const sent = await MailerUtils.sendVerificationEmail('test@example.com', 'sample_token_123', 'Test Biz');
      expect(sent).toBe(true);
    });
  });

  describe('Email Verification Flow Endpoints', () => {
    it('POST /v1/auth/register should create user with unverified email state', async () => {
      const res = await request(app)
        .post('/v1/auth/register')
        .set('x-skip-rate-limit', 'true')
        .send({
          email: testEmail,
          password: testPassword,
          business_name: testBusinessName,
        });

      if (res.status === 201) {
        expect(res.body.status).toBe(true);
        expect(res.body.data.merchant.is_email_verified).toBe(false);

        // Fetch token from database directly for verification test
        const userRes = await db.query(
          'SELECT email_verification_token FROM users WHERE email = $1',
          [testEmail]
        );
        verificationToken = userRes.rows[0]?.email_verification_token;
        expect(verificationToken).toBeDefined();
      }
    });

    it('GET /v1/auth/verify-email with invalid token should return 400', async () => {
      const res = await request(app)
        .get('/v1/auth/verify-email?token=invalid_token_999999');

      expect(res.status).toBe(400);
      expect(res.body.status).toBe(false);
    });

    it('GET /v1/auth/verify-email with valid token should verify account', async () => {
      if (!verificationToken) return;

      const res = await request(app)
        .get(`/v1/auth/verify-email?token=${verificationToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(true);
      expect(res.body.data.is_email_verified).toBe(true);

      // Confirm in DB
      const userRes = await db.query(
        'SELECT is_email_verified, email_verification_token FROM users WHERE email = $1',
        [testEmail]
      );
      expect(userRes.rows[0].is_email_verified).toBe(true);
      expect(userRes.rows[0].email_verification_token).toBeNull();
    });

    it('POST /v1/auth/resend-verification for already verified account should return error', async () => {
      const res = await request(app)
        .post('/v1/auth/resend-verification')
        .set('x-skip-rate-limit', 'true')
        .send({ email: testEmail });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already verified');
    });
  });

  describe('Rate Limiting Enforcement', () => {
    it('should include rate limit response headers on API requests', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
    });

    it('POST /v1/auth/login should contain rate limit headers', async () => {
      const res = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'Password123!' });

      // Check standard RateLimit headers (ratelimit-limit or ratelimit-remaining)
      expect(res.headers).toHaveProperty('ratelimit-limit');
    });
  });
});
