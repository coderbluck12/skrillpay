import { Request, Response } from 'express';
import db from '../db';
import { AuthenticatedRequest } from '../middleware/auth';

function formatNaira(kobo: number): string {
  return (kobo / 100).toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  });
}

function buildReceiptHtml(data: {
  reference: string;
  amount: number;
  platform_fee: number;
  merchant_amount: number;
  customer_email: string;
  status: string;
  currency: string;
  business_name: string;
  created_at: string;
  paystack_reference?: string;
}): string {
  const isPaid = data.status === 'success';
  const statusColor = isPaid ? '#22c55e' : data.status === 'pending' ? '#f59e0b' : '#ef4444';
  const statusLabel = isPaid ? 'PAID' : data.status === 'pending' ? 'PENDING' : 'FAILED';
  const date = new Date(data.created_at).toLocaleString('en-NG', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt – ${data.reference}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', system-ui, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      min-height: 100vh;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 40px 16px;
    }
    .receipt-container {
      width: 100%;
      max-width: 480px;
    }
    .receipt {
      background: #fff;
      border-radius: 20px;
      box-shadow: 0 20px 60px -10px rgba(0,0,0,0.12), 0 4px 16px -4px rgba(0,0,0,0.06);
      overflow: hidden;
    }
    .receipt-header {
      background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%);
      padding: 32px 32px 24px;
      text-align: center;
      position: relative;
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 20px;
    }
    .brand-icon {
      width: 36px; height: 36px;
      background: rgba(255,255,255,0.25);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 16px; color: #fff;
    }
    .brand-name { font-weight: 700; font-size: 18px; color: #fff; letter-spacing: -0.5px; }
    .amount-block { margin-bottom: 4px; }
    .amount { font-size: 40px; font-weight: 800; color: #fff; letter-spacing: -1px; }
    .currency { font-size: 18px; font-weight: 600; color: rgba(255,255,255,0.7); }
    .merchant-name { font-size: 13px; color: rgba(255,255,255,0.75); margin-top: 4px; }
    .status-badge {
      display: inline-flex; align-items: center; gap: 6px;
      margin-top: 16px;
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 100px;
      padding: 5px 14px;
      font-size: 11px; font-weight: 700; color: #fff;
      letter-spacing: 0.5px; text-transform: uppercase;
    }
    .status-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: ${statusColor};
      box-shadow: 0 0 0 2px rgba(255,255,255,0.4);
    }
    .receipt-body { padding: 28px 32px; }
    .section-title {
      font-size: 10px; font-weight: 700; color: #94a3b8;
      text-transform: uppercase; letter-spacing: 0.8px;
      margin-bottom: 12px;
    }
    .detail-grid { display: flex; flex-direction: column; gap: 0; margin-bottom: 24px; }
    .detail-row {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 10px 0;
      border-bottom: 1px solid #f1f5f9;
      gap: 16px;
    }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-size: 12px; color: #64748b; font-weight: 500; flex-shrink: 0; }
    .detail-value { font-size: 13px; color: #0f172a; font-weight: 600; text-align: right; word-break: break-all; }
    .detail-value.mono { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 500; color: #3b82f6; }
    .fee-section {
      background: #f8fafc;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
      border: 1px solid #e2e8f0;
    }
    .fee-row {
      display: flex; justify-content: space-between;
      padding: 5px 0;
      font-size: 12px;
    }
    .fee-label { color: #64748b; }
    .fee-value { font-weight: 600; color: #0f172a; }
    .fee-divider { border: none; border-top: 1px dashed #cbd5e1; margin: 8px 0; }
    .fee-total .fee-label { color: #0f172a; font-weight: 700; }
    .fee-total .fee-value { color: #0ea5e9; font-weight: 700; font-size: 14px; }
    .print-btn-container { text-align: center; margin-bottom: 8px; }
    .print-btn {
      display: inline-flex; align-items: center; gap: 8px;
      background: linear-gradient(135deg, #0ea5e9, #6366f1);
      color: #fff; border: none; border-radius: 10px;
      padding: 10px 24px; font-size: 13px; font-weight: 600;
      cursor: pointer; font-family: inherit;
      text-decoration: none;
    }
    .print-btn:hover { opacity: 0.9; }
    .footer {
      border-top: 1px solid #f1f5f9;
      padding: 16px 32px;
      text-align: center;
      font-size: 11px; color: #94a3b8;
    }
    .footer a { color: #0ea5e9; text-decoration: none; }
    .watermark {
      display: flex; align-items: center; justify-content: center;
      gap: 6px; margin-top: 6px; font-size: 11px; color: #cbd5e1;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .receipt { box-shadow: none; border-radius: 0; }
      .print-btn-container { display: none; }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="receipt">
      <div class="receipt-header">
        <div class="brand">
          <div class="brand-icon">S</div>
          <span class="brand-name">Skrillpay</span>
        </div>
        <div class="amount-block">
          <div class="amount">${formatNaira(data.amount)}</div>
        </div>
        <div class="merchant-name">Payment to ${data.business_name}</div>
        <div class="status-badge">
          <div class="status-dot"></div>
          ${statusLabel}
        </div>
      </div>

      <div class="receipt-body">
        <p class="section-title">Transaction Details</p>
        <div class="detail-grid">
          <div class="detail-row">
            <span class="detail-label">Customer</span>
            <span class="detail-value">${data.customer_email}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Reference</span>
            <span class="detail-value mono">${data.reference}</span>
          </div>
          ${data.paystack_reference ? `
          <div class="detail-row">
            <span class="detail-label">Paystack Ref</span>
            <span class="detail-value mono">${data.paystack_reference}</span>
          </div>` : ''}
          <div class="detail-row">
            <span class="detail-label">Date</span>
            <span class="detail-value">${date}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Merchant</span>
            <span class="detail-value">${data.business_name}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Currency</span>
            <span class="detail-value">${data.currency}</span>
          </div>
        </div>

        <p class="section-title">Fee Breakdown</p>
        <div class="fee-section">
          <div class="fee-row">
            <span class="fee-label">Total Charged</span>
            <span class="fee-value">${formatNaira(data.amount)}</span>
          </div>
          <div class="fee-row">
            <span class="fee-label">Platform Fee</span>
            <span class="fee-value" style="color:#f59e0b">&minus;${formatNaira(data.platform_fee)}</span>
          </div>
          <hr class="fee-divider">
          <div class="fee-row fee-total">
            <span class="fee-label">Merchant Receives</span>
            <span class="fee-value">${formatNaira(data.merchant_amount)}</span>
          </div>
        </div>

        <div class="print-btn-container">
          <button class="print-btn" onclick="window.print()">
            🖨️ Print / Save as PDF
          </button>
        </div>
      </div>

      <div class="footer">
        <p>This is an official payment receipt from <a href="#">Skrillpay</a>.</p>
        <p style="margin-top:4px">Keep this for your records — Reference: <strong>${data.reference}</strong></p>
        <div class="watermark">
          <span>Powered by Skrillpay &times; Paystack</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export class ReceiptController {
  /**
   * GET /v1/receipt/:reference
   * Public endpoint — returns a beautifully formatted HTML receipt.
   * Can also return JSON with ?format=json.
   */
  public static async getReceipt(req: Request, res: Response): Promise<void> {
    const { reference } = req.params;
    const format = (req.query.format as string) || 'html';

    try {
      const result = await db.query(
        `SELECT
          t.reference, t.amount, t.platform_fee, t.merchant_amount,
          t.customer_email, t.status, t.currency, t.created_at, t.paystack_reference,
          u.business_name
        FROM transactions t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.reference = $1`,
        [reference]
      );

      if (result.rows.length === 0) {
        if (format === 'json') {
          res.status(404).json({ status: false, message: 'Transaction not found' });
        } else {
          res.status(404).send(`<html><body style="font-family:sans-serif;padding:40px;text-align:center">
            <h2>Receipt Not Found</h2>
            <p>No transaction found with reference <strong>${reference}</strong>.</p>
          </body></html>`);
        }
        return;
      }

      const tx = result.rows[0];

      if (format === 'json') {
        res.status(200).json({
          status: true,
          data: {
            reference: tx.reference,
            amount: tx.amount,
            amount_naira: Number(tx.amount) / 100,
            platform_fee: tx.platform_fee,
            merchant_amount: tx.merchant_amount,
            customer_email: tx.customer_email,
            status: tx.status,
            currency: tx.currency,
            business_name: tx.business_name,
            paystack_reference: tx.paystack_reference,
            created_at: tx.created_at,
            receipt_url: `${process.env.API_BASE_URL || 'http://localhost:3000'}/v1/receipt/${tx.reference}`,
          },
        });
        return;
      }

      const html = buildReceiptHtml({
        reference: tx.reference,
        amount: Number(tx.amount),
        platform_fee: Number(tx.platform_fee),
        merchant_amount: Number(tx.merchant_amount),
        customer_email: tx.customer_email,
        status: tx.status,
        currency: tx.currency,
        business_name: tx.business_name || 'Merchant',
        created_at: tx.created_at,
        paystack_reference: tx.paystack_reference,
      });

      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(html);
    } catch (error: any) {
      console.error('Receipt generation error:', error);
      if (format === 'json') {
        res.status(500).json({ status: false, message: 'Failed to generate receipt' });
      } else {
        res.status(500).send('<html><body>Error generating receipt</body></html>');
      }
    }
  }

  /**
   * GET /v1/receipt/:reference/download
   * Returns the receipt HTML with Content-Disposition: attachment
   * so browsers prompt to download / save as PDF.
   */
  public static async downloadReceipt(req: Request, res: Response): Promise<void> {
    const { reference } = req.params;

    try {
      const result = await db.query(
        `SELECT
          t.reference, t.amount, t.platform_fee, t.merchant_amount,
          t.customer_email, t.status, t.currency, t.created_at, t.paystack_reference,
          u.business_name
        FROM transactions t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.reference = $1`,
        [reference]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ status: false, message: 'Transaction not found' });
        return;
      }

      const tx = result.rows[0];
      const html = buildReceiptHtml({
        reference: tx.reference,
        amount: Number(tx.amount),
        platform_fee: Number(tx.platform_fee),
        merchant_amount: Number(tx.merchant_amount),
        customer_email: tx.customer_email,
        status: tx.status,
        currency: tx.currency,
        business_name: tx.business_name || 'Merchant',
        created_at: tx.created_at,
        paystack_reference: tx.paystack_reference,
      });

      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="receipt-${reference}.html"`);
      res.status(200).send(html);
    } catch (error: any) {
      console.error('Receipt download error:', error);
      res.status(500).json({ status: false, message: 'Failed to generate receipt for download' });
    }
  }
}
