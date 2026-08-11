import { Request, Response } from 'express';
import crypto from 'crypto';
import db from '../db';
import { KorapayService } from '../integrations/korapay';

const PLATFORM_WEBHOOK_SECRET = process.env.PLATFORM_WEBHOOK_SECRET || crypto.randomBytes(32).toString('hex');

async function forwardToMerchantWebhook(
  webhookUrl: string,
  eventPayload: any,
  merchantId: string,
  eventId: string
): Promise<{ delivered: boolean; error?: string }> {
  try {
    const payloadString = JSON.stringify(eventPayload);
    const signature = crypto
      .createHmac('sha512', PLATFORM_WEBHOOK_SECRET)
      .update(payloadString)
      .digest('hex');

    const axios = (await import('axios')).default;
    await axios.post(webhookUrl, payloadString, {
      headers: {
        'Content-Type': 'application/json',
        'x-skrillpay-signature': signature,
        'x-skrillpay-merchant-id': merchantId,
      },
      timeout: 5000,
    });

    return { delivered: true };
  } catch (err: any) {
    const errMsg = err.response
      ? `HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}`
      : err.message;
    console.error(`[Webhook Forward] Failed to deliver to ${webhookUrl}: ${errMsg}`);
    return { delivered: false, error: errMsg };
  }
}

export class WebhookController {
  public static async handleWebhook(req: Request, res: Response): Promise<void> {
    const signature = (req.headers['x-korapay-signature'] || req.headers['x-paystack-signature']) as string;
    const rawPayload = req.body;

    const payloadString = typeof rawPayload === 'string'
      ? rawPayload
      : (Buffer.isBuffer(rawPayload) ? rawPayload.toString('utf8') : JSON.stringify(rawPayload));

    // Verify signature with Korapay (or Paystack fallback)
    const isAuthentic = KorapayService.verifyWebhookSignature(payloadString, signature);
    if (!isAuthentic && process.env.NODE_ENV === 'production') {
      console.warn('⚠️ Webhook Signature Verification Failed! Rejecting event.');
      res.status(400).json({ status: false, message: 'Invalid webhook signature' });
      return;
    }

    res.status(200).json({ status: true, message: 'Webhook received' });

    try {
      const event = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;
      const eventId = event.event_id || event.id || (event.data?.reference ? String(event.data.reference) : null);
      const eventType = event.event || event.type;

      if (!eventId || !eventType) {
        console.warn('[Webhook] Malformed event payload');
        return;
      }

      // Idempotency check
      const existingEvent = await db.query(
        'SELECT id, processed FROM webhook_events WHERE paystack_event_id = $1',
        [eventId]
      );

      if (existingEvent.rows.length > 0) {
        console.log(`ℹ️ Webhook Event [${eventId}] already received. Skipping.`);
        return;
      }

      await db.query(
        `INSERT INTO webhook_events (paystack_event_id, event_type, raw_payload, processed)
         VALUES ($1, $2, $3, false)`,
        [eventId, eventType, JSON.stringify(event)]
      );

      let merchantId: string | null = null;
      let reference: string | null = null;

      if (eventType.includes('charge') || eventType.includes('transfer') || eventType.includes('success')) {
        const data = event.data || event;
        reference = data.reference;
        const koraRef = data.payment_reference || data.reference;
        const newStatus = (eventType.includes('success') || data.status === 'success') ? 'success' : 'failed';

        if (reference) {
          const txResult = await db.query(
            `UPDATE transactions
             SET status = $1, korapay_reference = $2, updated_at = NOW()
             WHERE reference = $3
             RETURNING user_id`,
            [newStatus, koraRef, reference]
          );

          if (txResult.rows.length > 0) {
            merchantId = txResult.rows[0].user_id;
            console.log(`[Korapay Webhook] Transaction [${reference}] → ${newStatus}`);
          }
        }
      }

      if (merchantId) {
        const merchantResult = await db.query('SELECT webhook_url FROM users WHERE id = $1', [merchantId]);
        const merchant = merchantResult.rows[0];

        if (merchant?.webhook_url) {
          await db.query(
            `UPDATE webhook_events SET merchant_webhook_url = $1, merchant_webhook_status = 'pending'
             WHERE paystack_event_id = $2`,
            [merchant.webhook_url, eventId]
          );

          const forwardResult = await forwardToMerchantWebhook(merchant.webhook_url, event, merchantId, eventId);

          if (forwardResult.delivered) {
            await db.query(
              `UPDATE webhook_events SET merchant_webhook_status = 'delivered', merchant_webhook_delivered_at = NOW()
               WHERE paystack_event_id = $1`,
              [eventId]
            );
          } else {
            await db.query(
              `UPDATE webhook_events SET merchant_webhook_status = 'failed' WHERE paystack_event_id = $1`,
              [eventId]
            );
          }
        }
      }

      await db.query(
        'UPDATE webhook_events SET processed = true, processed_at = NOW() WHERE paystack_event_id = $1',
        [eventId]
      );
    } catch (error: any) {
      console.error('[Webhook] Processing error:', error);
    }
  }
}
