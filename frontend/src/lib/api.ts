const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

function authHeaders(token?: string | null): Record<string, string> {
  const t = token ?? getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (t) headers['Authorization'] = `Bearer ${t}`;
  return headers;
}

function apiKeyHeaders(apiKey: string): Record<string, string> {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` };
}

export class ApiClient {
  // ─── Auth ──────────────────────────────────────────────────────────────────

  /** POST /v1/auth/register */
  static async register(data: { email: string; password: string; business_name: string }) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  }

  /** Legacy POST /v1/merchants/onboard */
  static async onboardMerchant(data: any) {
    const res = await fetch(`${API_BASE_URL}/merchants/onboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  }

  /** POST /v1/auth/login */
  static async login(data: { email: string; password: string }) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  }

  /** GET /v1/auth/me */
  static async getMe(token?: string) {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: authHeaders(token),
    });
    return res.json();
  }

  // ─── KYC ───────────────────────────────────────────────────────────────────

  /** GET /v1/kyc/status */
  static async getKycStatus() {
    const res = await fetch(`${API_BASE_URL}/kyc/status`, { headers: authHeaders() });
    return res.json();
  }

  /** POST /v1/kyc/submit */
  static async submitKyc(data: {
    bvn?: string;
    nin?: string;
    registration_number?: string;
    tax_id?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    bank_account_number: string;
    bank_code: string;
    fee_type?: 'percentage' | 'flat';
    fee_value?: number;
    webhook_url?: string;
    callback_url?: string;
  }) {
    const res = await fetch(`${API_BASE_URL}/kyc/submit`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  /** PUT /v1/kyc/webhook-settings */
  static async updateWebhookSettings(data: { webhook_url?: string; callback_url?: string }) {
    const res = await fetch(`${API_BASE_URL}/kyc/webhook-settings`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  // ─── Admin ─────────────────────────────────────────────────────────────────

  /** GET /v1/admin/merchants */
  static async adminListMerchants() {
    const res = await fetch(`${API_BASE_URL}/admin/merchants`, { headers: authHeaders() });
    return res.json();
  }

  /** GET /v1/admin/kyc/pending */
  static async adminListPendingKyc() {
    const res = await fetch(`${API_BASE_URL}/admin/kyc/pending`, { headers: authHeaders() });
    return res.json();
  }

  /** POST /v1/admin/kyc/approve/:userId */
  static async adminApproveKyc(userId: string, feeConfig?: { fee_type?: 'percentage' | 'flat'; fee_value?: number }) {
    const res = await fetch(`${API_BASE_URL}/admin/kyc/approve/${userId}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(feeConfig || {}),
    });
    return res.json();
  }

  /** POST /v1/admin/merchants/:userId/fee */
  static async adminUpdateMerchantFee(userId: string, feeConfig: { fee_type: 'percentage' | 'flat'; fee_value: number }) {
    const res = await fetch(`${API_BASE_URL}/admin/merchants/${userId}/fee`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(feeConfig),
    });
    return res.json();
  }

  /** POST /v1/admin/kyc/reject/:userId */
  static async adminRejectKyc(userId: string, reason?: string) {
    const res = await fetch(`${API_BASE_URL}/admin/kyc/reject/${userId}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ reason }),
    });
    return res.json();
  }

  /** POST /v1/admin/merchants/:userId/suspend */
  static async adminSuspendMerchant(userId: string) {
    const res = await fetch(`${API_BASE_URL}/admin/merchants/${userId}/suspend`, {
      method: 'POST',
      headers: authHeaders(),
    });
    return res.json();
  }

  // ─── Merchant API (API key auth — used in merchant integrations) ────────────

  /** POST /v1/charge */
  static async initializeCharge(apiKey: string, data: { amount: number; email: string; reference: string; callback_url?: string }) {
    const res = await fetch(`${API_BASE_URL}/charge`, {
      method: 'POST',
      headers: apiKeyHeaders(apiKey),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  /** GET /v1/dashboard/balance */
  static async getMerchantBalance(apiKey: string) {
    const res = await fetch(`${API_BASE_URL}/dashboard/balance`, { headers: apiKeyHeaders(apiKey) });
    return res.json();
  }

  /** GET /v1/dashboard/transactions */
  static async getMerchantTransactions(apiKey: string, limit = 20, page = 1) {
    const res = await fetch(`${API_BASE_URL}/dashboard/transactions?limit=${limit}&page=${page}`, {
      headers: apiKeyHeaders(apiKey),
    });
    return res.json();
  }
}
