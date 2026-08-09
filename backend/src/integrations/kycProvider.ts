/**
 * KYC Provider Abstraction Layer
 *
 * To switch KYC provider, set KYC_PROVIDER env variable:
 *   KYC_PROVIDER=internal     → manual admin review (default for MVP)
 *   KYC_PROVIDER=prembly      → Prembly/Identitypass (BVN, NIN, CAC)
 *   KYC_PROVIDER=smile        → Smile Identity (face match + document)
 *   KYC_PROVIDER=youverify    → Youverify (business KYC)
 */

export interface KycVerificationResult {
  success: boolean;
  providerReference?: string;
  rawResponse?: any;
  error?: string;
  requiresManualReview: boolean;
}

export interface KycVerificationInput {
  userId: string;
  bvn?: string;
  nin?: string;
  registration_number?: string; // CAC
  tax_id?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  business_name?: string;
}

export interface KycProvider {
  name: string;
  verifyBvn(input: KycVerificationInput): Promise<KycVerificationResult>;
  verifyBusiness(input: KycVerificationInput): Promise<KycVerificationResult>;
  verifyIdentity(input: KycVerificationInput): Promise<KycVerificationResult>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal Provider — Manual review by admin. Always returns requiresManualReview=true
// ─────────────────────────────────────────────────────────────────────────────
class InternalKycProvider implements KycProvider {
  name = 'internal';

  async verifyBvn(input: KycVerificationInput): Promise<KycVerificationResult> {
    console.log(`[KYC:internal] BVN verification queued for user ${input.userId} — awaiting admin review`);
    return { success: true, requiresManualReview: true, providerReference: `INTERNAL_${input.userId}` };
  }

  async verifyBusiness(input: KycVerificationInput): Promise<KycVerificationResult> {
    console.log(`[KYC:internal] Business verification queued for user ${input.userId} — awaiting admin review`);
    return { success: true, requiresManualReview: true, providerReference: `INTERNAL_${input.userId}` };
  }

