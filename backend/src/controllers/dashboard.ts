import { Response } from 'express';
import db from '../db';
import { AuthenticatedRequest } from '../middleware/auth';

export class DashboardController {
  public static async getTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    const merchant = req.merchant;
    if (!merchant) {
      res.status(401).json({ status: false, message: 'Merchant context not found' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;

    try {
      const result = await db.query(
        `SELECT id, reference, paystack_reference, amount, platform_fee, merchant_amount, currency, status, customer_email, metadata, created_at, updated_at
         FROM transactions
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [merchant.id, limit, offset]
      );

      const countResult = await db.query(
        'SELECT COUNT(*) FROM transactions WHERE user_id = $1',
        [merchant.id]
      );

      const total = parseInt(countResult.rows[0].count, 10);

      res.status(200).json({
        status: true,
        data: {
          transactions: result.rows,
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error: any) {
      console.error('Get merchant transactions error:', error);
      res.status(500).json({ status: false, message: 'Failed to retrieve transaction history' });
    }
  }

  public static async getBalance(req: AuthenticatedRequest, res: Response): Promise<void> {
    const merchant = req.merchant;
    if (!merchant) {
      res.status(401).json({ status: false, message: 'Merchant context not found' });
      return;
    }

    try {
      const statsResult = await db.query(
        `SELECT 
           COALESCE(SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END), 0) as total_volume_kobo,
           COALESCE(SUM(CASE WHEN status = 'success' THEN merchant_amount ELSE 0 END), 0) as merchant_earned_kobo,
           COALESCE(SUM(CASE WHEN status = 'success' THEN platform_fee ELSE 0 END), 0) as platform_fees_kobo,
           COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_count,
           COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
           COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
         FROM transactions
         WHERE user_id = $1`,
        [merchant.id]
      );

      const stats = statsResult.rows[0];

      res.status(200).json({
        status: true,
        data: {
          merchant_id: merchant.id,
          business_name: merchant.business_name,
          currency: 'NGN',
          balance: {
            total_volume: Number(stats.total_volume_kobo) / 100,
            total_volume_kobo: Number(stats.total_volume_kobo),
            merchant_earned: Number(stats.merchant_earned_kobo) / 100,
            merchant_earned_kobo: Number(stats.merchant_earned_kobo),
            platform_fees: Number(stats.platform_fees_kobo) / 100,
            platform_fees_kobo: Number(stats.platform_fees_kobo),
          },
          counts: {
            successful: parseInt(stats.successful_count, 10),
            pending: parseInt(stats.pending_count, 10),
            failed: parseInt(stats.failed_count, 10),
          },
        },
      });
    } catch (error: any) {
      console.error('Get merchant balance error:', error);
      res.status(500).json({ status: false, message: 'Failed to calculate balance summary' });
    }
  }
}
