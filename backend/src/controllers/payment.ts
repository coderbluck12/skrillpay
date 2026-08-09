import { Response } from 'express';
import db from '../db';
import { PaystackService } from '../integrations/paystack';
import { AuthenticatedRequest } from '../middleware/auth';
import { ChargeDTO } from '../types';

export class PaymentController {
  public static async initializeCharge(req: AuthenticatedRequest, res: Response): Promise<void> {
    const merchant = req.merchant;
    if (!merchant) {
      res.status(401).json({ status: false, message: 'Merchant context not found' });
      return;
    }

    const { amount, email, reference, callback_url }: ChargeDTO = req.body;

    if (!amount || !email || !reference) {
      res.status(400).json({ status: false, message: 'Missing required parameters: amount, email, reference' });
      return;
    }

    if (!merchant.paystack_subaccount_code) {
      res.status(400).json({ status: false, message: 'Merchant paystack subaccount is missing or incomplete' });
      return;
    }

    const amountInKobo = Number.isInteger(amount) ? amount : Math.round(amount * 100);
    
    let platformFeeInKobo = 0;
    if (merchant.fee_type === 'percentage') {
      platformFeeInKobo = Math.round(amountInKobo * (Number(merchant.fee_value) / 100));
    } else {
      platformFeeInKobo = Number.isInteger(merchant.fee_value) 
        ? Number(merchant.fee_value) 
        : Math.round(Number(merchant.fee_value) * 100);
    }

    const merchantAmountInKobo = amountInKobo - platformFeeInKobo;

    try {
      const existingRef = await db.query('SELECT id FROM transactions WHERE reference = $1', [reference]);
      if (existingRef.rows.length > 0) {
        res.status(409).json({ status: false, message: 'Transaction reference already exists' });
        return;
      }

      // Callback URL chaining:
      // Paystack will call our platform's callback, which then redirects to merchant's callback.
      // Priority: 1. Per-request callback_url  2. Merchant's stored callback_url
      const merchantCallbackUrl = callback_url || (merchant as any).callback_url;
      const platformBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
      const platformCallbackUrl = `${platformBaseUrl}/v1/payment/callback?ref=${reference}${merchantCallbackUrl ? `&redirect_url=${encodeURIComponent(merchantCallbackUrl)}` : ''}`;

      const paystackData = await PaystackService.initializeTransaction({
        email,
        amount: amountInKobo,
        reference,
        subaccount: merchant.paystack_subaccount_code,
        transaction_charge: platformFeeInKobo,
        callback_url: platformCallbackUrl,
      });

      await db.query(
        `INSERT INTO transactions (
          user_id, reference, amount, platform_fee, merchant_amount, currency, status, customer_email
        ) VALUES ($1, $2, $3, $4, $5, 'NGN', 'pending', $6)`,
        [merchant.id, reference, amountInKobo, platformFeeInKobo, merchantAmountInKobo, email]
      );

      res.status(200).json({
        status: true,
        message: 'Transaction initialized successfully',
        data: {
          authorization_url: paystackData.authorization_url,
          access_code: paystackData.access_code,
          reference: paystackData.reference || reference,
        },
      });
    } catch (error: any) {
      console.error('Initialize charge error:', error);
      res.status(500).json({ status: false, message: error.message || 'Failed to initialize charge' });
    }
  }

  public static async verifyTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { reference } = req.params;

    if (!reference) {
      res.status(400).json({ status: false, message: 'Reference parameter is required' });
      return;
    }

    try {
      const paystackData = await PaystackService.verifyTransaction(reference);
      const paystackStatus = paystackData.status;

      let dbStatus: 'pending' | 'success' | 'failed' = 'pending';
      if (paystackStatus === 'success') {
        dbStatus = 'success';
      } else if (paystackStatus === 'failed' || paystackStatus === 'abandoned') {
        dbStatus = 'failed';
      }

      const updateResult = await db.query(
        `UPDATE transactions
         SET status = $1, paystack_reference = $2, updated_at = NOW()
         WHERE reference = $3
         RETURNING *`,
        [dbStatus, paystackData.reference || paystackData.id, reference]
      );

      const transaction = updateResult.rows[0];

      res.status(200).json({
        status: true,
        message: 'Transaction verification completed',
        data: {
          paystack_data: paystackData,
          transaction: transaction || null,
        },
      });
    } catch (error: any) {
      console.error('Verify transaction error:', error);
      res.status(500).json({ status: false, message: error.message || 'Failed to verify transaction' });
    }
  }

  /**
   * GET /v1/payment/callback
   * Paystack redirects here after payment. We verify the transaction, then redirect
   * to the merchant's own callback URL with the result appended as query params.
   * This is the callback URL chaining mechanism.
   */
  public static async handleCallback(req: Request, res: Response): Promise<void> {
    const { ref, redirect_url } = req.query as { ref?: string; redirect_url?: string };

    if (!ref) {
      res.status(400).send('Missing reference parameter');
      return;
    }

    try {
      // Verify the transaction with Paystack
      const paystackData = await PaystackService.verifyTransaction(ref);
      const paystackStatus = paystackData.status;

      let dbStatus: 'pending' | 'success' | 'failed' = 'pending';
      if (paystackStatus === 'success') dbStatus = 'success';
      else if (paystackStatus === 'failed' || paystackStatus === 'abandoned') dbStatus = 'failed';

      // Update DB
      await db.query(
        `UPDATE transactions SET status = $1, paystack_reference = $2, updated_at = NOW()
         WHERE reference = $3`,
        [dbStatus, paystackData.id || paystackData.reference, ref]
      );

      console.log(`[Callback] Transaction [${ref}] → ${dbStatus}`);

      // Redirect to merchant's callback URL with payment result appended
      if (redirect_url) {
        const separator = redirect_url.includes('?') ? '&' : '?';
        const finalUrl = `${redirect_url}${separator}reference=${ref}&status=${dbStatus}&trxref=${ref}`;
        res.redirect(302, finalUrl);
      } else {
        // No merchant callback — return JSON (useful for testing)
        res.status(200).json({
          status: true,
          message: 'Payment callback processed',
          data: { reference: ref, payment_status: dbStatus },
        });
      }
    } catch (error: any) {
      console.error('[Callback] Error processing callback:', error);
      if (redirect_url) {
        const separator = redirect_url.includes('?') ? '&' : '?';
        res.redirect(302, `${redirect_url}${separator}reference=${ref}&status=error`);
      } else {
        res.status(500).json({ status: false, message: 'Callback processing failed' });
      }
    }
  }
}
