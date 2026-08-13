import { Router, json, raw } from 'express';
import { MerchantController } from '../controllers/merchant';
import { PaymentController } from '../controllers/payment';
import { WebhookController } from '../controllers/webhook';
import { DashboardController } from '../controllers/dashboard';
import { AuthController } from '../controllers/auth';
import { KycController, AdminKycController } from '../controllers/kyc';
import { ReceiptController } from '../controllers/receipt';
import { authenticateApiKey } from '../middleware/auth';
import { authenticateJwt, requireAdmin } from '../middleware/jwtAuth';
import { authRateLimiter, apiRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply general API rate limiting to all /v1 routes
router.use(apiRateLimiter);

// ─────────────────────────────────────────────────────────────────────────────
// Auth Routes (public, protected by authRateLimiter)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/auth/register', authRateLimiter, json(), AuthController.register);
router.post('/auth/login', authRateLimiter, json(), AuthController.login);
router.get('/auth/verify-email', AuthController.verifyEmail as any);
router.post('/auth/verify-email', json(), AuthController.verifyEmail as any);
router.post('/auth/resend-verification', authRateLimiter, json(), AuthController.resendVerification as any);
router.get('/auth/me', authenticateJwt as any, AuthController.me as any);

// ─────────────────────────────────────────────────────────────────────────────
// KYC Routes (JWT protected — merchant must be logged in)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/kyc/status', authenticateJwt as any, KycController.getStatus as any);
router.post('/kyc/submit', authenticateJwt as any, json(), KycController.submitKyc as any);
router.put('/kyc/webhook-settings', authenticateJwt as any, json(), KycController.updateWebhookSettings as any);

// ─────────────────────────────────────────────────────────────────────────────
// Admin Routes (JWT + isAdmin protected)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/admin/merchants', authenticateJwt as any, requireAdmin as any, AdminKycController.listAllMerchants as any);
router.get('/admin/kyc/pending', authenticateJwt as any, requireAdmin as any, AdminKycController.listPending as any);
router.post('/admin/kyc/approve/:userId', authenticateJwt as any, requireAdmin as any, AdminKycController.approveKyc as any);
router.post('/admin/kyc/reject/:userId', authenticateJwt as any, requireAdmin as any, json(), AdminKycController.rejectKyc as any);
router.post('/admin/merchants/:userId/suspend', authenticateJwt as any, requireAdmin as any, AdminKycController.suspendMerchant as any);

// ─────────────────────────────────────────────────────────────────────────────
// Merchant API Routes (API key protected — used in merchant integrations)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/charge', authenticateApiKey as any, json(), PaymentController.initializeCharge as any);
router.get('/transactions/verify/:reference', authenticateApiKey as any, PaymentController.verifyTransaction as any);
router.get('/dashboard/transactions', authenticateApiKey as any, DashboardController.getTransactions as any);
router.get('/dashboard/balance', authenticateApiKey as any, DashboardController.getBalance as any);

// ─────────────────────────────────────────────────────────────────────────────
// Payment Callback (public — Paystack redirects here, then we chain to merchant)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/payment/callback', PaymentController.handleCallback as any);

// ─────────────────────────────────────────────────────────────────────────────
// Receipt Routes (public — anyone with the reference can view/download)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/receipt/:reference', ReceiptController.getReceipt as any);
router.get('/receipt/:reference/download', ReceiptController.downloadReceipt as any);

// ─────────────────────────────────────────────────────────────────────────────
// Korapay & Paystack Webhooks (public — gateways send events here)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/webhooks/payment', raw({ type: 'application/json' }), WebhookController.handleWebhook);
router.post('/webhooks/korapay', raw({ type: 'application/json' }), WebhookController.handleWebhook);
router.post('/webhooks/paystack', raw({ type: 'application/json' }), WebhookController.handleWebhook);

// ─────────────────────────────────────────────────────────────────────────────
// Legacy: Merchant onboarding (kept for backwards compat, deprecated)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/merchants/onboard', json(), MerchantController.onboard);

export default router;
