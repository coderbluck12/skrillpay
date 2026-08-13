import { Response } from 'express';
import db from '../db';
import { JwtAuthenticatedRequest } from '../middleware/jwtAuth';
import { kycProvider } from '../integrations/kycProvider';
import { AuthUtils } from '../utils/auth';
import { KorapayService } from '../integrations/korapay';
import { KycSubmitDTO } from '../types';

export class KycController {
  /**
   * GET /v1/kyc/status
   * Returns the current KYC status and submitted data for the authenticated merchant.
   */
  public static async getStatus(req: JwtAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await db.query(
        `SELECT
          id, email, business_name, kyc_status, kyc_data, kyc_submitted_at, kyc_approved_at,
          kyc_provider, korapay_subaccount_code, paystack_subaccount_code, bank_account_number, bank_code, account_name,
          fee_type, fee_value, webhook_url, callback_url,
          CASE WHEN api_key_hash IS NOT NULL THEN true ELSE false END as has_api_key
        FROM users WHERE id = $1`,
        [req.jwtUser!.userId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ status: false, message: 'User not found' });
        return;
      }

      res.status(200).json({ status: true, data: result.rows[0] });
    } catch (error: any) {
      console.error('KYC status error:', error);
      res.status(500).json({ status: false, message: 'Failed to fetch KYC status' });
    }
  }

  /**
   * POST /v1/kyc/submit
   * Merchant submits simplified KYC (BVN/NIN + Settlement Bank).
   * Runs instant automated identity check via Korapay Identity API.
   */
  public static async submitKyc(req: JwtAuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.jwtUser!.userId;
    const body: KycSubmitDTO = req.body;

    const {
      bvn, nin,
      first_name, last_name, phone,
      bank_account_number, bank_code,
      fee_type = 'percentage', fee_value = 1.5,
      webhook_url, callback_url,
    } = body;

    if (!bank_account_number || !bank_code) {
      res.status(400).json({
        status: false,
        message: 'bank_account_number and bank_code are required for settlement setup',
      });
      return;
    }

    try {
      const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
      const user = userResult.rows[0];

      if (!user) {
        res.status(404).json({ status: false, message: 'User not found' });
        return;
      }

      if (user.kyc_status === 'kyc_submitted' || user.kyc_status === 'active') {
        res.status(409).json({
          status: false,
          message: `KYC has already been ${user.kyc_status === 'active' ? 'approved' : 'submitted and is under review'}`,
        });
        return;
      }

      // Run instant Korapay Identity BVN & NIN verification
      const kycInput = {
        userId,
        bvn, nin,
        first_name, last_name, phone,
        business_name: user.business_name,
      };

      let providerReference: string | undefined;

      if (bvn) {
        const bvnResult = await kycProvider.verifyBvn(kycInput);
        providerReference = bvnResult.providerReference;
        if (!bvnResult.success && !bvnResult.requiresManualReview) {
          res.status(422).json({ status: false, message: `BVN verification failed: ${bvnResult.error}` });
          return;
        }
      }

      if (nin) {
        const ninResult = await kycProvider.verifyIdentity(kycInput);
        if (!ninResult.success && !ninResult.requiresManualReview) {
          res.status(422).json({ status: false, message: `NIN verification failed: ${ninResult.error}` });
          return;
        }
      }

      // Store masked KYC data
      const kycData = {
        bvn: bvn ? `***${bvn.slice(-4)}` : undefined,
        nin: nin ? `***${nin.slice(-4)}` : undefined,
        first_name,
        last_name,
        phone,
        submitted_at: new Date().toISOString(),
      };

      const defaultFeeType = user.fee_type || 'percentage';
      const defaultFeeValue = user.fee_value !== null && user.fee_value !== undefined ? user.fee_value : 1.5;

      await db.query(
        `UPDATE users SET
          kyc_status = 'kyc_submitted',
          status = 'pending_kyc',
          kyc_data = $1,
          kyc_provider = $2,
          kyc_provider_reference = $3,
          kyc_submitted_at = NOW(),
          bank_account_number = $4,
          bank_code = $5,
          fee_type = $6,
          fee_value = $7,
          webhook_url = $8,
          callback_url = $9
        WHERE id = $10`,
        [
          JSON.stringify(kycData),
          kycProvider.name,
          providerReference || null,
          bank_account_number,
          bank_code,
          defaultFeeType,
          defaultFeeValue,
          webhook_url || null,
          callback_url || null,
          userId,
        ]
      );

      res.status(200).json({
        status: true,
        message: 'KYC verified successfully. Your account is submitted for quick admin activation.',
        data: { kyc_status: 'kyc_submitted', provider: kycProvider.name },
      });
    } catch (error: any) {
      console.error('KYC submission error:', error);
      res.status(500).json({ status: false, message: 'Failed to submit KYC. Please try again.' });
    }
  }

  /**
   * PUT /v1/kyc/webhook-settings
   */
  public static async updateWebhookSettings(req: JwtAuthenticatedRequest, res: Response): Promise<void> {
    const { webhook_url, callback_url } = req.body;

    try {
      await db.query(
        'UPDATE users SET webhook_url = $1, callback_url = $2 WHERE id = $3',
        [webhook_url || null, callback_url || null, req.jwtUser!.userId]
      );
      res.status(200).json({ status: true, message: 'Webhook settings updated' });
    } catch (error: any) {
      console.error('Webhook settings update error:', error);
      res.status(500).json({ status: false, message: 'Failed to update webhook settings' });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin-only KYC actions
// ─────────────────────────────────────────────────────────────────────────────
export class AdminKycController {
  public static async listPending(req: JwtAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await db.query(
        `SELECT id, email, business_name, kyc_status, kyc_data, kyc_provider,
                bank_account_number, bank_code, fee_type, fee_value, kyc_submitted_at, created_at
         FROM users
         WHERE kyc_status = 'kyc_submitted'
         ORDER BY kyc_submitted_at ASC`
      );
      res.status(200).json({ status: true, data: { merchants: result.rows } });
    } catch (error: any) {
      console.error('Admin list pending KYC error:', error);
      res.status(500).json({ status: false, message: 'Failed to fetch pending KYC list' });
    }
  }

  public static async listAllMerchants(req: JwtAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await db.query(
        `SELECT id, email, business_name, kyc_status, kyc_provider,
                korapay_subaccount_code, paystack_subaccount_code, bank_account_number, bank_code, account_name,
                fee_type, fee_value, webhook_url, is_admin, created_at,
                CASE WHEN api_key_hash IS NOT NULL THEN true ELSE false END as has_api_key
         FROM users ORDER BY created_at DESC`
      );
      res.status(200).json({ status: true, data: { merchants: result.rows, total: result.rowCount } });
    } catch (error: any) {
      console.error('Admin list merchants error:', error);
      res.status(500).json({ status: false, message: 'Failed to fetch merchants' });
    }
  }

  /**
   * POST /v1/admin/kyc/approve/:userId
   * Approves KYC, creates merchant subaccount, configures platform fee, and generates secret API key.
   */
  public static async approveKyc(req: JwtAuthenticatedRequest, res: Response): Promise<void> {
    const { userId } = req.params;
    const { fee_type, fee_value } = req.body || {};

    try {
      const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
      const user = userResult.rows[0];

      if (!user) {
        res.status(404).json({ status: false, message: 'Merchant not found' });
        return;
      }

      if (user.kyc_status === 'active') {
        res.status(409).json({ status: false, message: 'Merchant is already active' });
        return;
      }

      if (!user.bank_account_number || !user.bank_code) {
        res.status(400).json({
          status: false,
          message: 'Cannot approve: merchant has no bank account on file',
        });
        return;
      }

      const finalFeeType = fee_type || user.fee_type || 'percentage';
      const finalFeeValue = fee_value !== undefined && fee_value !== null ? fee_value : (user.fee_value || 1.5);

      // Create merchant subaccount
      let subaccountCode = user.korapay_subaccount_code || user.paystack_subaccount_code;
      let accountName = user.account_name || user.business_name;

      if (!subaccountCode) {
        const subaccount = await KorapayService.createSubaccount({
          account_name: user.business_name,
          email: user.email,
          bank_code: user.bank_code,
          account_number: user.bank_account_number,
        });
        subaccountCode = subaccount.subaccount_code || subaccount.account_reference || subaccount.id;
        accountName = subaccount.account_name || user.business_name;
      }

      // Generate API Key
      const { rawKey, keyHash } = AuthUtils.generateApiKey(false);

      await db.query(
        `UPDATE users SET
          kyc_status = 'active',
          status = 'active',
          korapay_subaccount_code = $1,
          paystack_subaccount_code = $1,
          account_name = $2,
          api_key_hash = $3,
          api_key = $4,
          fee_type = $5,
          fee_value = $6,
          api_key_generated_at = NOW(),
          kyc_approved_at = NOW()
        WHERE id = $7`,
        [subaccountCode, accountName, keyHash, rawKey, finalFeeType, finalFeeValue, userId]
      );

      res.status(200).json({
        status: true,
        message: `Merchant ${user.business_name} has been approved and activated.`,
        data: {
          merchant_id: userId,
          subaccount_code: subaccountCode,
          fee_type: finalFeeType,
          fee_value: finalFeeValue,
          api_key: rawKey,
        },
      });
    } catch (error: any) {
      console.error('KYC approval error:', error);
      res.status(500).json({ status: false, message: `KYC approval failed: ${error.message}` });
    }
  }

  /**
   * POST /v1/admin/merchants/:userId/fee
   * Updates platform fee model for a merchant (Admin only).
   */
  public static async updateMerchantFee(req: JwtAuthenticatedRequest, res: Response): Promise<void> {
    const { userId } = req.params;
    const { fee_type, fee_value } = req.body;

    if (!fee_type || fee_value === undefined) {
      res.status(400).json({ status: false, message: 'fee_type and fee_value parameters are required' });
      return;
    }

    try {
      await db.query(
        'UPDATE users SET fee_type = $1, fee_value = $2 WHERE id = $3',
        [fee_type, fee_value, userId]
      );
      res.status(200).json({ status: true, message: 'Merchant platform fee updated successfully' });
    } catch (error: any) {
      console.error('Update merchant fee error:', error);
      res.status(500).json({ status: false, message: 'Failed to update merchant fee' });
    }
  }

  public static async rejectKyc(req: JwtAuthenticatedRequest, res: Response): Promise<void> {
    const { userId } = req.params;
    const { reason } = req.body;

    try {
      await db.query(
        `UPDATE users SET kyc_status = 'pending_kyc', status = 'pending_kyc' WHERE id = $1`,
        [userId]
      );
      res.status(200).json({
        status: true,
        message: 'KYC rejected. Merchant can resubmit after corrections.',
      });
    } catch (error: any) {
      res.status(500).json({ status: false, message: 'Failed to reject KYC' });
    }
  }

  public static async suspendMerchant(req: JwtAuthenticatedRequest, res: Response): Promise<void> {
    const { userId } = req.params;
    try {
      await db.query(
        `UPDATE users SET kyc_status = 'suspended', status = 'suspended' WHERE id = $1`,
        [userId]
      );
      res.status(200).json({ status: true, message: 'Merchant account suspended' });
    } catch (error: any) {
      res.status(500).json({ status: false, message: 'Failed to suspend merchant' });
    }
  }
}
