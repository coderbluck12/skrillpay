import { Request, Response } from 'express';
import db from '../db';
import { PaystackService } from '../integrations/paystack';
import { AuthUtils } from '../utils/auth';
import { OnboardMerchantDTO } from '../types';

export class MerchantController {
  public static async onboard(req: Request, res: Response): Promise<void> {
    const {
      email,
      business_name,
      bank_account_number,
      bank_code,
      account_name,
      fee_type = 'percentage',
      fee_value = 1.5,
    }: OnboardMerchantDTO = req.body;

    if (!email || !business_name || !bank_account_number || !bank_code) {
      res.status(400).json({
        status: false,
        message: 'Missing required fields: email, business_name, bank_account_number, bank_code',
      });
      return;
    }

    try {
      const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        res.status(409).json({ status: false, message: 'A merchant with this email already exists' });
        return;
      }

      const subaccount = await PaystackService.createSubaccount({
        business_name,
        settlement_bank: bank_code,
        account_number: bank_account_number,
        percentage_charge: fee_value,
      });

      const subaccountCode = subaccount.subaccount_code;
      const { rawKey, keyHash } = AuthUtils.generateApiKey(process.env.NODE_ENV !== 'production');

      const result = await db.query(
        `INSERT INTO users (
          email, business_name, api_key_hash, paystack_subaccount_code,
          bank_account_number, bank_code, account_name, fee_type, fee_value, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
        RETURNING id, email, business_name, paystack_subaccount_code, fee_type, fee_value, status, created_at`,
        [email, business_name, keyHash, subaccountCode, bank_account_number, bank_code, account_name || null, fee_type, fee_value]
      );

      const createdUser = result.rows[0];

      res.status(201).json({
        status: true,
        message: 'Merchant onboarded successfully. Save your API key securely — it will not be shown again.',
        data: {
          merchant: createdUser,
          api_key: rawKey,
        },
      });
    } catch (error: any) {
      console.error('Merchant onboarding error:', error);
      res.status(500).json({
        status: false,
        message: error.message || 'Failed to onboard merchant',
      });
    }
  }
}