  async verifyIdentity(input: KycVerificationInput): Promise<KycVerificationResult> {
    console.log(`[KYC:internal] Identity verification queued for user ${input.userId} — awaiting admin review`);
    return { success: true, requiresManualReview: true, providerReference: `INTERNAL_${input.userId}` };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Prembly / Identitypass — https://prembly.com
// Install: npm install axios
// Docs: https://docs.prembly.com
// ─────────────────────────────────────────────────────────────────────────────
class PremblyKycProvider implements KycProvider {
  name = 'prembly';
  private apiKey = process.env.PREMBLY_API_KEY || '';
  private appId = process.env.PREMBLY_APP_ID || '';
  private baseUrl = 'https://api.prembly.com/identitypass/verification';

  private async post(endpoint: string, body: any): Promise<any> {
    const axios = (await import('axios')).default;
    const response = await axios.post(`${this.baseUrl}${endpoint}`, body, {
      headers: {
        'x-api-key': this.apiKey,
        'app-id': this.appId,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
    return response.data;
  }

  async verifyBvn(input: KycVerificationInput): Promise<KycVerificationResult> {
    try {
      const data = await this.post('/bank_account/advance', {
        number: input.bvn,
        bank_code: '000', // BVN lookup doesn't need bank code
      });
      return {
        success: data.status === true,
        requiresManualReview: false,
        providerReference: data.data?.bvn,
        rawResponse: data,
      };
    } catch (err: any) {
      console.error('[KYC:prembly] BVN verification failed:', err.message);
      return { success: false, requiresManualReview: true, error: err.message };
    }
  }

  async verifyBusiness(input: KycVerificationInput): Promise<KycVerificationResult> {
    try {
      const data = await this.post('/cac/advance', {
        rc_number: input.registration_number,
        company_name: input.business_name,
      });
      return {
        success: data.status === true,
        requiresManualReview: false,
        providerReference: data.data?.rc_number,
        rawResponse: data,
      };
    } catch (err: any) {
      console.error('[KYC:prembly] Business verification failed:', err.message);
      return { success: false, requiresManualReview: true, error: err.message };
    }
  }

  async verifyIdentity(input: KycVerificationInput): Promise<KycVerificationResult> {
    try {
      const data = await this.post('/nin_slip', {
        number: input.nin,
        last_name: input.last_name,
        first_name: input.first_name,
      });
      return {
        success: data.status === true,
        requiresManualReview: false,
        providerReference: data.data?.nin,
        rawResponse: data,
      };
    } catch (err: any) {
      console.error('[KYC:prembly] NIN verification failed:', err.message);
      return { success: false, requiresManualReview: true, error: err.message };
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Smile Identity — https://smileidentity.com
// Install: npm install @smileidentity/server-side-sdk
// Docs: https://docs.smileidentity.com
// ─────────────────────────────────────────────────────────────────────────────
class SmileIdentityKycProvider implements KycProvider {
  name = 'smile_identity';
  private partnerId = process.env.SMILE_PARTNER_ID || '';
  private apiKey = process.env.SMILE_API_KEY || '';

  async verifyBvn(input: KycVerificationInput): Promise<KycVerificationResult> {
    // TODO: Integrate Smile Identity BVN lookup when credentials are available
    console.warn('[KYC:smile] Smile Identity BVN verification not yet fully implemented — falling back to manual review');
    return { success: true, requiresManualReview: true, providerReference: `SMILE_${input.userId}` };
  }

  async verifyBusiness(input: KycVerificationInput): Promise<KycVerificationResult> {
    console.warn('[KYC:smile] Smile Identity business verification not yet implemented');
    return { success: true, requiresManualReview: true };
  }

  async verifyIdentity(input: KycVerificationInput): Promise<KycVerificationResult> {
    console.warn('[KYC:smile] Smile Identity identity verification not yet implemented');
    return { success: true, requiresManualReview: true };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Youverify — https://youverify.co
// Docs: https://doc.youverify.co
// ─────────────────────────────────────────────────────────────────────────────
class YouverifyKycProvider implements KycProvider {
  name = 'youverify';
  private apiKey = process.env.YOUVERIFY_API_KEY || '';
  private baseUrl = 'https://api.youverify.co/v2/api';

  private async post(endpoint: string, body: any): Promise<any> {
    const axios = (await import('axios')).default;
    const response = await axios.post(`${this.baseUrl}${endpoint}`, body, {
      headers: { token: this.apiKey, 'Content-Type': 'application/json' },
      timeout: 15000,
    });
    return response.data;
  }

  async verifyBvn(input: KycVerificationInput): Promise<KycVerificationResult> {
    try {
      const data = await this.post('/identity/bvn/verify', {
        id: input.bvn,
        lastName: input.last_name,
        isSubjectConsent: true,
      });
      return {
        success: data.success === true,
        requiresManualReview: false,
        providerReference: data.data?.id,
        rawResponse: data,
      };
    } catch (err: any) {
      console.error('[KYC:youverify] BVN verification failed:', err.message);
      return { success: false, requiresManualReview: true, error: err.message };
    }
  }

  async verifyBusiness(input: KycVerificationInput): Promise<KycVerificationResult> {
    try {
      const data = await this.post('/identity/cac/verify', {
        rcNumber: input.registration_number,
        isSubjectConsent: true,
      });
      return {
        success: data.success === true,
        requiresManualReview: false,
        providerReference: data.data?.rcNumber,
        rawResponse: data,
      };
    } catch (err: any) {
      console.error('[KYC:youverify] Business verification failed:', err.message);
      return { success: false, requiresManualReview: true, error: err.message };
    }
  }

  async verifyIdentity(input: KycVerificationInput): Promise<KycVerificationResult> {
    try {
      const data = await this.post('/identity/nin/verify', {
        id: input.nin,
        isSubjectConsent: true,
      });
      return {
        success: data.success === true,
        requiresManualReview: false,
        providerReference: data.data?.id,
        rawResponse: data,
      };
    } catch (err: any) {
      console.error('[KYC:youverify] NIN verification failed:', err.message);
      return { success: false, requiresManualReview: true, error: err.message };
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory — instantiate provider from env config
// ─────────────────────────────────────────────────────────────────────────────
function createKycProvider(): KycProvider {
  const provider = (process.env.KYC_PROVIDER || 'internal').toLowerCase();
  switch (provider) {
    case 'prembly':
      return new PremblyKycProvider();
    case 'smile_identity':
    case 'smile':
      return new SmileIdentityKycProvider();
    case 'youverify':
      return new YouverifyKycProvider();
    default:
      return new InternalKycProvider();
  }
}

export const kycProvider = createKycProvider();
