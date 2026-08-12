import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import db from '../db';
import { signToken } from '../middleware/jwtAuth';
import { JwtAuthenticatedRequest } from '../middleware/jwtAuth';
import { RegisterDTO, LoginDTO } from '../types';
import { MailerUtils } from '../utils/mailer';

export class AuthController {
  /**
   * POST /v1/auth/register
   * Creates a new merchant account with email + password.
   * Generates email verification token and dispatches verification email via Nodemailer.
   */
  public static async register(req: Request, res: Response): Promise<void> {
    const { email, password, business_name }: RegisterDTO = req.body;

    if (!email || !password || !business_name) {
      res.status(400).json({
        status: false,
        message: 'email, password, and business_name are required',
      });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({
        status: false,
        message: 'Password must be at least 8 characters',
      });
      return;
    }

    try {
      // Check if email already registered
      const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
      if (existing.rows.length > 0) {
        res.status(409).json({
          status: false,
          message: 'An account with this email already exists',
        });
        return;
      }

      // Hash password with bcrypt (12 rounds)
      const password_hash = await bcrypt.hash(password, 12);

      // Generate email verification token (32 bytes hex) and 24-hour expiration
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Insert new user with pending_kyc status and false is_email_verified
      const result = await db.query(
        `INSERT INTO users (
          email, business_name, password_hash,
          kyc_status, status, kyc_provider,
          fee_type, fee_value, is_admin,
          is_email_verified, email_verification_token, email_verification_expires
        ) VALUES ($1, $2, $3, 'pending_kyc', 'pending_kyc', 'internal', 'percentage', 1.5, false, false, $4, $5)
        RETURNING id, email, business_name, kyc_status, is_admin, is_email_verified, created_at`,
        [email.toLowerCase(), business_name, password_hash, verificationToken, verificationExpires]
      );

      const user = result.rows[0];

      // Dispatch verification email in background
      MailerUtils.sendVerificationEmail(user.email, verificationToken, user.business_name).catch((err) => {
        console.error('Failed to send verification email on register:', err);
      });

      const token = signToken({
        userId: user.id,
        email: user.email,
        businessName: user.business_name,
        kycStatus: user.kyc_status,
        isAdmin: user.is_admin,
      });

      res.status(201).json({
        status: true,
        message: 'Account created. Please check your email to verify your account.',
        data: {
          token,
          merchant: {
            id: user.id,
            email: user.email,
            business_name: user.business_name,
            kyc_status: user.kyc_status,
            is_email_verified: user.is_email_verified,
          },
        },
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({ status: false, message: 'Registration failed. Please try again.' });
    }
  }

  /**
   * POST /v1/auth/login
   * Validates credentials and returns a JWT.
   */
  public static async login(req: Request, res: Response): Promise<void> {
    const { email, password }: LoginDTO = req.body;

    if (!email || !password) {
      res.status(400).json({ status: false, message: 'email and password are required' });
      return;
    }

    try {
      const result = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        // Consistent timing to prevent email enumeration
        await bcrypt.compare(password, '$2b$12$invalidhashtopreventtiming000000000000000000000');
        res.status(401).json({ status: false, message: 'Invalid email or password' });
        return;
      }

      const user = result.rows[0];

      if (!user.password_hash) {
        res.status(401).json({
          status: false,
          message: 'This account was created before password auth was enabled. Please use your API key or contact support.',
        });
        return;
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        res.status(401).json({ status: false, message: 'Invalid email or password' });
        return;
      }

      if (user.kyc_status === 'suspended') {
        res.status(403).json({ status: false, message: 'Your account has been suspended. Contact support.' });
        return;
      }

      const token = signToken({
        userId: user.id,
        email: user.email,
        businessName: user.business_name,
        kycStatus: user.kyc_status,
        isAdmin: user.is_admin,
      });

      res.status(200).json({
        status: true,
        message: 'Login successful',
        data: {
          token,
          merchant: {
            id: user.id,
            email: user.email,
            business_name: user.business_name,
            kyc_status: user.kyc_status,
            is_admin: user.is_admin,
            is_email_verified: user.is_email_verified || false,
          },
        },
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ status: false, message: 'Login failed. Please try again.' });
    }
  }

  /**
   * GET/POST /v1/auth/verify-email
   * Validates verification token and activates user's email verification status.
   */
  public static async verifyEmail(req: Request, res: Response): Promise<void> {
    const token = (req.query.token as string) || req.body?.token;

    if (!token) {
      res.status(400).json({ status: false, message: 'Verification token is required' });
      return;
    }

    try {
      const result = await db.query(
        `SELECT id, email, business_name, is_email_verified 
         FROM users 
         WHERE email_verification_token = $1 AND email_verification_expires > NOW()`,
        [token]
      );

      if (result.rows.length === 0) {
        res.status(400).json({
          status: false,
          message: 'Invalid or expired verification token. Please request a new verification email.',
        });
        return;
      }

      const user = result.rows[0];

      await db.query(
        `UPDATE users 
         SET is_email_verified = true, email_verification_token = NULL, email_verification_expires = NULL 
         WHERE id = $1`,
        [user.id]
      );

      res.status(200).json({
        status: true,
        message: 'Email address successfully verified!',
        data: {
          email: user.email,
          is_email_verified: true,
        },
      });
    } catch (error: any) {
      console.error('Email verification error:', error);
      res.status(500).json({ status: false, message: 'Email verification failed. Please try again.' });
    }
  }

  /**
   * POST /v1/auth/resend-verification
   * Generates a new email verification token and sends it.
   */
  public static async resendVerification(req: Request, res: Response): Promise<void> {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ status: false, message: 'email is required' });
      return;
    }

    try {
      const result = await db.query(
        'SELECT id, email, business_name, is_email_verified FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        // Return success message to prevent user enumeration
        res.status(200).json({
          status: true,
          message: 'If an account exists with this email, a verification link has been sent.',
        });
        return;
      }

      const user = result.rows[0];

      if (user.is_email_verified) {
        res.status(400).json({ status: false, message: 'This email address is already verified.' });
        return;
      }

      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await db.query(
        `UPDATE users 
         SET email_verification_token = $1, email_verification_expires = $2 
         WHERE id = $3`,
        [verificationToken, verificationExpires, user.id]
      );

      await MailerUtils.sendVerificationEmail(user.email, verificationToken, user.business_name);

      res.status(200).json({
        status: true,
        message: 'Verification email sent. Please check your inbox.',
      });
    } catch (error: any) {
      console.error('Resend verification error:', error);
      res.status(500).json({ status: false, message: 'Failed to resend verification email.' });
    }
  }

  /**
   * GET /v1/auth/me
   * Returns the current authenticated merchant's profile.
   */
  public static async me(req: JwtAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await db.query(
        `SELECT
          id, email, business_name, kyc_status, kyc_data, kyc_submitted_at, kyc_approved_at,
          paystack_subaccount_code, korapay_subaccount_code, bank_account_number, bank_code, account_name,
          fee_type, fee_value, webhook_url, callback_url, is_admin, is_email_verified, created_at, api_key,
          CASE WHEN api_key_hash IS NOT NULL THEN true ELSE false END as has_api_key
        FROM users WHERE id = $1`,
        [req.jwtUser!.userId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ status: false, message: 'User not found' });
        return;
      }

      const user = result.rows[0];

      // Auto-issue an API Key for active merchants approved before this feature was introduced
      if (user.kyc_status === 'active' && (!user.api_key || !user.api_key_hash)) {
        const { AuthUtils } = require('../utils/auth');
        const { rawKey, keyHash } = AuthUtils.generateApiKey(false);
        await db.query(
          `UPDATE users SET api_key = $1, api_key_hash = $2, api_key_generated_at = NOW() WHERE id = $3`,
          [rawKey, keyHash, user.id]
        );
        user.api_key = rawKey;
        user.has_api_key = true;
      }

      res.status(200).json({ status: true, data: user });
    } catch (error: any) {
      console.error('Me endpoint error:', error);
      res.status(500).json({ status: false, message: 'Failed to fetch profile' });
    }
  }
}
