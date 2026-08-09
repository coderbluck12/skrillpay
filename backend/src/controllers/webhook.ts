import { Request, Response } from 'express';
import crypto from 'crypto';
import db from '../db';
import { PaystackService } from '../integrations/paystack';

const PLATFORM_WEBHOOK_SECRET = process.env.PLATFORM_WEBHOOK_SECRET || crypto.randomBytes(32).toString('hex');

/**
 * Forwards an event payload to a merchant's registered webhook URL.
 * Signs the payload with a platform-level HMAC so merchants can verify it.
 * Fire-and-forget with timeout — errors are logged but don't block response to Paystack.
 */
async function forwardToMerchantWebhook(
  webhookUrl: string,
  eventPayload: any,
  merchantId: string,
  eventId: string
): Promise<{ delivered: boolean; error?: string }> {
  try {
    const payloadString = JSON.stringify(eventPayload);

    // Sign with platform HMAC — merchants verify using PLATFORM_WEBHOOK_SECRET
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
      timeout: 5000, // 5s hard timeout
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
    const signature = req.headers['x-paystack-signature'] as string;
    const rawPayload = req.body;

    const payloadString = typeof rawPayload === 'string'
      ? rawPayload
      : (Buffer.isBuffer(rawPayload) ? rawPayload.toString('utf8') : JSON.stringify(rawPayload));

    const isAuthentic = PaystackService.verifyWebhookSignature(payloadString, signature);
    if (!isAuthentic) {
      console.warn('⚠️ Webhook Signature Verification Failed! Rejecting event.');
      res.status(400).json({ status: false, message: 'Invalid webhook signature' });
      return;
    }

    // Always respond 200 to Paystack immediately (Paystack retries on non-2xx)
    res.status(200).json({ status: true, message: 'Webhook received' });

    // ─── Process event asynchronously AFTER sending response ───
    try {
      const event = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;
      const eventId = event.id ? String(event.id) : (event.data?.id ? String(event.data.id) : null);
      const eventType = event.event;

      if (!eventId || !eventType) {
        console.warn('[Webhook] Malformed event — missing id or event type');
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

      // Insert event record
      await db.query(
        `INSERT INTO webhook_events (paystack_event_id, event_type, raw_payload, processed)
         VALUES ($1, $2, $3, false)`,
        [eventId, eventType, JSON.stringify(event)]
      );

      let merchantId: string | null = null;
      let reference: string | null = null;

      // Handle charge events
      if (eventType === 'charge.success' || eventType === 'charge.failed') {
        const data = event.data;
        reference = data.reference;
        const paystackRef = data.id;
        const newStatus = eventType === 'charge.success' ? 'success' : 'failed';

        // Update transaction record and get merchant ID
        const txResult = await db.query(
          `UPDATE transactions
           SET status = $1, paystack_reference = $2, updated_at = NOW()
           WHERE reference = $3
           RETURNING user_id`,
          [newStatus, paystackRef, reference]
        );

        if (txResult.rows.length > 0) {
          merchantId = txResult.rows[0].user_id;
          console.log(`${eventType === 'charge.success' ? '✅' : '❌'} Transaction [${reference}] → ${newStatus}`);
        }
      }

      // ─── Merchant Webhook Forwarding ───
      if (merchantId) {
        const merchantResult = await db.query(
          'SELECT webhook_url FROM users WHERE id = $1',
          [merchantId]
        );
        const merchant = merchantResult.rows[0];

        if (merchant?.webhook_url) {
          console.log(`[Webhook Forward] Forwarding ${eventType} to merchant webhook: ${merchant.webhook_url}`);

          // Update record with the merchant's webhook URL
          await db.query(
            `UPDATE webhook_events SET merchant_webhook_url = $1, merchant_webhook_status = 'pending'
             WHERE paystack_event_id = $2`,
            [merchant.webhook_url, eventId]
          );

          // Forward the event to the merchant's endpoint
          const forwardResult = await forwardToMerchantWebhook(
            merchant.webhook_url,
            event,
            merchantId,
            eventId
          );

          // Track delivery status
          if (forwardResult.delivered) {
            await db.query(
              `UPDATE webhook_events SET
                merchant_webhook_status = 'delivered',
                merchant_webhook_delivered_at = NOW(),
                merchant_webhook_attempts = merchant_webhook_attempts + 1
               WHERE paystack_event_id = $1`,
              [eventId]
            );
            console.log(`[Webhook Forward] ✅ Delivered to ${merchant.webhook_url}`);
          } else {
            await db.query(
              `UPDATE webhook_events SET
                merchant_webhook_status = 'failed',
                merchant_webhook_attempts = merchant_webhook_attempts + 1
               WHERE paystack_event_id = $1`,
              [eventId]
            );
            console.error(`[Webhook Forward] ❌ Failed: ${forwardResult.error}`);
          }
        }
      }

      // Mark event as processed
      await db.query(
        `UPDATE webhook_events SET processed = true, processed_at = NOW()
         WHERE paystack_event_id = $1`,
        [eventId]
      );

    } catch (error: any) {
      console.error('[Webhook] Processing error:', error);
    }
  }
}
